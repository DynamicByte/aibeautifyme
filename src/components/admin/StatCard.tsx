interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  color?: 'purple' | 'green' | 'blue' | 'gold';
}

const colorClasses = {
  purple: 'bg-purple-700/20 text-purple-400',
  green: 'bg-green-700/20 text-green-400',
  blue: 'bg-blue-700/20 text-blue-400',
  gold: 'bg-gold-700/20 text-gold-400',
};

export default function StatCard({ title, value, subtitle, icon, trend, color = 'purple' }: StatCardProps) {
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-3">{title}</p>
          <p className="text-2xl font-bold text-text-1 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-3 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}
