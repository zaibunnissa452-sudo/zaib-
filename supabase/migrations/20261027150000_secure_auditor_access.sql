-- Staff accounts are provisioned by an administrator in Supabase Auth and assigned
-- a trusted role here. Public signup cannot grant or change staff roles.
CREATE TABLE IF NOT EXISTS public.staff_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'auditor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.staff_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.staff_roles TO authenticated;
GRANT ALL ON TABLE public.staff_roles TO service_role;

DROP POLICY IF EXISTS "staff_users_read_own_role" ON public.staff_roles;
CREATE POLICY "staff_users_read_own_role"
ON public.staff_roles
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.has_staff_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND auth.jwt()->>'aal' = 'aal2'
    AND EXISTS (
      SELECT 1
      FROM public.staff_roles AS staff
      WHERE staff.user_id = auth.uid()
        AND staff.role = p_role
    );
$function$;

REVOKE ALL ON FUNCTION public.has_staff_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_staff_role(text) TO authenticated;

-- Public can see only the small set of fields used by the live queue.
CREATE OR REPLACE FUNCTION public.get_public_live_queue()
RETURNS TABLE (
  id uuid,
  order_number integer,
  items jsonb,
  status text,
  queue_position integer,
  estimated_wait_minutes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
  SELECT
    order_row.id,
    order_row.order_number,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', item.value->>'id',
          'name', item.value->>'name',
          'quantity', (item.value->>'quantity')::integer
        ) ORDER BY item.value->>'name'
      )
      FROM jsonb_array_elements(order_row.items) AS item(value)
    ), '[]'::jsonb),
    order_row.status,
    order_row.queue_position,
    order_row.estimated_wait_minutes
  FROM public.orders AS order_row
  WHERE order_row.status IN ('pending', 'preparing', 'ready')
  ORDER BY order_row.created_at ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_public_live_queue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_live_queue() TO anon, authenticated;

-- The owner can still see customer names in the kitchen view. Auditors use the
-- read-only table access below, which intentionally omits that personal field.
CREATE OR REPLACE FUNCTION public.get_owner_orders(p_canteen_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  canteen_id uuid,
  order_number integer,
  items jsonb,
  total numeric,
  status text,
  customer_name text,
  queue_position integer,
  estimated_wait_minutes integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
  SELECT
    order_row.id,
    order_row.canteen_id,
    order_row.order_number,
    order_row.items,
    order_row.total,
    order_row.status,
    order_row.customer_name,
    order_row.queue_position,
    order_row.estimated_wait_minutes,
    order_row.created_at,
    order_row.updated_at
  FROM public.orders AS order_row
  WHERE public.has_staff_role('owner')
    AND order_row.status IN ('pending', 'preparing', 'ready')
    AND (p_canteen_id IS NULL OR order_row.canteen_id = p_canteen_id)
  ORDER BY order_row.created_at ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_owner_orders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_orders(uuid) TO authenticated;

-- Keep public catalog reads. Only an MFA-verified owner can make changes.
DROP POLICY IF EXISTS "anon_select_canteens" ON public.canteens;
DROP POLICY IF EXISTS "anon_insert_canteens" ON public.canteens;
DROP POLICY IF EXISTS "anon_update_canteens" ON public.canteens;
DROP POLICY IF EXISTS "anon_delete_canteens" ON public.canteens;
DROP POLICY IF EXISTS "owners_manage_canteens_insert" ON public.canteens;
DROP POLICY IF EXISTS "owners_manage_canteens_update" ON public.canteens;
DROP POLICY IF EXISTS "owners_manage_canteens_delete" ON public.canteens;
REVOKE ALL ON TABLE public.canteens FROM anon, authenticated;
GRANT SELECT ON TABLE public.canteens TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.canteens TO authenticated;
CREATE POLICY "public_read_canteens"
ON public.canteens FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owners_manage_canteens_insert"
ON public.canteens FOR INSERT TO authenticated
WITH CHECK (public.has_staff_role('owner'));
CREATE POLICY "owners_manage_canteens_update"
ON public.canteens FOR UPDATE TO authenticated
USING (public.has_staff_role('owner'))
WITH CHECK (public.has_staff_role('owner'));
CREATE POLICY "owners_manage_canteens_delete"
ON public.canteens FOR DELETE TO authenticated
USING (public.has_staff_role('owner'));

DROP POLICY IF EXISTS "anon_select_menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "anon_insert_menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "anon_update_menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "anon_delete_menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "owners_manage_menu_items_insert" ON public.menu_items;
DROP POLICY IF EXISTS "owners_manage_menu_items_update" ON public.menu_items;
DROP POLICY IF EXISTS "owners_manage_menu_items_delete" ON public.menu_items;
REVOKE ALL ON TABLE public.menu_items FROM anon, authenticated;
GRANT SELECT ON TABLE public.menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.menu_items TO authenticated;
CREATE POLICY "public_read_menu_items"
ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owners_manage_menu_items_insert"
ON public.menu_items FOR INSERT TO authenticated
WITH CHECK (public.has_staff_role('owner'));
CREATE POLICY "owners_manage_menu_items_update"
ON public.menu_items FOR UPDATE TO authenticated
USING (public.has_staff_role('owner'))
WITH CHECK (public.has_staff_role('owner'));
CREATE POLICY "owners_manage_menu_items_delete"
ON public.menu_items FOR DELETE TO authenticated
USING (public.has_staff_role('owner'));

-- The public queue is served by get_public_live_queue and order tracking by the
-- guest-orders Edge Function. Direct order reads/writes are staff-only.
DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_update_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON public.orders;
DROP POLICY IF EXISTS "staff_read_orders" ON public.orders;
DROP POLICY IF EXISTS "owners_update_orders" ON public.orders;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE SELECT (id, canteen_id, order_number, items, total, status, customer_name,
  queue_position, estimated_wait_minutes, created_at, updated_at)
ON TABLE public.orders FROM anon, authenticated;
REVOKE UPDATE (status, updated_at) ON TABLE public.orders FROM anon, authenticated;
GRANT SELECT (id, canteen_id, order_number, items, total, status,
  queue_position, estimated_wait_minutes, created_at, updated_at)
ON TABLE public.orders TO authenticated;
GRANT UPDATE (status, updated_at) ON TABLE public.orders TO authenticated;
CREATE POLICY "staff_read_orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_staff_role('owner') OR public.has_staff_role('auditor'));
CREATE POLICY "owners_update_orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_staff_role('owner'))
WITH CHECK (public.has_staff_role('owner'));

-- Auditors may read payment evidence but not guest tracking tokens or customer names.
DROP POLICY IF EXISTS "staff_read_guest_payments" ON public.guest_payment_intents;
REVOKE ALL ON TABLE public.guest_payment_intents FROM anon, authenticated;
GRANT SELECT (id, canteen_id, items, total, amount_paise, razorpay_order_id,
  razorpay_payment_id, payment_status, order_id, created_at, updated_at)
ON TABLE public.guest_payment_intents TO authenticated;
CREATE POLICY "staff_read_guest_payments"
ON public.guest_payment_intents FOR SELECT TO authenticated
USING (public.has_staff_role('owner') OR public.has_staff_role('auditor'));
