import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Hash, Clock, ArrowRight, X } from "lucide-react";
import type { Order } from "../lib/types";

interface OrderSuccessProps {
  order: Order | null;
  onClose: () => void;
  onViewQueue: () => void;
}

export function OrderSuccess({ order, onClose, onViewQueue }: OrderSuccessProps) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[90] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass rounded-3xl p-8 max-w-md w-full pointer-events-auto relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-16 h-16 rounded-full bg-lime/15 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 className="w-8 h-8 text-lime" />
              </motion.div>

              <h3 className="text-center text-2xl font-bold font-['Space_Grotesk'] mb-1">
                Order Placed!
              </h3>
              <p className="text-center text-gray-400 text-sm mb-6">
                Your order has been added to the queue
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass-card p-4 text-center">
                  <Hash className="w-4 h-4 text-cyan mx-auto mb-1" />
                  <div className="text-xs text-gray-500 mb-0.5">Order</div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    #{order.order_number}
                  </div>
                </div>
                <div className="glass-card p-4 text-center">
                  <Clock className="w-4 h-4 text-amber mx-auto mb-1" />
                  <div className="text-xs text-gray-500 mb-0.5">Est. Wait</div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    {order.estimated_wait_minutes}m
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 mb-6">
                <div className="text-xs text-gray-500 mb-2">Queue Position</div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-cyan font-['Space_Grotesk']">
                    {order.queue_position}
                  </span>
                  <span className="text-sm text-gray-400">
                    {order.queue_position === 1 ? "order ahead" : "orders ahead"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-full border border-white/15 bg-white/5 text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  CONTINUE
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onViewQueue();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cyan to-violet text-white text-sm font-bold hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all"
                >
                  TRACK ORDER
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
