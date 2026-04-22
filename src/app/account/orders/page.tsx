'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import { Order } from '@/lib/db';

export default function MemberOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/orders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrders(data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">My Orders</h1>
        <p className="text-text-3">Track and manage your purchases</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-1 border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-text-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-text-1 font-medium mb-2">No orders yet</p>
          <p className="text-text-3 text-sm mb-4">Start shopping to see your orders here</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-surface-1 border border-border rounded-xl p-4 hover:border-purple-500/50 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-text-1">{order.order_number}</p>
                  <p className="text-sm text-text-3">{formatDate(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.payment_status} />
                  <span className="text-sm text-text-3">{order.payment_method}</span>
                </div>
                <p className="font-bold text-text-1">{formatCurrency(order.total_amount)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
