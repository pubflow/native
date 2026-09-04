import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: 'system-ui', margin: '2rem' }}>{children}</div>
}
