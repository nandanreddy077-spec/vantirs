'use client'

interface VantirsLogoProps {
  className?: string
  width?: number
  height?: number
}

export default function VantirsLogo({ className = '', width = 120, height = 40 }: VantirsLogoProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`} style={{ height: `${height}px` }}>
      <img
        src="/vantirs-logo.png"
        alt="Vantirs"
        width={width}
        height={height}
        className="object-contain h-full w-auto"
        style={{ width: `${width}px`, height: 'auto', imageRendering: 'crisp-edges' }}
        loading="eager"
      />
    </div>
  )
}







