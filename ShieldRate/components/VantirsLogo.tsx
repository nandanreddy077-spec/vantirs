'use client'

import Image from 'next/image'

interface VantirsLogoProps {
  className?: string
  width?: number
  height?: number
}

export default function VantirsLogo({ className = '', width = 40, height = 40 }: VantirsLogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/vantirs-logo.svg"
        alt="Vantirs Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  )
}

