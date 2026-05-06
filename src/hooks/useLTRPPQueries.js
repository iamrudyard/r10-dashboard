import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getLTRPPDocumentCompletion,
  getLTRPPGeoOptions,
  getLTRPPLocationStats,
  getLTRPPQuarterlyTrend,
  getLTRPPRemarks,
  getLTRPPScoreByProvince,
  getLTRPPStatusByProvince,
  getLTRPPSummary,
  getLTRPPTable,
  getOverviewLTRPPStats,
} from '../services/ltrppService'

const QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

const hasLocationFilter = (filters) => Boolean(filters.province || filters.city)

export function useLTRPPGeoOptions() {
  return useQuery({
    queryKey: ['ltrpp-geo-options'],
    queryFn: getLTRPPGeoOptions,
    ...QUERY_OPTIONS,
  })
}

export function useOverviewLTRPPStats(filters, options = {}) {
  const enabled = options.enabled ?? true
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'overview-ltrpp-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getOverviewLTRPPStats(filters),
    enabled: enabled && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPSummary(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-summary',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getLTRPPSummary(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPDocumentCompletion(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-document-completion',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getLTRPPDocumentCompletion(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPLocationStats(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-location-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getLTRPPLocationStats(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPScoreByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: ['ltrpp-score-by-province', filters.year, filters.quarter],
    queryFn: () => getLTRPPScoreByProvince(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPStatusByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-status-by-province',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getLTRPPStatusByProvince(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPQuarterlyTrend(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-quarterly-trend',
      filters.year,
      filters.province,
      filters.city,
    ],
    queryFn: () => getLTRPPQuarterlyTrend(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPRemarks(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-remarks',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
    ],
    queryFn: () => getLTRPPRemarks(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useLTRPPTable(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'ltrpp-table',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.status,
      filters.page,
      filters.pageSize,
    ],
    queryFn: () => getLTRPPTable(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    placeholderData: keepPreviousData,
    ...QUERY_OPTIONS,
  })
}
