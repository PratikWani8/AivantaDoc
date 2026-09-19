import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

import MetricCard from '../../components/ui/MetricCard'
import StatusBadge from '../../components/ui/StatusBadge'
import RiskBadge from '../../components/ui/RiskBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Button from '../../components/ui/Button'

import { analyticsApi } from '../../api/analyticsApi'
import { documentApi } from '../../api/documentApi'
import { riskApi } from '../../api/riskApi'

import { useLanguage } from '../../context/LanguageContext'
import {
  formatCurrency,
  formatDate,
  getErrorMessage,
} from '../../utils/helpers'

/* =========================================================
   SAFE VALUE HELPERS
   ========================================================= */

/**
 * NEVER return an object from this function.
 * React must receive a string/number/null instead.
 */
function safeString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    const result = value.trim()
    return result || fallback
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? String(value)
      : fallback
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    const result = value
      .map((item) => safeString(item, ''))
      .filter(Boolean)
      .join(', ')

    return result || fallback
  }

  if (typeof value === 'object') {
    /*
     * Handle:
     * {
     *   name: "ABC",
     *   tax_id: "GST..."
     * }
     */
    const possibleNames = [
      value.name,
      value.vendorName,
      value.vendor_name,
      value.supplierName,
      value.supplier_name,
      value.label,
      value.title,
      value.message,
      value.value,
    ]

    for (const item of possibleNames) {
      if (
        typeof item === 'string' &&
        item.trim()
      ) {
        return item.trim()
      }
    }

    return fallback
  }

  return fallback
}

/**
 * Vendor-specific normalization.
 */
function getVendorName(vendor) {
  if (!vendor) {
    return 'Unknown Vendor'
  }

  if (typeof vendor === 'string') {
    return vendor.trim() || 'Unknown Vendor'
  }

  if (typeof vendor === 'object') {
    return (
      safeString(
        vendor.name ||
          vendor.vendorName ||
          vendor.vendor_name ||
          vendor.supplierName ||
          vendor.supplier_name,
        'Unknown Vendor'
      )
    )
  }

  return 'Unknown Vendor'
}

/**
 * Risk normalization.
 */
function getRiskLevel(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value.toUpperCase()
  }

  if (typeof value === 'object') {
    return safeString(
      value.level ||
        value.severity ||
        value.riskLevel ||
        value.name,
      ''
    ).toUpperCase()
  }

  return ''
}

/**
 * Mongo document ID.
 */
function getDocumentId(doc) {
  if (!doc) {
    return null
  }

  if (
    typeof doc._id === 'string' &&
    doc._id
  ) {
    return doc._id
  }

  if (
    typeof doc.id === 'string' &&
    doc.id
  ) {
    return doc.id
  }

  /*
   * Sometimes Mongo IDs may arrive as objects.
   */
  if (
    doc._id &&
    typeof doc._id === 'object'
  ) {
    if (typeof doc._id.toString === 'function') {
      const id = doc._id.toString()

      if (
        id &&
        id !== '[object Object]'
      ) {
        return id
      }
    }
  }

  return null
}

/**
 * OCR / extracted fields.
 */
function getDocumentFields(doc) {
  if (!doc) {
    return {}
  }

  const fields =
    doc?.ocr?.fields ||
    doc?.ocrResult?.fields ||
    doc?.fields ||
    {}

  return (
    fields &&
    typeof fields === 'object' &&
    !Array.isArray(fields)
  )
    ? fields
    : {}
}

/**
 * Safe date formatter.
 *
 * Important:
 * formatDate() should NEVER receive
 * an object such as {name, tax_id}.
 */
function safeFormatDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    !(value instanceof Date)
  ) {
    return '—'
  }

  try {
    const result = formatDate(value)

    return safeString(result, '—')
  } catch {
    return '—'
  }
}

/**
 * Safe currency formatter.
 */
function safeFormatCurrency(value, currency = 'INR') {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '—'
  }

  try {
    return safeString(
      formatCurrency(number, false, currency),
      '—'
    )
  } catch {
    return '—'
  }
}

/* =========================================================
   NORMALIZE RECENT DOCUMENTS
   ========================================================= */

