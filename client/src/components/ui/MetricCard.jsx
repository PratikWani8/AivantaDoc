import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

import Card from './Card'

function renderSafeValue(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => renderSafeValue(item))
      .filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          item !== ''
      )
      .join(', ') || '—'
  }

  if (typeof value === 'object') {
    /*
     * Handles objects such as:
     *
     * {
     *   name: "ABC Pvt Ltd",
     *   tax_id: "GST123"
     * }
     */

    if (
      typeof value.name === 'string' &&
      value.name.trim()
    ) {
      return value.name
    }

    if (
      typeof value.label === 'string' &&
      value.label.trim()
    ) {
      return value.label
    }

    if (
      typeof value.value === 'string' &&
      value.value.trim()
    ) {
      return value.value
    }

    if (
      typeof value.message === 'string' &&
      value.message.trim()
    ) {
      return value.message
    }

    return '—'
  }

  return String(value)
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  loading,
  iconBg =
    'bg-primary-50 dark:bg-primary-950',
  iconColor =
    'text-primary-600 dark:text-primary-400',
}) {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">

          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />

            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>

          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32" />

          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-20" />

        </div>
      </Card>
    )
  }

  const numericTrend =
    typeof trend === 'number'
      ? trend
      : Number(trend) || 0

  const trendSign =
    numericTrend > 0
      ? 'up'
      : numericTrend < 0
        ? 'down'
        : 'neutral'

  const TrendIcon =
    trendSign === 'up'
      ? TrendingUp
      : trendSign === 'down'
        ? TrendingDown
        : Minus

  const trendColor =
    trendSign === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trendSign === 'down'
        ? 'text-red-500 dark:text-red-400'
        : 'text-gray-400'

  const safeTitle =
    renderSafeValue(title) || 'Metric'

  const safeValue =
    renderSafeValue(value)

  const safeTrendLabel =
    renderSafeValue(trendLabel)

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">

        <div className="space-y-1 min-w-0">

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {safeTitle}
          </p>

          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {safeValue}
          </p>

          {trendLabel && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}
            >
              <TrendIcon className="w-3.5 h-3.5" />

              <span>
                {safeTrendLabel}
              </span>
            </div>
          )}

        </div>

        {Icon && (
          <div
            className={`flex-shrink-0 p-2.5 rounded-xl ${iconBg}`}
          >
            <Icon
              className={`w-5 h-5 ${iconColor}`}
            />
          </div>
        )}

      </div>
    </Card>
  )
}