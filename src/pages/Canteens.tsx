import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Utensils, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Canteen } from "../lib/types";

interface CanteensProps {
  onSelectCanteen: (canteen: Canteen) => void;
}

export function Canteens({ onSelectCanteen }: CanteensProps) {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("canteens")
        .select("*")
        .order("created_at");
      if (error) {
        setError(error.message);
      } else {
        setCanteens(data as Canteen[]);
      }
      setLoading(false);
    }
    load();
  }, []);

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
        Failed to load canteens: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-3">
            SELECT YOUR CANTEEN
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-2">
            Campus Canteens
          </h2>
          <p className="text-gray-400 mb-8">
            Choose a canteen to browse its menu and place an order.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {canteens.map((canteen, i) => (
            <motion.button
              key={canteen.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onSelectCanteen(canteen)}
              className="glass-card text-left overflow-hidden group relative cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden rounded-t-[20px]">
                <img
                  src={canteen.image_url ?? ""}
                  alt={canteen.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#03030840] to-transparent" />
                <div className="absolute top-4 right-4">
                  <span
                    className={`badge ${
                      canteen.is_open ? "badge-ready" : "badge-cancelled"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        canteen.is_open ? "bg-lime pulse-dot" : "bg-rose"
                      }`}
                    />
                    {canteen.is_open ? "OPEN" : "CLOSED"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 font-['Space_Grotesk']">
                  {canteen.name}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {canteen.location}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">
                  {canteen.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan text-xs font-medium">
                    <Utensils className="w-3.5 h-3.5" />
                    View Menu
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyan group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
