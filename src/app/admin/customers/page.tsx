'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/admin/Pagination';
import { Customer } from '@/lib/db';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(search && { search }),
    });

    try {
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Customers</h1>
          <p className="text-text-3">Manage your customer database</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-text-3">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-3 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase">Total Spent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    className="cursor-pointer hover:bg-surface-2 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-700/20 rounded-full flex items-center justify-center">
                          <span className="text-purple-400 font-medium">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-text-1">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-1">{customer.email}</p>
                      <p className="text-xs text-text-3">{customer.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-2">
                      {customer.city ? `${customer.city}, ${customer.province}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-surface-2 text-text-1">
                        {customer.total_orders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-1 text-right font-medium">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-3 text-right">
                      {formatDate(customer.created_at)}
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
