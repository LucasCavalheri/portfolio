import { Analytics } from '@vercel/analytics/react'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import { ReactNode } from 'react'
import { BackToTop } from './components/back-to-top'
import { ContactForm } from './components/contact-form'
import { Header } from './components/header'
import { Toaster } from './components/toaster'
import './globals.css'

export const metadata = {
  metadataBase: new URL('https://lucascavalheri.com.br'),
  title: {
    default: 'LC Dev',
    template: '%s | LC Dev'
  },
  authors: [{ name: 'Lucas Cavalheri', url: 'https://linkedin.com/in/lucas-cavalheri' }],
  creator: 'Lucas Cavalheri',
  openGraph: {
    images: [
      {
        url: '/images/HomeLC.png',
        width: 1200,
        height: 630
      }
    ],
    title: 'LC Dev',
    description: 'Lucas Cavalheri DEV, desenvolvimento de sites e aplicativos web.',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://lucascavalheri.com.br'
  },
  applicationName: 'LC Dev',
  description: 'Lucas Cavalheri DEV, desenvolvimento de sites e aplicativos web.',
  category: 'Desenvolvimento Web',
  keywords: [
    'Desenvolvimento Web',
    'Desenvolvimento de Sites',
    'Desenvolvimento de Aplicativos',
    'Desenvolvimento de Aplicativos Web',
    'Desenvolvimento de Sites Web'
  ],
  classification: 'Desenvolvimento Web',
  robots: 'index, follow',
  publisher: 'LC Dev',
  referrer: 'no-referrer-when-downgrade',
  alternates: {
    canonical: 'https://lucascavalheri.com.br',
    languages: {
      'pt-BR': 'https://lucascavalheri.com.br'
    }
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
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <body>
        <Toaster />
        <BackToTop />
        <Header />
        {children}
        <ContactForm />
        <Analytics />
      </body>
    </html>
  )
}