function normalizeRecentDocuments(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((doc, index) => {
    const fields = getDocumentFields(doc)

    /*
     * IMPORTANT:
     *
     * fields.vendor can be:
     *
     * {
     *   name: "ABC",
     *   tax_id: "GST..."
     * }
     *
     * NEVER put this object directly into JSX.
     */
    const vendorSource =
      fields?.vendor ??
      fields?.vendorName ??
      fields?.vendor_name ??
      doc?.vendor ??
      doc?.vendorName ??
      null

    const vendorName =
      getVendorName(vendorSource)

    const documentId =
      getDocumentId(doc)

    const riskSource =
      doc?.riskLevel ??
      doc?.risk_level ??
      doc?.ai?.riskLevel ??
      doc?.ai?.result?.riskLevel ??
      doc?.ai?.result?.risk_level ??
      null

    const riskLevel =
      getRiskLevel(riskSource)

    const invoiceDate =
      doc?.invoiceDate ??
      doc?.invoice_date ??
      fields?.invoiceDate ??
      fields?.invoice_date ??
      null

    const originalName =
      safeString(
        doc?.originalName ??
          doc?.original_name ??
          doc?.storedName,
        'Document'
      )

    const status =
      safeString(
        doc?.status,
        'UNKNOWN'
      ).toUpperCase()

    const amount =
      Number(
        doc?.total ??
          doc?.totalAmount ??
          fields?.total ??
          0
      ) || 0

    return {
      id: documentId,

      key:
        documentId ||
        `recent-document-${index}`,

      originalName,

      status,

      vendorName,

      invoiceDate,

      createdAt:
        doc?.createdAt ?? null,

      riskLevel,

      amount,
    }
  })
}

/* =========================================================
   NORMALIZE RISKS
   ========================================================= */

function normalizeRecentRisks(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((risk, index) => {
    const id =
      typeof risk?._id === 'string'
        ? risk._id
        : typeof risk?.id === 'string'
          ? risk.id
          : `risk-${index}`

    const severity =
      getRiskLevel(
        risk?.severity ??
          risk?.level ??
          risk?.riskLevel ??
          ''
      )

    const type =
      safeString(
        risk?.type ??
          risk?.anomalyType,
        'Risk'
      )

    const explanation =
      safeString(
        risk?.explanation ??
          risk?.description ??
          risk?.message,
        'Risk detected'
      )

    const createdAt =
      risk?.createdAt ?? null

    return {
      id,
      severity,
      type,
      explanation,
      createdAt,
    }
  })
}

/* =========================================================
   OVERVIEW PAGE
   ========================================================= */

