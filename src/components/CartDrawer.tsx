import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "../lib/cart";
import { supabase } from "../lib/supabase";
import type { GuestOrder } from "../lib/guestOrders";
import { getFunctionErrorMessage } from "../lib/guestOrders";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (order: GuestOrder) => void;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name?: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
}

interface RazorpayCheckout {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-razorpay-checkout]");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CartDrawer({ open, onClose, onOrderPlaced }: CartDrawerProps) {
  const { items, removeItem, decreaseItem, addItem, clearCart, total, canteenName } =
    useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  const handleCheckout = async () => {
    if (items.length === 0) return;

    const canteenId = items[0].canteen_id;
    if (items.some((item) => item.canteen_id !== canteenId)) {
      setError("Your cart contains items from different canteens. Clear the cart and choose one canteen.");
      return;
    }

    setPlacing(true);
    setError(null);

    try {
      const checkoutReady = await loadRazorpayCheckout();
      if (!checkoutReady || !window.Razorpay) {
        setError("Secure payment could not be loaded. Check your connection and try again.");
        return;
      }

      const { data, error: checkoutError } = await supabase.functions.invoke<{
        keyId: string;
        payment: { orderId: string; amount: number; currency: string };
        trackingToken: string;
      }>("guest-orders", {
        body: {
          action: "create-payment",
          canteenId,
          customerName: customerName.trim(),
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        },
      });

      if (checkoutError) {
        setError(await getFunctionErrorMessage(checkoutError, "We couldn't start secure payment. Please try again."));
        return;
      }

      if (!data?.keyId || !data.payment?.orderId || !data.trackingToken) {
        setError("We couldn't prepare secure checkout. Please try again.");
        return;
      }

      if (data.payment.amount !== Math.round(total * 100)) {
        setError("A menu price changed. Refresh your cart before paying.");
        return;
      }

      let paymentReturned = false;
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.payment.amount,
        currency: data.payment.currency,
        name: "LORDS SMART CANTEEN",
        description: "Canteen order",
        order_id: data.payment.orderId,
        prefill: customerName.trim() ? { name: customerName.trim() } : {},
        theme: { color: "#00e5ff" },
        handler: async (paymentResponse) => {
          paymentReturned = true;
          setPlacing(true);
          setError(null);

          try {
            const { data: verified, error: verifyError } = await supabase.functions.invoke<{
              order: Omit<GuestOrder, "trackingToken">;
            }>("guest-orders", {
              body: {
                action: "verify-payment",
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
            });

            if (verifyError) {
              setError(await getFunctionErrorMessage(verifyError, "We couldn't confirm the payment yet. Please contact the canteen before paying again."));
              return;
            }

            if (!verified?.order) {
              setError("We couldn't confirm the order yet. Please contact the canteen before paying again.");
              return;
            }

            onOrderPlaced({ ...verified.order, trackingToken: data.trackingToken });
            clearCart();
          } catch {
            setError("We couldn't confirm the payment yet. Please contact the canteen before paying again.");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (!paymentReturned) {
              setError("Payment was not completed, so no order was placed.");
            }
          },
        },
      });

      checkout.open();
    } catch {
      setError("We couldn't reach secure checkout. Check your connection and try again.");
    } finally {
      setPlacing(false);
    }
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
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan" />
                <h3 className="font-bold text-lg">Your Cart</h3>
                {items.length > 0 && (
                  <button onClick={clearCart} className="ml-2 text-xs text-gray-500 hover:text-rose transition-colors">Clear</button>
                )}
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
                            item.quantity > 1 ? decreaseItem(item.id) : removeItem(item.id)
                          }
                          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
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
                <p className="text-center text-xs text-gray-500">
                  Secure online payment · UPI, cards and other available methods
                </p>
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-cyan via-violet to-magenta text-white font-bold text-sm tracking-wider hover:shadow-[0_0_35px_rgba(0,229,255,0.4)] transition-all duration-400 disabled:opacity-50"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PREPARING PAYMENT...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      PAY & PLACE ORDER
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
