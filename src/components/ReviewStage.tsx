import { useEffect, useState } from 'react'
import { TranscriptBlock } from './TranscriptBlock'
import type { Question, TranscriptSource, WhisperStatus } from '../types'

interface ReviewStageProps {
  question: Question
  recording: Blob
  saveStatus: 'saving' | 'saved' | 'error'
  transcript: string
  transcriptSource: TranscriptSource
  whisperStatus: WhisperStatus
  onRestart: () => void
  onRerecord: () => void
}

export function ReviewStage({
  question,
  recording,
  saveStatus,
  transcript,
  transcriptSource,
  whisperStatus,
  onRestart,
  onRerecord,
}: ReviewStageProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(recording)
    queueMicrotask(() => setUrl(objectUrl))
    return () => URL.revokeObjectURL(objectUrl)
  }, [recording])

  return (
    <>
      <h1>Playback</h1>
      <p className="question-card">{question.text}</p>
      {url && <video src={url} controls />}
      {saveStatus === 'saving' && <p className="save-status">Saving…</p>}
      {saveStatus === 'saved' && <p className="save-status">Saved to history.</p>}
      {saveStatus === 'error' && (
        <p className="save-status error">
          Couldn't save this recording to history (storage may be full or unavailable). You can
          still watch it now, but it won't be saved once you leave this screen.
        </p>
      )}
      <TranscriptBlock
        transcript={transcript}
        transcriptSource={transcriptSource}
        whisperStatus={whisperStatus}
      />
      <div className="actions">
        <button type="button" onClick={onRerecord}>
          Rerecord
        </button>
        <button type="button" onClick={onRestart}>
          Home
        </button>
      </div>
    </>
  )
}
