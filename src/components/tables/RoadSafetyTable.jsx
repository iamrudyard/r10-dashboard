import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { isRoadSafetyCompliantValue } from '../../utils/roadSafetyAnalytics'

const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']
const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

const getGeoLabelPart = (record, key) => {
  const value = record[key] ?? record.lib_geographic_units?.[key]

  return typeof value === 'string' ? value.trim() : value
}

const getRoadSafetyRecordLabel = (record) => {
  const provinceHuc = getGeoLabelPart(record, 'province_huc')
  const cityMunName = getGeoLabelPart(record, 'city_mun_name')
  const isHuc = isHucProvinceOption(provinceHuc)
  const parts = isHuc ? [provinceHuc] : [provinceHuc, cityMunName]

  return parts.filter(Boolean).join(', ') || ''
}

const tableColumns = [
  {
    key: 'lgu',
    label: 'LGU',
    className: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug xl:text-sm',
    headerClassName: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug xl:text-sm',
    getValue: getRoadSafetyRecordLabel,
  },
  {
    key: 'ordinance_no',
    label: 'Ordinance Details',
    className: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug text-slate-700 xl:text-sm',
    headerClassName: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug xl:text-sm',
    getValue: (record) => record.ordinance_no || '',
  },
  {
    key: 'submitted_to_dotr',
    label: 'Submitted To DOTr',
    className: 'px-2 py-2 text-center text-xs xl:text-sm',
    headerClassName: 'whitespace-normal px-2 py-2 text-center text-xs leading-snug xl:text-sm',
    getValue: (record) => {
      if (record.submitted_to_dotr === null || record.submitted_to_dotr === undefined || record.submitted_to_dotr === '') {
        return ''
      }

      return isRoadSafetyCompliantValue(record.submitted_to_dotr) ? 'Yes' : 'No'
    },
  },
  {
    key: 'date_submitted',
    label: 'Submitted Date',
    className: 'px-2 py-2 text-center text-xs xl:text-sm',
    headerClassName: 'whitespace-normal px-2 py-2 text-center text-xs leading-snug xl:text-sm',
    getValue: (record) => record.date_submitted || '',
  },
]

function SortableHeader({ column, sortConfig, onSort }) {
  const isActive = sortConfig.key === column.key
  const indicator = isActive ? (sortConfig.direction === 'asc' ? '^' : 'v') : '-'

  return (
    <TableHeaderCell className={column.headerClassName}>
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className="flex w-full items-center justify-center gap-1 text-left font-semibold text-slate-700 hover:text-civic-700"
      >
        <span>{column.label}</span>
        <span className="text-[10px] text-slate-400">{indicator}</span>
      </button>
    </TableHeaderCell>
  )
}

function compareValues(leftValue, rightValue, direction) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (leftValue === null || leftValue === undefined || leftValue === '') {
    return rightValue === null || rightValue === undefined || rightValue === '' ? 0 : 1
  }

  if (rightValue === null || rightValue === undefined || rightValue === '') {
    return -1
  }

  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * multiplier
}

export default function RoadSafetyTable({
  records,
  totalRecords = records.length,
  page = 0,
  pageSize = 25,
  activeStatusFilter = '',
  onClearStatusFilter,
  onPageChange,
  onPageSizeChange,
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'lgu', direction: 'asc' })
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const currentPage = Math.min(page + 1, totalPages)

  const sortedRecords = useMemo(() => {
    const column = tableColumns.find((item) => item.key === sortConfig.key)

    if (!column) {
      return records
    }

    return [...records].sort((left, right) =>
      compareValues(column.getValue(left), column.getValue(right), sortConfig.direction),
    )
  }, [records, sortConfig])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Ordinance Detailed Records</h2>
          <p className="text-sm text-slate-500">
            {activeStatusFilter
              ? `Filtered by ${activeStatusFilter}`
              : 'LGUs with speed-limit ordinances for the selected period.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeStatusFilter ? (
            <button
              type="button"
              onClick={onClearStatusFilter}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear filter
            </button>
          ) : null}
          <Badge color="slate">
            {records.length} of {totalRecords} records
          </Badge>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Rows
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[760px] table-fixed text-xs leading-snug xl:text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[34%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
          </colgroup>
          <TableHead>
            <TableRow>
              {tableColumns.map((column) => (
                <SortableHeader
                  key={column.key}
                  column={column}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRecords.map((record, index) => (
              <TableRow key={record.id ?? `${record.province_huc}-${record.city_mun_name}-${index}`}>
                {tableColumns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.getValue(record)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center">
        <p className="text-sm text-slate-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}
