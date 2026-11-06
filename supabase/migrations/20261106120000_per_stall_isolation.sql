-- ============================================================
-- Migration: per_stall_isolation
-- Adds canteen_id to staff_roles so owners are scoped to their
-- own stall only. NULL canteen_id = super-owner / admin access.
-- ============================================================

-- 1. Add canteen_id column to staff_roles
ALTER TABLE public.staff_roles
  ADD COLUMN IF NOT EXISTS canteen_id uuid REFERENCES public.canteens(id) ON DELETE SET NULL;

-- 2. Update get_owner_orders to respect per-stall isolation
CREATE OR REPLACE FUNCTION public.get_owner_orders(p_canteen_id uuid DEFAULT NULL)
RETURNS TABLE (
  id                      uuid,
  canteen_id              uuid,
  order_number            integer,
  items                   jsonb,
  total                   numeric,
  status                  text,
  customer_name           text,
  queue_position          integer,
  estimated_wait_minutes  integer,
  created_at              timestamptz,
  updated_at              timestamptz
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
    AND (
      -- Respect optional caller-supplied canteen filter
      p_canteen_id IS NULL
      OR order_row.canteen_id = p_canteen_id
    )
    AND (
      -- Also restrict by the owner's own canteen_id if set in staff_roles
      -- NULL canteen_id on staff_roles = access to all stalls
      NOT EXISTS (
        SELECT 1 FROM public.staff_roles sr
        WHERE sr.user_id = auth.uid() AND sr.canteen_id IS NOT NULL
      )
      OR order_row.canteen_id = (
        SELECT sr.canteen_id FROM public.staff_roles sr WHERE sr.user_id = auth.uid()
        LIMIT 1
      )
    )
  ORDER BY order_row.created_at ASC;
$function$;

-- 3. Update staff_roles read policy to include canteen_id column
DROP POLICY IF EXISTS "staff_users_read_own_role" ON public.staff_roles;
CREATE POLICY "staff_users_read_own_role"
ON public.staff_roles
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));
