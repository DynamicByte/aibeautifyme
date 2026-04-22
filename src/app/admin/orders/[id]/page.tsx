'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import { Order, OrderItem, Shipping } from '@/lib/db';

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order & { items: OrderItem[]; shipping?: Shipping } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrder(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, ...data.data });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-text-3">Order not found</p>
        <Link href="/admin/orders" className="text-purple-400 hover:underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => router.back()} className="text-text-3 hover:text-text-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-text-1">{order.order_number}</h1>
            <StatusBadge status={order.status} size="md" />
          </div>
          <p className="text-text-3">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={isUpdating}
            className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 focus:outline-none focus:border-purple-500"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Order Items</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-2 rounded-lg flex items-center justify-center">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-text-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-1">{item.product_name}</p>
                    <p className="text-sm text-text-3">Qty: {item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-medium text-text-1">{formatCurrency(item.total_price)}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-3">Subtotal</span>
                <span className="text-text-1">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-3">Shipping</span>
                <span className="text-text-1">{formatCurrency(order.shipping_fee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-3">Discount</span>
                  <span className="text-green-400">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-text-1">Total</span>
                <span className="text-text-1">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          {order.shipping && (
            <div className="bg-surface-1 border border-border rounded-xl">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-text-1">Shipping</h2>
                <StatusBadge status={order.shipping.status} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-sm text-text-3">Courier</p>
                    <p className="font-medium text-text-1">{order.shipping.courier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-3">Tracking Number</p>
                    <p className="font-medium text-text-1">{order.shipping.tracking_number}</p>
                  </div>
                </div>
                {order.shipping.tracking_history.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-text-1 mb-3">Tracking History</p>
                    <div className="space-y-3">
                      {order.shipping.tracking_history.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                          <div>
                            <p className="text-sm text-text-1">{event.description}</p>
                            <p className="text-xs text-text-3">{event.location} • {formatDate(event.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Customer</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-text-3">Name</p>
                <p className="text-text-1">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-3">Email</p>
                <p className="text-text-1">{order.customer_email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-text-3">Phone</p>
                <p className="text-text-1">{order.customer_phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Shipping Address</h2>
            </div>
            <div className="p-4">
              <p className="text-text-1 whitespace-pre-line">{order.shipping_address || '-'}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Payment</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-text-3">Method</span>
                <span className="text-text-1">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">Status</span>
                <StatusBadge status={order.payment_status} />
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-surface-1 border border-border rounded-xl">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-text-1">Notes</h2>
              </div>
              <div className="p-4">
                <p className="text-text-2 text-sm">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
