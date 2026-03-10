/**
 * Root layout: metadata, global styles, error boundary.
 * All app routes render as children.
 */
import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Vantirs - CE 3.0 Compliance Engine',
  description: 'Automated Visa CE 3.0 Liability Shift for SaaS chargeback defense',
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
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}

