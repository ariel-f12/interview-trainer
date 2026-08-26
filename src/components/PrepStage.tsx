import { useCountdown } from '../hooks/useCountdown'

interface PrepStageProps {
  prepSeconds: number
  onComplete: () => void
}

export function PrepStage({ prepSeconds, onComplete }: PrepStageProps) {
  const secondsLeft = useCountdown(prepSeconds, onComplete)

  return (
    <>
      <h1>Get ready</h1>
      <p className="countdown">Starts in {secondsLeft}s</p>
    </>
  )
}
