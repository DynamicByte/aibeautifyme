'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import { Customer, Order } from '@/lib/db';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer & { orders: Order[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/customers/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setCustomer(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [params.id]);

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

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-text-3">Customer not found</p>
        <Link href="/admin/customers" className="text-purple-400 hover:underline">Back to Customers</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => router.back()} className="text-text-3 hover:text-text-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-purple-700/20 rounded-full flex items-center justify-center">
            <span className="text-purple-400 text-xl font-medium">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-1">{customer.name}</h1>
            <p className="text-text-3">Customer since {formatDate(customer.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="space-y-6">
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Contact Information</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-text-3">Email</p>
                <p className="text-text-1">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-text-3">Phone</p>
                <p className="text-text-1">{customer.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Address</h2>
            </div>
            <div className="p-4">
              {customer.address ? (
                <p className="text-text-1">
                  {customer.address}<br />
                  {customer.city}, {customer.province} {customer.postal_code}
                </p>
              ) : (
                <p className="text-text-3">No address on file</p>
              )}
            </div>
          </div>

          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Statistics</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-text-3">Total Orders</span>
                <span className="font-medium text-text-1">{customer.total_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">Total Spent</span>
                <span className="font-medium text-text-1">{formatCurrency(customer.total_spent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">Avg Order Value</span>
                <span className="font-medium text-text-1">
                  {customer.total_orders > 0 
                    ? formatCurrency(customer.total_spent / customer.total_orders)
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-surface-1 border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text-1">Order History</h2>
            </div>
            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-text-3">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="cursor-pointer hover:bg-surface-2 transition"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-text-1">{order.order_number}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-2">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-sm font-medium text-text-1 text-right">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
