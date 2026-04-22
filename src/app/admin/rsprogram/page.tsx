'use client';

import { useEffect, useState } from 'react';

interface RSProgramSignup {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  package_name: string;
  package_price: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export default function RSProgramPage() {
  const [signups, setSignups] = useState<RSProgramSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignup, setSelectedSignup] = useState<RSProgramSignup | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchSignups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rsprogram');
      const data = await res.json();
      if (data.success) {
        setSignups(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch signups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignups();
  }, []);

  const handleUpdateStatus = async (id: string, field: 'status' | 'payment_status', value: string) => {
    try {
      const res = await fetch(`/api/admin/rsprogram/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSignups();
        if (selectedSignup?.id === id) {
          setSelectedSignup({ ...selectedSignup, [field]: value });
        }
      }
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signup?')) return;
    try {
      const res = await fetch(`/api/admin/rsprogram/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchSignups();
        if (selectedSignup?.id === id) {
          setSelectedSignup(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filteredSignups = filter === 'all' 
    ? signups 
    : signups.filter(s => s.status === filter);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const stats = {
    total: signups.length,
    pending: signups.filter(s => s.status === 'pending').length,
    confirmed: signups.filter(s => s.status === 'confirmed').length,
    completed: signups.filter(s => s.status === 'completed').length,
    totalRevenue: signups.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + s.package_price, 0),
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">Reseller Program Signups</h1>
        <p className="text-text-3">Manage reseller program registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <p className="text-text-3 text-sm">Total Signups</p>
          <p className="text-2xl font-bold text-text-1">{stats.total}</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <p className="text-text-3 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <p className="text-text-3 text-sm">Confirmed</p>
          <p className="text-2xl font-bold text-blue-500">{stats.confirmed}</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <p className="text-text-3 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <p className="text-text-3 text-sm">Total Paid</p>
          <p className="text-2xl font-bold text-purple-500">₱{stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm capitalize ${
              filter === status
                ? 'bg-purple-700 text-white'
                : 'bg-surface-2 text-text-2 hover:bg-surface-3'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredSignups.length === 0 ? (
          <div className="p-8 text-center text-text-3">No signups found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Package</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-3 uppercase">Payment</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-3 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSignups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-surface-2 transition">
                    <td className="px-4 py-3 text-sm text-text-3">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-1">{signup.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-2">{signup.email}</p>
                      <p className="text-xs text-text-3">{signup.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-1">₱{signup.package_price}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(signup.payment_status)}`}>
                        {signup.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(signup.status)}`}>
                        {signup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedSignup(signup)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedSignup(null)}></div>
          <div className="relative bg-surface-1 border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-1 p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-1">Signup Details</h2>
              <button onClick={() => setSelectedSignup(null)} className="p-1 text-text-3 hover:text-text-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Contact Info */}
              <div className="bg-surface-2 rounded-lg p-4">
                <h3 className="text-sm font-medium text-text-1 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-3">Name</span>
                    <span className="text-text-1 font-medium">{selectedSignup.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3">Email</span>
                    <span className="text-text-1">{selectedSignup.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3">Phone</span>
                    <span className="text-text-1">{selectedSignup.phone}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-surface-2 rounded-lg p-4">
                <h3 className="text-sm font-medium text-text-1 mb-3">Shipping Address</h3>
                <p className="text-sm text-text-2">
                  {selectedSignup.address}
                  {selectedSignup.city && `, ${selectedSignup.city}`}
                  {selectedSignup.province && `, ${selectedSignup.province}`}
                  {selectedSignup.postal_code && ` ${selectedSignup.postal_code}`}
                </p>
              </div>

              {/* Package */}
              <div className="bg-surface-2 rounded-lg p-4">
                <h3 className="text-sm font-medium text-text-1 mb-3">Package Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-3">Package</span>
                    <span className="text-text-1">{selectedSignup.package_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3">Price</span>
                    <span className="text-text-1 font-bold">₱{selectedSignup.package_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3">Date</span>
                    <span className="text-text-1">{new Date(selectedSignup.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Updates */}
              <div className="bg-surface-2 rounded-lg p-4">
                <h3 className="text-sm font-medium text-text-1 mb-3">Update Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-text-3 mb-1">Payment Status</label>
                    <select
                      value={selectedSignup.payment_status}
                      onChange={(e) => handleUpdateStatus(selectedSignup.id, 'payment_status', e.target.value)}
                      className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg text-sm text-text-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-3 mb-1">Signup Status</label>
                    <select
                      value={selectedSignup.status}
                      onChange={(e) => handleUpdateStatus(selectedSignup.id, 'status', e.target.value)}
                      className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg text-sm text-text-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(selectedSignup.id)}
                  className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg text-sm hover:bg-red-500/10"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedSignup(null)}
                  className="flex-1 py-2 bg-purple-700 text-white rounded-lg text-sm hover:bg-purple-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
