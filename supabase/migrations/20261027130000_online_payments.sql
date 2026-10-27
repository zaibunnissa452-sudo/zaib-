CREATE TABLE IF NOT EXISTS public.guest_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total numeric(10, 2) NOT NULL CHECK (total > 0),
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  customer_name text,
  guest_token_hash text NOT NULL CHECK (guest_token_hash ~ '^[0-9a-f]{64}$'),
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  payment_status text NOT NULL DEFAULT 'created'
    CHECK (payment_status IN ('created', 'pending', 'paid', 'failed')),
  order_id uuid UNIQUE REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_payment_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.guest_payment_intents FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.guest_payment_intents TO service_role;

-- Route each paid order to the linked merchant account for its canteen.
CREATE TABLE IF NOT EXISTS public.canteen_payment_accounts (
  canteen_id uuid PRIMARY KEY REFERENCES public.canteens(id) ON DELETE CASCADE,
  razorpay_linked_account_id text NOT NULL UNIQUE
    CHECK (razorpay_linked_account_id ~ '^acc_[A-Za-z0-9]+$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.canteen_payment_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.canteen_payment_accounts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.canteen_payment_accounts TO service_role;

CREATE OR REPLACE FUNCTION public.create_guest_payment_intent(
  p_canteen_id uuid,
  p_items jsonb,
  p_customer_name text,
  p_guest_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_canteen_open boolean;
  v_item_count integer;
  v_unique_item_count integer;
  v_matched_item_count integer;
  v_items jsonb;
  v_total numeric(10, 2);
  v_intent_id uuid;
BEGIN
  IF p_canteen_id IS NULL
     OR p_guest_token_hash IS NULL
     OR p_guest_token_hash !~ '^[0-9a-f]{64}$'
     OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 30 THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS requested(item)
    WHERE coalesce(requested.item->>'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR coalesce(requested.item->>'quantity', '') !~ '^(1|2|3|4|5|6|7|8|9|[12][0-9]|30)$'
  ) THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  SELECT count(*), count(DISTINCT (requested.item->>'id')::uuid)
  INTO v_item_count, v_unique_item_count
  FROM jsonb_array_elements(p_items) AS requested(item);

  IF v_item_count <> v_unique_item_count THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  SELECT canteen.is_open
  INTO v_canteen_open
  FROM public.canteens AS canteen
  WHERE canteen.id = p_canteen_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CANTEEN_NOT_FOUND';
  END IF;

  IF NOT v_canteen_open THEN
    RAISE EXCEPTION 'CANTEEN_CLOSED';
  END IF;

  WITH requested AS (
    SELECT
      (item->>'id')::uuid AS id,
      (item->>'quantity')::integer AS quantity
    FROM jsonb_array_elements(p_items) AS source(item)
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', menu_item.id,
        'name', menu_item.name,
        'price', menu_item.price,
        'quantity', requested.quantity
      ) ORDER BY menu_item.name
    ),
    coalesce(sum(menu_item.price * requested.quantity), 0),
    count(*)
  INTO v_items, v_total, v_matched_item_count
  FROM requested
  JOIN public.menu_items AS menu_item
    ON menu_item.id = requested.id
   AND menu_item.canteen_id = p_canteen_id
   AND menu_item.is_available;

  IF v_matched_item_count <> v_item_count OR v_total <= 0 THEN
    RAISE EXCEPTION 'ITEM_UNAVAILABLE';
  END IF;

  INSERT INTO public.guest_payment_intents (
    canteen_id,
    items,
    total,
    amount_paise,
    customer_name,
    guest_token_hash
  ) VALUES (
    p_canteen_id,
    v_items,
    v_total,
    (v_total * 100)::bigint,
    nullif(left(trim(coalesce(p_customer_name, '')), 80), ''),
    p_guest_token_hash
  )
  RETURNING id INTO v_intent_id;

  RETURN jsonb_build_object(
    'id', v_intent_id,
    'amount_paise', (v_total * 100)::bigint,
    'currency', 'INR'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.attach_razorpay_order(
  p_intent_id uuid,
  p_razorpay_order_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.guest_payment_intents
  SET razorpay_order_id = p_razorpay_order_id,
      payment_status = 'pending',
      updated_at = now()
  WHERE id = p_intent_id
    AND payment_status = 'created'
    AND razorpay_order_id IS NULL;

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.finalize_guest_payment(
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_intent public.guest_payment_intents%ROWTYPE;
  v_prep_minutes integer;
  v_order_number integer;
  v_queue_position integer;
  v_estimated_wait integer;
  v_order jsonb;
BEGIN
  SELECT *
  INTO v_intent
  FROM public.guest_payment_intents
  WHERE razorpay_order_id = p_razorpay_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
  END IF;

  IF v_intent.order_id IS NOT NULL THEN
    SELECT to_jsonb(order_row) - 'guest_token_hash'
    INTO v_order
    FROM public.orders AS order_row
    WHERE order_row.id = v_intent.order_id;
    RETURN v_order;
  END IF;

  IF v_intent.payment_status NOT IN ('pending', 'paid') OR p_razorpay_payment_id IS NULL THEN
    RAISE EXCEPTION 'PAYMENT_NOT_PENDING';
  END IF;

  SELECT coalesce(sum((item->>'quantity')::integer * menu_item.prep_time_minutes), 0)
  INTO v_prep_minutes
  FROM jsonb_array_elements(v_intent.items) AS source(item)
  JOIN public.menu_items AS menu_item
    ON menu_item.id = (item->>'id')::uuid;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_intent.canteen_id::text, 0));

  SELECT coalesce(max(order_row.order_number), 0) + 1
  INTO v_order_number
  FROM public.orders AS order_row
  WHERE order_row.canteen_id = v_intent.canteen_id;

  SELECT count(*) + 1
  INTO v_queue_position
  FROM public.orders AS order_row
  WHERE order_row.canteen_id = v_intent.canteen_id
    AND order_row.status IN ('pending', 'preparing');

  v_estimated_wait := least(99, v_queue_position * 8 + v_prep_minutes);

  INSERT INTO public.orders AS inserted (
    canteen_id,
    order_number,
    items,
    total,
    status,
    customer_name,
    queue_position,
    estimated_wait_minutes,
    guest_token_hash
  ) VALUES (
    v_intent.canteen_id,
    v_order_number,
    v_intent.items,
    v_intent.total,
    'pending',
    v_intent.customer_name,
    v_queue_position,
    v_estimated_wait,
    v_intent.guest_token_hash
  )
  RETURNING to_jsonb(inserted) - 'guest_token_hash' INTO v_order;

  UPDATE public.guest_payment_intents
  SET payment_status = 'paid',
      razorpay_payment_id = p_razorpay_payment_id,
      order_id = (v_order->>'id')::uuid,
      updated_at = now()
  WHERE id = v_intent.id;

  RETURN v_order;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_guest_payment_intent(uuid, jsonb, text, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_razorpay_order(uuid, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_guest_payment(text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_payment_intent(uuid, jsonb, text, text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_razorpay_order(uuid, text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_guest_payment(text, text)
TO service_role;
