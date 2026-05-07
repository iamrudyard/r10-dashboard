import { supabase } from '../lib/supabaseClient'
import {
  getRoadSafetyScore,
  getRoadSafetyStatus,
  isRoadSafetyCompliantValue,
  ROAD_SAFETY_FIELDS,
} from '../utils/roadSafetyAnalytics'

const OPTION_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 25
const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']
const ROAD_SAFETY_DETAIL_SELECT = `
  id,
  lgu_id,
  speed_limit_ordinance,
  ordinance_no,
  submitted_to_dotr,
  date_submitted,
  crowded_streets,
  signs_cm_brgy_road,
  signs_provincial_road,
  signs_national_road,
  inventory_of_roads,
  data_collected_road_crash,
  data_submission_driver,
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
const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''
const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

const uniqueSorted = (values) =>
  [...new Set(values.map(normalizeOption).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

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

  const total = rows.reduce((sum, row) => sum + getRoadSafetyScore(row), 0)
  return Number((total / rows.length).toFixed(1))
}

const sortLocationScores = (rows) =>
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
    const status = getRoadSafetyStatus(row)
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})

const ROAD_SAFETY_STATUS_SERIES = [
  { label: 'Compliance' },
  { label: 'Non Compliance' },
]

const countCompliantLgus = (rows, fieldKey) =>
  uniqueRowsBy(
    rows.filter((row) => isRoadSafetyCompliantValue(row[fieldKey])),
    (row) => row.lgu_id || row.id,
  ).length

const hasRequiredPeriod = (filters = {}) => Boolean(filters.year && filters.quarter)

const getStatusLocationKey = (row, filters = {}) => {
  if (filters.province) {
    return normalizeOption(row.city_mun_name) || normalizeOption(row.province_huc)
  }

  return normalizeOption(row.province_huc)
}

const buildStatusByProvince = (locationRows, rows, filters = {}) => {
  const shouldUseCityLevel = Boolean(filters.province && !isHucProvinceOption(filters.province))
  const locations = filters.province
    ? uniqueSorted(
        locationRows
          .map((row) => row.city_mun_name || row.province_huc)
          .filter((location) => !shouldUseCityLevel || normalizeText(location) !== normalizeText(filters.province)),
      ).map((city) => ({
        label: city,
        province: filters.province,
        city: shouldUseCityLevel ? city : '',
      }))
    : uniqueSorted(locationRows.map((row) => row.province_huc)).map((province) => ({
        label: province,
        province,
        city: '',
      }))
  const countsByProvince = new Map(
    locations.map((location) => [
      normalizeText(location.label),
      ROAD_SAFETY_STATUS_SERIES.reduce(
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
    const status = getRoadSafetyStatus(row)

    if (!locationKey || !countsByProvince.has(locationKey) || countsByProvince.get(locationKey)[status] === undefined) {
      return
    }

    countsByProvince.get(locationKey)[status] += 1
  })

  return locations.map((location) => ({
    ...location,
    counts: countsByProvince.get(normalizeText(location.label)),
  }))
}

const getSelectedIncomeClass = (rows, filters = {}) => {
  const rowsWithIncomeClass = rows.filter((row) => normalizeOption(row.income_class))

  if (filters.city) {
    const cityRow = rowsWithIncomeClass.find(
      (row) =>
        normalizeText(row.city_mun_name) === normalizeText(filters.city) &&
        isBlank(row.barangay_name) &&
        normalizeText(row.lgu_type) !== 'barangay',
    )

    if (cityRow) {
      return normalizeOption(cityRow.income_class)
    }
  }

  if (filters.province) {
    const provinceHucRow = rowsWithIncomeClass.find((row) => {
      const lguType = normalizeText(row.lgu_type)

      return (
        normalizeText(row.province_huc) === normalizeText(filters.province) &&
        isBlank(row.barangay_name) &&
        (lguType === 'province' || lguType === 'huc' || isBlank(row.city_mun_name))
      )
    })

    if (provinceHucRow) {
      return normalizeOption(provinceHucRow.income_class)
    }
  }

  return uniqueSorted(rowsWithIncomeClass.map((row) => row.income_class))[0] || 'N/A'
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

function flattenRoadSafetyRow(row) {
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

async function getRoadSafetyRows(filters = {}, includeLocation = true) {
  if (!hasRequiredPeriod(filters)) {
    return []
  }

  const lguIds = includeLocation ? await getFilteredLguIds(filters) : null
  const rows = await fetchAllPages(() => {
    let query = supabase.from('road_safety_compliance').select(ROAD_SAFETY_DETAIL_SELECT)
    query = applyTemporalFilters(query, filters)
    return query
  })
  const flattenedRows = rows.map(flattenRoadSafetyRow)

  if (!includeLocation) {
    return flattenedRows
  }

  return flattenedRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
}

export async function getRoadSafetyGeoOptions() {
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
        .from('road_safety_compliance')
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

export async function getOverviewRoadSafetyStats(filters = {}) {
  if (!hasRequiredPeriod(filters)) {
    return {
      mode: 'message',
      message: 'Select a year and quarter to load Road Class & Safety data.',
    }
  }

  const rows = await getRoadSafetyRows(filters)
  const level = filters.city ? 'city' : 'province'
  const statusCounts = getStatusCounts(rows)

  if (level !== 'province' && filters.quarter) {
    return {
      mode: 'status',
      status: getRoadSafetyStatus(getLatestRecord(rows)),
    }
  }

  return {
    mode: 'counts',
    cards: [
      { title: 'Compliance', value: statusCounts.Compliance ?? 0 },
      { title: 'Non Compliance', value: statusCounts['Non Compliance'] ?? 0 },
      { title: 'Avg Score', value: rows.length ? `${averageScore(rows)}/${ROAD_SAFETY_FIELDS.length}` : 'N/A' },
    ],
  }
}

export async function getRoadSafetySummary(filters = {}) {
  const rows = await getRoadSafetyRows(filters)
  const statusCounts = getStatusCounts(rows)

  return {
    totalRecords: rows.length,
    uniqueLguCount: new Set(rows.map((row) => row.lgu_id).filter(Boolean)).size,
    averageScore: averageScore(rows),
    statusCounts,
    selectedYear: filters.year || 'All Years',
    selectedQuarter: filters.quarter ? `Q${filters.quarter}` : 'All Quarters',
  }
}

export async function getRoadSafetyDocumentCompletion(filters = {}) {
  const rows = await getRoadSafetyRows(filters)
  const totalRecords = rows.length

  return ROAD_SAFETY_FIELDS.map((field) => {
    const complete = rows.filter((row) => isRoadSafetyCompliantValue(row[field.key])).length
    const missing = Math.max(totalRecords - complete, 0)

    return {
      ...field,
      complete,
      missing,
      percentage: roundPercentage(complete, totalRecords),
    }
  })
}

export async function getRoadSafetyLocationStats(filters = {}) {
  const geoRows = await getFilteredGeoRows(filters)
  const lguIds = uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
  const detailRows = await getRoadSafetyRows({ ...filters, province: '', city: '' }, false)
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
  const scopedPopulation = provinceHucPopulationRows.length
    ? provinceHucPopulationRows.reduce((sum, row) => sum + (toNumber(row.population_2024) ?? 0), 0)
    : totalPopulation

  return {
    level: filters.province ? 'province' : 'all',
    cards: [
      {
        title: 'Population',
        value: formatNumber(scopedPopulation),
        info: 'Population data is from year 2024.',
      },
      { title: 'No of LGUs', value: new Set(filteredDetailRows.map((row) => row.lgu_id).filter(Boolean)).size },
      { title: 'With Ordinances on Speed Limit', value: countCompliantLgus(filteredDetailRows, 'speed_limit_ordinance') },
      { title: 'LGUs with Crowded Streets', value: countCompliantLgus(filteredDetailRows, 'crowded_streets') },
    ],
  }
}

export async function getRoadSafetyProvinceFieldCounts(filters = {}) {
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() =>
      supabase
        .from('lib_geographic_units')
        .select('province_huc')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false }),
    ),
    getRoadSafetyRows({ year: filters.year, quarter: filters.quarter }, false),
  ])
  const provinceHucs = uniqueSorted(geoRows.map((row) => row.province_huc))
  const rowsByProvince = detailRows.reduce((groups, row) => {
    const province = normalizeOption(row.province_huc)

    if (!province) {
      return groups
    }

    if (!groups[province]) {
      groups[province] = []
    }

    groups[province].push(row)
    return groups
  }, {})

  return provinceHucs.map((province) => ({
    province,
    label: province,
    counts: {
      speed_limit_ordinance: countCompliantLgus(rowsByProvince[province] ?? [], 'speed_limit_ordinance'),
      submitted_to_dotr: countCompliantLgus(rowsByProvince[province] ?? [], 'submitted_to_dotr'),
      crowded_streets: countCompliantLgus(rowsByProvince[province] ?? [], 'crowded_streets'),
      signs_cm_brgy_road: countCompliantLgus(rowsByProvince[province] ?? [], 'signs_cm_brgy_road'),
      signs_provincial_road: countCompliantLgus(rowsByProvince[province] ?? [], 'signs_provincial_road'),
      signs_national_road: countCompliantLgus(rowsByProvince[province] ?? [], 'signs_national_road'),
      inventory_of_roads: countCompliantLgus(rowsByProvince[province] ?? [], 'inventory_of_roads'),
      data_collected_road_crash: countCompliantLgus(rowsByProvince[province] ?? [], 'data_collected_road_crash'),
    },
  }))
}

export async function getRoadSafetyRoadCrashByProvince(filters = {}) {
  const fieldCounts = await getRoadSafetyProvinceFieldCounts(filters)

  return fieldCounts.map((item) => ({
    ...item,
    collected: item.counts.data_collected_road_crash,
  }))
}

export async function getRoadSafetyScoreByProvince(filters = {}) {
  const useCityLevel = Boolean(filters.province && !isHucProvinceOption(filters.province))
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
    getRoadSafetyRows({ year: filters.year, quarter: filters.quarter }, false),
  ])

  const locations = useCityLevel
    ? uniqueSorted(
        geoRows
          .map((row) => row.city_mun_name)
          .filter((city) => normalizeText(city) !== normalizeText(filters.province)),
      )
    : uniqueSorted(geoRows.map((row) => row.province_huc))
  const scoresByLocation = detailRows.reduce((groups, row) => {
    if (useCityLevel && normalizeText(row.province_huc) !== normalizeText(filters.province)) {
      return groups
    }

    if (useCityLevel && normalizeText(row.city_mun_name) === normalizeText(row.province_huc)) {
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

    groups[location].push(row)
    return groups
  }, {})

  return sortLocationScores(
    locations.map((location) => ({
      province: location,
      label: location,
      city: useCityLevel ? location : '',
      averageScore: averageScore(scoresByLocation[location] ?? []),
    })),
  )
}

export async function getRoadSafetyStatusByProvince(filters = {}) {
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
    getRoadSafetyRows(filters),
  ])

  return buildStatusByProvince(geoRows, detailRows, filters)
}

export async function getRoadSafetyQuarterlyTrend(filters = {}) {
  const quarterlyTrendFilters = { ...filters, quarter: '' }
  const rows = await getRoadSafetyRows(quarterlyTrendFilters)

  return [1, 2, 3, 4].map((quarter) => {
    const quarterRows = rows.filter((item) => Number(item.quarter) === quarter)

    return {
      quarter,
      averageScore: averageScore(quarterRows),
    }
  })
}

export async function getRoadSafetyTable(filters = {}) {
  const page = Number(filters.page ?? 0)
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE)
  const from = page * pageSize
  const to = from + pageSize - 1
  const rows = await getRoadSafetyRows(filters)
  const filteredRows = rows.filter((row) => {
    if (!isRoadSafetyCompliantValue(row.speed_limit_ordinance)) {
      return false
    }

    if (filters.status && getRoadSafetyStatus(row) !== filters.status) {
      return false
    }

    return true
  }).sort((left, right) => {
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
