/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize PDFKit and pdf-parse so they're not bundled
      // This prevents bundling issues with their dependencies (pdfjs-dist, etc.)
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('pdfkit', 'pdf-parse', 'pdfjs-dist')
      } else {
        config.externals = [config.externals, 'pdfkit', 'pdf-parse', 'pdfjs-dist']
      }
    }
    return config
  },
}

module.exports = nextConfig

