/*
# LORDS Smart Canteen - Database Schema

## Overview
Creates the full schema for a campus food ordering system with canteens, menu items, and orders with live queue tracking.

## New Tables

### 1. canteens
- `id` (uuid, primary key)
- `name` (text) - canteen name
- `location` (text) - campus location
- `description` (text) - short description
- `image_url` (text) - hero image URL
- `is_open` (boolean, default true) - whether the canteen is currently accepting orders
- `created_at` (timestamp)

### 2. menu_items
- `id` (uuid, primary key)
- `canteen_id` (uuid, FK to canteens)
- `name` (text) - food item name
- `description` (text) - item description
- `price` (numeric) - price in currency
- `category` (text) - e.g. Burgers, Beverages, Snacks, Meals
- `image_url` (text) - food image URL
- `is_available` (boolean, default true)
- `prep_time_minutes` (int, default 10) - estimated prep time
- `created_at` (timestamp)

### 3. orders
- `id` (uuid, primary key)
- `canteen_id` (uuid, FK to canteens)
- `order_number` (int) - sequential order number per canteen
- `items` (jsonb) - array of {name, price, quantity}
- `total` (numeric) - total order amount
- `status` (text) - 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
- `customer_name` (text) - optional name for the order
- `queue_position` (int) - position in queue
- `estimated_wait_minutes` (int) - estimated wait time
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Security
- RLS enabled on all tables.
- This is a no-auth app (no sign-in screen), so all policies use TO anon, authenticated.
- All data is intentionally shared/public for the demo.
*/ 

CREATE TABLE IF NOT EXISTS canteens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  description text,
  image_url text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_canteens" ON canteens;
CREATE POLICY "anon_select_canteens" ON canteens FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_canteens" ON canteens;
CREATE POLICY "anon_insert_canteens" ON canteens FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_canteens" ON canteens;
CREATE POLICY "anon_update_canteens" ON canteens FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_canteens" ON canteens;
CREATE POLICY "anon_delete_canteens" ON canteens FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Other',
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  prep_time_minutes int NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_menu_items" ON menu_items;
CREATE POLICY "anon_select_menu_items" ON menu_items FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  order_number int NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  customer_name text,
  queue_position int NOT NULL DEFAULT 0,
  estimated_wait_minutes int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_menu_items_canteen ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_canteen ON orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
