export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface Canteen {
  id: string;
  name: string;
  location: string;
  description: string | null;
  image_url: string | null;
  is_open: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  canteen_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  prep_time_minutes: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  canteen_id: string;
  order_number: number;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customer_name: string | null;
  queue_position: number;
  estimated_wait_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CanteenWithCounts extends Canteen {
  menu_count?: number;
  active_orders?: number;
}
