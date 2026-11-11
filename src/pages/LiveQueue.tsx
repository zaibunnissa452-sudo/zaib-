import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Hash,
  ChefHat,
  PackageCheck,
  X,
  Loader2,
  Store,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Order, OrderStatus } from "../lib/types";
import { getFunctionErrorMessage } from "../lib/guestOrders";

interface LiveQueueProps {
  trackingToken: string | null;
}

interface PublicQueueOrder {
  id: string;
  order_number: number;
  items: Array<{ id: string; name: string; quantity: number }>;
  status: OrderStatus;
  queue_position: number;
  estimated_wait_minutes: number;
}

interface Canteen {
  id: string;
  name: string;
  is_open: boolean;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; badge: string; icon: typeof Clock; color: string }
> = {
  pending: { label: "IN QUEUE", badge: "badge-pending", icon: Clock, color: "text-amber" },
  preparing: { label: "PREPARING", badge: "badge-preparing", icon: ChefHat, color: "text-cyan" },
  ready: { label: "READY FOR PICKUP", badge: "badge-ready", icon: PackageCheck, color: "text-lime" },
  completed: { label: "COMPLETED", badge: "badge-completed", icon: PackageCheck, color: "text-gray-500" },
  cancelled: { label: "CANCELLED", badge: "badge-cancelled", icon: X, color: "text-rose" },
};

