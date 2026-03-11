/**
 * Root layout: metadata, global styles, error boundary.
 * All app routes render as children.
 */
import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Vantirs - CE 3.0 Compliance Engine for Chargeback Defense',
  description: 'Automated Visa CE 3.0 liability shift for SaaS chargeback defense. Fight disputes automatically with forensic evidence and bank-ready compliance reports.',
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
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
