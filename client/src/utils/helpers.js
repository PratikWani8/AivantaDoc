/**
 * Utility helpers
 */

/**
 * Format a currency value.
 * @param {number|null|undefined} value
 * @param {boolean} compact - Use compact notation (1.2M)
 * @param {string} currency - ISO currency code
 */
export function formatCurrency(value, compact = false, currency = 'INR') {
  if (value == null || isNaN(value)) return '—'
  const opts = {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }
  try {
    return new Intl.NumberFormat('en-IN', opts).format(value)
  } catch {
    return String(value)
  }
}

/**
 * Format a date string or Date object to a human-readable format.
 */
export function formatDate(date, opts = {}) {
  if (!date) return '—'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...opts,
    }).format(new Date(date))
  } catch {
    return String(date)
  }
}

/**
 * Format a number as a percentage.
 */
export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str, max = 40) {
  if (!str) return ''
  return str.length <= max ? str : str.slice(0, max) + '…'
}

/**
 * Extract a human-readable error message from an Axios error.
 */
export function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong."
  }

  if (typeof error === "string") {
    return error
  }

  const responseData = error.response?.data

  if (responseData?.error?.message) {
    return responseData.error.message
  }

  if (responseData?.message) {
    return responseData.message
  }

  if (error.message && typeof error.message === "string") {
    return error.message
  }

  if (error.error?.message) {
    return error.error.message
  }

  return "Something went wrong. Please try again."
}

/**
 * Map HTTP status to user-friendly message.
 */
export function getStatusMessage(status, t) {
  switch (status) {
    case 401: return t ? t('common.unauthorized') : 'Session expired. Please log in again.'
    case 403: return t ? t('common.forbidden') : 'You do not have permission to access this resource.'
    case 404: return t ? t('common.notFoundError') : 'The requested resource was not found.'
    case 422: return 'Validation failed. Please check your inputs.'
    case 429: return t ? t('common.rateLimit') : 'Too many requests. Please wait before trying again.'
    case 500: return t ? t('common.serverError') : 'Server error. Please try again later.'
    default:  return t ? t('common.error') : 'Something went wrong.'
  }
}
