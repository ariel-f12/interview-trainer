import { useEffect, useState } from 'react'
import { getSessionRecording } from '../db/sessions'
import { TranscriptBlock } from './TranscriptBlock'
import type { SessionSummary } from '../db/sessions'

interface SessionPlaybackProps {
  session: SessionSummary
  onClose: () => void
}

export function SessionPlayback({ session, onClose }: SessionPlaybackProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    queueMicrotask(() => {
      if (cancelled) return
      setUrl(null)
      setLoadError(null)
    })

    getSessionRecording(session.id).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setLoadError(result.error)
        return
      }
      if (!result.value) {
        setLoadError('This recording could not be found — it may have been deleted.')
        return
      }
      createdUrl = URL.createObjectURL(result.value)
      setUrl(createdUrl)
    })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [session.id])

  return (
    <div className="session-playback">
      <button type="button" className="link-button" onClick={onClose}>
        Back to history
      </button>
      <h2>{session.questionText}</h2>
      <p>
        Attempt {session.attemptNumber} · {new Date(session.createdAt).toLocaleString()}
      </p>
      {loadError && <p className="error">{loadError}</p>}
      {!loadError && !url && <p>Loading…</p>}
      {url && <video src={url} controls />}
      <TranscriptBlock
        transcript={session.transcript}
        transcriptSource={session.transcriptSource}
      />
    </div>
  )
}
