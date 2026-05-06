import { supabase } from '../lib/supabaseClient'
import { SKFPD_DOCUMENT_FIELDS, SKFPD_POLICY_BOARD_FIELD } from '../utils/skfpdAnalytics'

const OPTION_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 25
const STATUS_LABELS = {
  full: 'Full Compliant',
  partial: 'Partial Compliant',
  none: 'None Compliant',
}
const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']
const SKFPD_DETAIL_SELECT = `
  id,
  lgu_id,
  cbydp,
  abyip,
  annual_budget,
  rcb,
  month_1st,
  month_2nd,
  month_3rd,
  score,
  status,
  skfpd_pb,
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

const uniqueSorted = (values) =>
  [...new Set(values.map(normalizeOption).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const roundPercentage = (complete, total) => {
  if (!total) {
    return 0
  }

  return Number(((complete / total) * 100).toFixed(1))
}

const formatNumber = (value) => {
  const number = toNumber(value)
  return number === null ? 'N/A' : number.toLocaleString()
}

const averageScore = (values) => {
  const numericScores = values.map(toNumber).filter((value) => value !== null)

  if (!numericScores.length) {
    return null
  }

  const total = numericScores.reduce((sum, value) => sum + value, 0)
  return Number((total / numericScores.length).toFixed(1))
}

const sortProvinceScores = (rows) =>
  [...rows].sort((left, right) => {
    if (left.averageScore === null && right.averageScore === null) {
      return left.province.localeCompare(right.province)
    }

    if (left.averageScore === null) {
      return 1
    }

    if (right.averageScore === null) {
      return -1
    }

    return right.averageScore - left.averageScore || left.province.localeCompare(right.province)
  })

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''

const isSubmitted = (value) => value === true || Number(value) === 1

const getStatusGroup = (status) => {
  const normalized = typeof status === 'string' ? status.toLowerCase() : ''

  if (normalized.includes('full')) {
    return 'full'
  }

  if (normalized.includes('partial')) {
    return 'partial'
  }

  if (normalized.includes('none') || normalized.includes('non')) {
    return 'none'
  }

  return null
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

const getPopulationTotal = (rows) => {
  const aggregateRows = rows.filter((row) => normalizeOption(row.city_mun_name) && isBlank(row.barangay_name))
  const detailRows = rows.filter((row) => normalizeOption(row.barangay_name))
  const sourceRows = aggregateRows.length ? aggregateRows : detailRows

  return sourceRows.reduce((sum, row) => sum + (toNumber(row.population_2024) ?? 0), 0)
}

const getLocationPopulation = (row, fallbackRows = []) => {
  const population = toNumber(row?.population_2024)

  if (population !== null) {
    return formatNumber(population)
  }

  return formatNumber(getPopulationTotal(fallbackRows))
}

const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

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
  rows.reduce(
    (counts, row) => {
      const group = getStatusGroup(row.status)

      if (group) {
        counts[STATUS_LABELS[group]] = (counts[STATUS_LABELS[group]] ?? 0) + 1
      }

      return counts
    },
    {
      [STATUS_LABELS.full]: 0,
      [STATUS_LABELS.partial]: 0,
      [STATUS_LABELS.none]: 0,
    },
  )

const SKFPD_STATUS_SERIES = [
  { group: 'full', label: STATUS_LABELS.full },
  { group: 'partial', label: STATUS_LABELS.partial },
  { group: 'none', label: STATUS_LABELS.none },
]

const getStatusLocationKey = (row, filters = {}) => {
  if (filters.province) {
    return normalizeOption(row.city_mun_name) || normalizeOption(row.province_huc)
  }

  return normalizeOption(row.province_huc)
}

const buildStatusByProvince = (locationRows, rows, filters = {}) => {
  const locations = filters.province
    ? uniqueSorted(locationRows.map((row) => row.city_mun_name || row.province_huc)).map((city) => ({
        label: city,
        province: filters.province,
        city,
      }))
    : uniqueSorted(locationRows.map((row) => row.province_huc)).map((province) => ({
        label: province,
        province,
        city: '',
      }))
  const countsByProvince = new Map(
    locations.map((location) => [
      normalizeText(location.label),
      SKFPD_STATUS_SERIES.reduce(
        (counts, status) => ({
          ...counts,
          [status.label]: 0,
        }),
        {},
      ),
    ]),
  )

  rows.forEach((row) => {
    const locationKey = normalizeText(getStatusLocationKey(row, filters))
    const group = getStatusGroup(row.status)
    const status = SKFPD_STATUS_SERIES.find((item) => item.group === group)

    if (!locationKey || !status || !countsByProvince.has(locationKey)) {
      return
    }

    countsByProvince.get(locationKey)[status.label] += 1
  })

  return locations.map((location) => ({
    ...location,
    counts: countsByProvince.get(normalizeText(location.label)),
  }))
}

const getPolicyBoardScopeLabel = (filters = {}) => {
  if (filters.barangay) {
    return 'Selected Barangay'
  }

  if (filters.province && filters.city) {
    return 'Selected City/Municipality'
  }

  if (filters.province) {
    return 'Selected Province/HUC'
  }

  return 'All LGU'
}

const getPolicyBoardCard = (rows, filters = {}) => {
  const submitted = rows.filter((row) => isSubmitted(row[SKFPD_POLICY_BOARD_FIELD.key])).length
  const total = rows.length
  const percentage = roundPercentage(submitted, total)

  return {
    title: SKFPD_POLICY_BOARD_FIELD.fullLabel,
    value: submitted,
    note: `${percentage}% of ${total.toLocaleString()} records submitted`,
    info: `${getPolicyBoardScopeLabel(filters)} scope for SKFPD Policy Board.`,
  }
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

  if (filters.barangay) {
    query = query.eq('barangay_name', filters.barangay)
  }

  return query
}

function applyLguIdFilter(query, lguIds) {
  if (!lguIds) {
    return query
  }

  if (!lguIds.length) {
    return query.eq('lgu_id', -1)
  }

  return query.in('lgu_id', lguIds)
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
  if (!filters.province && !filters.city && !filters.barangay) {
    return null
  }

  const geoRows = await getFilteredGeoRows(filters)
  return uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
}

function flattenSKFPDRow(row) {
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

async function getSKFPDRows(filters = {}, includeLocation = true) {
  const lguIds = includeLocation ? await getFilteredLguIds(filters) : null
  const rows = await fetchAllPages(() => {
    let query = supabase.from('skfpd').select(SKFPD_DETAIL_SELECT)
    query = applyTemporalFilters(query, filters)
    query = applyLguIdFilter(query, lguIds)
    return query
  })

  return rows.map(flattenSKFPDRow)
}

export async function getSKFPDGeoOptions() {
  const [geoRows, yearRows] = await Promise.all([
    fetchAllPages(() =>
      supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name, barangay_name')
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })
        .order('barangay_name', { ascending: true, nullsFirst: false }),
    ),
    fetchAllPages(() =>
      supabase
        .from('skfpd')
        .select('year')
        .order('year', { ascending: false, nullsFirst: false }),
    ),
  ])

  return {
    provinces: uniqueSorted(geoRows.map((row) => row.province_huc)),
    locations: geoRows,
    years: [...new Set(yearRows.map((row) => row.year).filter(Boolean))].sort((a, b) => b - a),
  }
}

export async function getOverviewSKFPDStats(filters = {}) {
  const rows = await getSKFPDRows(filters)
  const level = filters.barangay ? 'barangay' : filters.city ? 'city' : 'province'
  const statusCounts = getStatusCounts(rows)

  if (level === 'barangay' && filters.quarter) {
    return {
      mode: 'status',
      status: getLatestRecord(rows)?.status || 'N/A',
    }
  }

  return {
    mode: 'counts',
    cards: Object.entries(statusCounts).map(([title, value]) => ({ title, value })),
  }
}

export async function getSKFPDSummary(filters = {}) {
  const rows = await getSKFPDRows(filters)
  const statusCounts = getStatusCounts(rows)
  const totalRecords = rows.length
  const uniqueLguCount = new Set(rows.map((row) => row.lgu_id).filter(Boolean)).size
  const averageScoreValue = averageScore(rows.map((row) => row.score))

  return {
    totalRecords,
    uniqueLguCount,
    averageScore: averageScoreValue,
    statusCounts,
    selectedYear: filters.year || 'All Years',
    selectedQuarter: filters.quarter ? `Q${filters.quarter}` : 'All Quarters',
  }
}

export async function getSKFPDDocumentCompletion(filters = {}) {
  const rows = await getSKFPDRows(filters)
  const totalRecords = rows.length

  return SKFPD_DOCUMENT_FIELDS.map((field) => {
    const complete = rows.filter((row) => isSubmitted(row[field.key])).length
    const missing = Math.max(totalRecords - complete, 0)

    return {
      ...field,
      complete,
      missing,
      percentage: roundPercentage(complete, totalRecords),
    }
  })
}

export async function getSKFPDLocationStats(filters = {}) {
  const geoRows = await getFilteredGeoRows(filters)
  const lguIds = uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
  const detailRows = await getSKFPDRows(
    {
      ...filters,
      province: '',
      city: '',
      barangay: '',
    },
    false,
  )
  const filteredDetailRows = lguIds.length
    ? detailRows.filter((row) => lguIds.includes(row.lgu_id))
    : []

  const uniqueGeoRows = uniqueRowsBy(
    geoRows,
    (row) => row.psgc_code || `${row.province_huc}-${row.city_mun_name}-${row.barangay_name}`,
  )
  const totalPopulation = uniqueGeoRows.reduce(
    (sum, row) => sum + (toNumber(row.population_2024) ?? 0),
    0,
  )
  const barangayCount = uniqueGeoRows.filter((row) => normalizeOption(row.barangay_name)).length
  const provinceHucCount = uniqueSorted(uniqueGeoRows.map((row) => row.province_huc)).length
  const cityMunicipalityCount = uniqueRowsBy(
    uniqueGeoRows.filter(
      (row) =>
        normalizeOption(row.city_mun_name) &&
        isBlank(row.barangay_name) &&
        normalizeText(row.city_mun_name) !== normalizeText(row.province_huc),
    ),
    (row) => `${row.province_huc}-${row.city_mun_name}`,
  ).length
  const provinceHucPopulationRows = uniqueRowsBy(
    uniqueGeoRows.filter((row) => {
      const lguType = normalizeText(row.lgu_type)

      return (
        isBlank(row.barangay_name) &&
        (isBlank(row.city_mun_name) ||
          normalizeText(row.city_mun_name) === normalizeText(row.province_huc) ||
          lguType === 'province' ||
          lguType === 'huc')
      )
    }),
    (row) => row.province_huc,
  )
  const allScopePopulation = provinceHucPopulationRows.length
    ? provinceHucPopulationRows.reduce((sum, row) => sum + (toNumber(row.population_2024) ?? 0), 0)
    : totalPopulation
  const incomeClass = getSelectedIncomeClass(uniqueGeoRows, filters)
  const locationRow = uniqueGeoRows[0] ?? filteredDetailRows[0] ?? {}
  const statusCounts = getStatusCounts(filteredDetailRows)
  const passedCount = filteredDetailRows.reduce(
    (sum, row) => sum + SKFPD_DOCUMENT_FIELDS.filter((field) => isSubmitted(row[field.key])).length,
    0,
  )
  const failedCount = filteredDetailRows.reduce(
    (sum, row) => sum + SKFPD_DOCUMENT_FIELDS.filter((field) => !isSubmitted(row[field.key])).length,
    0,
  )
  const latestRecord = getLatestRecord(filteredDetailRows)
  const level = filters.barangay ? 'barangay' : filters.city ? 'city' : 'province'
  const isAllScope = !filters.province && !filters.city && !filters.barangay

  if (level === 'barangay') {
    return {
      level,
      cards: [
        {
          title: 'Population',
          value: formatNumber(locationRow.population_2024),
          info: 'Population data is from year 2024.',
        },
        { title: 'Type', value: locationRow.urban_rural_type || 'N/A' },
        { title: 'PSGC Code', value: locationRow.psgc_code || 'N/A' },
        { title: 'No. of Passed', value: passedCount },
        { title: 'No. of Failed', value: failedCount },
        { title: 'Overall Score', value: latestRecord?.status || 'N/A' },
      ],
    }
  }

  if (isAllScope) {
    return {
      level: 'all',
      cards: [
        {
          title: 'Population',
          value: formatNumber(allScopePopulation),
          info: 'Population data is from year 2024.',
        },
        { title: 'Province/HUC', value: provinceHucCount },
        { title: 'City/Municipality', value: cityMunicipalityCount },
        { title: 'No. of Barangays', value: barangayCount },
        { title: STATUS_LABELS.full, value: statusCounts[STATUS_LABELS.full] ?? 0 },
        { title: STATUS_LABELS.partial, value: statusCounts[STATUS_LABELS.partial] ?? 0 },
        { title: STATUS_LABELS.none, value: statusCounts[STATUS_LABELS.none] ?? 0 },
        getPolicyBoardCard(filteredDetailRows, filters),
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
      { title: 'Income Class', value: incomeClass },
      { title: 'No. of Barangays', value: barangayCount },
      { title: STATUS_LABELS.full, value: statusCounts[STATUS_LABELS.full] ?? 0 },
      { title: STATUS_LABELS.partial, value: statusCounts[STATUS_LABELS.partial] ?? 0 },
      { title: STATUS_LABELS.none, value: statusCounts[STATUS_LABELS.none] ?? 0 },
      getPolicyBoardCard(filteredDetailRows, filters),
    ],
  }
}

export async function getSKFPDScoreByProvince(filters = {}) {
  const useCityLevel = Boolean(filters.province && filters.city)
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() => {
      let query = supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })

      if (useCityLevel) {
        query = query.eq('province_huc', filters.province).not('city_mun_name', 'is', null)
      }

      return query
    }),
    getSKFPDRows({ year: filters.year, quarter: filters.quarter }, false),
  ])

  const locations = useCityLevel
    ? uniqueSorted(geoRows.map((row) => row.city_mun_name))
    : uniqueSorted(geoRows.map((row) => row.province_huc))
  const scoresByLocation = detailRows.reduce((groups, row) => {
    if (useCityLevel && normalizeText(row.province_huc) !== normalizeText(filters.province)) {
      return groups
    }

    const location = useCityLevel
      ? normalizeOption(row.city_mun_name)
      : normalizeOption(row.province_huc) || 'Unspecified'

    if (!location) {
      return groups
    }

    if (!groups[location]) {
      groups[location] = []
    }

    groups[location].push(row.score)
    return groups
  }, {})

  return sortProvinceScores(
    locations.map((location) => ({
      province: location,
      label: location,
      city: useCityLevel ? location : '',
      averageScore: averageScore(scoresByLocation[location] ?? []),
    })),
  )
}

export async function getSKFPDStatusByProvince(filters = {}) {
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() => {
      let query = supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })

      if (filters.province) {
        query = query.eq('province_huc', filters.province)
      }

      if (filters.city) {
        query = query.eq('city_mun_name', filters.city)
      }

      return query
    }),
    getSKFPDRows(filters),
  ])

  return buildStatusByProvince(geoRows, detailRows, filters)
}

export async function getSKFPDQuarterlyTrend(filters = {}) {
  const quarterlyTrendFilters = { ...filters, quarter: '' }
  const rows = await getSKFPDRows(quarterlyTrendFilters)

  return [1, 2, 3, 4].map((quarter) => {
    const quarterRows = rows.filter((item) => Number(item.quarter) === quarter)

    return {
      quarter,
      averageScore: averageScore(quarterRows.map((row) => row.score)),
    }
  })
}

export async function getSKFPDTable(filters = {}) {
  const page = Number(filters.page ?? 0)
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE)
  const from = page * pageSize
  const to = from + pageSize - 1
  const lguIds = await getFilteredLguIds(filters)

  let query = supabase.from('skfpd').select(SKFPD_DETAIL_SELECT, { count: 'exact' })
  query = applyTemporalFilters(query, filters)
  query = applyLguIdFilter(query, lguIds)

  if (filters.status) {
    const statusGroup = getStatusGroup(filters.status)

    if (statusGroup === 'full') {
      query = query.ilike('status', '%full%')
    } else if (statusGroup === 'partial') {
      query = query.ilike('status', '%partial%')
    } else if (statusGroup === 'none') {
      query = query.or('status.ilike.%none%,status.ilike.%non%')
    } else {
      query = query.eq('status', filters.status)
    }
  }

  const { data, error, count } = await query
    .order('year', { ascending: false, nullsFirst: false })
    .order('quarter', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (error) {
    throw error
  }

  return {
    rows: (data ?? []).map(flattenSKFPDRow).sort((left, right) => {
      const leftLabel = [
        left.province_huc,
        isHucProvinceOption(left.province_huc) ? '' : left.city_mun_name,
        left.barangay_name,
      ].filter(Boolean).join(' ')
      const rightLabel = [
        right.province_huc,
        isHucProvinceOption(right.province_huc) ? '' : right.city_mun_name,
        right.barangay_name,
      ].filter(Boolean).join(' ')

      return leftLabel.localeCompare(rightLabel)
    }),
    count: count ?? 0,
  }
}
