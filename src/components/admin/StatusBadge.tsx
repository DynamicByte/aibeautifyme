type Status = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' |
  'preparing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'failed' |
  'paid' | 'refunded';

interface StatusBadgeProps {
  status: Status | string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; label?: string }> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  processing: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  shipped: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  delivered: { bg: 'bg-green-500/20', text: 'text-green-400' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400' },
  preparing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  picked_up: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Picked Up' },
  in_transit: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'In Transit' },
  out_for_delivery: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Out for Delivery' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
  paid: { bg: 'bg-green-500/20', text: 'text-green-400' },
  refunded: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
  const label = config.label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      {label}
    </span>
  );
}
