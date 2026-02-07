import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin", "cyrillic"] });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://obriym.online'),
  title: {
    default: 'OBRIYM | Agenzia Web Full-cycle Italia',
    template: '%s | OBRIYM'
  },
  description: 'OBRIYM - agenzia web full-cycle in Italia. Sviluppo siti web, app, e-commerce, UI/UX design, SEO. Dalla prima scintilla al lancio completo. Preventivo gratuito.',
  keywords: [
    'agenzia web Italia',
    'sviluppo siti web',
    'web agency',
    'sviluppo web',
    'creazione siti internet',
    'e-commerce',
    'UI/UX design',
    'SEO ottimizzazione',
    'sviluppo app',
    'web design',
    'siti web professionali',
    'sviluppo software',
    'digital agency',
    'realizzazione siti web',
    'web developer Italia',
    'agenzia digitale',
    'siti web responsive',
    'sviluppo full-stack',
    'branding digitale',
    'consulenza web'
  ],
  authors: [{ name: 'OBRIYM', url: 'https://obriym.online' }],
  creator: 'OBRIYM',
  publisher: 'OBRIYM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://obriym.online',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://obriym.online',
    siteName: 'OBRIYM',
    title: 'OBRIYM | Agenzia Web Full-cycle Italia',
    description: 'Sviluppo siti web, app, e-commerce, UI/UX design e SEO. Dalla prima scintilla al lancio completo. Preventivo gratuito.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'OBRIYM - Agenzia Web Full-cycle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OBRIYM | Agenzia Web Full-cycle Italia',
    description: 'Sviluppo siti web, app, e-commerce, UI/UX design e SEO. Dalla prima scintilla al lancio completo.',
    images: ['/og-image.svg'],
    creator: '@obriym',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
  },
  category: 'technology',
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
