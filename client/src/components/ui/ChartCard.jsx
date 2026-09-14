import Card from './Card'

export default function ChartCard({ title, subtitle, children, loading, action, className = '' }) {
  return (
    <Card padding={false} className={`overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-t-md animate-pulse"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        ) : children}
      </div>
    </Card>
  )
}
