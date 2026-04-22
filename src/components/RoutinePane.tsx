'use client';

import { useState } from 'react';
import { RoutineStep } from '@/lib/types';
import ProductCard from './ProductCard';
import { useCart } from './CartContext';
import CheckoutModal from './CheckoutModal';

interface RoutinePaneProps {
  routine: RoutineStep[];
  isComplete: boolean;
}

export default function RoutinePane({ routine, isComplete }: RoutinePaneProps) {
  const [activeTab, setActiveTab] = useState<'AM' | 'PM'>('AM');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { items, getItemCount, getTotalFormatted } = useCart();

  const amSteps = routine.filter(step => step.timeOfDay === 'AM' || step.timeOfDay === 'Both');
  const pmSteps = routine.filter(step => step.timeOfDay === 'PM' || step.timeOfDay === 'Both');
  const currentSteps = activeTab === 'AM' ? amSteps : pmSteps;
  
  const itemCount = getItemCount();

  if (!isComplete) {
    return (
      <div className="flex flex-col h-full bg-surface-1 rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-1">Your Routine</h2>
          <p className="text-sm text-text-3">Complete the consultation to see recommendations</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-purple-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <h3 className="text-text-1 font-medium mb-2">Building Your Routine</h3>
            <p className="text-text-3 text-sm max-w-xs">
              Answer the questions in the chat to receive personalized product recommendations tailored to your skin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-1 rounded-xl border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-1">Your Routine</h2>
        <p className="text-sm text-text-3">Personalized for your skin</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('AM')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'AM'
              ? 'text-gold-700 border-b-2 border-gold-700'
              : 'text-text-3 hover:text-text-2'
          }`}
        >
          Morning Routine
        </button>
        <button
          onClick={() => setActiveTab('PM')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'PM'
              ? 'text-gold-700 border-b-2 border-gold-700'
              : 'text-text-3 hover:text-text-2'
          }`}
        >
          Evening Routine
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentSteps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className="absolute left-0 top-0 w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center text-xs font-bold text-white z-10">
              {index + 1}
            </div>
            <div className="ml-8">
              {step.product && (
                <ProductCard product={step.product} stepName={step.stepName} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Cart Summary */}
        {itemCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span>Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            </div>
            <span className="font-semibold text-gold-700">{getTotalFormatted()}</span>
          </div>
        )}
        
        {/* Checkout Button */}
        <button 
          onClick={() => setIsCheckoutOpen(true)}
          className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
            itemCount > 0
              ? 'bg-gold-700 text-on-primary hover:bg-gold-600'
              : 'bg-surface-3 text-text-3 cursor-not-allowed'
          }`}
          disabled={itemCount === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          {itemCount > 0 ? `Checkout (${getTotalFormatted()})` : 'Add items to checkout'}
        </button>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        routine={routine}
      />
    </div>
  );
}
