'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error tracking service in production
    if (typeof window !== 'undefined') {
      console.error('Error caught by boundary:', error, errorInfo)
      
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'error_boundary',
            user_id: 'system',
            metadata: {
              error: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
            },
          }),
        }).catch(() => {
          // Silently fail - error tracking shouldn't break the app
        })
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-10 animate-scale-in border border-gray-200/50">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-30"></div>
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Something Went Wrong</h1>
              <p className="text-gray-600 text-lg mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {this.state.error && (
                <details className="text-left mb-6">
                  <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                    Technical Details
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full gradient-primary text-white py-4 px-4 rounded-2xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Return to Dashboard</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-gray-900 py-4 px-4 rounded-2xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}



