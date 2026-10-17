'use client'

import { useState, useCallback } from 'react'
import { EVENT_CATEGORIES, TECH_TAGS, EVENT_SOURCES } from '@/types'

interface FilterBarProps {
  onFiltersChange: (filters: {
    search: string
    category: string
    source: string
    tag: string
    isOnline: string
  }) => void
  totalCount: number
  filteredCount: number
}

export default function FilterBar({ onFiltersChange, totalCount, filteredCount }: FilterBarProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [source, setSource] = useState('')
  const [tag, setTag] = useState('')
  const [isOnline, setIsOnline] = useState('')

  const update = useCallback(
    (updates: Partial<{ search: string; category: string; source: string; tag: string; isOnline: string }>) => {
      const newFilters = { search, category, source, tag, isOnline, ...updates }
      onFiltersChange(newFilters)
    },
    [search, category, source, tag, isOnline, onFiltersChange]
  )

  function handleSearch(v: string) {
    setSearch(v)
    update({ search: v })
  }

  function handleCategory(v: string) {
    setCategory(v)
    update({ category: v })
  }

  function handleSource(v: string) {
    setSource(v)
    update({ source: v })
  }

  function handleTag(v: string) {
    const next = tag === v ? '' : v
    setTag(next)
    update({ tag: next })
  }

  function handleOnline(v: string) {
    setIsOnline(v)
    update({ isOnline: v })
  }

  function clearAll() {
    setSearch('')
    setCategory('')
    setSource('')
    setTag('')
    setIsOnline('')
    onFiltersChange({ search: '', category: '', source: '', tag: '', isOnline: '' })
  }

  const hasFilters = search || category || source || tag || isOnline
  const popularTags = ['AI', 'Startup', 'Tech', 'Hackathon', 'SaaS', 'Developer', 'Web3', 'DevOps']

  return (
    <div className="filter-bar" role="search" aria-label="Filter events">
      {/* Search + Dropdowns row */}
      <div className="filter-row">
        {/* Search */}
        <div className="search-wrapper">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="6.5" cy="6.5" r="5"/>
            <path d="M10.5 10.5L14 14"/>
          </svg>
          <input
            id="event-search"
            className="search-input"
            type="search"
            placeholder="Search events, organizers, venues..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            aria-label="Search events"
          />
        </div>

        <div className="filter-divider" />

        {/* Category */}
        <select
          id="filter-category"
          className="filter-select"
          value={category}
          onChange={e => handleCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {EVENT_CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>

        {/* Online/In-person */}
        <select
          id="filter-location-type"
          className="filter-select"
          value={isOnline}
          onChange={e => handleOnline(e.target.value)}
          aria-label="Filter by location type"
        >
          <option value="">All formats</option>
          <option value="false">In-person</option>
          <option value="true">Online</option>
        </select>

        {/* Source */}
        <select
          id="filter-source"
          className="filter-select"
          value={source}
          onChange={e => handleSource(e.target.value)}
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {EVENT_SOURCES.map(s => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll} aria-label="Clear all filters">
            Clear ✕
          </button>
        )}

        <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
          {filteredCount !== totalCount
            ? `${filteredCount} of ${totalCount} events`
            : `${totalCount} events`}
        </span>
      </div>

      {/* Tag chips row */}
      <div className="filter-row" role="group" aria-label="Filter by tag">
        <span className="filter-label">Tags:</span>
        {popularTags.map(t => (
          <span
            key={t}
            className={`tag-chip ${tag === t ? 'active' : ''}`}
            onClick={() => handleTag(t)}
            role="button"
            aria-pressed={tag === t}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleTag(t)}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
