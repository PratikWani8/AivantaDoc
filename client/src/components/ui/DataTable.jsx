import { ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function DataTable({
  columns = [],
  data = [],
  rowKey = '_id',
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
}) {
  const [sortConfig, setSortConfig] = useState(null)

  const sortedData = [...data]

  if (sortConfig) {
    sortedData.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal === bVal) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1
      }

      return aVal < bVal ? 1 : -1
    })
  }

  const handleSort = (column) => {
    if (!column.sortable) return

    let direction = 'asc'

    if (
      sortConfig &&
      sortConfig.key === column.key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc'
    }

    setSortConfig({
      key: column.key,
      direction,
    })
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={`loading-${i}`} className="border-b border-gray-100 dark:border-gray-800">
                {Array.from({ length: columns.length || 5 }).map((_, j) => (
                  <td key={`loading-${i}-${j}`} className="px-4 py-4">
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!sortedData.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={`header-${column.key}`}
                onClick={() => handleSort(column)}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
              >
                <div className="flex items-center gap-1">
                  {column.label}

                  {column.sortable && sortConfig?.key === column.key && (
                    sortConfig.direction === 'asc'
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedData.map((row, rowIndex) => {
            const key =
              row[rowKey] ||
              row.id ||
              row._id ||
              `row-${rowIndex}`

            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-gray-100 dark:border-gray-800 ${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={`${key}-${column.key}`}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}