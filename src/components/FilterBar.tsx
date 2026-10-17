'use client'

import { EVENT_CATEGORIES } from '@/types'

export interface Filters {
  search: string
  category: string
  source: string
  city: string
  tag: string
}
export const EMPTY_FILTERS: Filters = { search: '', category: '', source: '', city: '', tag: '' }

const TAGS = ['AI', 'Startup', 'Developer', 'Web3', 'Fintech', 'Cloud', 'SaaS']

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  sources: string[]
  cities: string[]
  shown: number
  total: number
}

export default function FilterBar({ filters, onChange, sources, cities, shown, total }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const active = Object.values(filters).some(Boolean)
  return (
    <div className="filter-bar" role="search" aria-label="Filter events">
      <div className="filter-row">
        <div className="search-wrapper">
          <input
            id="event-search"
            className="search-input"
            type="search"
            placeholder="Search events, organizers, venues..."
            value={filters.search}
            onChange={e => set({ search: e.target.value })}
            aria-label="Search events"
          />
        </div>
        <select className="filter-select" value={filters.category} onChange={e => set({ category: e.target.value })} aria-label="Category">
          <option value="">All categories</option>
          {EVENT_CATEGORIES.map(c => (
            <option key={c} value={c}>{c.replace('-', ' ')}</option>
          ))}
        </select>
        <select className="filter-select" value={filters.city} onChange={e => set({ city: e.target.value })} aria-label="City">
          <option value="">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={filters.source} onChange={e => set({ source: e.target.value })} aria-label="Source">
          <option value="">All sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {active && <button className="btn btn-ghost btn-sm" onClick={() => onChange(EMPTY_FILTERS)}>Clear</button>}
        <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
          {shown === total ? `${total} events` : `${shown} of ${total} events`}
        </span>
      </div>
      <div className="filter-row" role="group" aria-label="Filter by tag">
        <span className="filter-label">Tags:</span>
        {TAGS.map(t => (
          <button key={t} className={`tag-chip ${filters.tag === t ? 'active' : ''}`} aria-pressed={filters.tag === t} onClick={() => set({ tag: filters.tag === t ? '' : t })}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
