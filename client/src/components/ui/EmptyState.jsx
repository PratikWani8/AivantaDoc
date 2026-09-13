import { InboxIcon } from 'lucide-react'
import Button from './Button'

function safeText(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    return value.trim() || fallback
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => safeText(item, ''))
      .filter(Boolean)
      .join(', ')

    return text || fallback
  }

  if (typeof value === 'object') {

    if (
      typeof value.name === 'string' &&
      value.name.trim()
    ) {
      return value.name.trim()
    }

    if (
      typeof value.label === 'string' &&
      value.label.trim()
    ) {
      return value.label.trim()
    }

    if (
      typeof value.message === 'string' &&
      value.message.trim()
    ) {
      return value.message.trim()
    }

    if (
      typeof value.value === 'string' &&
      value.value.trim()
    ) {
      return value.value.trim()
    }

    return fallback
  }

  return fallback
}

export default function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  actionLabel,
}) {
  const safeTitle = safeText(
    title,
    'No data available'
  )

  const safeDescription = safeText(
    description,
    ''
  )

  const safeActionLabel = safeText(
    actionLabel,
    'Continue'
  )

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">

      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
        <Icon className="w-7 h-7 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
        {safeTitle}
      </h3>

      {safeDescription && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {safeDescription}
        </p>
      )}

      {action && safeActionLabel && (
        <div className="mt-5">
          <Button onClick={action}>
            {safeActionLabel}
          </Button>
        </div>
      )}

    </div>
  )
}