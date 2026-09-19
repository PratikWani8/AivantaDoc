import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Upload,
  Eye,
  Download,
} from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import RiskBadge from '../../components/ui/RiskBadge'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { documentApi } from '../../api/documentApi'
import { useLanguage } from '../../context/LanguageContext'
import {
  formatCurrency,
  formatDate,
  getErrorMessage,
} from '../../utils/helpers'
import toast from 'react-hot-toast'

/*
 * Safely get a value from multiple possible field names.
 */
function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ''
  )
}

/*
 * Normalize backend document/OCR data into one structure
 * used by the table.
 */
function normalizeDocument(doc) {
  const fields =
    doc?.ocr?.fields ||
    doc?.ocrResult?.fields ||
    doc?.extractedData?.fields ||
    {}

  return {
    ...doc,

    id: doc._id || doc.id,

    vendorName: firstValue(
      doc.vendorName,
      doc.vendor,
      fields.vendorName,
      fields.vendor_name,
      fields.vendor,
      fields.supplierName,
      fields.supplier_name
    ),

    invoiceNumber: firstValue(
      doc.invoiceNumber,
      doc.invoice_number,
      fields.invoiceNumber,
      fields.invoice_number,
      fields.invoiceNo,
      fields.invoice_no
    ),

    invoiceDate: firstValue(
      doc.invoiceDate,
      doc.invoice_date,
      fields.invoiceDate,
      fields.invoice_date
    ),

    poNumber: firstValue(
      doc.poNumber,
      doc.po_number,
      fields.poNumber,
      fields.po_number,
      fields.purchaseOrderNumber,
      fields.purchase_order_number
    ),

    subtotal: firstValue(
      doc.subtotal,
      fields.subtotal,
      fields.subTotal,
      fields.sub_total
    ),

    taxAmount: firstValue(
      doc.taxAmount,
      doc.tax,
      fields.taxAmount,
      fields.tax_amount,
      fields.tax,
      fields.totalTax,
      fields.total_tax
    ),

    totalAmount: firstValue(
      doc.totalAmount,
      doc.total,
      fields.totalAmount,
      fields.total_amount,
      fields.total,
      fields.grandTotal,
      fields.grand_total
    ),

    currency: firstValue(
      doc.currency,
      fields.currency,
      fields.currencyCode,
      fields.currency_code
    ),

    riskLevel: firstValue(
      doc.riskLevel,
      doc.ai?.riskLevel,
      doc.aiAnalysis?.riskLevel
    ),
  }
}

