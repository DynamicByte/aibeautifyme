'use client';

import { useEffect, useState, useRef } from 'react';
import { Reseller } from '@/lib/db/types';

const DOMAIN = 'aibeautifyme.app';

interface UploadResult {
  success: boolean;
  row: number;
  name?: string;
  referral_code?: string;
  error?: string;
}

interface BulkUploadResponse {
  total: number;
  success_count: number;
  error_count: number;
  results: UploadResult[];
}

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<BulkUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResellers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/resellers');
      const data = await res.json();
      if (data.success) {
        setResellers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch resellers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !referralCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, referral_code: referralCode }),
      });
      const data = await res.json();

      if (data.success) {
        setName('');
        setReferralCode('');
        fetchResellers();
      } else {
        setError(data.error || 'Failed to add reseller');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reseller?')) return;

    try {
      const res = await fetch(`/api/admin/resellers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchResellers();
      }
    } catch (error) {
      console.error('Failed to delete reseller:', error);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(`https://${DOMAIN}/ref/${code}`);
  };

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/resellers/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadResults(data.data);
        fetchResellers();
      } else {
        setError(data.error || 'Failed to upload file');
      }
    } catch {
      setError('An error occurred during upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,referral_code\nJohn Doe,john123\nJane Smith,janebeauty\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resellers_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-1">Resellers</h1>
        <p className="text-text-3">Manage reseller referral links</p>
      </div>

      {/* Add Reseller Form */}
      <div className="bg-surface-1 border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-1">Add New Reseller</h2>
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            {showBulkUpload ? 'Single Add' : 'Bulk Upload'}
          </button>
        </div>

        {!showBulkUpload ? (
          <>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-text-3 mb-1">Reseller Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-text-3 mb-1">Link Extension</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-3">{DOMAIN}/ref/</span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="e.g., john"
                    className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Reseller'}
              </button>
            </form>
            {referralCode && (
              <p className="mt-2 text-xs text-text-3">
                Preview: <span className="text-purple-400">https://{DOMAIN}/ref/{referralCode.toLowerCase().replace(/[^a-z0-9-_]/g, '')}</span>
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleBulkUpload}
                className="hidden"
                id="bulk-upload"
              />
              <label
                htmlFor="bulk-upload"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-purple-500 transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-text-2">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-text-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-text-2">Click to upload CSV or Excel file</span>
                  </>
                )}
              </label>
            </div>
            <div className="flex items-center justify-between text-xs text-text-3">
              <span>Columns: name, referral_code</span>
              <button onClick={downloadTemplate} className="text-purple-400 hover:text-purple-300">
                Download Template
              </button>
            </div>

            {/* Upload Results */}
            {uploadResults && (
              <div className="mt-4 p-4 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-text-1">
                    Upload Complete: {uploadResults.success_count} of {uploadResults.total} added
                  </span>
                  {uploadResults.error_count > 0 && (
                    <span className="text-sm text-red-400">{uploadResults.error_count} errors</span>
                  )}
                </div>
                {uploadResults.results.filter(r => !r.success).length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResults.results.filter(r => !r.success).map((result, i) => (
                      <div key={i} className="text-xs text-red-400">
                        Row {result.row}: {result.error} {result.name && `(${result.name})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      {/* Resellers Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : resellers.length === 0 ? (
          <div className="p-8 text-center text-text-3">No resellers added yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Referral Link</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-3 uppercase">Referrals</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resellers.map((reseller) => (
                  <tr key={reseller.id} className="hover:bg-surface-2 transition">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-1">{reseller.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-purple-400">https://{DOMAIN}/ref/{reseller.referral_code}</span>
                        <button
                          onClick={() => copyToClipboard(reseller.referral_code)}
                          className="p-1 text-text-3 hover:text-text-1 transition"
                          title="Copy link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-text-1">{reseller.total_referrals}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-text-1">{formatCurrency(reseller.total_revenue)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(reseller.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition"
                        title="Delete reseller"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
