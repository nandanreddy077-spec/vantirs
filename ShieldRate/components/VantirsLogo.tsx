'use client'

interface VantirsLogoProps {
  className?: string
  width?: number
  height?: number
}

export default function VantirsLogo({ className = '', width = 120, height = 40 }: VantirsLogoProps) {
  // Logo aspect ratio is 1536:1024 = 3:2 = 1.5:1
  // Calculate height based on width to maintain aspect ratio
  const aspectRatio = 1536 / 1024 // 1.5
  const calculatedHeight = width / aspectRatio
  
  return (
    <div className={`relative inline-flex items-center ${className}`} style={{ height: `${calculatedHeight}px` }}>
      <img
        src="/vantirs-logo.png"
        alt="Vantirs"
        width={width}
        height={calculatedHeight}
        className="object-contain"
        style={{ 
          width: `${width}px`, 
          height: `${calculatedHeight}px`,
          maxWidth: `${width}px`,
          maxHeight: `${calculatedHeight}px`,
          display: 'block',
          objectFit: 'contain'
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  )
}







