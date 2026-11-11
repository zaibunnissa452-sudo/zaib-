import type { Order } from "./types";

export interface GuestOrder extends Order {
  trackingToken: string;
}

export async function getFunctionErrorMessage(error: unknown, fallback: string) {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error.trim()) return body.error;
    } catch {
      // Use the friendly fallback when the function response has no JSON body.
    }
  }
  return fallback;
}

// ─── Order History (localStorage) ───────────────────────────────────────────

export interface SavedOrderToken {
  token: string;
  orderNumber: number;
  canteenName: string;
  total: number;
  placedAt: string; // ISO timestamp
}

const HISTORY_KEY = "lords_order_tokens";
const MAX_SAVED = 20;

export function saveOrderToHistory(order: GuestOrder, canteenName: string): void {
  try {
    const existing = loadOrderHistory();
    // Avoid duplicates
    const filtered = existing.filter((o) => o.token !== order.trackingToken);
    const entry: SavedOrderToken = {
      token: order.trackingToken,
      orderNumber: order.order_number,
      canteenName,
      total: order.total,
      placedAt: order.created_at ?? new Date().toISOString(),
    };
    const updated = [entry, ...filtered].slice(0, MAX_SAVED);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable in some contexts — fail silently
  }
}

export function loadOrderHistory(): SavedOrderToken[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedOrderToken[]) : [];
  } catch {
    return [];
  }
}

export function clearOrderHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // fail silently
  }
}
