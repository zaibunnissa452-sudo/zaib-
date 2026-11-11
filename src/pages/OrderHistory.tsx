import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Hash, Trash2, ExternalLink, ShoppingBag } from "lucide-react";
import { loadOrderHistory, clearOrderHistory } from "../lib/guestOrders";

interface OrderHistoryProps {
  onTrackOrder: (token: string) => void;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today ${timeStr}`;

  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  return `${dateStr}, ${timeStr}`;
}

export function OrderHistory({ onTrackOrder }: OrderHistoryProps) {
  const [orders, setOrders] = useState(() => loadOrderHistory());
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    clearOrderHistory();
    setOrders([]);
    setConfirmClear(false);
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-3">
            YOUR ORDERS
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-2">
                Order History
              </h2>
              <p className="text-gray-400">
                All your past orders on this device. Tap any order to track it.
              </p>
            </div>
            {orders.length > 0 && (
              <div className="flex-shrink-0">
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose">Clear all?</span>
                    <button
                      onClick={handleClear}
                      className="px-3 py-1.5 rounded-full bg-rose/20 text-rose text-xs font-bold border border-rose/30 hover:bg-rose/30 transition-colors"
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-500 text-xs border border-white/10 hover:border-rose/30 hover:text-rose transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear History
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Empty state */}
        {orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-16 text-center"
          >
            <ShoppingBag className="w-14 h-14 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">No orders yet</h3>
            <p className="text-sm text-gray-600">
              Place your first order to see it appear here.
            </p>
          </motion.div>
        )}

        {/* Order list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {orders.map((order, i) => (
              <motion.div
                key={order.token}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="glass-card p-4 sm:p-5"
              >
                <div className="flex items-center gap-4">
                  {/* Order number */}
                  <div className="text-center min-w-[56px]">
                    <div className="text-[10px] text-gray-600 flex items-center gap-1 justify-center mb-0.5">
                      <Hash className="w-3 h-3" />
                    </div>
                    <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                      {order.orderNumber}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-cyan text-xs font-medium mb-0.5">
                      {order.canteenName}
                    </div>
                    <div className="text-white font-bold text-sm mb-1">
                      ₹{order.total.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.placedAt)}
                    </div>
                  </div>

                  {/* Track button */}
                  <button
                    onClick={() => onTrackOrder(order.token)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:border-cyan/40 hover:text-cyan transition-all flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Track
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
