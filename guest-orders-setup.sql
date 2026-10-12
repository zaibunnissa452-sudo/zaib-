-- Add a hashed guest tracking token to orders.
-- Existing orders remain valid; no existing policies are changed.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_token_hash text;

CREATE INDEX IF NOT EXISTS orders_guest_token_hash_idx
ON public.orders (guest_token_hash)
WHERE guest_token_hash IS NOT NULL;