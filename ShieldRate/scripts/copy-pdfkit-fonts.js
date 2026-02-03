/**
 * Copy PDFKit font files to .next directory for serverless functions
 * This ensures PDFKit can find fonts in Next.js serverless environment
 */

const fs = require('fs')
const path = require('path')

try {
  const pdfkitPath = require.resolve('pdfkit/package.json')
  const sourceFontDir = path.join(path.dirname(pdfkitPath), 'js', 'data')
  const targetFontDir = path.join(__dirname, '..', '.next', 'server', 'vendor-chunks', 'data')
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetFontDir)) {
    fs.mkdirSync(targetFontDir, { recursive: true })
  }
  
  // Copy all .afm font files
  const fontFiles = fs.readdirSync(sourceFontDir).filter(f => f.endsWith('.afm'))
  
  console.log(`📋 Copying ${fontFiles.length} font files from PDFKit...`)
  
  for (const fontFile of fontFiles) {
    const sourcePath = path.join(sourceFontDir, fontFile)
    const targetPath = path.join(targetFontDir, fontFile)
    fs.copyFileSync(sourcePath, targetPath)
    console.log(`  ✅ Copied ${fontFile}`)
  }
  
  console.log('✅ PDFKit fonts copied successfully!')
} catch (error) {
  console.error('❌ Error copying PDFKit fonts:', error.message)
  process.exit(1)
}

