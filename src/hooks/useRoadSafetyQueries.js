import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getOverviewRoadSafetyStats,
  getRoadSafetyDocumentCompletion,
  getRoadSafetyGeoOptions,
  getRoadSafetyLocationStats,
  getRoadSafetyProvinceFieldCounts,
  getRoadSafetyQuarterlyTrend,
  getRoadSafetyRoadCrashByProvince,
  getRoadSafetyScoreByProvince,
  getRoadSafetyStatusByProvince,
  getRoadSafetySummary,
  getRoadSafetyTable,
} from '../services/roadSafetyService'

const QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

const hasLocationFilter = (filters) => Boolean(filters.province || filters.city)
const hasRequiredPeriod = (filters) => Boolean(filters.year && filters.quarter)

export function useRoadSafetyGeoOptions() {
  return useQuery({
    queryKey: ['road-safety-geo-options'],
    queryFn: getRoadSafetyGeoOptions,
    ...QUERY_OPTIONS,
  })
}

export function useOverviewRoadSafetyStats(filters, options = {}) {
  const enabled = options.enabled ?? true
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'overview-road-safety-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getOverviewRoadSafetyStats(filters),
    enabled: enabled && hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetySummary(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'road-safety-summary',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getRoadSafetySummary(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyDocumentCompletion(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'road-safety-document-completion',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getRoadSafetyDocumentCompletion(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyLocationStats(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'road-safety-location-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getRoadSafetyLocationStats(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyScoreByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: ['road-safety-score-by-province', filters.year, filters.quarter, filters.province, filters.city],
    queryFn: () => getRoadSafetyScoreByProvince(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyProvinceFieldCounts(filters, options = {}) {
  const requireLocation = options.requireLocation ?? false

  return useQuery({
    queryKey: ['road-safety-province-field-counts', filters.year, filters.quarter],
    queryFn: () => getRoadSafetyProvinceFieldCounts(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyRoadCrashByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? false

  return useQuery({
    queryKey: ['road-safety-road-crash-by-province', filters.year, filters.quarter],
    queryFn: () => getRoadSafetyRoadCrashByProvince(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyStatusByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'road-safety-status-by-province',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getRoadSafetyStatusByProvince(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyQuarterlyTrend(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'road-safety-quarterly-trend',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getRoadSafetyQuarterlyTrend(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useRoadSafetyTable(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'road-safety-table',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.status,
      filters.fieldKey,
      filters.page,
      filters.pageSize,
    ],
    queryFn: () => getRoadSafetyTable(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    placeholderData: keepPreviousData,
    ...QUERY_OPTIONS,
  })
}