export default function OverviewPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [overview, setOverview] = useState(null)
  const [recentDocs, setRecentDocs] = useState([])
  const [recentRisks, setRecentRisks] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* =======================================================
     FETCH DASHBOARD DATA
     ======================================================= */

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [
        overviewResponse,
        documentsResponse,
        risksResponse,
      ] = await Promise.allSettled([
        analyticsApi.getOverview(),
        documentApi.getAll({}),
        riskApi.getAll({}),
      ])

      /* ---------------- OVERVIEW ---------------- */

      if (
        overviewResponse.status ===
        'fulfilled'
      ) {
        const response =
          overviewResponse.value

        const data =
          response?.data?.data ??
          response?.data ??
          {}

        if (
          data &&
          typeof data === 'object' &&
          !Array.isArray(data)
        ) {
          setOverview(data)
        } else {
          setOverview({})
        }
      } else {
        setOverview(null)
      }

      /* ---------------- DOCUMENTS ---------------- */

      if (
        documentsResponse.status ===
        'fulfilled'
      ) {
        const response =
          documentsResponse.value

        const data =
          response?.data?.data ??
          response?.data?.documents ??
          response?.data ??
          []

        const normalized =
          normalizeRecentDocuments(data)

        setRecentDocs(
          normalized.slice(0, 5)
        )
      } else {
        setRecentDocs([])
      }

      /* ---------------- RISKS ---------------- */

      if (
        risksResponse.status ===
        'fulfilled'
      ) {
        const response =
          risksResponse.value

        const data =
          response?.data?.data ??
          response?.data ??
          []

        setRecentRisks(
          normalizeRecentRisks(data).slice(
            0,
            5
          )
        )
      } else {
        setRecentRisks([])
      }

      /* ---------------- ALL FAILED ---------------- */

      const allFailed = [
        overviewResponse,
        documentsResponse,
        risksResponse,
      ].every(
        (result) =>
          result.status === 'rejected'
      )

      if (allFailed) {
        setError(
          safeString(
            t('common.error'),
            'Failed to load dashboard data.'
          )
        )
      }
    } catch (err) {
      setError(
        safeString(
          getErrorMessage(err),
          'Failed to load dashboard data.'
        )
      )
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  /* =======================================================
     ERROR
     ======================================================= */

  if (
    error &&
    !overview &&
    recentDocs.length === 0
  ) {
    return (
      <ErrorState
        title={safeString(
          t('common.error'),
          'Error'
        )}
        description={safeString(
          error,
          'Failed to load dashboard data.'
        )}
        onRetry={fetchOverview}
      />
    )
  }

  /* =======================================================
     SAFE OVERVIEW VALUES
     ======================================================= */

  const data =
    overview &&
    typeof overview === 'object'
      ? overview
      : {}

  const totalDocuments =
    Number(data.totalDocuments) || 0

  const processedDocuments =
    Number(data.processedDocuments) || 0

  const pendingDocuments =
    Number(data.pendingDocuments) || 0

  const highRiskDocuments =
    Number(data.highRiskDocuments) || 0

  const totalInvoiceValue =
    Number(data.totalInvoiceValue) || 0

  const potentialLeakage =
    Number(data.potentialLeakage) || 0

  const averageTrustScore =
    data.averageTrustScore == null
      ? null
      : Number(data.averageTrustScore)

  /* =======================================================
     METRICS
     ======================================================= */

  const metrics = [
    {
      key: 'documents',
      title: safeString(
        t('dashboard.totalDocuments'),
        'Total Documents'
      ),
      value: totalDocuments,
      icon: FileText,
      iconColor: 'text-primary-600',
      iconBg:
        'bg-primary-50 dark:bg-primary-950',
    },

    {
      key: 'processed',
      title: safeString(
        t('dashboard.processedDocuments'),
        'Processed Documents'
      ),
      value: processedDocuments,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg:
        'bg-green-50 dark:bg-green-950',
    },

    {
      key: 'pending',
      title: safeString(
        t('dashboard.pendingDocuments'),
        'Pending Documents'
      ),
      value: pendingDocuments,
      icon: Clock,
      iconColor: 'text-orange-600',
      iconBg:
        'bg-orange-50 dark:bg-orange-950',
    },

    {
      key: 'highRisk',
      title: safeString(
        t('dashboard.highRiskDocuments'),
        'High Risk'
      ),
      value: highRiskDocuments,
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg:
        'bg-red-50 dark:bg-red-950',
    },

    {
      key: 'invoiceValue',
      title: safeString(
        t('dashboard.totalInvoiceValue'),
        'Invoice Value'
      ),
      value: safeFormatCurrency(
        totalInvoiceValue,
        'INR'
      ),
      icon: IndianRupee,
      iconColor: 'text-indigo-600',
      iconBg:
        'bg-indigo-50 dark:bg-indigo-950',
    },

    {
      key: 'leakage',
      title: safeString(
        t('dashboard.potentialLeakage'),
        'Potential Leakage'
      ),
      value: safeFormatCurrency(
        potentialLeakage,
        'INR'
      ),
      icon: TrendingUp,
      iconColor: 'text-red-600',
      iconBg:
        'bg-red-50 dark:bg-red-950',
    },

    {
      key: 'trust',
      title: safeString(
        t('dashboard.averageTrustScore'),
        'Average Trust Score'
      ),
      value:
        averageTrustScore == null ||
        !Number.isFinite(
          averageTrustScore
        )
          ? '—'
          : `${Math.round(
              averageTrustScore * 100
            )}%`,
      icon: ShieldCheck,
      iconColor: 'text-green-600',
      iconBg:
        'bg-green-50 dark:bg-green-950',
    },
  ]

  /* =======================================================
     SAFE TRANSLATIONS
     ======================================================= */

  const dashboardHeading =
    safeString(
      t('dashboard.heading'),
      'Dashboard'
    )

  const dashboardSub =
    safeString(
      t('dashboard.sub'),
      'Overview of your document intelligence'
    )

  const uploadText =
    safeString(
      t('dashboard.upload'),
      'Upload Document'
    )

  const recentDocumentsTitle =
    safeString(
      t('dashboard.recentDocuments'),
      'Recent Documents'
    )

  const documentsTitle =
    safeString(
      t('documents.noDocuments'),
      'No Documents'
    )

  const documentsDescription =
    safeString(
      t('documents.noDocumentsDesc'),
      'Upload your first document to get started.'
    )

  const uploadFirstText =
    safeString(
      t('documents.uploadFirst'),
      'Upload Document'
    )

  const recentRisksTitle =
    safeString(
      t('dashboard.recentRisks'),
      'Recent Risks'
    )

  const risksTitle =
    safeString(
      t('risks.noData'),
      'No Risks'
    )

  const risksDescription =
    safeString(
      t('risks.noDataDesc'),
      'No financial risks have been detected.'
    )

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="space-y-8 animate-fade-in">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {dashboardHeading}
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {dashboardSub}
          </p>
        </div>

        <Button
          leftIcon={
            <Upload className="w-4 h-4" />
          }
          onClick={() =>
            navigate('/dashboard/upload')
          }
        >
          {uploadText}
        </Button>
      </div>

      {/* =================================================
          REFRESH
          ================================================= */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={fetchOverview}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          <span>Refresh</span>
        </button>
      </div>

      {/* =================================================
          METRICS
          ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            title={safeString(
              metric.title,
              'Metric'
            )}
            value={safeString(
              metric.value,
              '—'
            )}
            icon={metric.icon}
            iconColor={metric.iconColor}
            iconBg={metric.iconBg}
          />
        ))}
      </div>

      {/* =================================================
          RECENT DOCUMENTS
          ================================================= */}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">

          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {recentDocumentsTitle}
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Recently uploaded documents
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/dashboard/documents'
              )
            }
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

        {loading ? (

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={`document-skeleton-${index}`}
                className="flex items-center gap-3 px-6 py-4 animate-pulse"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />

                  <div className="h-2.5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>

                <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}

          </div>

        ) : recentDocs.length > 0 ? (

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {recentDocs.map(
              (doc, index) => {

                const documentId =
                  getDocumentId(doc)

                /*
                 * IMPORTANT:
                 * vendorName is already
                 * normalized to STRING.
                 */
                const vendorName =
                  safeString(
                    doc?.vendorName,
                    'Unknown Vendor'
                  )

                const originalName =
                  safeString(
                    doc?.originalName,
                    'Document'
                  )

                const status =
                  safeString(
                    doc?.status,
                    'UNKNOWN'
                  ).toUpperCase()

                const riskLevel =
                  getRiskLevel(
                    doc?.riskLevel
                  )

                const date =
                  safeFormatDate(
                    doc?.invoiceDate ??
                      doc?.createdAt
                  )

                return (
                  <div
                    key={
                      doc?.key ||
                      documentId ||
                      `recent-document-${index}`
                    }
                    onClick={() => {
                      if (!documentId) {
                        return
                      }

                      navigate(
                        `/dashboard/documents/${documentId}`
                      )
                    }}
                    className={`flex items-center gap-3 px-6 py-4 transition-colors ${
                      documentId
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                        : ''
                    }`}
                  >

                    <div className="w-9 h-9 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {vendorName}
                      </p>

                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {originalName}
                      </p>

                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {date}
                      </p>

                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">

                      <StatusBadge
                        status={status}
                      />

                      {riskLevel && (
                        <RiskBadge
                          risk={riskLevel}
                        />
                      )}

                    </div>

                  </div>
                )
              }
            )}

          </div>

        ) : (

          <div className="p-8">
            <EmptyState
              icon={FileText}
              title={documentsTitle}
              description={documentsDescription}
              action={() =>
                navigate(
                  '/dashboard/upload'
                )
              }
              actionLabel={uploadFirstText}
            />
          </div>

        )}

      </div>

      {/* =================================================
          RECENT RISKS
          ================================================= */}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">

          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {recentRisksTitle}
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Recently detected financial risks
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/dashboard/risks'
              )
            }
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

        {loading ? (

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={`risk-skeleton-${index}`}
                className="flex items-center gap-4 px-6 py-4 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />

                  <div className="h-2.5 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                </div>

                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}

          </div>

        ) : recentRisks.length > 0 ? (

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {recentRisks.map(
              (risk) => {

                const id =
                  safeString(
                    risk?.id,
                    'risk'
                  )

                const severity =
                  safeString(
                    risk?.severity,
                    ''
                  )

                const type =
                  safeString(
                    risk?.type,
                    'Risk'
                  )

                const explanation =
                  safeString(
                    risk?.explanation,
                    'Risk detected'
                  )

                const date =
                  safeFormatDate(
                    risk?.createdAt
                  )

                return (
                  <div
                    key={id}
                    className="flex items-center gap-4 px-6 py-4"
                  >

                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center gap-2">

                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {type}
                        </p>

                        {severity && (
                          <RiskBadge
                            risk={severity}
                          />
                        )}

                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {explanation}
                      </p>

                    </div>

                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {date}
                    </p>

                  </div>
                )
              }
            )}

          </div>

        ) : (

          <div className="p-8">
            <EmptyState
              icon={ShieldCheck}
              title={risksTitle}
              description={risksDescription}
            />
          </div>

        )}

      </div>

    </div>
  )
}