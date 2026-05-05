import { useEffect, useMemo, useState } from 'react'
import { Card } from '@tremor/react'

const quarters = [
  { value: '1', label: 'Quarter 1' },
  { value: '2', label: 'Quarter 2' },
  { value: '3', label: 'Quarter 3' },
  { value: '4', label: 'Quarter 4' },
]

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function SelectField({ label, value, onChange, children, disabled }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {children}
      </select>
    </label>
  )
}

function SearchableSelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}) {
  const [search, setSearch] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setSearch(value)
  }, [value])

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return options
    }

    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, search])

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch)
    setIsOpen(true)

    if (!nextSearch) {
      onChange('')
    }
  }

  return (
    <label className="relative block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <div className="relative mt-1.5">
        <input
          type="search"
          value={search}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false)
              setSearch(value)
            }, 120)
          }}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        {value ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSearch('')
              onChange('')
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700"
            aria-label={`Clear ${label}`}
          >
            x
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSearch('')
              onChange('')
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-civic-50"
          >
            {placeholder}
          </button>
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearch(option)
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-civic-50 ${
                  option === value ? 'bg-civic-50 font-semibold text-civic-700' : 'text-slate-800'
                }`}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">No matching item found</div>
          )}
        </div>
      ) : null}
    </label>
  )
}

export default function LocationFilters({
  filters,
  onChange,
  geoOptions,
  optionsLoading = false,
  optionError = '',
  onRefresh,
  refreshDisabled = false,
  isRefreshing = false,
  includeBarangay = true,
  includeQuarter = true,
  includeMonth = false,
}) {
  const locations = geoOptions?.locations ?? []
  const provinceOptions = geoOptions?.provinces ?? []
  const yearOptions = geoOptions?.years ?? []

  const cityOptions = useMemo(() => {
    const filteredLocations = filters.provinceHuc
      ? locations.filter((item) => item.province_huc === filters.provinceHuc)
      : locations

    return [...new Set(filteredLocations.map((item) => item.city_mun_name).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    )
  }, [filters.provinceHuc, locations])

  const barangayOptions = useMemo(() => {
    const filteredLocations = locations.filter((item) => {
      if (filters.provinceHuc && item.province_huc !== filters.provinceHuc) {
        return false
      }

      if (filters.cityMunName && item.city_mun_name !== filters.cityMunName) {
        return false
      }

      return true
    })

    return [...new Set(filteredLocations.map((item) => item.barangay_name).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    )
  }, [filters.provinceHuc, filters.cityMunName, locations])

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value }

    if (key === 'provinceHuc') {
      nextFilters.cityMunName = ''
      if (includeBarangay) {
        nextFilters.barangayName = ''
      }
    }

    if (includeBarangay && key === 'cityMunName') {
      nextFilters.barangayName = ''
    }

    if (key === 'quarter' && value) {
      nextFilters.month = ''
    }

    if (key === 'month' && value) {
      nextFilters.quarter = ''
    }

    onChange(nextFilters)
  }

  return (
    <Card className="border border-slate-200 bg-white p-3 shadow-panel md:p-4">
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              provinceHuc: '',
              cityMunName: '',
              year: '',
              ...(includeBarangay ? { barangayName: '' } : {}),
              ...(includeQuarter ? { quarter: '' } : {}),
              ...(includeMonth ? { month: '' } : {}),
            })
          }
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshDisabled || isRefreshing}
          className="rounded-lg bg-civic-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {optionError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {optionError}
        </div>
      ) : null}

      <div
        className={`grid gap-3 md:grid-cols-2 ${
          includeMonth
            ? 'xl:grid-cols-6'
            : includeBarangay && includeQuarter
              ? 'xl:grid-cols-5'
              : includeQuarter
                ? 'xl:grid-cols-4'
                : 'xl:grid-cols-3'
        }`}
      >
        <SelectField
          label="Province/HUC"
          value={filters.provinceHuc}
          disabled={optionsLoading}
          onChange={(value) => updateFilter('provinceHuc', value)}
        >
          <option value="">All Province/HUC</option>
          {provinceOptions.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </SelectField>

        <SearchableSelectField
          label="City/Municipality"
          value={filters.cityMunName}
          options={cityOptions}
          placeholder="All City/Municipality"
          onChange={(value) => updateFilter('cityMunName', value)}
        />

        {includeBarangay ? (
          <SearchableSelectField
            label="Barangay"
            value={filters.barangayName}
            options={barangayOptions}
            placeholder="All Barangays"
            onChange={(value) => updateFilter('barangayName', value)}
          />
        ) : null}

        <SelectField label="Year" value={filters.year} onChange={(value) => updateFilter('year', value)}>
          <option value="">All Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>

        {includeQuarter ? (
          <SelectField
            label="Quarter"
            value={filters.quarter}
            disabled={Boolean(filters.month)}
            onChange={(value) => updateFilter('quarter', value)}
          >
            <option value="">All Quarters</option>
            {quarters.map((quarter) => (
              <option key={quarter.value} value={quarter.value}>
                {quarter.label}
              </option>
            ))}
          </SelectField>
        ) : null}

        {includeMonth ? (
          <SelectField
            label="Month"
            value={filters.month}
            disabled={Boolean(filters.quarter)}
            onChange={(value) => updateFilter('month', value)}
          >
            <option value="">All Months</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </SelectField>
        ) : null}
      </div>
    </Card>
  )
}
