"use client"

import { useEffect, useState } from "react"

interface TimerProps {
  startTime: string | Date
  className?: string
}

export function Timer({ startTime, className = "" }: TimerProps) {
  const [elapsed, setElapsed] = useState("")

  useEffect(() => {
    const start = new Date(startTime).getTime()

    const updateTimer = () => {
      const now = Date.now()
      const diff = now - start
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (hours > 0) {
        setElapsed(`${hours}h ${minutes % 60}m`)
      } else if (minutes > 0) {
        setElapsed(`${minutes}m ${seconds % 60}s`)
      } else {
        setElapsed(`${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  return <span className={className}>{elapsed}</span>
}
