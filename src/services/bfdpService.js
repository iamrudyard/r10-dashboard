import { supabase } from '../lib/supabaseClient'
import { DOCUMENT_FIELDS } from '../utils/bfdpAnalytics'

const OPTION_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 25
const STATUS_LABELS = {
  full: 'Full Compliant',
  partial: 'Partial Compliant',
  none: 'None Compliant',
}
const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']

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

const percentageValue = (row) =>
  toNumber(
    row.percentage ??
      row.completion_percentage ??
      row.percent_complete ??
      row.completion_rate ??
      row.rate,
  ) ?? 0

const roundPercentage = (complete, total) => {
  if (!total) {
    return 0
  }

  return Number(((complete / total) * 100).toFixed(1))
}

const getFirstExistingValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key]
    }
  }

  return null
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

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''

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
        counts[group] += 1
      }

      return counts
    },
    { full: 0, partial: 0, none: 0 },
  )

const BFDP_STATUS_SERIES = [
  { group: 'full', label: STATUS_LABELS.full },
  { group: 'partial', label: STATUS_LABELS.partial },
  { group: 'none', label: STATUS_LABELS.none },
]

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

const getStatusLocationKey = (row, filters = {}) => {
  if (filters.locationLevel === 'city') {
    return normalizeOption(row.city_mun_name) || normalizeOption(row.province_huc)
  }

  return normalizeOption(row.province_huc)
}

