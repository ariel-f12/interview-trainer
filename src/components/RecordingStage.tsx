import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import { getSpeechRecognitionConstructor } from '../speech/availability'
import type { Question, TranscriptionMode, TranscriptSource } from '../types'

interface RecordingStageProps {
  stream: MediaStream | null
  question: Question
  answerSeconds: number
  transcriptionMode: TranscriptionMode
  onComplete: (
    recording: Blob,
    actualDurationSeconds: number,
    transcript: string,
    transcriptSource: TranscriptSource,
  ) => void
}

function transcriptFromResults(results: SpeechRecognitionEvent['results']): string {
  return Array.from(results)
    .filter((result) => result.isFinal)
    .map((result) => result[0].transcript)
    .join(' ')
}

export function RecordingStage({
  stream,
  question,
  answerSeconds,
  transcriptionMode,
  onComplete,
}: RecordingStageProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recorderError, setRecorderError] = useState<string | null>(null)

  useEffect(() => {
    if (!stream) return

    const chunks: Blob[] = []
    const discardRef = { current: false }
    const transcriptRef = { current: '' }
    let recognition: SpeechRecognition | null = null

    let mediaRecorder: MediaRecorder
    try {
      mediaRecorder = new MediaRecorder(stream)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start recording'
      queueMicrotask(() => setRecorderError(message))
      return
    }
    mediaRecorderRef.current = mediaRecorder

    // Web Speech runs live, during recording. Whisper (transcriptionMode
    // 'whisper') runs afterwards, off the recorded blob, so nothing but
    // the timer is on screen while recording — it's handled by App on the
    // review screen, not here.
    let webSpeechRan = false
    if (transcriptionMode === 'web-speech') {
      const Ctor = getSpeechRecognitionConstructor()
      if (Ctor) {
        try {
          const instance = new Ctor()
          instance.continuous = true
          instance.interimResults = true
          instance.processLocally = true
          instance.lang = 'en-US'
          instance.onresult = (event) => {
            transcriptRef.current = transcriptFromResults(event.results)
          }
          instance.onerror = () => {
            // A transcription failure never interrupts or errors the recording itself.
          }
          instance.start()
          recognition = instance
          webSpeechRan = true
        } catch {
          // e.g. 'language-not-supported' — proceed with recording, no transcript.
          recognition = null
        }
      }
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      recognition?.stop()
      if (discardRef.current) return
      const blobType = mediaRecorder.mimeType || 'video/webm'
      const blob = new Blob(chunks, { type: blobType })
      const actualDurationSeconds = Math.round((Date.now() - startTime) / 1000)
      const source: TranscriptSource = webSpeechRan ? 'on-device' : 'none'
      onComplete(blob, actualDurationSeconds, transcriptRef.current, source)
    }

    const startTime = Date.now()
    mediaRecorder.start()

    return () => {
      // In React StrictMode dev double-invoke, this cleanup fires immediately
      // after the throwaway first mount. Mark it as a discard so that stop
      // doesn't trigger a real completion before the second, real mount runs.
      discardRef.current = true
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
      recognition?.abort()
    }
  }, [stream, transcriptionMode, onComplete])

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
