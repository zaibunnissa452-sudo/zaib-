import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "../lib/cart";
import { supabase } from "../lib/supabase";
import type { Order } from "../lib/types";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

export function CartDrawer({ open, onClose, onOrderPlaced }: CartDrawerProps) {
  const { items, removeItem, decreaseItem, addItem, clearCart, total, canteenName } =
    useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    setError(null);

    const canteenId = items[0].canteen_id;
    const orderItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    // Count existing orders for this canteen to get next order number
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("canteen_id", canteenId);

    const orderNumber = (count ?? 0) + 1;

    // Count pending/preparing orders to get queue position
    const { count: activeCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("canteen_id", canteenId)
      .in("status", ["pending", "preparing"]);

    const queuePosition = (activeCount ?? 0) + 1;
    const estimatedWait =
      queuePosition * 8 + items.reduce((s, i) => s + i.prep_time_minutes * i.quantity, 0);

    const { data, error: insertError } = await supabase
      .from("orders")
      .insert({
        canteen_id: canteenId,
        order_number: orderNumber,
        items: orderItems,
        total,
        status: "pending",
        customer_name: customerName || null,
        queue_position: queuePosition,
        estimated_wait_minutes: Math.min(estimatedWait, 99),
      })
      .select()
      .maybeSingle();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to place order");
      setPlacing(false);
      return;
    }

    onOrderPlaced(data as Order);
    clearCart();
    setPlacing(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[#080810] border-l border-white/10 z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan" />
                <h3 className="font-bold text-lg">Your Cart</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {canteenName && (
              <div className="px-5 py-2 text-xs text-gray-500 border-b border-white/5">
                Ordering from <span className="text-cyan">{canteenName}</span>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="text-center text-gray-500 py-20">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Your cart is empty</p>
                  <p className="text-xs mt-1">Add items from a canteen menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="glass-card p-3 flex items-center gap-3"
                    >
                      <img
                        src={item.image_url ?? ""}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-cyan font-bold text-sm">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? decreaseItem(item.id)
                              : removeItem(item.id)
                          }
                          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addItem(item)}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/10 p-5 space-y-4">
                {error && (
                  <div className="text-rose text-xs bg-rose/10 border border-rose/20 rounded-lg p-3">
                    {error}
                  </div>
                )}
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-gray-600 focus:border-cyan/40 focus:outline-none transition-colors"
                />
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-2xl font-bold neon-cyan">₹{total}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-cyan via-violet to-magenta text-white font-bold text-sm tracking-wider hover:shadow-[0_0_35px_rgba(0,229,255,0.4)] transition-all duration-400 disabled:opacity-50"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PLACING ORDER...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      PLACE ORDER
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
