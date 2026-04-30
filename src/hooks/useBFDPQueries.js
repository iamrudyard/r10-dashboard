import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getBFDPDocumentCompletion,
  getBFDPLocationStats,
  getBFDPQuarterlyTrend,
  getBFDPSummary,
  getBFDPScoreByProvince,
  getBFDPTable,
  getGeoOptions,
  getOverviewBFDPStats,
  getOverviewLocationStats,
} from '../services/bfdpService'

const QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

const hasLocationFilter = (filters) =>
  Boolean(filters.province || filters.city || filters.barangay)

export function useGeoOptions() {
  return useQuery({
    queryKey: ['geo-options'],
    queryFn: getGeoOptions,
    ...QUERY_OPTIONS,
  })
}

export function useOverviewLocationStats(filters) {
  return useQuery({
    queryKey: [
      'overview-location-stats',
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getOverviewLocationStats(filters),
    enabled: hasLocationFilter(filters),
    ...QUERY_OPTIONS,
  })
}

export function useOverviewBFDPStats(filters, options = {}) {
  const enabled = options.enabled ?? true

  return useQuery({
    queryKey: [
      'overview-bfdp-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getOverviewBFDPStats(filters),
    enabled: enabled && hasLocationFilter(filters),
    ...QUERY_OPTIONS,
  })
}

export function useBFDPSummary(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'bfdp-summary',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getBFDPSummary(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useBFDPDocumentCompletion(filters) {
  return useQuery({
    queryKey: [
      'bfdp-document-completion',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getBFDPDocumentCompletion(filters),
    enabled: hasLocationFilter(filters),
    ...QUERY_OPTIONS,
  })
}

export function useBFDPLocationStats(filters) {
  return useQuery({
    queryKey: [
      'bfdp-location-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getBFDPLocationStats(filters),
    enabled: hasLocationFilter(filters),
    ...QUERY_OPTIONS,
  })
}

export function useBFDPScoreByProvince(filters) {
  return useQuery({
    queryKey: ['bfdp-score-by-province', filters.year, filters.quarter],
    queryFn: () => getBFDPScoreByProvince(filters),
    enabled: hasLocationFilter(filters),
    ...QUERY_OPTIONS,
  })
}

export function useBFDPQuarterlyTrend(filters) {
  return useQuery({
    queryKey: [
      'bfdp-quarterly-trend',
      filters.year,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getBFDPQuarterlyTrend(filters),
    enabled: hasLocationFilter(filters),
    ...QUERY_OPTIONS,
  })
}

export function useBFDPTable(filters) {
  return useQuery({
    queryKey: [
      'bfdp-table',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
      filters.page,
      filters.pageSize,
    ],
    queryFn: () => getBFDPTable(filters),
    enabled: hasLocationFilter(filters),
    placeholderData: keepPreviousData,
    ...QUERY_OPTIONS,
  })
}
