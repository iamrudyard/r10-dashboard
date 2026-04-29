export const DOCUMENT_FIELDS = [
  { key: 'bfr', label: 'BFR' },
  { key: 'brgy_budget', label: 'Brgy Budget' },
  { key: 'summary_income', label: 'Summary Income' },
  { key: 'ira_nta_utilization', label: 'IRA/NTA Utilization' },
  { key: 'annual_procurement_plan', label: 'Annual Procurement Plan' },
  { key: 'notice_of_award', label: 'Notice of Award' },
  { key: 'month_1st', label: '1st Month' },
  { key: 'month_2nd', label: '2nd Month' },
  { key: 'month_3rd', label: '3rd Month' },
]

const DEFAULT_STATUS_LABEL = 'No Status'

const numericValues = (records, key) =>
  records.map((record) => record[key]).filter((value) => typeof value === 'number')

const average = (values) => {
  if (!values.length) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const round = (value, decimals = 1) =>
  value === null || Number.isNaN(value) ? null : Number(value.toFixed(decimals))

export function getStatusCounts(records) {
  return records.reduce((counts, record) => {
    const status = record.status || DEFAULT_STATUS_LABEL
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

export function getDocumentCompletion(records) {
  const total = records.length

  return DOCUMENT_FIELDS.map((field) => {
    const complete = records.filter((record) => record[field.key] === true).length
    const missing = total - complete

    return {
      ...field,
      complete,
      missing,
      percentage: total ? round((complete / total) * 100) : 0,
    }
  })
}

export function getAverageScoreByProvince(records) {
  const groups = records.reduce((result, record) => {
    const province = record.lib_geographic_units?.province_huc || 'Unspecified'

    if (!result[province]) {
      result[province] = []
    }

    if (typeof record.score === 'number') {
      result[province].push(record.score)
    }

    return result
  }, {})

  return Object.entries(groups)
    .map(([province, scores]) => ({
      province,
      averageScore: round(average(scores)),
    }))
    .filter((item) => item.averageScore !== null)
    .sort((a, b) => a.province.localeCompare(b.province))
}

export function getQuarterlyAverageScore(records, selectedYear) {
  const yearFilteredRecords = selectedYear
    ? records.filter((record) => Number(record.year) === Number(selectedYear))
    : records

  return [1, 2, 3, 4].map((quarter) => {
    const scores = yearFilteredRecords
      .filter((record) => Number(record.quarter) === quarter)
      .map((record) => record.score)
      .filter((score) => typeof score === 'number')

    return {
      quarter,
      averageScore: round(average(scores)),
    }
  })
}

export function getAvailableYears(records) {
  return [...new Set(records.map((record) => record.year).filter(Boolean))].sort((a, b) => b - a)
}

export function getBFDPAnalytics(records, filters = {}) {
  const totalRecords = records.length
  const uniqueLguCount = new Set(records.map((record) => record.lgu_id).filter(Boolean)).size
  const averageScore = round(average(numericValues(records, 'score')))
  const statusCounts = getStatusCounts(records)
  // TODO: Confirm canonical status labels if production values differ from these display labels.
  const compliantCount = Object.entries(statusCounts).find(
    ([status]) => status.toLowerCase() === 'compliant',
  )?.[1]
  const nonCompliantCount = Object.entries(statusCounts).find(([status]) =>
    ['non-compliant', 'non compliant'].includes(status.toLowerCase()),
  )?.[1]

  return {
    totalRecords,
    uniqueLguCount,
    averageScore,
    statusCounts,
    compliantCount,
    nonCompliantCount,
    documentCompletion: getDocumentCompletion(records),
    averageScoreByProvince: getAverageScoreByProvince(records),
    quarterlyAverageScore: getQuarterlyAverageScore(records, filters.year),
    selectedYear: filters.year || 'All Years',
    selectedQuarter: filters.quarter ? `Q${filters.quarter}` : 'All Quarters',
  }
}
