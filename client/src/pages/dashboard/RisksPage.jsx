import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AlertTriangle,
  ShieldOff,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RiskBadge from '../../components/ui/RiskBadge'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { riskApi } from '../../api/riskApi'
import { useLanguage } from '../../context/LanguageContext'
import {
  formatDate,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers'
import toast from 'react-hot-toast'

function normalizeSeverity(value) {
  if (!value) return 'UNKNOWN'

  const severity = String(value)
    .trim()
    .toUpperCase()

  if (severity === 'CRITICAL') return 'CRITICAL'
  if (severity === 'HIGH') return 'HIGH'
  if (severity === 'MEDIUM') return 'MEDIUM'
  if (severity === 'LOW') return 'LOW'

  return severity
}

/* ============================================================
   NORMALIZE RISK OBJECT
   ============================================================ */

function normalizeRisk(risk) {
  const severity = normalizeSeverity(
    risk?.severity ||
      risk?.level ||
      risk?.riskLevel
  )

  return {
    ...risk,

    id: risk?._id || risk?.id,

    severity,

    type:
      risk?.type ||
      risk?.anomalyType ||
      risk?.name ||
      'Risk',

    description:
      risk?.description ||
      risk?.message ||
      risk?.reason ||
      'No description available.',

    documentId:
      risk?.documentId ||
      risk?.document?._id ||
      risk?.document?.id ||
      null,

    transactionId:
      risk?.transactionId ||
      risk?.transaction?.id ||
      null,

    amount:
      risk?.amount ??
      risk?.potentialLeakage ??
      risk?.transaction?.potentialLeakage ??
      null,

    createdAt:
      risk?.createdAt ||
      risk?.detectedAt ||
      risk?.updatedAt ||
      null,

    resolvedAt:
      risk?.resolvedAt || null,
  }
}

/* ============================================================
   SEVERITY STYLE
   ============================================================ */

function getSeverityStyle(severity) {
  switch (severity) {
    case 'CRITICAL':
      return {
        background:
          'bg-red-100 dark:bg-red-950',
        icon:
          'text-red-600 dark:text-red-400',
      }

    case 'HIGH':
      return {
        background:
          'bg-red-50 dark:bg-red-950',
        icon:
          'text-red-500 dark:text-red-400',
      }

    case 'MEDIUM':
      return {
        background:
          'bg-orange-50 dark:bg-orange-950',
        icon:
          'text-orange-500 dark:text-orange-400',
      }

    case 'LOW':
      return {
        background:
          'bg-green-50 dark:bg-green-950',
        icon:
          'text-green-500 dark:text-green-400',
      }

    default:
      return {
        background:
          'bg-gray-50 dark:bg-gray-800',
        icon:
          'text-gray-500 dark:text-gray-400',
      }
  }
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function RisksPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [risks, setRisks] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filter, setFilter] = useState('all')

  /* ============================================================
     FETCH RISKS
     ============================================================ */

  const fetchRisks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params =
        filter !== 'all'
          ? {
              severity: filter.toUpperCase(),
            }
          : {}

      const [risksResponse, summaryResponse] =
        await Promise.allSettled([
          riskApi.getAll(params),
          riskApi.getSummary(),
        ])

      /* --------------------------------------------------------
         RISKS
         -------------------------------------------------------- */

      if (risksResponse.status === 'fulfilled') {
        const rawData =
          risksResponse.value?.data?.data ??
          risksResponse.value?.data ??
          []

        const normalized =
          Array.isArray(rawData)
            ? rawData.map(normalizeRisk)
            : []

        console.log(
          'RISKS RESPONSE:',
          rawData
        )

        console.log(
          'NORMALIZED RISKS:',
          normalized
        )

        setRisks(normalized)
      } else {
        throw risksResponse.reason
      }

      /* --------------------------------------------------------
         SUMMARY
         -------------------------------------------------------- */

      if (summaryResponse.status === 'fulfilled') {
        const rawSummary =
          summaryResponse.value?.data?.data ??
          summaryResponse.value?.data ??
          []

        setSummary(
          Array.isArray(rawSummary)
            ? rawSummary
            : []
        )

        console.log(
          'RISK SUMMARY:',
          rawSummary
        )
      }
    } catch (err) {
      console.error(
        'RISKS FETCH ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRisks()
  }, [fetchRisks])

  /* ============================================================
     RESOLVE RISK
     ============================================================ */

  const handleResolve = async (id) => {
    if (!id) {
      toast.error(
        'Risk ID is missing.'
      )
      return
    }

    try {
      await riskApi.resolve(id)

      setRisks((previous) =>
        previous.filter(
          (risk) => risk.id !== id
        )
      )

      toast.success(
        'Risk resolved successfully.'
      )

      /*
       * Refresh summary after resolving.
       */
      try {
        const res =
          await riskApi.getSummary()

        const data =
          res?.data?.data ??
          res?.data ??
          []

        setSummary(
          Array.isArray(data)
            ? data
            : []
        )
      } catch {
        // Summary refresh failure shouldn't
        // make the resolve operation fail.
      }
    } catch (err) {
      console.error(
        'RESOLVE RISK ERROR:',
        err
      )

      toast.error(
        getErrorMessage(err) ||
          'Failed to resolve risk.'
      )
    }
  }

  /* ============================================================
     SUMMARY COUNTS
     ============================================================ */

  const summaryCounts = useMemo(() => {
    const result = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    }

    summary.forEach((item) => {
      const severity =
        normalizeSeverity(
          item?.severity
        )

      const count = Number(
        item?._count?._all ??
        item?.count ??
        0
      )

      if (
        Object.prototype.hasOwnProperty.call(
          result,
          severity
        )
      ) {
        result[severity] = count
      }
    })

    /*
     * If summary endpoint returns nothing,
     * calculate counts from currently loaded risks.
     */
    if (summary.length === 0) {
      risks.forEach((risk) => {
        if (
          Object.prototype.hasOwnProperty.call(
            result,
            risk.severity
          )
        ) {
          result[risk.severity] += 1
        }
      })
    }

    return result
  }, [summary, risks])

  /* ============================================================
     LOCAL FILTER
     ============================================================ */

  const filteredRisks = useMemo(() => {
    if (filter === 'all') {
      return risks
    }

    return risks.filter(
      (risk) =>
        risk.severity ===
        filter.toUpperCase()
    )
  }, [risks, filter])

  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <ErrorState
        title={t('common.error')}
        description={error}
        onRetry={fetchRisks}
      />
    )
  }

  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('risks.heading')}
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('risks.sub')}
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchRisks}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />
          </button>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">
              {t('common.all')}
            </option>

            <option value="CRITICAL">
              Critical
            </option>

            <option value="HIGH">
              {t('risks.high')}
            </option>

            <option value="MEDIUM">
              {t('risks.medium')}
            </option>

            <option value="LOW">
              {t('risks.low')}
            </option>
          </select>

        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Critical */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Critical
          </p>

          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {loading
              ? '—'
              : summaryCounts.CRITICAL}
          </p>
        </div>

        {/* High */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            High
          </p>

          <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">
            {loading
              ? '—'
              : summaryCounts.HIGH}
          </p>
        </div>

        {/* Medium */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Medium
          </p>

          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">
            {loading
              ? '—'
              : summaryCounts.MEDIUM}
          </p>
        </div>

        {/* Low */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Low
          </p>

          <p className="text-2xl font-bold text-green-500 dark:text-green-400 mt-1">
            {loading
              ? '—'
              : summaryCounts.LOW}
          </p>
        </div>

      </div>

      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading ? (
        <div className="space-y-3">

          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="h-28 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl animate-pulse"
            />
          ))}

        </div>
      ) : filteredRisks.length === 0 ? (

        /* ====================================================
           EMPTY
           ==================================================== */

        <EmptyState
          icon={ShieldOff}
          title={t('risks.noData')}
          description={
            filter === 'all'
              ? t(
                  'risks.noDataDesc'
                )
              : `No ${filter.toLowerCase()} risks found.`
          }
        />

      ) : (

        /* ====================================================
           RISK LIST
           ==================================================== */

        <div className="space-y-3">

          {filteredRisks.map((risk) => {
            const styles =
              getSeverityStyle(
                risk.severity
              )

            return (
              <div
                key={risk.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-5 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >

                <div className="flex items-start justify-between gap-4">

                  {/* Left */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">

                    {/* Severity Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.background}`}
                    >
                      {risk.severity ===
                      'CRITICAL' ? (
                        <ShieldCheck
                          className={`w-5 h-5 ${styles.icon}`}
                        />
                      ) : (
                        <AlertTriangle
                          className={`w-5 h-5 ${styles.icon}`}
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">

                      <div className="flex items-center gap-2 mb-1 flex-wrap">

                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {risk.type}
                        </h3>

                        <RiskBadge
                          risk={
                            risk.severity
                          }
                        />

                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {risk.description}
                      </p>

                      {/* Amount */}
                      {risk.amount != null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Amount:{' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatCurrency(
                              risk.amount
                            )}
                          </span>
                        </p>
                      )}

                      {/* Document */}
                      {risk.documentId && (
                        <div className="flex items-center gap-2 mt-2">

                          <p className="text-xs text-gray-400">
                            Document:{' '}
                            <span className="font-mono">
                              {String(
                                risk.documentId
                              ).slice(-12)}
                            </span>
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/documents/${risk.documentId}`
                              )
                            }
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </button>

                        </div>
                      )}

                      {/* Transaction */}
                      {risk.transactionId && (
                        <p className="text-xs text-gray-400 mt-1">
                          Transaction:{' '}
                          <span className="font-mono">
                            {String(
                              risk.transactionId
                            ).slice(-12)}
                          </span>
                        </p>
                      )}

                      {/* Created */}
                      {risk.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(
                            risk.createdAt
                          )}
                        </p>
                      )}

                    </div>
                  </div>

                  {/* Resolve */}
                  {!risk.resolvedAt && (
                    <button
                      type="button"
                      onClick={() =>
                        handleResolve(
                          risk.id
                        )
                      }
                      className="text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Resolve
                    </button>
                  )}

                  {risk.resolvedAt && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">
                      Resolved
                    </span>
                  )}

                </div>

              </div>
            )
          })}

        </div>
      )}

    </div>
  )
}