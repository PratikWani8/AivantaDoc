import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { BarChart2 } from 'lucide-react'
import ChartCard from '../../components/ui/ChartCard'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { analyticsApi } from '../../api/analyticsApi'
import { useLanguage } from '../../context/LanguageContext'
import { formatCurrency } from '../../utils/helpers'

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
  '#e0e7ff',
  '#3730a3',
  '#4f46e5',
]

const RISK_COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
  critical: '#dc2626',
}

export default function AnalyticsPage() {
  const { t } = useLanguage()

  const [spendByVendor, setSpendByVendor] = useState([])
  const [spendOverTime, setSpendOverTime] = useState([])
  const [riskBreakdown, setRiskBreakdown] = useState([])
  const [docVolume, setDocVolume] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [sv, st, rb, dv] = await Promise.allSettled([
        analyticsApi.getSpendByVendor(),
        analyticsApi.getSpendingTrends(),
        analyticsApi.getRiskDistribution(),
        analyticsApi.getDocumentTrends(),
      ])

      /*
       * ============================
       * SPEND BY VENDOR
       * Backend:
       * {
       *   id,
       *   name,
       *   totalSpend,
       *   invoiceCount,
       *   averageTrustScore
       * }
       *
       * Chart expects:
       * {
       *   vendor,
       *   amount
       * }
       * ============================
       */

      if (sv.status === 'fulfilled') {
        const data = sv.value?.data?.data ?? sv.value?.data ?? []

        const normalized = Array.isArray(data)
          ? data.map((item) => ({
              vendor: item.name || 'Unknown Vendor',
              amount: Number(item.totalSpend || 0),
              invoiceCount: Number(item.invoiceCount || 0),
              averageTrustScore:
                item.averageTrustScore == null
                  ? null
                  : Number(item.averageTrustScore),
            }))
          : []

        setSpendByVendor(normalized)
      }

      /*
       * ============================
       * SPENDING TRENDS
       * Backend:
       * {
       *   month,
       *   total
       * }
       *
       * Chart expects:
       * {
       *   period,
       *   amount
       * }
       * ============================
       */

      if (st.status === 'fulfilled') {
        const data = st.value?.data?.data ?? st.value?.data ?? []

        const normalized = Array.isArray(data)
          ? data.map((item) => ({
              period: formatPeriod(item.month),
              amount: Number(item.total || 0),
            }))
          : []

        setSpendOverTime(normalized)
      }

      /*
       * ============================
       * RISK DISTRIBUTION
       *
       * Backend:
       * {
       *   riskLevel,
       *   _count: {
       *     _all
       *   }
       * }
       *
       * Chart expects:
       * {
       *   level,
       *   count
       * }
       * ============================
       */

      if (rb.status === 'fulfilled') {
        const data = rb.value?.data?.data ?? rb.value?.data ?? []

        const normalized = Array.isArray(data)
          ? data.map((item) => ({
              level:
                item.riskLevel ||
                item.level ||
                'UNKNOWN',

              count: Number(
                item?._count?._all ??
                item.count ??
                0
              ),
            }))
          : []

        setRiskBreakdown(normalized)
      }

      /*
       * ============================
       * DOCUMENT TRENDS
       *
       * Backend:
       * {
       *   date,
       *   count
       * }
       *
       * Chart expects:
       * {
       *   period,
       *   count
       * }
       * ============================
       */

      if (dv.status === 'fulfilled') {
        const data = dv.value?.data?.data ?? dv.value?.data ?? []

        const normalized = Array.isArray(data)
          ? data.map((item) => ({
              period: item.date || '',
              count: Number(item.count || 0),
            }))
          : []

        setDocVolume(normalized)
      }

      const allFailed = [sv, st, rb, dv].every(
        (result) => result.status === 'rejected'
      )

      if (allFailed) {
        setError(t('common.error'))
      }
    } catch (err) {
      console.error('Analytics error:', err)
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /*
   * Format PostgreSQL month/date values safely.
   */
  function formatPeriod(value) {
    if (!value) return ''

    try {
      const date = new Date(value)

      if (Number.isNaN(date.getTime())) {
        return String(value)
      }

      return date.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return String(value)
    }
  }

  if (error) {
    return (
      <ErrorState
        title={t('common.error')}
        description={error}
        onRetry={fetchAll}
      />
    )
  }

  const hasAnyData =
    spendByVendor.length > 0 ||
    spendOverTime.length > 0 ||
    riskBreakdown.length > 0 ||
    docVolume.length > 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('analytics.heading')}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('analytics.sub')}
        </p>
      </div>

      {!loading && !hasAnyData ? (
        <EmptyState
          icon={BarChart2}
          title={t('analytics.noData')}
          description={t('analytics.noDataDesc')}
        />
      ) : (
        <>
          {/* ============================
              ROW 1
          ============================ */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spend by Vendor */}
            <ChartCard
              title={t('analytics.spendByVendor')}
              loading={loading}
            >
              {spendByVendor.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart
                    data={spendByVendor}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) =>
                        formatCurrency(value, true)
                      }
                    />

                    <YAxis
                      type="category"
                      dataKey="vendor"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Bar
                      dataKey="amount"
                      radius={[0, 4, 4, 0]}
                    >
                      {spendByVendor.map((_, index) => (
                        <Cell
                          key={`vendor-${index}`}
                          fill={
                            COLORS[
                              index % COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : !loading ? (
                <EmptyState
                  icon={BarChart2}
                  title={t('common.noData')}
                />
              ) : null}
            </ChartCard>

            {/* Spend Over Time */}
            <ChartCard
              title={t('analytics.spendOverTime')}
              loading={loading}
            >
              {spendOverTime.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <LineChart data={spendOverTime}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) =>
                        formatCurrency(value, true)
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : !loading ? (
                <EmptyState
                  icon={BarChart2}
                  title={t('common.noData')}
                />
              ) : null}
            </ChartCard>
          </div>

          {/* ============================
              ROW 2
          ============================ */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Breakdown */}
            <ChartCard
              title={t('analytics.riskBreakdown')}
              loading={loading}
            >
              {riskBreakdown.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={240}
                >
                  <PieChart>
                    <Pie
                      data={riskBreakdown}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ level, count }) =>
                        `${level}: ${count}`
                      }
                    >
                      {riskBreakdown.map(
                        (entry, index) => (
                          <Cell
                            key={`risk-${index}`}
                            fill={
                              RISK_COLORS[
                                entry.level?.toLowerCase()
                              ] ||
                              COLORS[
                                index % COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : !loading ? (
                <EmptyState
                  icon={BarChart2}
                  title={t('common.noData')}
                />
              ) : null}
            </ChartCard>

            {/* Document Volume */}
            <ChartCard
              title={t('analytics.documentVolume')}
              loading={loading}
            >
              {docVolume.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={240}
                >
                  <BarChart data={docVolume}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis tick={{ fontSize: 11 }} />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : !loading ? (
                <EmptyState
                  icon={BarChart2}
                  title={t('common.noData')}
                />
              ) : null}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}