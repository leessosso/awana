import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useTrackSearch } from '../../analytics'

interface SearchFormProps {
  onSearch: (query: string, filters?: Record<string, unknown>) => void
  placeholder?: string
  filters?: {
    key: string
    label: string
    options: { value: string; label: string }[]
  }[]
  className?: string
}

export function SearchForm({
  onSearch,
  placeholder = '검색어를 입력하세요',
  filters = [],
  className = '',
}: SearchFormProps) {
  const trackSearch = useTrackSearch()
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query, activeFilters)
    // Google Analytics: 검색 이벤트 추적
    if (query.trim()) {
      trackSearch(query.trim())
    }
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
  }

  const clearFilters = () => {
    setActiveFilters({})
    setQuery('')
    onSearch('', {})
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit">검색</Button>
        {filters.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            필터
          </Button>
        )}
      </form>

      {filters.length > 0 && showFilters && (
        <div className="bg-muted p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) =>
                    handleFilterChange(filter.key, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">전체</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              필터 초기화
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
