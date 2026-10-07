import { ShoppingCart } from "lucide-react";
import { useCart } from "../lib/cart";

type TabId = "home" | "canteens" | "menu" | "queue" | "owner";

const tabs: { id: TabId; label: string }[] = [
  { id: "home", label: "HOME" },
  { id: "canteens", label: "CANTEENS" },
  { id: "menu", label: "MENU" },
  { id: "queue", label: "LIVE QUEUE" },
  { id: "owner", label: "OWNER" },
];

interface NavProps {
  active: TabId;
  onNavigate: (tab: TabId) => void;
  onCartClick: () => void;
}

export function Nav({ active, onNavigate, onCartClick }: NavProps) {
  const { count } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 sm:px-6 z-50 border-b border-white/10 bg-[#05050880] backdrop-blur-xl">
      <div className="flex items-center gap-6 sm:gap-8">
        <div
          className="text-lg sm:text-xl font-bold tracking-widest cursor-pointer select-none"
          onClick={() => onNavigate("home")}
        >
          LORDS<span className="neon-cyan ml-1.5">/SC</span>
        </div>
        <div className="hidden md:flex items-center gap-7">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              className={`text-[11px] tracking-[2px] font-bold transition-colors duration-300 ${
                active === t.id ? "text-cyan" : "text-gray-500 hover:text-cyan"
              }`}
            >
              {t.label}
              {active === t.id && (
                <div className="h-0.5 mt-1 bg-cyan rounded-full shadow-[0_0_8px_#00e5ff]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCartClick}
          className="relative flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-3 sm:px-4 py-2 text-[11px] tracking-wider font-bold hover:border-cyan/40 hover:bg-cyan/5 transition-all duration-300"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">CART</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-cyan to-violet text-[10px] font-bold flex items-center justify-center text-white shadow-[0_0_12px_#00e5ff]">
              {count}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