export default function DocumentsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  /*
   * ============================================================
   * FETCH DOCUMENTS
   * ============================================================
   */

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {}

      /*
       * IMPORTANT:
       * Your backend currently does not show status filtering
       * in listDocuments(), so don't send unsupported frontend
       * values unless your backend implements them.
       */
      if (statusFilter !== 'all') {
        params.status = statusFilter.toUpperCase()
      }

      const res = await documentApi.getAll(params)

      const rawData =
        res.data?.data ||
        res.data?.documents ||
        res.data ||
        []

      const normalized = Array.isArray(rawData)
        ? rawData.map(normalizeDocument)
        : []

      console.log('DOCUMENT LIST RESPONSE:', rawData)
      console.log('NORMALIZED DOCUMENTS:', normalized)

      setDocs(normalized)
    } catch (err) {
      console.error('DOCUMENT LIST ERROR:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  /*
   * ============================================================
   * SEARCH
   * ============================================================
   */

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return docs
    }

    const q = search.toLowerCase().trim()

    return docs.filter((doc) => {
      return (
        String(doc.vendorName || '')
          .toLowerCase()
          .includes(q) ||

        String(doc.invoiceNumber || '')
          .toLowerCase()
          .includes(q) ||

        String(doc.poNumber || '')
          .toLowerCase()
          .includes(q) ||

        String(doc.documentType || '')
          .toLowerCase()
          .includes(q) ||

        String(doc.originalName || '')
          .toLowerCase()
          .includes(q) ||

        String(doc.id || '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [docs, search])

  /*
   * ============================================================
   * EXPORT
   * ============================================================
   */

  const handleExport = async (doc) => {
    const documentId = doc._id || doc.id

    if (!documentId) {
      toast.error('Document ID is missing.')
      return
    }

    try {
      const res = await documentApi.export(documentId)

      const blob = new Blob(
        [res.data],
        {
          type:
            res.headers?.['content-type'] ||
            'application/json',
        }
      )

      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')

      a.href = url
      a.download = `document-${documentId}.json`

      document.body.appendChild(a)
      a.click()
      a.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('EXPORT ERROR:', err)
      toast.error(
        getErrorMessage(err) || 'Export failed.'
      )
    }
  }

  /*
   * ============================================================
   * TABLE COLUMNS
   * ============================================================
   */

  const columns = [
    {
      key: '_id',
      label: t('documents.id'),

      render: (value, row) => {
        const id = value || row.id || ''

        return (
          <span className="font-mono text-xs text-gray-400">
            {id ? id.slice(-8) : '—'}
          </span>
        )
      },
    },

    {
      key: 'documentType',
      label: t('documents.type'),

      render: (value, row) => {
        const type =
          value ||
          row.type ||
          'unknown'

        return (
          <span className="capitalize text-xs font-medium text-gray-700 dark:text-gray-300">
            {type}
          </span>
        )
      },
    },

    {
      key: 'vendorName',
      label: t('documents.vendor'),

      render: (value, row) => {
        const vendor =
          value ||
          row.vendor ||
          t('common.unknown')

        return (
          <div className="max-w-[180px]">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
              {vendor}
            </span>
          </div>
        )
      },
    },

    {
      key: 'invoiceNumber',
      label: t('docDetails.invoiceNumber'),

      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value || '—'}
        </span>
      ),
    },

    {
      key: 'invoiceDate',
      label: t('documents.date'),

      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {value ? formatDate(value) : '—'}
        </span>
      ),
    },

    {
      key: 'totalAmount',
      label: t('documents.amount'),

      render: (value, row) => {
        if (
          value === undefined ||
          value === null ||
          value === ''
        ) {
          return '—'
        }

        return formatCurrency(
          Number(value),
          false,
          row.currency || 'INR'
        )
      },
    },

    {
      key: 'status',
      label: t('documents.status'),

      render: (value) => (
        <StatusBadge status={value} />
      ),

      sortable: false,
    },

    {
      key: 'riskLevel',
      label: t('documents.risk'),

      render: (value) => (
        <RiskBadge risk={value} />
      ),

      sortable: false,
    },

    {
      key: 'actions',
      label: t('documents.actions'),
      sortable: false,

      render: (_, row) => {
        const documentId =
          row._id || row.id

        return (
          <div className="flex items-center gap-1.5">

            {/* View */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()

                if (documentId) {
                  navigate(
                    `/dashboard/documents/${documentId}`
                  )
                }
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary-600 transition-colors"
              title={t('documents.view')}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleExport(row)
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary-600 transition-colors"
              title={t('documents.download')}
            >
              <Download className="w-4 h-4" />
            </button>

          </div>
        )
      },
    },
  ]

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error) {
    return (
      <ErrorState
        title={t('common.error')}
        description={error}
        onRetry={fetchDocs}
      />
    )
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('documents.heading')}
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('documents.sub')}
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
          {t('dashboard.upload')}
        </Button>

      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={
              t('common.search') + '...'
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">
            {t('common.all')}
          </option>

          <option value="COMPLETED">
            Completed
          </option>

          <option value="QUEUED">
            Queued
          </option>

          <option value="PROCESSING">
            Processing
          </option>

          <option value="FAILED">
            Failed
          </option>
        </select>

      </div>

      {/* Results */}
      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('documents.noDocuments')}
          description={t('documents.noDocumentsDesc')}
          action={() =>
            navigate('/dashboard/upload')
          }
          actionLabel={t('documents.uploadFirst')}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey="_id"
          emptyMessage={t('documents.noDocuments')}
          onRowClick={(row) => {
            const documentId =
              row._id || row.id

            if (documentId) {
              navigate(
                `/dashboard/documents/${documentId}`
              )
            }
          }}
        />
      )}

    </div>
  )
}