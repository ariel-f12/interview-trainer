import type { TranscriptSource, WhisperStatus } from '../types'

interface TranscriptBlockProps {
  transcript: string
  transcriptSource: TranscriptSource
  // Only supplied on the live review screen, where a Whisper pass may
  // still be running. Omitted for stored sessions.
  whisperStatus?: WhisperStatus
}

export function TranscriptBlock({
  transcript,
  transcriptSource,
  whisperStatus,
}: TranscriptBlockProps) {
  if (transcriptSource === 'none') {
    if (whisperStatus === 'running') {
      return (
        <p className="save-status">
          Transcribing your answer on this device… this can take a few minutes.
        </p>
      )
    }
    if (whisperStatus === 'error') {
      return (
        <p className="save-status">
          On-device transcription didn't complete for this attempt.
        </p>
      )
    }
    return <p className="save-status">No transcript for this attempt.</p>
  }

  return (
    <div>
      <h2>Transcript</h2>
      {transcriptSource === 'on-device-whisper' && (
        <p className="save-status">
          Auto-transcribed by an on-device model. May contain errors or repeated phrases
          during pauses.
        </p>
      )}
      <p>{transcript.trim() ? transcript : '(no speech detected)'}</p>
    </div>
  )
}
