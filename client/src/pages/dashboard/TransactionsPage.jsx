import { useState, useEffect, useCallback } from 'react'
import { CreditCard } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import RiskBadge from '../../components/ui/RiskBadge'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { aiApi } from '../../api/aiApi'
import { useLanguage } from '../../context/LanguageContext'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function TransactionsPage() {
  const { t } = useLanguage()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiApi.getTransactions()
      setData(res.data?.data || res.data?.transactions || res.data || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: '_id',        label: 'ID',                  render: (v, r) => <span className="font-mono text-xs text-gray-400">{(v || r.id || '').slice(-8)}</span> },
    { key: 'vendor',     label: t('vendors.name'),      render: v => <span className="font-medium text-gray-900 dark:text-gray-100">{v || '—'}</span> },
    { key: 'invoiceNo',  label: t('docDetails.invoiceNumber') },
    { key: 'date',       label: t('documents.date'),    render: v => formatDate(v) },
    { key: 'amount',     label: t('documents.amount'),  render: (v, r) => formatCurrency(v, false, r.currency) },
    { key: 'trustScore', label: t('docDetails.trustScore'), render: v => v != null ? `${Number(v).toFixed(1)}%` : '—' },
    { key: 'status',     label: t('documents.status'),  render: v => <StatusBadge status={v} />, sortable: false },
    { key: 'riskLevel',  label: t('documents.risk'),    render: v => <RiskBadge risk={v} />,   sortable: false },
  ]

  if (error) return <ErrorState title={t('common.error')} description={error} onRetry={fetchData} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transactions.heading')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('transactions.sub')}</p>
      </div>
      {!loading && data.length === 0 ? (
        <EmptyState icon={CreditCard} title={t('transactions.noData')} />
      ) : (
        <DataTable columns={columns} data={data} loading={loading} rowKey="_id" emptyMessage={t('transactions.noData')} />
      )}
    </div>
  )
}
