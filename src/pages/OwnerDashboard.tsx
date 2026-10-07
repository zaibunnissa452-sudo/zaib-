import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, PackageCheck, Check, X, Clock, Loader2, Store } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Order, OrderStatus, Canteen } from "../lib/types";

export function OwnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: true });

    if (selectedCanteen !== "all") {
      query = query.eq("canteen_id", selectedCanteen);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [selectedCanteen]);

  useEffect(() => {
    async function loadCanteens() {
      const { data } = await supabase.from("canteens").select("*").order("name");
      if (data) setCanteens(data as Canteen[]);
    }
    loadCanteens();
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) {
      setError(error.message);
    } else {
      await loadOrders();
    }
    setUpdating(null);
  };

  const canteenName = (id: string) =>
    canteens.find((c) => c.id === id)?.name ?? "Unknown";

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  const statusActions: Record<
    OrderStatus,
    { next: OrderStatus; label: string; icon: typeof ChefHat; color: string }[]
  > = {
    pending: [
      { next: "preparing", label: "Start Preparing", icon: ChefHat, color: "from-cyan to-violet" },
      { next: "cancelled", label: "Cancel", icon: X, color: "from-rose to-rose" },
    ],
    preparing: [
      { next: "ready", label: "Mark Ready", icon: PackageCheck, color: "from-lime to-cyan" },
    ],
    ready: [
      { next: "completed", label: "Complete", icon: Check, color: "from-violet to-magenta" },
    ],
    completed: [],
    cancelled: [],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-3">
            OWNER DASHBOARD
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-6">
            Order Management
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: "In Queue", count: pending.length, color: "text-amber", border: "border-amber/20", bg: "bg-amber/5" },
            { label: "Preparing", count: preparing.length, color: "text-cyan", border: "border-cyan/20", bg: "bg-cyan/5" },
            { label: "Ready", count: ready.length, color: "text-lime", border: "border-lime/20", bg: "bg-lime/5" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-4 sm:p-5 ${stat.border} border`}
            >
              <div className={`text-2xl sm:text-4xl font-bold ${stat.color} font-['Space_Grotesk']`}>
                {stat.count}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 tracking-wider mt-1">
                {stat.label.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Canteen filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCanteen("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
              selectedCanteen === "all"
                ? "bg-cyan/15 text-cyan border border-cyan/40"
                : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
            }`}
          >
            ALL CANTEENS
          </button>
          {canteens.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCanteen(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                selectedCanteen === c.id
                  ? "bg-cyan/15 text-cyan border border-cyan/40"
                  : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
              }`}
            >
              {c.name.toUpperCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-rose text-xs bg-rose/10 border border-rose/20 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Store className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500">No active orders right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {orders.map((order, i) => {
                const actions = statusActions[order.status] ?? [];
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="glass-card p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Left: order info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-gray-600">#</div>
                          <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                            {order.order_number}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-cyan mb-1">
                            {canteenName(order.canteen_id)}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {order.items.map((item) => (
                              <span
                                key={item.id}
                                className="text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-0.5"
                              >
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="font-bold text-gray-400">₹{order.total}</span>
                            {order.customer_name && <span>• {order.customer_name}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {order.estimated_wait_minutes}m
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: status badge + actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`badge ${
                            order.status === "pending"
                              ? "badge-pending"
                              : order.status === "preparing"
                              ? "badge-preparing"
                              : "badge-ready"
                          }`}
                        >
                          {order.status === "pending"
                            ? "PENDING"
                            : order.status === "preparing"
                            ? "PREPARING"
                            : "READY"}
                        </span>
                        {actions.map((action) => (
                          <button
                            key={action.next}
                            onClick={() => updateStatus(order.id, action.next)}
                            disabled={updating === order.id}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${action.color} hover:scale-105 active:scale-95 transition-transform disabled:opacity-50`}
                          >
                            <action.icon className="w-3.5 h-3.5" />
                            {action.label}
                          </button>
                        ))}
                      </div>
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
