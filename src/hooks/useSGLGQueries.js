import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getSGLGDashboard, getSGLGGeoOptions, getSGLGTable } from '../services/sglgService'

const QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

export function useSGLGGeoOptions() {
  return useQuery({
    queryKey: ['sglg-geo-options'],
    queryFn: getSGLGGeoOptions,
    ...QUERY_OPTIONS,
  })
}

export function useSGLGDashboard(filters, options = {}) {
  const enabled = options.enabled ?? true

  return useQuery({
    queryKey: ['sglg-dashboard', filters.year, filters.province, filters.city],
    queryFn: () => getSGLGDashboard(filters),
    enabled,
    ...QUERY_OPTIONS,
  })
}

export function useSGLGTable(filters) {
  return useQuery({
    queryKey: ['sglg-table', filters.year, filters.province, filters.city, filters.page, filters.pageSize],
    queryFn: () => getSGLGTable(filters),
    placeholderData: keepPreviousData,
    ...QUERY_OPTIONS,
  })
}
