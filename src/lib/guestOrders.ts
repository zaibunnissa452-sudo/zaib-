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
