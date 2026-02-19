'use client'

import Image from 'next/image'

interface VantirsLogoProps {
  className?: string
  width?: number
  height?: number
}

export default function VantirsLogo({ className = '', width = 120, height = 40 }: VantirsLogoProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Image
        src="/vantirs-logo.png"
        alt="Vantirs"
        width={width}
        height={height}
        className="object-contain"
        style={{ width: `${width}px`, height: 'auto' }}
        priority
      />
    </div>
  )
}







