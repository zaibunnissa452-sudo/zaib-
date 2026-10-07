import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { MenuItem } from "./types";

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  canteenId: string | null;
  canteenName: string | null;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  clearCart: () => void;
  setCanteen: (name: string) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const [canteenName, setCanteenName] = useState<string | null>(null);

  const addItem = useCallback(
    (item: MenuItem) => {
      setItems((prev) => {
        if (canteenId && canteenId !== item.canteen_id && prev.length > 0) {
          return [{ ...item, quantity: 1 }];
        }
        setCanteenId(item.canteen_id);
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
    },
    [canteenId]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const decreaseItem = useCallback((id: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCanteenId(null);
    setCanteenName(null);
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const setCanteen = (name: string) => setCanteenName(name);

  return (
    <CartContext.Provider
      value={{ items, canteenId, canteenName, addItem, removeItem, decreaseItem, clearCart, total, count, setCanteen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
