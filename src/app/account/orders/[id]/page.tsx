'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';
import { Order, OrderItem, Shipping } from '@/lib/db';

export default function MemberOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order & { items: OrderItem[]; shipping?: Shipping } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);

  const fetchOrder = () => {
    fetch(`/api/account/orders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrder(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleRefreshTracking = async () => {
    if (!order?.shipping || order.shipping.courier !== 'PhilEx') return;
    
    setIsRefreshingTracking(true);
    try {
      const res = await fetch(`/api/admin/shipping/philex/track?tracking_number=${order.shipping.tracking_number}&order_id=${order.id}`);
      const data = await res.json();
      if (data.success) {
        fetchOrder(); // Refresh order data to get updated tracking
      }
    } catch (error) {
      console.error('Failed to refresh tracking:', error);
    } finally {
      setIsRefreshingTracking(false);
    }
  };

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
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
        <button onClick={() => router.back()} className="text-purple-400 hover:underline mt-2">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-3 hover:text-text-1 mb-4 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Orders
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-1">{order.order_number}</h1>
          <StatusBadge status={order.status} size="md" />
        </div>
        <p className="text-text-3">{formatDate(order.created_at)}</p>
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
                  <div className="w-16 h-16 bg-surface-2 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
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
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-text-1">Total</span>
                <span className="text-text-1">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Tracking */}
          {order.shipping && (
            <div className="bg-surface-1 border border-border rounded-xl">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-text-1">Shipping Status</h2>
                  {order.shipping.courier === 'PhilEx' && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">PhilEx</span>
                  )}
                </div>
                <StatusBadge status={order.shipping.status} />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-text-3">Courier</p>
                      <p className="font-medium text-text-1">{order.shipping.courier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-3">Tracking Number</p>
                      <p className="font-medium text-text-1 font-mono">{order.shipping.tracking_number}</p>
                    </div>
                  </div>
                  {order.shipping.courier === 'PhilEx' && (
                    <button
                      onClick={handleRefreshTracking}
                      disabled={isRefreshingTracking}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-lg hover:bg-orange-500/30 transition disabled:opacity-50"
                    >
                      {isRefreshingTracking ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          Refresh Tracking
                        </>
                      )}
                    </button>
                  )}
                </div>
                {order.shipping.tracking_history.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-text-1 mb-3">Tracking History</p>
                    <div className="space-y-3">
                      {order.shipping.tracking_history.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className={`w-2 h-2 mt-2 rounded-full ${idx === 0 ? 'bg-orange-500' : 'bg-purple-500'}`}></div>
                          <div>
                            <p className="text-sm text-text-1">{event.description}</p>
                            <p className="text-xs text-text-3">
                              {event.location && `${event.location} • `}{new Date(event.timestamp).toLocaleDateString('en-PH', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
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
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Shipping Address</h2>
            </div>
            <div className="p-4">
              <p className="text-text-1">{order.customer_name}</p>
              <p className="text-sm text-text-3 mt-1">{order.customer_phone}</p>
              <p className="text-sm text-text-2 mt-2 whitespace-pre-line">{order.shipping_address}</p>
            </div>
          </div>

          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Payment</h2>
            </div>
            <div className="p-4 space-y-2">
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
        </div>
      </div>
    </div>
  );
}
