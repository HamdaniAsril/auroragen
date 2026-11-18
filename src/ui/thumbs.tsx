import type { ReactNode } from 'react'
import type { AuroraType, LandType } from '../scene/types'

// Small line drawings for the pickers. They show the shape, not a rendered image.
const box = { width: 44, height: 28, viewBox: '0 0 44 28', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const }

export const TYPE_THUMBS: Record<AuroraType, ReactNode> = {
  tirai: (
    <svg {...box}>
      <path d="M3 18c6-5 9 3 15-1s9-6 14-2 6 1 9-1" />
      {[6, 10, 14, 18, 22, 26, 30, 34, 38].map((x, i) => (
        <path key={x} d={`M${x} ${17 - (i % 3)}v-${8 + (i % 4) * 2}`} opacity={0.55} />
      ))}
    </svg>
  ),
  busur: (
    <svg {...box}>
      <path d="M3 24C10 8 34 8 41 24" />
      <path d="M8 24C14 13 30 13 36 24" opacity={0.55} />
    </svg>
  ),
  korona: (
    <svg {...box}>
      {[-60, -35, -12, 12, 35, 60].map((a) => (
        <path key={a} d="M22 4v20" transform={`rotate(${a} 22 4)`} opacity={0.75} />
      ))}
    </svg>
  ),
  pilar: (
    <svg {...box}>
      {[7, 15, 24, 33].map((x, i) => (
        <path key={x} d={`M${x} 23v-${10 + (i % 2) * 7}`} strokeWidth={2.4} opacity={0.8} />
      ))}
    </svg>
  ),
  pusaran: (
    <svg {...box}>
      <path d="M22 15c2 0 3-2 1-3s-5 0-5 3 3 5 7 4 7-4 5-8-8-6-13-3-8 9-4 13" />
    </svg>
  ),
}

export const LAND_THUMBS: Record<LandType, ReactNode> = {
  none: (
    <svg {...box}>
      <path d="M2 19h40" />
    </svg>
  ),
  mountains: (
    <svg {...box}>
      <path d="M2 22l8-10 5 5 7-11 8 10 4-4 8 10" />
    </svg>
  ),
  hills: (
    <svg {...box}>
      <path d="M2 21c6-6 10-6 15-2s9-7 15-5 7 5 10 6" />
    </svg>
  ),
  pines: (
    <svg {...box}>
      <path d="M2 22h40" />
      {[6, 13, 20, 27, 34].map((x, i) => (
        <path key={x} d={`M${x - 3} 22l3-${8 + (i % 2) * 4} 3 ${8 + (i % 2) * 4}`} />
      ))}
    </svg>
  ),
}

export function PaletteThumb({ colors }: { colors: string[] }) {
  return (
    <svg width={44} height={28} viewBox="0 0 44 28">
      {colors.map((c, i) => (
        <rect key={i} x={4 + i * 12.5} y={6} width={11} height={16} rx={2} fill={c} />
      ))}
    </svg>
  )
}
