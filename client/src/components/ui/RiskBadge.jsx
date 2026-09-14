const riskConfig = {
  high: {
    classes:
      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },

  medium: {
    classes:
      'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },

  low: {
    classes:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },

  critical: {
    classes:
      'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
    dot: 'bg-red-600',
  },

  unknown: {
    classes:
      'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
}

function safeRisk(value) {
  if (value === null || value === undefined) {
    return 'unknown'
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() || 'unknown'
  }

  if (typeof value === 'number') {
    return String(value).toLowerCase()
  }

  if (typeof value === 'object') {
    // Prevent accidental objects from reaching React.
    if (typeof value.level === 'string') {
      return value.level.trim().toLowerCase()
    }

    if (typeof value.riskLevel === 'string') {
      return value.riskLevel.trim().toLowerCase()
    }

    if (typeof value.severity === 'string') {
      return value.severity.trim().toLowerCase()
    }

    return 'unknown'
  }

  return 'unknown'
}

export default function RiskBadge({ risk }) {
  const key = safeRisk(risk)

  const config =
    riskConfig[key] || riskConfig.unknown

  const label =
    key.charAt(0).toUpperCase() +
    key.slice(1)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
      />

      {label}
    </span>
  )
}