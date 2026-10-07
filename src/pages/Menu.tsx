import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Loader2, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Canteen, MenuItem } from "../lib/types";
import { useCart } from "../lib/cart";

interface MenuProps {
  canteen: Canteen;
  onBack: () => void;
}

export function Menu({ canteen, onBack }: MenuProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const { addItem, items: cartItems, setCanteen: setCartCanteen } = useCart();

  useEffect(() => {
    setCartCanteen(canteen.name);
  }, [canteen.name, setCartCanteen]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("canteen_id", canteen.id)
        .eq("is_available", true)
        .order("category");
      if (error) {
        setError(error.message);
      } else {
        setItems(data as MenuItem[]);
      }
      setLoading(false);
    }
    load();
  }, [canteen.id]);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered =
    activeCategory === "All"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const getQty = (id: string) =>
    cartItems.find((i) => i.id === id)?.quantity ?? 0;

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
        Failed to load menu: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan transition-colors text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <img
            src={canteen.image_url ?? ""}
            alt={canteen.name}
            className="w-20 h-20 rounded-xl object-cover border border-white/10"
          />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk']">
              {canteen.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{canteen.location}</p>
          </div>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-cyan/15 text-cyan border border-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="glass-card p-4 flex gap-4"
              >
                <img
                  src={item.image_url ?? ""}
                  alt={item.name}
                  className="w-24 h-24 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-0.5 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-cyan font-bold text-lg">
                        ₹{item.price}
                      </span>
                      <span className="text-gray-600 text-xs ml-2">
                        ~{item.prep_time_minutes}min
                      </span>
                    </div>
                    <button
                      onClick={() => addItem(item)}
                      className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-cyan to-violet text-white hover:scale-110 active:scale-95 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                    >
                      {getQty(item.id) > 0 ? (
                        <span className="text-sm font-bold">
                          {getQty(item.id)}
                        </span>
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-20">
            No items available in this category.
          </div>
        )}
      </div>
    </div>
  );
}
