'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { DashboardStats, Order } from '@/lib/db';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-text-3">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">Dashboard</h1>
        <p className="text-text-3">Welcome back! Here&apos;s your store overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          subtitle={`${formatCurrency(stats.revenue_today)} today`}
          icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={stats.total_orders}
          subtitle={`${stats.orders_today} orders today`}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={stats.total_customers}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          color="purple"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending_orders}
          subtitle="Needs attention"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="gold"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-1">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-purple-400 hover:text-purple-300">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recent_orders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-surface-2 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-text-1 hover:text-purple-400">
                        {order.order_number}
                      </Link>
                      <p className="text-xs text-text-3">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-2">{order.customer_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-sm text-text-1 text-right font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
                {stats.recent_orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-3">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-surface-1 border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-1">Orders by Status</h2>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(stats.orders_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-sm font-medium text-text-1">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
