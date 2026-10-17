import { describe, expect, it } from 'vitest'
import { detectCategory, detectCity, detectTags, isTargetEvent } from '@/lib/sources/classify'

describe('isTargetEvent', () => {
  it('keeps tech, AI, startup and hackathon events', () => {
    expect(isTargetEvent('AI Builders and Databases Dubai')).toBe(true)
    expect(isTargetEvent('UAE Founders Hackathon')).toBe(true)
    expect(isTargetEvent('GDG DevFest 2026')).toBe(true)
  })
  it('drops non-tech noise', () => {
    expect(isTargetEvent('MIRA Chess Tournament (Kids)')).toBe(false)
    expect(isTargetEvent('Sohum Open Mic | Music & More')).toBe(false)
    expect(isTargetEvent('Wealth creation masterclass')).toBe(false)
  })
  it('matches whole words only', () => {
    expect(isTargetEvent('Chair yoga morning')).toBe(false)
  })
})

describe('detectCategory', () => {
  it('maps keywords', () => {
    expect(detectCategory('Agentic AI Hackathon')).toBe('hackathon')
    expect(detectCategory('Cloud workshop')).toBe('workshop')
    expect(detectCategory('MENA SaaS Summit')).toBe('conference')
    expect(detectCategory('Something else')).toBe('other')
  })
})

describe('detectTags', () => {
  it('finds tags and never invents a default', () => {
    expect(detectTags('Build agents with Claude')).toContain('AI')
    expect(detectTags('Dubai brunch')).toEqual([])
  })
  it('does not treat Dubai as AI', () => {
    expect(detectTags('Dubai Networking Night')).not.toContain('AI')
  })
})

describe('detectCity', () => {
  it('finds UAE cities', () => {
    expect(detectCity('Hub71, ADGM Square')).toBe('Abu Dhabi')
    expect(detectCity('Dubai Internet City')).toBe('Dubai')
    expect(detectCity('London')).toBeUndefined()
  })
})
