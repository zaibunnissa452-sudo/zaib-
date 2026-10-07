import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Hash, ChefHat, PackageCheck, X, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Order, OrderStatus } from "../lib/types";

export function LiveQueue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

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
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan pulse-dot shadow-[0_0_12px_#00e5ff]" />
            <span className="text-[10px] tracking-[4px] text-cyan font-bold">LIVE QUEUE</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-2">
            Live Order Queue
          </h2>
          <p className="text-gray-400 mb-8">
            Real-time order status across all canteens. Updates every 5 seconds.
          </p>
        </motion.div>

        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500">No active orders right now.</p>
            <p className="text-xs text-gray-600 mt-1">Place an order to see it appear here.</p>
          </div>
        ) : (
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
                            {order.queue_position} {order.queue_position === 1 ? "order" : "orders"} ahead
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
        )}
      </div>
    </div>
  );
}
