'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';
import Pagination from '@/components/admin/Pagination';
import { Order } from '@/lib/db';

const statusFilters = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(search && { search }),
    });

    try {
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Orders</h1>
          <p className="text-text-3">Manage and track all orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search by order #, customer name, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                statusFilter === status
                  ? 'bg-purple-700 text-white'
                  : 'bg-surface-2 text-text-2 hover:bg-surface-3'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-text-3">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Referrer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="cursor-pointer hover:bg-surface-2 transition"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-1">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-1">{order.customer_name}</p>
                      <p className="text-xs text-text-3">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-2">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3 text-sm text-text-2">
                      {order.referrer_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-1 text-right font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