export function LiveQueue({ trackingToken }: LiveQueueProps) {
  const [orders, setOrders] = useState<PublicQueueOrder[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [selectedCanteen, setSelectedCanteen] = useState<string>("all");

  // ─── Fetch canteens once ───────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("canteens")
      .select("id, name, is_open")
      .order("created_at")
      .then(({ data }) => {
        if (data) setCanteens(data as Canteen[]);
      });
  }, []);

  // ─── Live queue polling ────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_public_live_queue");
    if (error) {
      setError(error.message);
    } else {
      setOrders((data ?? []) as PublicQueueOrder[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // ─── Tracked order polling ─────────────────────────────────────────────────
  useEffect(() => {
    if (!trackingToken) {
      setTrackedOrder(null);
      setTrackingError(null);
      setTrackingLoading(false);
      return;
    }

    let cancelled = false;
    const loadTrackedOrder = async () => {
      setTrackingLoading(true);
      const { data, error } = await supabase.functions.invoke<{ order: Order }>("guest-orders", {
        body: { action: "track", trackingToken },
      });
      if (cancelled) return;
      if (error) {
        setTrackingError(
          await getFunctionErrorMessage(
            error,
            "We couldn't load this order. Check your tracking link and try again."
          )
        );
      } else if (data?.order) {
        setTrackedOrder(data.order);
        setTrackingError(null);
      } else {
        setTrackingError(
          "We couldn't find this order. Check that you opened the correct tracking link."
        );
      }
      setTrackingLoading(false);
    };

    loadTrackedOrder();
    const interval = setInterval(loadTrackedOrder, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackingToken]);

  // ─── Derived state ─────────────────────────────────────────────────────────
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing"
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-rose">
        Failed to load queue: {error}
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen pt-24 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan pulse-dot shadow-[0_0_12px_#00e5ff]" />
            <span className="text-[10px] tracking-[4px] text-cyan font-bold">LIVE QUEUE</span>
          </div>
          <h2 className="page-title text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-2">
            Live Order Queue
          </h2>
          <p className="text-gray-400 mb-8">
            Real-time order status across all canteens. Updates every 5 seconds.
          </p>
        </motion.div>

        {/* ── Tracked order ── */}
        {trackingToken && (
          <div className="glass rounded-2xl p-5 mb-8">
            <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-3">YOUR ORDER</div>
            {trackingLoading && !trackedOrder ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan" />
                Loading your order...
              </div>
            ) : trackingError ? (
              <p role="alert" className="text-sm text-rose">{trackingError}</p>
            ) : trackedOrder ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="font-bold text-2xl text-white">Order #{trackedOrder.order_number}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {trackedOrder.items.map((item) => item.quantity + "x " + item.name).join(", ")}
                  </div>
                </div>
                <span className="badge badge-preparing">
                  {trackedOrder.status.replace("_", " ").toUpperCase()}
                </span>
                {trackedOrder.status !== "ready" &&
                  trackedOrder.status !== "completed" &&
                  trackedOrder.status !== "cancelled" && (
                    <div className="text-sm text-cyan">
                      Estimated wait: {trackedOrder.estimated_wait_minutes}m
                    </div>
                  )}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Per-stall status cards ── */}
        {canteens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8"
          >
            <div className="text-[10px] tracking-[4px] text-gray-500 font-bold mb-3 flex items-center gap-2">
              <Store className="w-3.5 h-3.5" />
              STALL STATUS
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {canteens.map((canteen) => (
                <motion.div
                  key={canteen.id}
                  whileHover={{ scale: 1.03 }}
                  className="glass rounded-xl p-4 min-w-[160px] flex-shrink-0 border border-white/5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-white leading-tight line-clamp-2">
                      {canteen.name}
                    </span>
                    {canteen.is_open ? (
                      <Wifi className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full ${
                      canteen.is_open
                        ? "bg-cyan/10 text-cyan border border-cyan/20"
                        : "bg-white/5 text-gray-500 border border-white/10"
                    }`}
                  >
                    {canteen.is_open ? "OPEN" : "CLOSED"}
                  </span>
                  <div className="mt-3 text-xs text-gray-500">
                    <span className="text-white font-semibold">{activeOrders.length}</span>{" "}
                    active orders
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Stall filter tab bar ── */}
        {canteens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide"
          >
            {/* All Stalls tab */}
            <button
              onClick={() => setSelectedCanteen("all")}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide border transition-all duration-200 ${
                selectedCanteen === "all"
                  ? "bg-cyan/10 text-cyan border-cyan/40 shadow-[0_0_12px_#00e5ff30]"
                  : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
              }`}
            >
              All Stalls
            </button>
            {canteens.map((canteen) => (
              <button
                key={canteen.id}
                onClick={() => setSelectedCanteen(canteen.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide border transition-all duration-200 whitespace-nowrap ${
                  selectedCanteen === canteen.id
                    ? "bg-cyan/10 text-cyan border-cyan/40 shadow-[0_0_12px_#00e5ff30]"
                    : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                {canteen.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Queue list ── */}
        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500">No active orders right now.</p>
            <p className="text-xs text-gray-600 mt-1">Place an order to see it appear here.</p>
          </div>
        ) : (
          <>
            {/* When a specific canteen is selected but we can't server-filter,
                show a soft notice. The queue is global; stall tabs control the
                stall-status view only. */}
            {selectedCanteen !== "all" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mb-4 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan/50" />
                Showing all queue entries — stall-level filtering is handled by the stall cards
                above.
              </motion.p>
            )}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {orders.map((order, i) => {
                  const cfg = statusConfig[order.status];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      {/* Order number */}
                      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-0 sm:min-w-[80px]">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Hash className="w-3.5 h-3.5" />
                          <span className="font-bold text-2xl text-white font-['Space_Grotesk']">
                            {order.order_number}
                          </span>
                        </div>
                      </div>

                      {/* Status + items */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`badge ${cfg.badge}`}>
                            <Icon className={`w-3 h-3 ${cfg.color}`} />
                            {cfg.label}
                          </span>
                          {order.status === "pending" && (
                            <span className="text-xs text-gray-500">
                              {order.queue_position}{" "}
                              {order.queue_position === 1 ? "order" : "orders"} ahead
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item) => (
                            <span
                              key={item.id}
                              className="text-xs text-gray-400 bg-white/5 rounded-lg px-2.5 py-1"
                            >
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Wait time */}
                      <div className="text-right sm:min-w-[80px]">
                        {order.status !== "ready" ? (
                          <>
                            <div className="text-xs text-gray-500 mb-0.5">Est. Wait</div>
                            <div className="text-lg font-bold text-cyan font-['Space_Grotesk']">
                              {order.estimated_wait_minutes}m
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-lime font-['Space_Grotesk']">
                            READY
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
