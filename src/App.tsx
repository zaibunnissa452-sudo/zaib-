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
import type { Canteen, Order } from "./lib/types";

type TabId = "home" | "canteens" | "menu" | "queue" | "owner";

function AppContent() {
  const [tab, setTab] = useState<TabId>("home");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);

  const handleNavigate = useCallback((next: TabId) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectCanteen = useCallback((canteen: Canteen) => {
    setSelectedCanteen(canteen);
    setTab("menu");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleOrderPlaced = useCallback((order: Order) => {
    setRecentOrder(order);
    setCartOpen(false);
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
          {tab === "queue" && <LiveQueue />}
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
        onViewQueue={() => handleNavigate("queue")}
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
