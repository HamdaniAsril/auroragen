import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (props: P) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const UndoIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 4 2.5 7l3 3" />
    <path d="M2.5 7h7a4 4 0 0 1 0 8H7" />
  </svg>
)
export const RedoIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m10.5 4 3 3-3 3" />
    <path d="M13.5 7h-7a4 4 0 0 0 0 8H9" />
  </svg>
)
export const DiceIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2" width="12" height="12" rx="2.5" />
    <circle cx="5.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)
export const PlayIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3.2v9.6L12.5 8z" fill="currentColor" />
  </svg>
)
export const PauseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 3.5v9M10.5 3.5v9" strokeWidth={2.2} />
  </svg>
)
export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3v10M3 8h10" />
  </svg>
)
export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
)
export const ChevronIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 6 4 4 4-4" />
  </svg>
)
