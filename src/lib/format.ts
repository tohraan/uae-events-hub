const TZ = 'Asia/Dubai'

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })

export const formatMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: TZ })

/** "Sat 24 Oct 2026, 09:00" or just the date when the source gave no time. */
export const formatWhen = (iso: string, timeKnown: boolean) =>
  timeKnown ? `${formatDay(iso)}, ${formatTime(iso)}` : formatDay(iso)

export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

export const labelCategory = (c: string) => (c === 'demo-day' ? 'Demo day' : c.charAt(0).toUpperCase() + c.slice(1))
