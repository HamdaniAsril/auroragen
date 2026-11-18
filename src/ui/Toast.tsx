import { useEffect, useState } from 'react'

const listeners = new Set<(message: string) => void>()

export function toast(message: string): void {
  for (const l of listeners) l(message)
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const show = (m: string) => {
      setMessage(m)
      clearTimeout(timer)
      timer = setTimeout(() => setMessage(null), 3500)
    }
    listeners.add(show)
    return () => {
      listeners.delete(show)
      clearTimeout(timer)
    }
  }, [])
  return (
    <div className="toast" role="status" aria-live="polite" data-open={message ? '' : undefined}>
      {message}
    </div>
  )
}
