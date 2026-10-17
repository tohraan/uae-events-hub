import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UAE Tech Events Hub — Hackathons, Meetups & Workshops',
  description:
    'Live aggregator of tech events, hackathons, meetups, workshops and conferences in the UAE. AI, SaaS, Startups, Fintech, Web3 and more. Free API + iCal calendar feed.',
  keywords: [
    'UAE tech events',
    'Dubai hackathon',
    'Abu Dhabi meetup',
    'AI events UAE',
    'startup events Dubai',
    'tech workshops UAE',
    'GITEX',
    'developer events Dubai',
    'SaaS events',
    'fintech UAE',
  ],
  openGraph: {
    title: 'UAE Tech Events Hub',
    description: 'Live aggregator of tech events in the UAE — AI, SaaS, Startups & more.',
    type: 'website',
    locale: 'en_AE',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    types: {
      'text/calendar': '/api/feed.ics',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="alternate" type="text/calendar" href="/api/feed.ics" title="UAE Tech Events" />
      </head>
      <body>{children}</body>
    </html>
  )
}
