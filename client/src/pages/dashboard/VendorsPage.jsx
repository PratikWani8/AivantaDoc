import { useState, useEffect, useCallback } from 'react'
import { Users, ExternalLink } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import RiskBadge from '../../components/ui/RiskBadge'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { vendorApi } from '../../api/vendorApi'
import { useLanguage } from '../../context/LanguageContext'
import { formatCurrency, formatPercent, getErrorMessage } from '../../utils/helpers'

export default function VendorsPage() {
  const { t } = useLanguage()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await vendorApi.getAll()
      setVendors(res.data?.data || res.data?.vendors || res.data || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  const columns = [
    { key: 'name', label: t('vendors.name'), render: v => <span className="font-semibold text-gray-900 dark:text-gray-100">{v || '—'}</span> },
    { key: 'invoiceCount', label: t('vendors.invoices'), render: v => v ?? '—' },
    { key: 'totalSpend',   label: t('vendors.totalSpend'), render: (v, r) => formatCurrency(v, false, r.currency || 'INR') },
    { key: 'trustScore',   label: t('vendors.trustScore'), render: v => v != null ? formatPercent(v) : '—' },
    { key: 'riskLevel',    label: t('vendors.risk'), render: v => <RiskBadge risk={v} />, sortable: false },
  ]

  if (error) return <ErrorState title={t('common.error')} description={error} onRetry={fetchVendors} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('vendors.heading')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('vendors.sub')}</p>
      </div>
      {!loading && vendors.length === 0 ? (
        <EmptyState icon={Users} title={t('vendors.noData')} />
      ) : (
        <DataTable columns={columns} data={vendors} loading={loading} rowKey="_id" emptyMessage={t('vendors.noData')} />
      )}
    </div>
  )
}
