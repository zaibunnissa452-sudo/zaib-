
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { MenuItem } from "./types";

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  canteenId: string | null;
  canteenName: string | null;
  addItem: (item: MenuItem) => void;
  canAddItem: (item: MenuItem) => boolean;
  removeItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  clearCart: () => void;
  setCanteen: (id: string, name: string) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const [canteenName, setCanteenName] = useState<string | null>(null);

  const canAddItem = useCallback(
    (item: MenuItem) => items.length === 0 || items[0].canteen_id === item.canteen_id,
    [items]
  );

  const addItem = useCallback((item: MenuItem) => {
    setItems((previous) => {
      // Do not silently replace a cart containing food from another canteen.
      if (
        previous.length > 0 &&
        previous[0].canteen_id !== item.canteen_id
      ) {
        return previous;
      }

      const existing = previous.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existing) {
        return previous.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...previous, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const decreaseItem = useCallback((id: string) => {
    setItems((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCanteenId(null);
    setCanteenName(null);
  }, []);

  const setCanteen = useCallback((id: string, name: string) => {
    setCanteenId(id);
    setCanteenName(name);
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const count = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        canteenId,
        canteenName,
        addItem,
        canAddItem,
        removeItem,
        decreaseItem,
        clearCart,
        setCanteen,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
