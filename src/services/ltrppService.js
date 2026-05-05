import { supabase } from '../lib/supabaseClient'
import {
  getLTRPPScore,
  getLTRPPStatus,
  isLTRPPCompliantValue,
  LTRPP_FIELDS,
} from '../utils/ltrppAnalytics'

const OPTION_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 25
const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']
const LTRPP_DETAIL_SELECT = `
  id,
  lgu_id,
  planning_team,
  draft_plan,
  submission_of_plan,
  certification_issuance,
  remarks,
  quarter,
  year,
  created_at,
  lib_geographic_units (
    id,
    psgc_code,
    province_huc,
    city_mun_name,
    barangay_name,
    income_class,
    lgu_type,
    urban_rural_type,
    population_2024
  )
`

const normalizeOption = (value) => (typeof value === 'string' ? value.trim() : value)

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const uniqueSorted = (values) =>
  [...new Set(values.map(normalizeOption).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''

const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

const formatNumber = (value) => {
  const number = toNumber(value)
  return number === null ? 'N/A' : number.toLocaleString()
}

const roundPercentage = (complete, total) => {
  if (!total) {
    return 0
  }

  return Number(((complete / total) * 100).toFixed(1))
}

const averageScore = (rows) => {
  if (!rows.length) {
    return null
  }

  const total = rows.reduce((sum, row) => sum + getLTRPPScore(row), 0)
  return Number((total / rows.length).toFixed(1))
}

const uniqueRowsBy = (rows, getKey) => {
  const map = new Map()

  rows.forEach((row) => {
    const key = getKey(row)
    if (key && !map.has(key)) {
      map.set(key, row)
    }
  })

  return [...map.values()]
}

const getLatestRecord = (rows) =>
  [...rows].sort((left, right) => {
    if ((right.year ?? 0) !== (left.year ?? 0)) {
      return (right.year ?? 0) - (left.year ?? 0)
    }

    if ((right.quarter ?? 0) !== (left.quarter ?? 0)) {
      return (right.quarter ?? 0) - (left.quarter ?? 0)
    }

    return (right.id ?? 0) - (left.id ?? 0)
  })[0]

const getStatusCounts = (rows) =>
  rows.reduce((counts, row) => {
    const status = getLTRPPStatus(row)
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})

const getSelectedIncomeClass = (rows, filters = {}) => {
  const rowsWithIncomeClass = rows.filter((row) => normalizeOption(row.income_class))

  if (filters.city) {
    const selectedCity = normalizeText(filters.city)
    const cityRow = rowsWithIncomeClass.find(
      (row) =>
        normalizeText(row.city_mun_name) === selectedCity &&
        isBlank(row.barangay_name) &&
        normalizeText(row.lgu_type) !== 'barangay',
    )

    if (cityRow) {
      return normalizeOption(cityRow.income_class)
    }
  }

  if (filters.province) {
    const selectedProvince = normalizeText(filters.province)
    const provinceHucRow = rowsWithIncomeClass.find((row) => {
      const lguType = normalizeText(row.lgu_type)

      return (
        normalizeText(row.province_huc) === selectedProvince &&
        isBlank(row.barangay_name) &&
        (lguType === 'province' || lguType === 'huc' || isBlank(row.city_mun_name))
      )
    })

    if (provinceHucRow) {
      return normalizeOption(provinceHucRow.income_class)
    }
  }

  const incomeClasses = uniqueSorted(rowsWithIncomeClass.map((row) => row.income_class))
  return incomeClasses[0] || 'N/A'
}

function applyTemporalFilters(query, filters = {}) {
  if (filters.year) {
    query = query.eq('year', Number(filters.year))
  }

  if (filters.quarter) {
    query = query.eq('quarter', Number(filters.quarter))
  }

  return query
}

function applyGeoFilters(query, filters = {}) {
  if (filters.province) {
    query = query.eq('province_huc', filters.province)
  }

  if (filters.city) {
    query = query.eq('city_mun_name', filters.city)
  }

  return query
}

function matchesLocationFilters(row, lguIds, filters = {}) {
  if (!filters.province && !filters.city) {
    return true
  }

  if (lguIds?.includes(row.lgu_id)) {
    return true
  }

  if (filters.province && normalizeText(row.province_huc) !== normalizeText(filters.province)) {
    return false
  }

  if (filters.city && normalizeText(row.city_mun_name) !== normalizeText(filters.city)) {
    return false
  }

  return true
}

async function fetchAllPages(buildQuery, pageSize = OPTION_PAGE_SIZE) {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    rows.push(...(data ?? []))

    if (!data || data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

async function getFilteredGeoRows(filters = {}) {
  return fetchAllPages(() => {
    let query = supabase
      .from('lib_geographic_units')
      .select(
        'id, psgc_code, province_huc, city_mun_name, barangay_name, income_class, lgu_type, urban_rural_type, population_2024',
      )
      .order('province_huc', { ascending: true, nullsFirst: false })
      .order('city_mun_name', { ascending: true, nullsFirst: false })
      .order('barangay_name', { ascending: true, nullsFirst: false })

    query = applyGeoFilters(query, filters)
    return query
  })
}

async function getFilteredLguIds(filters = {}) {
  if (!filters.province && !filters.city) {
    return null
  }

  const geoRows = await getFilteredGeoRows(filters)
  return uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
}

function flattenLTRPPRow(row) {
  const geo = row.lib_geographic_units ?? {}

  return {
    ...row,
    psgc_code: geo.psgc_code,
    province_huc: geo.province_huc,
    city_mun_name: geo.city_mun_name,
    barangay_name: geo.barangay_name,
    income_class: geo.income_class,
    lgu_type: geo.lgu_type,
    urban_rural_type: geo.urban_rural_type,
    population_2024: geo.population_2024,
  }
}

async function getLTRPPRows(filters = {}, includeLocation = true) {
  const lguIds = includeLocation ? await getFilteredLguIds(filters) : null
  const rows = await fetchAllPages(() => {
    let query = supabase.from('lptrpp').select(LTRPP_DETAIL_SELECT)
    query = applyTemporalFilters(query, filters)
    return query
  })

  const flattenedRows = rows.map(flattenLTRPPRow)

  if (!includeLocation) {
    return flattenedRows
  }

  return flattenedRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
}

export async function getLTRPPGeoOptions() {
  const geoRows = await fetchAllPages(() =>
    supabase
      .from('lib_geographic_units')
      .select('province_huc, city_mun_name, barangay_name')
      .order('province_huc', { ascending: true, nullsFirst: false })
      .order('city_mun_name', { ascending: true, nullsFirst: false })
      .order('barangay_name', { ascending: true, nullsFirst: false }),
  )

  return {
    provinces: uniqueSorted(geoRows.map((row) => row.province_huc)),
    locations: geoRows,
    years: [2026],
  }
}

export async function getOverviewLTRPPStats(filters = {}) {
  const rows = await getLTRPPRows(filters)
  const level = filters.city ? 'city' : 'province'
  const statusCounts = getStatusCounts(rows)

  if (level !== 'province' && filters.quarter) {
    return {
      mode: 'status',
      status: getLTRPPStatus(getLatestRecord(rows)),
    }
  }

  return {
    mode: 'counts',
    cards: [
      { title: 'Compliance', value: statusCounts.Compliance ?? 0 },
      { title: 'Non Compliance', value: statusCounts['Non Compliance'] ?? 0 },
      { title: 'Notice Issued', value: rows.filter((row) => row.certification_issuance).length },
    ],
  }
}

export async function getLTRPPSummary(filters = {}) {
  const rows = await getLTRPPRows(filters)
  const statusCounts = getStatusCounts(rows)
  const totalRecords = rows.length
  const uniqueLguCount = new Set(rows.map((row) => row.lgu_id).filter(Boolean)).size

  return {
    totalRecords,
    uniqueLguCount,
    averageScore: averageScore(rows),
    statusCounts,
    selectedYear: filters.year || 'All Years',
    selectedQuarter: filters.quarter ? `Q${filters.quarter}` : 'All Quarters',
  }
}

export async function getLTRPPDocumentCompletion(filters = {}) {
  const rows = await getLTRPPRows(filters)
  const totalRecords = rows.length

  return LTRPP_FIELDS.map((field) => {
    const complete = rows.filter((row) => isLTRPPCompliantValue(field.key, row[field.key])).length
    const missing = Math.max(totalRecords - complete, 0)

    return {
      ...field,
      complete,
      missing,
      percentage: roundPercentage(complete, totalRecords),
    }
  })
}

export async function getLTRPPLocationStats(filters = {}) {
  const geoRows = await getFilteredGeoRows(filters)
  const lguIds = uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
  const detailRows = await getLTRPPRows(
    {
      ...filters,
      province: '',
      city: '',
    },
    false,
  )
  const hasGeoFilter = Boolean(filters.province || filters.city)
  const filteredDetailRows = lguIds.length
    ? detailRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
    : hasGeoFilter
      ? detailRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
      : detailRows
  const uniqueGeoRows = uniqueRowsBy(
    geoRows,
    (row) => row.psgc_code || `${row.province_huc}-${row.city_mun_name}-${row.barangay_name}`,
  )
  const municipalityCount = uniqueRowsBy(
    uniqueGeoRows.filter(
      (row) =>
        normalizeOption(row.city_mun_name) &&
        isBlank(row.barangay_name) &&
        normalizeText(row.city_mun_name) !== normalizeText(row.province_huc),
    ),
    (row) => `${row.province_huc}-${row.city_mun_name}`,
  ).length
  const totalPopulation = uniqueGeoRows.reduce(
    (sum, row) => sum + (toNumber(row.population_2024) ?? 0),
    0,
  )
  const statusCounts = getStatusCounts(filteredDetailRows)
  const latestRecord = getLatestRecord(filteredDetailRows)
  const level = filters.city ? 'city' : 'province'

  if (level === 'city') {
    const locationRow = uniqueGeoRows.find(
      (row) =>
        normalizeText(row.city_mun_name) === normalizeText(filters.city) &&
        isBlank(row.barangay_name),
    ) ?? uniqueGeoRows[0] ?? latestRecord ?? {}

    return {
      level,
      cards: [
        {
          title: 'Population',
          value: formatNumber(locationRow.population_2024),
          info: 'Population data is from year 2024.',
        },
        { title: 'Income Class', value: locationRow.income_class || getSelectedIncomeClass(uniqueGeoRows, filters) },
        { title: 'Latest Score', value: latestRecord ? `${getLTRPPScore(latestRecord)}/4` : 'N/A' },
        { title: 'Latest Status', value: getLTRPPStatus(latestRecord) },
        { title: 'Records', value: filteredDetailRows.length },
      ],
    }
  }

  return {
    level,
    cards: [
      {
        title: 'Population',
        value: formatNumber(totalPopulation),
        info: 'Population data is from year 2024.',
      },
      { title: 'City/Municipality', value: municipalityCount },
      { title: 'Compliance', value: statusCounts.Compliance ?? 0 },
      { title: 'Non Compliance', value: statusCounts['Non Compliance'] ?? 0 },
      { title: 'Average Score', value: filteredDetailRows.length ? `${averageScore(filteredDetailRows)}/4` : 'N/A' },
    ],
  }
}

export async function getLTRPPScoreByProvince(filters = {}) {
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() =>
      supabase
        .from('lib_geographic_units')
        .select('province_huc')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false }),
    ),
    getLTRPPRows({ year: filters.year, quarter: filters.quarter }, false),
  ])

  const provinceHucs = uniqueSorted(geoRows.map((row) => row.province_huc))
  const scoresByProvince = detailRows.reduce((groups, row) => {
    const province = normalizeOption(row.province_huc) || 'Unspecified'

    if (!groups[province]) {
      groups[province] = []
    }

    groups[province].push(row)
    return groups
  }, {})

  return provinceHucs.map((province) => ({
    province,
    averageScore: averageScore(scoresByProvince[province] ?? []),
  }))
}

