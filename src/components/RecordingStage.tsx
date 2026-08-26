import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import type { Question } from '../types'

interface RecordingStageProps {
  stream: MediaStream | null
  question: Question
  answerSeconds: number
  onComplete: (recordedUrl: string) => void
}

export function RecordingStage({
  stream,
  question,
  answerSeconds,
  onComplete,
}: RecordingStageProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recorderError, setRecorderError] = useState<string | null>(null)

  useEffect(() => {
    if (!stream) return

    const chunks: Blob[] = []
    const discardRef = { current: false }

    let mediaRecorder: MediaRecorder
    try {
      mediaRecorder = new MediaRecorder(stream)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start recording'
      queueMicrotask(() => setRecorderError(message))
      return
    }
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      if (discardRef.current) return
      const blob = new Blob(chunks, { type: 'video/webm' })
      onComplete(URL.createObjectURL(blob))
    }

    mediaRecorder.start()

    return () => {
      // In React StrictMode dev double-invoke, this cleanup fires immediately
      // after the throwaway first mount. Mark it as a discard so that stop
      // doesn't trigger a real completion before the second, real mount runs.
      discardRef.current = true
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
    }
  }, [stream, onComplete])

  const secondsLeft = useCountdown(answerSeconds, () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  })

  if (recorderError) {
    return <p className="error">Recording failed to start: {recorderError}</p>
  }

  return (
    <>
      <h1>Recording…</h1>
      <p className="question-card">{question.text}</p>
      <p className="countdown">{secondsLeft}s remaining</p>
    </>
  )
}