const buildStatusByProvince = (locationRows, rows, filters = {}) => {
  const locations = filters.locationLevel === 'city'
    ? uniqueSorted(locationRows.map((row) => row.city_mun_name)).map((city) => ({
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
      BFDP_STATUS_SERIES.reduce(
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
    const status = BFDP_STATUS_SERIES.find((item) => item.group === group)

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

function applyCommonFilters(query, filters = {}, includeLocation = true) {
  if (filters.year) {
    query = query.eq('year', Number(filters.year))
  }

  if (filters.quarter) {
    query = query.eq('quarter', Number(filters.quarter))
  }

  if (includeLocation && filters.province) {
    query = query.eq('province_huc', filters.province)
  }

  if (includeLocation && filters.city) {
    query = query.eq('city_mun_name', filters.city)
  }

  if (includeLocation && filters.barangay) {
    query = query.eq('barangay_name', filters.barangay)
  }

  return query
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

export async function getGeoOptions() {
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
        .from('bfdp')
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

export async function getOverviewLocationStats(filters = {}) {
  const geoRows = await fetchAllPages(() => {
    let query = supabase
      .from('lib_geographic_units')
      .select(
        'id, psgc_code, province_huc, city_mun_name, barangay_name, income_class, lgu_type, urban_rural_type, population_2024',
      )
      .order('province_huc', { ascending: true, nullsFirst: false })
      .order('city_mun_name', { ascending: true, nullsFirst: false })
      .order('barangay_name', { ascending: true, nullsFirst: false })

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
  })

  const uniqueGeoRows = uniqueRowsBy(
    geoRows,
    (row) => row.psgc_code || `${row.province_huc}-${row.city_mun_name}-${row.barangay_name}`,
  )
  const level = filters.barangay ? 'barangay' : filters.city ? 'city' : 'province'
  const barangayRows = uniqueGeoRows.filter((row) => normalizeOption(row.barangay_name))
  const barangayCount = uniqueRowsBy(
    barangayRows,
    (row) => row.psgc_code || `${row.city_mun_name}-${row.barangay_name}`,
  ).length
  const municipalityCount = uniqueSorted(uniqueGeoRows.map((row) => row.city_mun_name)).length

  if (level === 'barangay') {
    const selectedBarangay = uniqueGeoRows.find(
      (row) =>
        normalizeText(row.barangay_name) === normalizeText(filters.barangay) &&
        (!filters.city || normalizeText(row.city_mun_name) === normalizeText(filters.city)),
    ) ?? uniqueGeoRows[0] ?? {}

    return {
      level,
      cards: [
        {
          title: 'Population',
          value: getLocationPopulation(selectedBarangay),
          info: 'Population data is from year 2024.',
        },
        { title: 'Type', value: selectedBarangay.urban_rural_type || selectedBarangay.lgu_type || 'N/A' },
        { title: 'PSGC Code', value: selectedBarangay.psgc_code || 'N/A' },
      ],
    }
  }

  if (level === 'city') {
    const selectedCity = uniqueGeoRows.find(
      (row) =>
        normalizeText(row.city_mun_name) === normalizeText(filters.city) &&
        isBlank(row.barangay_name),
    ) ?? uniqueGeoRows[0] ?? {}

    return {
      level,
      cards: [
        {
          title: 'Population',
          value: getLocationPopulation(selectedCity, uniqueGeoRows),
          info: 'Population data is from year 2024.',
        },
        { title: 'Income Class', value: selectedCity.income_class || getSelectedIncomeClass(uniqueGeoRows, filters) },
        { title: 'No. of Barangays', value: barangayCount },
      ],
    }
  }

  const selectedProvince = uniqueGeoRows.find((row) => {
    const lguType = normalizeText(row.lgu_type)

    return (
      normalizeText(row.province_huc) === normalizeText(filters.province) &&
      isBlank(row.barangay_name) &&
      (isBlank(row.city_mun_name) || lguType === 'province' || lguType === 'huc')
    )
  }) ?? uniqueGeoRows[0] ?? {}

  return {
    level,
    cards: isHucProvinceOption(filters.province) ? [
      {
        title: 'Population',
        value: getLocationPopulation(selectedProvince, uniqueGeoRows),
        info: 'Population data is from year 2024.',
      },
      { title: 'Income Class', value: selectedProvince.income_class || getSelectedIncomeClass(uniqueGeoRows, filters) },
      { title: 'No. of Barangays', value: barangayCount },
    ] : [
      {
        title: 'Population',
        value: getLocationPopulation(selectedProvince, uniqueGeoRows),
        info: 'Population data is from year 2024.',
      },
      { title: 'Income Class', value: selectedProvince.income_class || getSelectedIncomeClass(uniqueGeoRows, filters) },
      { title: 'No. of Municipality', value: municipalityCount },
      { title: 'No. of Barangays', value: barangayCount },
    ],
  }
}

export async function getOverviewBFDPStats(filters = {}) {
  const rows = await fetchAllPages(() => {
    let query = supabase
      .from('v_bfdp_details')
      .select('id, province_huc, city_mun_name, barangay_name, year, quarter, status')
    query = applyCommonFilters(query, filters)
    return query
  })
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
    cards: [
      { title: STATUS_LABELS.full, value: statusCounts.full },
      { title: STATUS_LABELS.partial, value: statusCounts.partial },
      { title: STATUS_LABELS.none, value: statusCounts.none },
    ],
  }
}

export async function getBFDPSummary(filters = {}) {
  const rows = await fetchAllPages(() => {
    let query = supabase.from('v_bfdp_summary_by_status').select('*')
    query = applyCommonFilters(query, filters)
    return query
  })
  const statusCounts = rows.reduce((counts, row) => {
    const status =
      getFirstExistingValue(row, ['status', 'compliance_status', 'status_name']) || 'No Status'
    const count =
      toNumber(getFirstExistingValue(row, ['record_count', 'count', 'total_records', 'total'])) ?? 0

    counts[status] = (counts[status] ?? 0) + count
    return counts
  }, {})

  const totalRecords =
    toNumber(getFirstExistingValue(rows[0] ?? {}, ['grand_total', 'total_all_records'])) ??
    Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

  const uniqueLguCount =
    toNumber(getFirstExistingValue(rows[0] ?? {}, ['unique_lgu_count', 'lgu_count', 'total_lgus'])) ??
    'N/A'

  const averageScore =
    toNumber(getFirstExistingValue(rows[0] ?? {}, ['average_score', 'avg_score', 'score_avg'])) ??
    null

  // TODO: Confirm canonical status labels in v_bfdp_summary_by_status if production labels differ.
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
    selectedYear: filters.year || 'All Years',
    selectedQuarter: filters.quarter ? `Q${filters.quarter}` : 'All Quarters',
  }
}

export async function getBFDPDocumentCompletion(filters = {}) {
  const rows = await fetchAllPages(() => {
    let query = supabase.from('v_bfdp_document_completion').select('*')
    query = applyCommonFilters(query, filters)
    return query
  })

  const totalRecords = rows.reduce(
    (sum, row) => sum + (toNumber(getFirstExistingValue(row, ['total_records', 'total'])) ?? 0),
    0,
  )

  const hasWideCompletionColumns = rows.some((row) =>
    DOCUMENT_FIELDS.some((field) => row[`${field.key}_completed`] !== undefined),
  )

  if (hasWideCompletionColumns) {
    return DOCUMENT_FIELDS.map((field) => {
      const complete = rows.reduce(
        (sum, row) => sum + (toNumber(row[`${field.key}_completed`]) ?? 0),
        0,
      )
      const missing = Math.max(totalRecords - complete, 0)

      return {
        ...field,
        complete,
        missing,
        percentage: roundPercentage(complete, totalRecords),
      }
    })
  }

  return DOCUMENT_FIELDS.map((field) => {
    const row = rows.find((item) => {
      const documentKey = getFirstExistingValue(item, [
        'document_key',
        'field_name',
        'document_field',
        'document',
        'label',
      ])

      return documentKey === field.key || documentKey === field.label
    })

    return {
      ...field,
      complete: toNumber(getFirstExistingValue(row ?? {}, ['complete', 'true_count', 'submitted'])) ?? 0,
      missing: toNumber(getFirstExistingValue(row ?? {}, ['missing', 'false_count', 'not_submitted'])) ?? 0,
      percentage: percentageValue(row ?? {}),
    }
  })
}

export async function getBFDPLocationStats(filters = {}) {
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() => {
      let query = supabase
        .from('lib_geographic_units')
        .select(
          'id, psgc_code, province_huc, city_mun_name, barangay_name, income_class, lgu_type, urban_rural_type, population_2024',
        )
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })
        .order('barangay_name', { ascending: true, nullsFirst: false })

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
    }),
    fetchAllPages(() => {
      let query = supabase
        .from('v_bfdp_details')
        .select(
          'id, psgc_code, province_huc, city_mun_name, barangay_name, income_class, urban_rural_type, population_2024, bfr, brgy_budget, summary_income, ira_nta_utilization, annual_procurement_plan, notice_of_award, month_1st, month_2nd, month_3rd, score, quarter, year, status',
        )
      query = applyCommonFilters(query, filters)
      return query
    }),
  ])

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
  const locationRow = uniqueGeoRows[0] ?? detailRows[0] ?? {}

  const statusCounts = getStatusCounts(detailRows)

  const passedCount = detailRows.reduce(
    (sum, row) => sum + DOCUMENT_FIELDS.filter((field) => row[field.key] === true).length,
    0,
  )
  const failedCount = detailRows.reduce(
    (sum, row) => sum + DOCUMENT_FIELDS.filter((field) => row[field.key] === false).length,
    0,
  )
  const latestRecord = getLatestRecord(detailRows)

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
        { title: STATUS_LABELS.full, value: statusCounts.full },
        { title: STATUS_LABELS.partial, value: statusCounts.partial },
        { title: STATUS_LABELS.none, value: statusCounts.none },
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
      { title: STATUS_LABELS.full, value: statusCounts.full },
      { title: STATUS_LABELS.partial, value: statusCounts.partial },
      { title: STATUS_LABELS.none, value: statusCounts.none },
    ],
  }
}