export async function getLTRPPQuarterlyTrend(filters = {}) {
  const quarterlyTrendFilters = { ...filters, quarter: '' }
  const rows = await getLTRPPRows(quarterlyTrendFilters)

  return [1, 2, 3, 4].map((quarter) => {
    const quarterRows = rows.filter((item) => Number(item.quarter) === quarter)

    return {
      quarter,
      averageScore: averageScore(quarterRows),
    }
  })
}

export async function getLTRPPRemarks(filters = {}) {
  if (!filters.province && !filters.city) {
    return []
  }

  const rows = await getLTRPPRows(filters)
  return rows
    .filter((row) => row.remarks && String(row.remarks).trim())
    .sort((left, right) => {
      if ((right.year ?? 0) !== (left.year ?? 0)) {
        return (right.year ?? 0) - (left.year ?? 0)
      }

      if ((right.quarter ?? 0) !== (left.quarter ?? 0)) {
        return (right.quarter ?? 0) - (left.quarter ?? 0)
      }

      return (right.id ?? 0) - (left.id ?? 0)
    })
    .slice(0, 5)
}

export async function getLTRPPTable(filters = {}) {
  const page = Number(filters.page ?? 0)
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE)
  const from = page * pageSize
  const to = from + pageSize - 1
  const rows = await getLTRPPRows(filters)
  const filteredRows = (filters.status
    ? rows.filter((row) => getLTRPPStatus(row) === filters.status)
    : rows
  ).sort((left, right) => {
    if ((right.year ?? 0) !== (left.year ?? 0)) {
      return (right.year ?? 0) - (left.year ?? 0)
    }

    if ((right.quarter ?? 0) !== (left.quarter ?? 0)) {
      return (right.quarter ?? 0) - (left.quarter ?? 0)
    }

      const leftLabel = [
        left.province_huc,
        isHucProvinceOption(left.province_huc) ? '' : left.city_mun_name,
      ].filter(Boolean).join(' ')
      const rightLabel = [
        right.province_huc,
        isHucProvinceOption(right.province_huc) ? '' : right.city_mun_name,
      ].filter(Boolean).join(' ')

      return leftLabel.localeCompare(rightLabel)
    })

  return {
    rows: filteredRows.slice(from, to + 1),
    count: filteredRows.length,
  }
}
