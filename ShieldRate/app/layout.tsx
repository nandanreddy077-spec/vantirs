/**
 * Root layout: metadata, global styles, error boundary.
 * All app routes render as children.
 */
import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Vantirs - Forensic Chargeback Defense for SaaS',
  description: 'Automated chargeback defense with Visa CE 3.0, Mastercard First-Party Trust, and forensic evidence matching. Fight disputes across all networks and reason codes.',
  icons: {
    icon: '/vantirs-favicon.png',
    shortcut: '/vantirs-favicon.png',
    apple: '/vantirs-favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
