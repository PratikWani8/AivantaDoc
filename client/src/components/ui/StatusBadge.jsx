const statusConfig = {
  processed: {
    label: 'Processed',
    classes:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  },

  processing: {
    label: 'Processing',
    classes:
      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },

  pending: {
    label: 'Pending',
    classes:
      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  },

  failed: {
    label: 'Failed',
    classes:
      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  },

  approved: {
    label: 'Approved',
    classes:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  },

  rejected: {
    label: 'Rejected',
    classes:
      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  },

  verified: {
    label: 'Verified',
    classes:
      'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  },

  uploading: {
    label: 'Uploading',
    classes:
      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
}

/**
 * Convert ANY value into something React can safely render.
 */
function safeLabel(value, fallback = 'Unknown') {
  if (
    value === null ||
    value === undefined
  ) {
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
    const result = value
      .map((item) =>
        safeLabel(item, '')
      )
      .filter(Boolean)
      .join(', ')

    return result || fallback
  }

  if (typeof value === 'object') {
    /*
     * Handle accidental objects such as:
     *
     * {
     *   name: "ABC",
     *   tax_id: "GST123"
     * }
     */

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
      typeof value.status === 'string' &&
      value.status.trim()
    ) {
      return value.status.trim()
    }

    if (
      typeof value.value === 'string' &&
      value.value.trim()
    ) {
      return value.value.trim()
    }

    if (
      typeof value.message === 'string' &&
      value.message.trim()
    ) {
      return value.message.trim()
    }

    return fallback
  }

  return fallback
}

export default function StatusBadge({
  status,
  label,
}) {
  const safeStatus = safeLabel(
    status,
    ''
  ).toLowerCase()

  const config =
    statusConfig[safeStatus] || {
      label: safeLabel(
        label || status,
        'Unknown'
      ),

      classes:
        'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    }

  const displayLabel = safeLabel(
    label,
    config.label
  )

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      {displayLabel}
    </span>
  )
}