import { supabase } from '../lib/supabaseClient'
import {
  SGLG_FIELD_KEYS,
  SGLG_INDICATORS,
  getSGLGRequirementStats,
} from '../utils/sglgIndicators'

const OPTION_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 25

const normalizeOption = (value) => (typeof value === 'string' ? value.trim() : value)
const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''

const uniqueSorted = (values) =>
  [...new Set(values.map(normalizeOption).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const toBinary = (value) => {
  const number = Number(value)
  return number === 0 || number === 1 ? number : null
}

const roundPercentage = (complete, total) => {
  if (!total) {
    return 0
  }

  return Number(((complete / total) * 100).toFixed(1))
}

const getGeo = (row = {}) => row.lib_geographic_units ?? {}

const toNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : null
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

function applySGLGFilters(query, filters = {}) {
  if (filters.year) {
    query = query.eq('assessment_year', Number(filters.year))
  }

  if (filters.province) {
    query = query.eq('lib_geographic_units.province_huc', filters.province)
  }

  if (filters.city) {
    query = query.eq('lib_geographic_units.city_mun_name', filters.city)
  }

  return query
}

function isSelectedProvinceHucRow(row, province) {
  const geo = getGeo(row)
  const selectedProvince = normalizeText(province)
  const provinceHuc = normalizeText(geo.province_huc)
  const cityMunName = normalizeText(geo.city_mun_name)
  const lguType = normalizeText(geo.lgu_type)

  return (
    provinceHuc === selectedProvince &&
    (isBlank(geo.city_mun_name) ||
      cityMunName === selectedProvince ||
      lguType === 'province' ||
      lguType === 'huc' ||
      lguType.includes('highly urbanized'))
  )
}

function isProvinceHucPopulationRow(row) {
  const geo = getGeo(row)
  const provinceHuc = normalizeText(geo.province_huc)
  const cityMunName = normalizeText(geo.city_mun_name)
  const lguType = normalizeText(geo.lgu_type)

  return (
    isBlank(geo.city_mun_name) ||
    cityMunName === provinceHuc ||
    lguType === 'province' ||
    lguType === 'huc' ||
    lguType.includes('highly urbanized')
  )
}

async function getProvinceHucPopulationTotal() {
  const rows = await fetchAllPages(() =>
    supabase
      .from('lib_geographic_units')
      .select('province_huc, population_2024')
      .is('city_mun_name', null)
      .is('barangay_name', null),
  )

  const populationByProvinceHuc = rows.reduce((totals, row) => {
    const key = normalizeOption(row.province_huc)
    const population = toNumber(row.population_2024)

    if (key && population !== null && !totals.has(key)) {
      totals.set(key, population)
    }

    return totals
  }, new Map())

  return populationByProvinceHuc.size
    ? [...populationByProvinceHuc.values()].reduce((sum, population) => sum + population, 0)
    : null
}

function filterRowsBySpecificLgu(rows, filters = {}) {
  if (filters.city) {
    return rows.filter((row) => normalizeText(getGeo(row).city_mun_name) === normalizeText(filters.city))
  }

  if (filters.province) {
    return rows.filter((row) => isSelectedProvinceHucRow(row, filters.province))
  }

  return rows
}

function sortRowsByLocation(rows) {
  return [...rows].sort((left, right) => {
    const leftGeo = getGeo(left)
    const rightGeo = getGeo(right)

    return (
      normalizeOption(leftGeo.province_huc || '').localeCompare(
        normalizeOption(rightGeo.province_huc || ''),
      ) ||
      normalizeOption(leftGeo.city_mun_name || '').localeCompare(
        normalizeOption(rightGeo.city_mun_name || ''),
      )
    )
  })
}

function getSGLGSelect() {
  return `
    id,
    lgu_id,
    assessment_year,
    overall_rating,
    ${SGLG_FIELD_KEYS.join(',')},
    lib_geographic_units!inner(
      id,
      psgc_code,
      province_huc,
      city_mun_name,
      income_class,
      lgu_type,
      population_2024
    )
  `
}

function getRowsQuery() {
  return supabase.from('sglg').select(getSGLGSelect())
}

function getRatingGroup(value) {
  const normalized = normalizeText(value)

  if (normalized === 'passed' || normalized === 'passes') {
    return 'PASSED'
  }

  if (normalized === 'failed') {
    return 'FAILED'
  }

  return value ? normalizeOption(value) : 'No Rating'
}

function filterRowsByRating(rows, rating) {
  if (!rating) {
    return rows
  }

  const selectedRating = normalizeText(rating)

  return rows.filter((row) => normalizeText(getRatingGroup(row.overall_rating)) === selectedRating)
}

function getStatusCounts(rows) {
  return rows.reduce((counts, row) => {
    const status = getRatingGroup(row.overall_rating)
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

const SGLG_STATUS_SERIES = [
  { value: 'PASSED', label: 'PASSES' },
  { value: 'FAILED', label: 'FAILED' },
]

function getStatusLocationKey(row, filters = {}) {
  const geo = getGeo(row)

  if (filters.province) {
    return normalizeOption(geo.city_mun_name) || normalizeOption(geo.province_huc)
  }

  return normalizeOption(geo.province_huc)
}

function getProvinceStatusCounts(rows, filters = {}) {
  const locations = filters.province
    ? uniqueSorted(rows.map((row) => getStatusLocationKey(row, filters))).map((city) => ({
        label: city,
        province: filters.province,
        city,
      }))
    : uniqueSorted(rows.map((row) => getGeo(row).province_huc)).map((province) => ({
        label: province,
        province,
        city: '',
      }))
  const countsByProvince = new Map(
    locations.map((location) => [
      normalizeText(location.label),
      SGLG_STATUS_SERIES.reduce(
        (counts, status) => ({
          ...counts,
          [status.value]: 0,
        }),
        {},
      ),
    ]),
  )

  rows.forEach((row) => {
    const locationKey = normalizeText(getStatusLocationKey(row, filters))
    const status = getRatingGroup(row.overall_rating)

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

function getFieldStats(rows, key) {
  const assessedRows = rows.filter((row) => toBinary(row[key]) !== null)
  const pass = assessedRows.filter((row) => toBinary(row[key]) === 1).length
  const fail = assessedRows.filter((row) => toBinary(row[key]) === 0).length

  return {
    pass,
    fail,
    total: assessedRows.length,
    percentage: roundPercentage(pass, assessedRows.length),
  }
}

function buildAnalytics(rows, filters = {}) {
  const statusCounts = getStatusCounts(rows)
  const passedCount = statusCounts.PASSED ?? 0
  const failedCount = statusCounts.FAILED ?? 0
  const uniqueLguCount = new Set(rows.map((row) => row.lgu_id).filter(Boolean)).size
  const latestRecord = [...rows].sort((left, right) => {
    if ((right.assessment_year ?? 0) !== (left.assessment_year ?? 0)) {
      return (right.assessment_year ?? 0) - (left.assessment_year ?? 0)
    }

    return (right.id ?? 0) - (left.id ?? 0)
  })[0]

  const indicators = SGLG_INDICATORS.map((indicator) => {
    const statusStats = getFieldStats(rows, indicator.statusKey)
    const subIndicators = indicator.fields.map((field) => ({
      ...field,
      ...getFieldStats(rows, field.key),
      requirement: getSGLGRequirementStats(rows, indicator.key, field.key),
    }))
    const subIndicatorAverage = subIndicators.length
      ? Number(
          (
            subIndicators.reduce((sum, field) => sum + field.percentage, 0) /
            subIndicators.length
          ).toFixed(1),
        )
      : 0

    return {
      ...indicator,
      ...statusStats,
      subIndicators,
      subIndicatorAverage,
    }
  })

  const areaPassTotal = indicators.reduce((sum, indicator) => sum + indicator.pass, 0)
  const areaFailTotal = indicators.reduce((sum, indicator) => sum + indicator.fail, 0)
  const areaTotal = indicators.reduce((sum, indicator) => sum + indicator.total, 0)
  const latestGeo = getGeo(latestRecord)
  const populationByProvinceHuc = rows.reduce((totals, row) => {
    const geo = getGeo(row)
    const key = normalizeOption(geo.province_huc)
    const population = toNumber(getGeo(row).population_2024)

    if (key && population !== null && isProvinceHucPopulationRow(row) && !totals.has(key)) {
      totals.set(key, population)
    }

    return totals
  }, new Map())
  const totalPopulation = populationByProvinceHuc.size
    ? [...populationByProvinceHuc.values()].reduce((sum, population) => sum + population, 0)
    : null

  return {
    totalRecords: rows.length,
    uniqueLguCount,
    passedCount,
    failedCount,
    noRatingCount: rows.length - passedCount - failedCount,
    latestOverallRating: latestRecord?.overall_rating || 'No Rating',
    latestPopulation: toNumber(latestGeo.population_2024),
    totalPopulation,
    latestIncomeClass: latestGeo.income_class || 'N/A',
    areaPassTotal,
    areaFailTotal,
    overallPassRate: roundPercentage(passedCount, passedCount + failedCount),
    areaPassRate: roundPercentage(areaPassTotal, areaTotal),
    statusCounts,
    provinceStatusCounts: getProvinceStatusCounts(rows, filters),
    indicators,
  }
}

export async function getSGLGGeoOptions() {
  const [geoRows, yearRows] = await Promise.all([
    fetchAllPages(() =>
      supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name')
        .is('barangay_name', null)
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false }),
    ),
    fetchAllPages(() =>
      supabase
        .from('sglg')
        .select('assessment_year')
        .order('assessment_year', { ascending: false, nullsFirst: false }),
    ),
  ])

  return {
    provinces: uniqueSorted(geoRows.map((row) => row.province_huc)),
    locations: geoRows
      .filter((row) => {
        if (isBlank(row.city_mun_name)) {
          return false
        }

        return normalizeText(row.city_mun_name) !== normalizeText(row.province_huc)
      })
      .map((row) => ({
        province_huc: row.province_huc,
        city_mun_name: row.city_mun_name,
        barangay_name: '',
      })),
    years: [...new Set(yearRows.map((row) => row.assessment_year).filter(Boolean))].sort(
      (a, b) => b - a,
    ),
  }
}

export async function getSGLGDashboard(filters = {}) {
  const [rows, provinceHucPopulationTotal] = await Promise.all([
    fetchAllPages(() => {
      let query = getRowsQuery()
      query = applySGLGFilters(query, filters)
      return query.order('assessment_year', { ascending: false, nullsFirst: false })
    }),
    !filters.province && !filters.city ? getProvinceHucPopulationTotal() : Promise.resolve(null),
  ])

  const sortedRows = sortRowsByLocation(filterRowsByRating(filterRowsBySpecificLgu(rows, filters), filters.status))
  const analytics = buildAnalytics(sortedRows, filters)

  return {
    ...analytics,
    totalPopulation: provinceHucPopulationTotal ?? analytics.totalPopulation,
  }
}

export async function getSGLGTable(filters = {}) {
  const page = Number(filters.page ?? 0)
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE)
  const from = page * pageSize
  const to = from + pageSize

  const rows = await fetchAllPages(() => {
    let query = getRowsQuery()
    query = applySGLGFilters(query, filters)
    return query.order('assessment_year', { ascending: false, nullsFirst: false })
  })
  const filteredRows = sortRowsByLocation(filterRowsByRating(filterRowsBySpecificLgu(rows, filters), filters.status))

  return {
    rows: filteredRows.slice(from, to).map((row) => ({
      ...row,
      province_huc: getGeo(row).province_huc,
      city_mun_name: getGeo(row).city_mun_name,
      lgu_type: getGeo(row).lgu_type,
      psgc_code: getGeo(row).psgc_code,
    })),
    count: filteredRows.length,
  }
}

export function getSGLGRecordLabel(record = {}) {
  const geo = getGeo(record)
  const province = record.province_huc || geo.province_huc
  const city = record.city_mun_name || geo.city_mun_name

  if (normalizeText(province) === normalizeText(city) || !city) {
    return province || 'Unspecified LGU'
  }

  return `${city}, ${province}`
}
