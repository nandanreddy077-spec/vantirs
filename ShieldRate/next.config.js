/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize PDFKit, pdf-parse, and bcrypt so they're not bundled
      // This prevents bundling issues with their dependencies (pdfjs-dist, etc.)
      // bcrypt is a native module that must be externalized
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('pdfkit', 'pdf-parse', 'pdfjs-dist', 'bcrypt')
      } else {
        config.externals = [config.externals, 'pdfkit', 'pdf-parse', 'pdfjs-dist', 'bcrypt']
      }
    } else {
      // For client-side, ignore bcrypt (it's server-only)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bcrypt: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

