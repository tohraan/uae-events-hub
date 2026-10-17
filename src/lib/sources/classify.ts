import { EVENT_CATEGORIES, UAE_CITIES, type EventCategory } from '@/types'

export function detectCategory(text: string): EventCategory {
  const t = text.toLowerCase()
  if (/hackathon|buildathon|codefest|hack\b/.test(t)) return 'hackathon'
  if (/demo day|demo-day|pitch (night|day)/.test(t)) return 'demo-day'
  if (/workshop|bootcamp|masterclass|hands-on/.test(t)) return 'workshop'
  if (/webinar|online talk/.test(t)) return 'webinar'
  if (/conference|summit|expo\b|forum|congress|gitex|devfest|awards/.test(t)) return 'conference'
  if (/meetup|meet up|meet-up/.test(t)) return 'meetup'
  if (/networking|mixer|founders (night|dinner)|happy hour/.test(t)) return 'networking'
  return 'other'
}

const TAG_PATTERNS: Array<[RegExp, string]> = [
  [/\bai\b|artificial intelligence|openai|chatgpt|\bllms?\b|generative|genai|agentic|\bagents?\b|claude|gemini|grok/i, 'AI'],
  [/machine learning|deep learning|neural|\bml\b/i, 'Machine Learning'],
  [/startup|entrepreneur|founders?\b|investors?\b|venture|pitch/i, 'Startup'],
  [/saas|software as a service/i, 'SaaS'],
  [/blockchain|web3|\bnft\b|crypto|defi|bitcoin|solana|ethereum/i, 'Web3'],
  [/fintech|financial tech|payments?\b/i, 'Fintech'],
  [/\bcloud\b|\baws\b|azure|\bgcp\b|google cloud/i, 'Cloud'],
  [/devops|kubernetes|docker|terraform/i, 'DevOps'],
  [/cyber ?security|infosec|\bsecurity\b/i, 'Cybersecurity'],
  [/data science|analytics|big data|database|clickhouse/i, 'Data'],
  [/\biot\b|internet of things|robotics/i, 'IoT'],
  [/developers?\b|programming|coding|devfest|engineers?\b|\bapi\b/i, 'Developer'],
  [/no-?code|low-?code|\bn8n\b|zapier/i, 'No-Code'],
  [/design|\bux\b|\bui\b/i, 'Design'],
]

export function detectTags(text: string): string[] {
  const tags = TAG_PATTERNS.filter(([re]) => re.test(text)).map(([, tag]) => tag)
  return tags.length ? tags : []
}

/**
 * Keep an event if it is about tech, AI, startups or hackathons; drop obvious
 * non-tech noise. Matches on whole words so "ai" does not hit "chair".
 */
const EXCLUDE =
  /\b(pathology|asset protection|real estate|wealth|dream tending|kids? chess|chess tournament|parenting|fashion|holistic|weight loss|interior design|cooking|open mic|exhibition|yoga|wedding|concert|stand-?up comedy|halloween|brunch)\b/i
const INCLUDE =
  /\b(tech|technology|software|developers?|devfest|coding|programming|cloud|aws|azure|gcp|devops|kubernetes|api|apis|gitex|cyber ?security|web3|blockchain|crypto|solana|data|digital|iot|fintech|edtech|healthtech|no-?code|ai|artificial intelligence|machine learning|ml|llms?|genai|generative|agents?|bots?|robotics|startups?|founders?|saas|venture|vc|accelerator|incubator|investors?|entrepreneurs?|pitch|hackathons?|buildathon|demo day|innovation|product)\b/i

export function isTargetEvent(title: string, description = ''): boolean {
  if (EXCLUDE.test(title)) return false
  const text = `${title} ${description.slice(0, 600)}`
  if (EXCLUDE.test(text) && !INCLUDE.test(title)) return false
  return INCLUDE.test(text)
}

export function detectCity(...parts: Array<string | undefined | null>): string | undefined {
  const text = parts.filter(Boolean).join(' ').toLowerCase()
  const aliases: Array<[string, RegExp]> = [
    ['Abu Dhabi', /abu dhabi|adgm|masdar|yas island|أبوظبي/],
    ['Dubai', /dubai|difc|jlt|jumeirah|business bay|dubai internet city|دبي/],
    ['Sharjah', /sharjah|الشارقة/],
    ['Ajman', /ajman/],
    ['Ras Al Khaimah', /ras al khaimah|\brak\b/],
    ['Fujairah', /fujairah/],
    ['Umm Al Quwain', /umm al quwain/],
  ]
  for (const [city, re] of aliases) if (re.test(text)) return city
  return undefined
}

export function isUaeCity(city: string | undefined): boolean {
  return !!city && (UAE_CITIES as readonly string[]).includes(city)
}

export function summarize(e: {
  title: string
  category: string
  startDate: Date
  city?: string | null
  venue?: string | null
  isOnline: boolean
  price?: string | null
  organizer?: string | null
}): string {
  const date = e.startDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dubai',
  })
  const where = e.isOnline ? 'Online' : [e.venue, e.city].filter(Boolean).join(', ') || 'UAE'
  const parts = [`${e.category} on ${date}`, `at ${where}`]
  if (e.price) parts.push(`price: ${e.price}`)
  if (e.organizer) parts.push(`by ${e.organizer}`)
  return parts.join(', ') + '.'
}

export { EVENT_CATEGORIES }
