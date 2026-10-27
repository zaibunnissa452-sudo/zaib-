
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Loader2, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Canteen, MenuItem } from "../lib/types";
import { useCart } from "../lib/cart";
import { canteenImageFor, menuImageFor } from "../lib/menuImages";

interface MenuProps {
  canteen: Canteen;
  onBack: () => void;
}

export function Menu({ canteen, onBack }: MenuProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  const {
    addItem,
    items: cartItems,
    setCanteen: setCartCanteen,
    canAddItem,
  } = useCart();

  useEffect(() => {
    if (cartItems.length === 0 || cartItems[0].canteen_id === canteen.id) {
      setCartCanteen(canteen.id, canteen.name);
    }
  }, [canteen.id, canteen.name, cartItems, setCartCanteen]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("canteen_id", canteen.id)
        .eq("is_available", true)
        .order("category");

      if (cancelled) return;

      if (error) {
        setError(error.message);
      } else {
        setItems(
          (data ?? []).map((item) => ({
            ...(item as MenuItem),
            image_url:
              menuImageFor(item.name) ?? (item as MenuItem).image_url,
          }))
        );
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [canteen.id]);

  const categories = [
    "All",
    ...Array.from(new Set(items.map((item) => item.category))),
  ];

  const filtered = items.filter(
    (item) =>
      (activeCategory === "All" || item.category === activeCategory) &&
      item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const canteenImage = canteenImageFor(canteen.name) ?? canteen.image_url;

  const getQty = (id: string) =>
    cartItems.find((item) => item.id === id)?.quantity ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-rose px-4">
        Failed to load menu: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-8 relative z-10">
      <div className="max-w-5xl mx-auto">
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
          {canteenImage && (
            <img
              src={canteenImage}
              alt={canteen.name}
              className="w-20 h-20 rounded-xl object-cover border border-white/10"
            />
          )}

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk']">
              {canteen.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {canteen.location}
            </p>
            <p className={canteen.is_open ? "text-xs mt-2 font-bold text-lime" : "text-xs mt-2 font-bold text-rose"}>
              {canteen.is_open ? "OPEN FOR ORDERS" : "CLOSED — ORDERS PAUSED"}
            </p>
          </div>
        </motion.div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search food..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-cyan/40"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                activeCategory === category
                  ? "bg-cyan/15 text-cyan border border-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
              }`}
            >
              {category.toUpperCase()}
            </button>
          ))}
        </div>

        {cartNotice && (
          <div role="alert" className="mb-4 rounded-xl border border-amber/20 bg-amber/5 p-3 text-sm text-amber">
            {cartNotice}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-card p-4 flex gap-4"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-0.5 truncate">
                    {item.name}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-cyan font-bold text-lg">
                        ₹{item.price}
                      </span>
                      <span className="text-gray-600 text-xs ml-2">
                        ~{item.prep_time_minutes} min
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!canAddItem(item)) {
                          setCartNotice("Your cart has items from another canteen. Clear the cart before adding food from this one.");
                          return;
                        }
                        setCartNotice(null);
                        addItem(item);
                      }}
                      disabled={!canteen.is_open}
                      aria-label={`Add ${item.name} to cart`}
                      className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-cyan to-violet text-white hover:scale-110 active:scale-95 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            No items available in this category.
          </div>
        )}
      </div>
    </div>
  );
}
