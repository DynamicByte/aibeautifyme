'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

// Dr. Chang's Bundle Configuration
const DR_CHANG_BUNDLE = {
  productIds: ['dr-chang-cleansing-foam', 'dr-chang-serum', 'dr-chang-sunscreen'],
  bundlePrice: 3998,
  bundleName: "Dr. Chang's Mega Peptide Bundle",
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
  getTotalFormatted: () => string;
  getBundleDiscount: () => number;
  hasDrChangBundle: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/[\d,]+/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  };

  // Check if cart has all Dr. Chang's products for bundle
  const hasDrChangBundle = useCallback(() => {
    const drChangItems = items.filter(item => 
      DR_CHANG_BUNDLE.productIds.includes(item.product.id)
    );
    // Check if all 3 products are in cart with at least qty 1
    return DR_CHANG_BUNDLE.productIds.every(id => 
      drChangItems.some(item => item.product.id === id && item.quantity >= 1)
    );
  }, [items]);

  // Calculate how many complete bundles can be formed
  const getBundleCount = useCallback(() => {
    if (!hasDrChangBundle()) return 0;
    
    const quantities = DR_CHANG_BUNDLE.productIds.map(id => {
      const item = items.find(i => i.product.id === id);
      return item?.quantity || 0;
    });
    
    // Number of complete bundles is the minimum quantity among all 3 products
    return Math.min(...quantities);
  }, [items, hasDrChangBundle]);

  // Calculate bundle discount
  const getBundleDiscount = useCallback(() => {
    const bundleCount = getBundleCount();
    if (bundleCount === 0) return 0;

    // Calculate original price of bundle items
    const originalBundlePrice = DR_CHANG_BUNDLE.productIds.reduce((sum, id) => {
      const item = items.find(i => i.product.id === id);
      if (item) {
        return sum + parsePrice(item.product.price);
      }
      return sum;
    }, 0);

    // Discount per bundle = original price - bundle price
    const discountPerBundle = originalBundlePrice - DR_CHANG_BUNDLE.bundlePrice;
    return discountPerBundle * bundleCount;
  }, [items, getBundleCount]);

  const getTotal = useCallback(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = parsePrice(item.product.price);
      return sum + price * item.quantity;
    }, 0);
    
    // Apply bundle discount
    const discount = getBundleDiscount();
    return subtotal - discount;
  }, [items, getBundleDiscount]);

  const getTotalFormatted = useCallback(() => {
    const total = getTotal();
    return `₱${total.toLocaleString()}`;
  }, [getTotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal,
        getTotalFormatted,
        getBundleDiscount,
        hasDrChangBundle,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    return {
      items: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getItemCount: () => 0,
      getTotal: () => 0,
      getTotalFormatted: () => '₱0',
      getBundleDiscount: () => 0,
      hasDrChangBundle: () => false,
    };
  }
  return context;
}