export async function getBFDPScoreByProvince(filters = {}) {
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() =>
      supabase
        .from('lib_geographic_units')
        .select('province_huc')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false }),
    ),
    fetchAllPages(() => {
      let query = supabase.from('v_bfdp_details').select('province_huc, score, year, quarter')
      // Keep this as a regional comparison: Year and Quarter affect the averages,
      // but location dropdowns should not collapse the chart below the 7 Province/HUC bars.
      query = applyCommonFilters(query, filters, false)
      return query.order('province_huc', { ascending: true, nullsFirst: false })
    }),
  ])

  const provinceHucs = uniqueSorted(geoRows.map((row) => row.province_huc))
  const scoresByProvince = detailRows.reduce((groups, row) => {
    const province = normalizeOption(row.province_huc) || 'Unspecified'

    if (!groups[province]) {
      groups[province] = []
    }

    groups[province].push(row.score)
    return groups
  }, {})

  return sortProvinceScores(
    provinceHucs.map((province) => ({
      province,
      averageScore: averageScore(scoresByProvince[province] ?? []),
    })),
  )
}

export async function getBFDPStatusByProvince(filters = {}) {
  const useCityLevel = Boolean(filters.city)
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() => {
      let query = supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })

      if (useCityLevel && filters.province) {
        query = query.eq('province_huc', filters.province)
      }

      if (useCityLevel) {
        query = query.not('city_mun_name', 'is', null)
      }

      return query
    }),
    fetchAllPages(() => {
      let query = supabase.from('v_bfdp_details').select('province_huc, city_mun_name, status, year, quarter')
      query = applyCommonFilters(query, {
        year: filters.year,
        quarter: filters.quarter,
        province: useCityLevel ? filters.province : '',
      })

      if (useCityLevel) {
        query = query.not('city_mun_name', 'is', null)
      }

      return query.order('province_huc', { ascending: true, nullsFirst: false })
    }),
  ])

  return buildStatusByProvince(geoRows, detailRows, {
    ...filters,
    locationLevel: useCityLevel ? 'city' : 'province',
  })
}

export async function getBFDPQuarterlyTrend(filters = {}) {
  const quarterlyTrendFilters = { ...filters, quarter: '' }

  const rows = await fetchAllPages(() => {
    let query = supabase
      .from('v_bfdp_details')
      .select('province_huc, city_mun_name, barangay_name, score, year, quarter')
    query = applyCommonFilters(query, quarterlyTrendFilters)
    return query.order('quarter', { ascending: true, nullsFirst: false })
  })

  return [1, 2, 3, 4].map((quarter) => {
    const quarterRows = rows.filter((item) => Number(item.quarter) === quarter)

    return {
      quarter,
      averageScore: averageScore(quarterRows.map((row) => row.score)),
    }
  })
}

export async function getBFDPTable(filters = {}) {
  const page = Number(filters.page ?? 0)
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE)
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('v_bfdp_details').select('*', { count: 'exact' })
  query = applyCommonFilters(query, filters)

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
    .order('province_huc', { ascending: true, nullsFirst: false })
    .order('city_mun_name', { ascending: true, nullsFirst: false })
    .order('barangay_name', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (error) {
    throw error
  }

  return {
    rows: data ?? [],
    count: count ?? 0,
  }
}
