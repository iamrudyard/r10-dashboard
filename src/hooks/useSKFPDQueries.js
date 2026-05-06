import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getOverviewSKFPDStats,
  getSKFPDDocumentCompletion,
  getSKFPDGeoOptions,
  getSKFPDLocationStats,
  getSKFPDQuarterlyTrend,
  getSKFPDScoreByProvince,
  getSKFPDStatusByProvince,
  getSKFPDSummary,
  getSKFPDTable,
} from '../services/skfpdService'

const QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

const hasLocationFilter = (filters) =>
  Boolean(filters.province || filters.city || filters.barangay)

export function useSKFPDGeoOptions() {
  return useQuery({
    queryKey: ['skfpd-geo-options'],
    queryFn: getSKFPDGeoOptions,
    ...QUERY_OPTIONS,
  })
}

export function useOverviewSKFPDStats(filters, options = {}) {
  const enabled = options.enabled ?? true
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'overview-skfpd-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getOverviewSKFPDStats(filters),
    enabled: enabled && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDSummary(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'skfpd-summary',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getSKFPDSummary(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDDocumentCompletion(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'skfpd-document-completion',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getSKFPDDocumentCompletion(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDLocationStats(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'skfpd-location-stats',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getSKFPDLocationStats(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDScoreByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: ['skfpd-score-by-province', filters.year, filters.quarter, filters.province, filters.city],
    queryFn: () => getSKFPDScoreByProvince(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDStatusByProvince(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'skfpd-status-by-province',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getSKFPDStatusByProvince(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDQuarterlyTrend(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'skfpd-quarterly-trend',
      filters.year,
      filters.province,
      filters.city,
      filters.barangay,
    ],
    queryFn: () => getSKFPDQuarterlyTrend(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    ...QUERY_OPTIONS,
  })
}

export function useSKFPDTable(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'skfpd-table',
      filters.year,
      filters.quarter,
      filters.province,
      filters.city,
      filters.barangay,
      filters.status,
      filters.page,
      filters.pageSize,
    ],
    queryFn: () => getSKFPDTable(filters),
    enabled: requireLocation ? hasLocationFilter(filters) : true,
    placeholderData: keepPreviousData,
    ...QUERY_OPTIONS,
  })
}
