import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Background } from "./components/Background";
import { Nav } from "./components/Nav";
import { CartDrawer } from "./components/CartDrawer";
import { OrderSuccess } from "./components/OrderSuccess";
import { Home } from "./pages/Home";
import { Canteens } from "./pages/Canteens";
import { Menu } from "./pages/Menu";
import { LiveQueue } from "./pages/LiveQueue";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { CartProvider } from "./lib/cart";
import type { Canteen } from "./lib/types";
import type { GuestOrder } from "./lib/guestOrders";

type TabId = "home" | "canteens" | "menu" | "queue" | "owner";

function readTrackingToken() {
  const token = new URLSearchParams(window.location.search).get("track");
  return token && /^[0-9a-f]{64}$/i.test(token) ? token : null;
}

function updateTrackingUrl(token: string | null) {
  const url = new URL(window.location.href);
  if (token) url.searchParams.set("track", token);
  else url.searchParams.delete("track");
  window.history.replaceState({}, "", url.toString());
}

function AppContent() {
  const [trackingToken, setTrackingToken] = useState<string | null>(() => readTrackingToken());
  const [tab, setTab] = useState<TabId>(() => (readTrackingToken() ? "queue" : "home"));
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [recentOrder, setRecentOrder] = useState<GuestOrder | null>(null);

  const handleNavigate = useCallback((next: TabId) => {
    if (next !== "queue") {
      setTrackingToken(null);
      updateTrackingUrl(null);
    }
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectCanteen = useCallback((canteen: Canteen) => {
    setTrackingToken(null);
    updateTrackingUrl(null);
    setSelectedCanteen(canteen);
    setTab("menu");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleOrderPlaced = useCallback((order: GuestOrder) => {
    setTrackingToken(order.trackingToken);
    updateTrackingUrl(order.trackingToken);
    setRecentOrder(order);
    setCartOpen(false);
  }, []);

  const handleTrackOrder = useCallback((token: string) => {
    setTrackingToken(token);
    setTab("queue");
    updateTrackingUrl(token);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen relative">
      <Background />
      <Nav active={tab} onNavigate={handleNavigate} onCartClick={() => setCartOpen(true)} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {tab === "home" && <Home onExplore={() => handleNavigate("canteens")} />}
          {tab === "canteens" && <Canteens onSelectCanteen={handleSelectCanteen} />}
          {tab === "menu" && selectedCanteen && (
            <Menu canteen={selectedCanteen} onBack={() => handleNavigate("canteens")} />
          )}
          {tab === "menu" && !selectedCanteen && (
            <div className="min-h-screen flex items-center justify-center pt-16 text-gray-400">
              Please select a canteen first.
            </div>
          )}
          {tab === "queue" && <LiveQueue trackingToken={trackingToken} />}
          {tab === "owner" && <OwnerDashboard />}
        </motion.div>
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      <OrderSuccess
        order={recentOrder}
        onClose={() => setRecentOrder(null)}
        onViewQueue={handleTrackOrder}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
