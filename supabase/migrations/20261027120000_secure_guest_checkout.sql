ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_guest_token_hash_unique_idx
ON public.orders (guest_token_hash)
WHERE guest_token_hash IS NOT NULL;

-- Only the server function may create orders. It checks menu prices and availability.
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;

-- Public screens can read order details but cannot read the guest tracking hash.
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders FROM anon, authenticated;
GRANT SELECT (
  id,
  canteen_id,
  order_number,
  items,
  total,
  status,
  customer_name,
  queue_position,
  estimated_wait_minutes,
  created_at,
  updated_at
) ON TABLE public.orders TO anon, authenticated;
GRANT UPDATE (status, updated_at) ON TABLE public.orders TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_guest_order(
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
  v_prep_minutes integer;
  v_order_number integer;
  v_queue_position integer;
  v_estimated_wait integer;
  v_order jsonb;
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
    coalesce(sum(menu_item.prep_time_minutes * requested.quantity), 0),
    count(*)
  INTO v_items, v_total, v_prep_minutes, v_matched_item_count
  FROM requested
  JOIN public.menu_items AS menu_item
    ON menu_item.id = requested.id
   AND menu_item.canteen_id = p_canteen_id
   AND menu_item.is_available;

  IF v_matched_item_count <> v_item_count THEN
    RAISE EXCEPTION 'ITEM_UNAVAILABLE';
  END IF;

  -- Serialize order numbers for each canteen so simultaneous checkouts do not collide.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_canteen_id::text, 0));

  SELECT coalesce(max(order_row.order_number), 0) + 1
  INTO v_order_number
  FROM public.orders AS order_row
  WHERE order_row.canteen_id = p_canteen_id;

  SELECT count(*) + 1
  INTO v_queue_position
  FROM public.orders AS order_row
  WHERE order_row.canteen_id = p_canteen_id
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
    p_canteen_id,
    v_order_number,
    v_items,
    v_total,
    'pending',
    nullif(left(trim(coalesce(p_customer_name, '')), 80), ''),
    v_queue_position,
    v_estimated_wait,
    p_guest_token_hash
  )
  RETURNING (to_jsonb(inserted) - 'guest_token_hash') INTO v_order;

  RETURN v_order;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_guest_order(uuid, jsonb, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_order(uuid, jsonb, text, text)
TO service_role;
