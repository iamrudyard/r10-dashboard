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
import { DOCUMENT_FIELDS } from '../../utils/bfdpAnalytics'

const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

const getGeoLabelPart = (record, key) => {
  const value = record[key] ?? record.lib_geographic_units?.[key]

  return typeof value === 'string' ? value.trim() : value
}

const getBFDPRecordLabel = (record) => {
  const provinceHuc = getGeoLabelPart(record, 'province_huc')
  const cityMunName = getGeoLabelPart(record, 'city_mun_name')
  const barangayName = getGeoLabelPart(record, 'barangay_name')
  const isHuc = isHucProvinceOption(provinceHuc)
  const parts = isHuc
    ? [provinceHuc, barangayName]
    : [provinceHuc, cityMunName, barangayName]

  return parts.filter(Boolean).join(', ') || 'Unspecified'
}

const badgeClassName =
  'border px-1.5 py-0.5 text-[11px] font-medium leading-4 shadow-none ring-1 ring-inset xl:px-2 xl:text-xs'

const badgeColorClasses = {
  green: '!border-[#069c56] !bg-[#069c56] !text-white !ring-[#069c56]/20',
  orange: '!border-[#ff980e] !bg-[#ff980e] !text-white !ring-[#ff980e]/20',
  red: '!border-[#d3212c] !bg-[#d3212c] !text-white !ring-[#d3212c]/20',
  slate: '!border-slate-300 !bg-slate-50 !text-slate-700 !ring-slate-600/20',
}

const getStatusBadgeColor = (status = '') => {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('full')) {
    return 'green'
  }

  if (normalizedStatus.includes('partial')) {
    return 'orange'
  }

  if (normalizedStatus.includes('none') || normalizedStatus.includes('non')) {
    return 'red'
  }

  return status ? 'slate' : 'slate'
}

const getStatusBadgeClassName = (status) =>
  `${badgeClassName} whitespace-normal ${badgeColorClasses[getStatusBadgeColor(status)]}`

const baseColumns = [
  {
    key: 'lgu',
    label: 'LGU',
    className: 'whitespace-normal break-words px-1.5 py-2 text-xs leading-snug xl:px-2 xl:text-sm',
    headerClassName: 'whitespace-normal break-words px-1.5 py-2 text-xs leading-snug xl:px-2 xl:text-sm',
    getValue: getBFDPRecordLabel,
  },
]

const documentColumns = DOCUMENT_FIELDS.map((field) => ({
  key: field.key,
  label: field.label,
  className: 'px-0.5 py-2 text-center xl:px-1',
  headerClassName: 'whitespace-normal break-words px-0.5 py-2 text-center text-[11px] leading-tight xl:px-1 xl:text-xs',
  getValue: (record) => record[field.key],
  render: (record) => <BooleanBadge value={record[field.key]} />,
}))

const metricColumns = [
  {
    key: 'score',
    label: 'Score',
    className: 'px-0.5 py-2 text-center text-xs xl:px-1 xl:text-sm',
    headerClassName: 'whitespace-normal px-0.5 py-2 text-center text-xs leading-snug xl:px-1 xl:text-sm',
    getValue: (record) => record.score,
    render: (record) => record.score ?? 'N/A',
  },
  {
    key: 'quarter',
    label: 'Quarter',
    className: 'px-0.5 py-2 text-center text-xs xl:px-1 xl:text-sm',
    headerClassName: 'whitespace-normal px-0.5 py-2 text-center text-xs leading-snug xl:px-1 xl:text-sm',
    getValue: (record) => record.quarter,
    render: (record) => (record.quarter ? `Q${record.quarter}` : 'N/A'),
  },
  {
    key: 'year',
    label: 'Year',
    className: 'px-0.5 py-2 text-center text-xs xl:px-1 xl:text-sm',
    headerClassName: 'whitespace-normal px-0.5 py-2 text-center text-xs leading-snug xl:px-1 xl:text-sm',
    getValue: (record) => record.year,
    render: (record) => record.year ?? 'N/A',
  },
  {
    key: 'status',
    label: 'Status',
    className: 'whitespace-normal break-words px-1.5 py-2 xl:px-2',
    headerClassName: 'whitespace-normal break-words px-1.5 py-2 text-xs leading-snug xl:px-2 xl:text-sm',
    getValue: (record) => record.status || 'No Status',
    render: (record) => (
      <Badge
        color={getStatusBadgeColor(record.status)}
        className={getStatusBadgeClassName(record.status)}
      >
        {record.status || 'No Status'}
      </Badge>
    ),
  },
]

const tableColumns = [...baseColumns, ...documentColumns, ...metricColumns]

function BooleanBadge({ value }) {
  return value ? (
    <Badge color="green" className={`${badgeClassName} ${badgeColorClasses.green}`}>
      Yes
    </Badge>
  ) : (
    <Badge color="red" className={`${badgeClassName} ${badgeColorClasses.red}`}>
      No
    </Badge>
  )
}

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

  if (leftValue === null || leftValue === undefined) {
    return rightValue === null || rightValue === undefined ? 0 : 1
  }

  if (rightValue === null || rightValue === undefined) {
    return -1
  }

  if (typeof leftValue === 'boolean' || typeof rightValue === 'boolean') {
    return (Number(leftValue) - Number(rightValue)) * multiplier
  }

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return (leftValue - rightValue) * multiplier
  }

  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * multiplier
}

export default function BFDPTable({
  records,
  totalRecords = records.length,
  page = 0,
  pageSize = 25,
  activeStatusFilter = '',
  onClearStatusFilter,
  onPageChange,
  onPageSizeChange,
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' })
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
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-950">BFDP Detailed Records</h2>
          <p className="text-sm text-slate-500">
            {activeStatusFilter
              ? `Filtered by status: ${activeStatusFilter}`
              : 'Joined BFDP records with geographic unit fields.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeStatusFilter ? (
            <button
              type="button"
              onClick={onClearStatusFilter}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear status
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

      <div className="w-full overflow-hidden">
        <Table className="w-full table-fixed text-xs leading-snug xl:text-sm">
          <colgroup>
            <col className="w-[23%]" />
            {DOCUMENT_FIELDS.map((field) => (
              <col key={field.key} className="w-[5.4%]" />
            ))}
            <col className="w-[5%]" />
            <col className="w-[5%]" />
            <col className="w-[5%]" />
            <col className="w-[13.4%]" />
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
              <TableRow key={record.id ?? `${record.province_huc}-${record.city_mun_name}-${record.barangay_name}-${index}`}>
                {tableColumns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(record) : column.getValue(record)}
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
