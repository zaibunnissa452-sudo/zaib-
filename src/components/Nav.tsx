import {
  ClipboardList,
  Home as HomeIcon,
  MapPin,
  ShoppingCart,
  Store,
} from "lucide-react";
import { useCart } from "../lib/cart";
import { ElectricLogo } from "./ElectricLogo";

type TabId = "home" | "canteens" | "menu" | "queue" | "history" | "owner";

const tabs: { id: TabId; label: string; shortLabel: string; icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", shortLabel: "Home", icon: HomeIcon },
  { id: "canteens", label: "Canteens", shortLabel: "Food", icon: MapPin },
  { id: "queue", label: "Live queue", shortLabel: "Queue", icon: ClipboardList },
  { id: "history", label: "My orders", shortLabel: "Orders", icon: ShoppingCart },
  { id: "owner", label: "Staff login", shortLabel: "Staff", icon: Store },
];

interface NavProps {
  active: TabId;
  onNavigate: (tab: TabId) => void;
  onCartClick: () => void;
}

export function Nav({ active, onNavigate, onCartClick }: NavProps) {
  const { count } = useCart();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 sm:px-6 z-50 border-b border-white/10 bg-[#05050880] backdrop-blur-xl">
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            className="flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-widest cursor-pointer select-none"
            onClick={() => onNavigate("home")}
            aria-label="Lords Smart Canteen home"
          >
            <ElectricLogo src="/images/lords-college-logo.png" />
            <span className="whitespace-nowrap">LORDS<span className="neon-cyan ml-1.5">/SC</span></span>
          </button>
          <div className="hidden md:flex items-center gap-7">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              aria-current={active === t.id ? "page" : undefined}
              className={`text-[11px] tracking-[2px] font-bold transition-colors duration-300 ${
                active === t.id ? "text-cyan" : "text-gray-500 hover:text-cyan"
              }`}
            >
              {t.label.toUpperCase()}
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
            aria-label={`Open cart${count > 0 ? `, ${count} items` : ""}`}
            className="relative flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-3 sm:px-4 py-2 text-[11px] tracking-wider font-bold hover:border-cyan/40 hover:bg-cyan/5 transition-all duration-300"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">CART</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-gradient-to-br from-cyan to-violet text-[10px] font-bold flex items-center justify-center text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      <nav
        aria-label="Main navigation"
        className="mobile-nav fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#050508f5] backdrop-blur-xl md:hidden"
      >
        {tabs.map(({ id, shortLabel, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={active === id ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors ${
              active === id ? "text-cyan" : "text-gray-500 hover:text-gray-200"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{shortLabel}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
