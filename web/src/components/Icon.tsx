const PATHS = {
  logo: 'M12 3a9 9 0 1 0 9 9 M12 3v9h9',
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  bills: 'M6 2h12v20l-3-2-3 2-3-2-3 2z M9 7h6 M9 11h6',
  members:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  balances: 'M3 7h18v13H3z M3 7l2-3h14l2 3 M16 13.5h2',
  settings: 'M4 6h10 M18 6h2 M4 12h2 M10 12h10 M4 18h12 M14 4v4 M6 10v4 M16 16v4',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  check: 'M20 6 9 17l-5-5',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  close: 'M18 6 6 18 M6 6l12 12',
  plus: 'M12 5v14 M5 12h14',
  swap: 'M17 3l4 4-4 4 M21 7H8 M7 21l-4-4 4-4 M3 17h13',
  alert:
    'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
