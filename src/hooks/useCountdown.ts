import { useEffect, useRef, useState } from 'react'

export function useCountdown(totalSeconds: number, onComplete: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    const startTime = Date.now()

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, totalSeconds - elapsed)
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(intervalId)
        onCompleteRef.current()
      }
    }

    const intervalId = window.setInterval(tick, 1000)
    return () => clearInterval(intervalId)
  }, [totalSeconds])

  return secondsLeft
}
