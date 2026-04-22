'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from './CartContext';

interface ProductCardProps {
  product: Product;
  stepName: string;
}

export default function ProductCard({ product, stepName }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const decrementQty = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const incrementQty = () => {
    if (quantity < 10) setQuantity(q => q + 1);
  };

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-3 hover:border-purple-500 transition">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-surface-3 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-text-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gold-700 font-medium uppercase tracking-wide">{stepName}</p>
          <h4 className="text-text-1 font-medium text-sm truncate">{product.name}</h4>
          <p className="text-text-3 text-xs">{product.brand}</p>
          <p className="text-text-2 text-xs mt-1 line-clamp-2">{product.reason}</p>
          <p className="text-gold-600 font-semibold text-sm mt-1">{product.price}</p>
        </div>
      </div>
      
      {/* Quantity and Add to Cart */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        {/* Quantity Counter */}
        <div className="flex items-center bg-surface-3 rounded-lg">
          <button
            onClick={decrementQty}
            className="w-8 h-8 flex items-center justify-center text-text-2 hover:text-text-1 transition"
            aria-label="Decrease quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium text-text-1">{quantity}</span>
          <button
            onClick={incrementQty}
            className="w-8 h-8 flex items-center justify-center text-text-2 hover:text-text-1 transition"
            aria-label="Increase quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        
        {/* Add to Cart Button */}
        <button
          onClick={handleAdd}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            added
              ? 'bg-green-600 text-white'
              : 'bg-gold-700 text-on-primary hover:bg-gold-600'
          }`}
        >
          {added ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
