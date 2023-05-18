import './globals.css'
import { Analytics } from '@vercel/analytics/react';
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { ReactNode } from 'react'
import { Header } from './components/header'
import { ContactForm } from './components/contact-form'
import { BackToTop } from './components/back-to-top'

export const metadata = {
  title: {
    default: 'LC Dev',
    template: '%s | LC Dev'
  },
  icons: [
    {
      url: '/favicon.ico'
    }
  ],
  openGraph: {
    images: [
      {
        url: '/images/HomeLC.png',
        width: 1200,
        height: 630,
      }
    ]
  }
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500']
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='pt-BR' className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <BackToTop />
        <Header />
        {children}
        <ContactForm />
        <Analytics />
      </body>
    </html>
  )
}
