'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';
import { Shipping } from '@/lib/db';

type ShipmentWithOrder = Shipping & {
  order_number?: string;
  customer_name?: string;
  shipping_address?: string;
};

const statusFilters = ['all', 'preparing', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];

export default function ShippingPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<ShipmentWithOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [trackingShipment, setTrackingShipment] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<Record<string, unknown> | null>(null);
  const [printingWaybill, setPrintingWaybill] = useState<string | null>(null);

  const fetchShipments = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });

    try {
      const res = await fetch(`/api/admin/shipping?${params}`);
      const data = await res.json();
      if (data.success) {
        setShipments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleTrackPhilEx = async (e: React.MouseEvent, shipment: ShipmentWithOrder) => {
    e.stopPropagation();
    if (shipment.courier !== 'PhilEx') return;

    setTrackingShipment(shipment.tracking_number);
    try {
      const res = await fetch(`/api/admin/shipping/philex/track?tracking_number=${shipment.tracking_number}&order_id=${shipment.order_id}`);
      const data = await res.json();
      if (data.success) {
        setTrackingData(data.data);
        fetchShipments(); // Refresh to get updated status
      } else {
        alert(data.error || 'Failed to track shipment');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      alert('Failed to track shipment');
    } finally {
      setTrackingShipment(null);
    }
  };

  const handlePrintWaybill = async (e: React.MouseEvent, shipment: ShipmentWithOrder) => {
    e.stopPropagation();
    if (shipment.courier !== 'PhilEx') return;

    setPrintingWaybill(shipment.tracking_number);
    try {
      const res = await fetch(`/api/admin/shipping/philex/waybill?tracking_number=${shipment.tracking_number}`);
      const data = await res.json();
      if (data.success && data.data.waybill_url) {
        window.open(data.data.waybill_url, '_blank');
      } else {
        alert(data.error || 'Failed to get waybill');
      }
    } catch (error) {
      console.error('Waybill error:', error);
      alert('Failed to get waybill');
    } finally {
      setPrintingWaybill(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-1">Shipping</h1>
          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">PhilEx Integrated</span>
        </div>
        <p className="text-text-3">Track and manage all shipments via PhilEx</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              statusFilter === status
                ? 'bg-purple-700 text-white'
                : 'bg-surface-2 text-text-2 hover:bg-surface-3'
            }`}
          >
            {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-8 text-center text-text-3">No shipments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Courier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Tracking #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Shipped</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    onClick={() => router.push(`/admin/orders/${shipment.order_id}`)}
                    className="cursor-pointer hover:bg-surface-2 transition"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-1">{shipment.order_number || shipment.order_id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-2">{shipment.customer_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        shipment.courier === 'PhilEx' 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-surface-2 text-text-1'
                      }`}>
                        {shipment.courier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-1 font-mono">{shipment.tracking_number}</td>
                    <td className="px-4 py-3"><StatusBadge status={shipment.status} /></td>
                    <td className="px-4 py-3 text-sm text-text-3">{formatDate(shipment.shipped_at)}</td>
                    <td className="px-4 py-3">
                      {shipment.courier === 'PhilEx' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleTrackPhilEx(e, shipment)}
                            disabled={trackingShipment === shipment.tracking_number}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition disabled:opacity-50"
                            title="Refresh tracking from PhilEx"
                          >
                            {trackingShipment === shipment.tracking_number ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => handlePrintWaybill(e, shipment)}
                            disabled={printingWaybill === shipment.tracking_number}
                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition disabled:opacity-50"
                            title="Print Waybill"
                          >
                            {printingWaybill === shipment.tracking_number ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-border rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text-1">PhilEx Tracking Details</h3>
              <button onClick={() => setTrackingData(null)} className="text-text-3 hover:text-text-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-text-3">Tracking Number</p>
                  <p className="font-mono text-text-1">{(trackingData as { tracking_number?: string }).tracking_number}</p>
                </div>
                <div>
                  <p className="text-xs text-text-3">Status</p>
                  <StatusBadge status={(trackingData as { status?: string }).status || 'unknown'} />
                </div>
              </div>
              {(trackingData as { tracking_history?: Array<{ timestamp: string; status: string; description: string }> }).tracking_history && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-text-1 mb-3">Tracking History</p>
                  <div className="space-y-3">
                    {((trackingData as { tracking_history?: Array<{ timestamp: string; status: string; description: string }> }).tracking_history || []).map((event: { timestamp: string; status: string; description: string }, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                        <div>
                          <p className="text-sm text-text-1">{event.description}</p>
                          <p className="text-xs text-text-3">
                            {event.status} • {new Date(event.timestamp).toLocaleDateString('en-PH', {
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
        </div>
      )}
    </div>
  );
}
