CREATE OR REPLACE FUNCTION public.has_staff_canteen_access(
  p_canteen_id uuid,
  p_role text DEFAULT NULL
)
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
        AND (p_role IS NULL OR staff.role = p_role)
        AND (staff.canteen_id IS NULL OR staff.canteen_id = p_canteen_id)
    );
$function$;

REVOKE ALL ON FUNCTION public.has_staff_canteen_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_staff_canteen_access(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "owners_manage_canteens_insert" ON public.canteens;
DROP POLICY IF EXISTS "owners_manage_canteens_update" ON public.canteens;
DROP POLICY IF EXISTS "owners_manage_canteens_delete" ON public.canteens;
CREATE POLICY "owners_manage_canteens_insert"
ON public.canteens FOR INSERT TO authenticated
WITH CHECK (public.has_staff_canteen_access(id, 'owner'));
CREATE POLICY "owners_manage_canteens_update"
ON public.canteens FOR UPDATE TO authenticated
USING (public.has_staff_canteen_access(id, 'owner'))
WITH CHECK (public.has_staff_canteen_access(id, 'owner'));
CREATE POLICY "owners_manage_canteens_delete"
ON public.canteens FOR DELETE TO authenticated
USING (public.has_staff_canteen_access(id, 'owner'));

DROP POLICY IF EXISTS "owners_manage_menu_items_insert" ON public.menu_items;
DROP POLICY IF EXISTS "owners_manage_menu_items_update" ON public.menu_items;
DROP POLICY IF EXISTS "owners_manage_menu_items_delete" ON public.menu_items;
CREATE POLICY "owners_manage_menu_items_insert"
ON public.menu_items FOR INSERT TO authenticated
WITH CHECK (public.has_staff_canteen_access(canteen_id, 'owner'));
CREATE POLICY "owners_manage_menu_items_update"
ON public.menu_items FOR UPDATE TO authenticated
USING (public.has_staff_canteen_access(canteen_id, 'owner'))
WITH CHECK (public.has_staff_canteen_access(canteen_id, 'owner'));
CREATE POLICY "owners_manage_menu_items_delete"
ON public.menu_items FOR DELETE TO authenticated
USING (public.has_staff_canteen_access(canteen_id, 'owner'));

DROP POLICY IF EXISTS "staff_read_orders" ON public.orders;
DROP POLICY IF EXISTS "owners_update_orders" ON public.orders;
CREATE POLICY "staff_read_orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_staff_canteen_access(canteen_id));
CREATE POLICY "owners_update_orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_staff_canteen_access(canteen_id, 'owner'))
WITH CHECK (public.has_staff_canteen_access(canteen_id, 'owner'));

DROP POLICY IF EXISTS "staff_read_guest_payments" ON public.guest_payment_intents;
CREATE POLICY "staff_read_guest_payments"
ON public.guest_payment_intents FOR SELECT TO authenticated
USING (public.has_staff_canteen_access(canteen_id));

CREATE OR REPLACE FUNCTION public.get_staff_order_history(p_canteen_id uuid DEFAULT NULL)
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
    CASE
      WHEN public.has_staff_canteen_access(order_row.canteen_id, 'owner')
      THEN order_row.customer_name
      ELSE NULL
    END,
    order_row.queue_position,
    order_row.estimated_wait_minutes,
    order_row.created_at,
    order_row.updated_at
  FROM public.orders AS order_row
  WHERE public.has_staff_canteen_access(order_row.canteen_id)
    AND order_row.status IN ('completed', 'cancelled')
    AND (p_canteen_id IS NULL OR order_row.canteen_id = p_canteen_id)
  ORDER BY order_row.created_at DESC
  LIMIT 50;
$function$;

REVOKE ALL ON FUNCTION public.get_staff_order_history(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_staff_order_history(uuid) TO authenticated;
