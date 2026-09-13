import { useEffect, useState } from 'react'
import { MODEL_DOWNLOAD_MB } from '../speech/whisperModel'
import {
  downloadWhisperModel,
  isWhisperModelReady,
} from '../speech/whisperTranscriber'
import type { TranscriptionMode } from '../types'

interface WhisperSetupProps {
  onModeChange: (mode: TranscriptionMode) => void
}

type State = 'checking' | 'ready' | 'offer' | 'downloading' | 'error'

export function WhisperSetup({ onModeChange }: WhisperSetupProps) {
  const [state, setState] = useState<State>('checking')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    isWhisperModelReady().then((ready) => {
      if (cancelled) return
      setState(ready ? 'ready' : 'offer')
      onModeChange(ready ? 'whisper' : 'none')
    })
    return () => {
      cancelled = true
    }
  }, [onModeChange])

  const handleDownload = async () => {
    setState('downloading')
    setProgress(0)
    onModeChange('none')
    try {
      await downloadWhisperModel((fraction) => setProgress(fraction))
      setState('ready')
      onModeChange('whisper')
    } catch (err) {
      console.warn('On-device speech model failed to load:', err)
      setState('error')
      onModeChange('none')
    }
  }

  if (state === 'checking') {
    return <p className="save-status">Checking on-device transcription availability…</p>
  }

  if (state === 'ready') {
    return (
      <p className="save-status">
        On-device transcription: ready. The speech recognition model is already downloaded;
        your answer will be transcribed on this device after you finish recording.
      </p>
    )
  }

  if (state === 'downloading') {
    return (
      <div className="whisper-setup">
        <p className="save-status">
          Downloading the speech recognition model… {Math.round(progress * 100)}%. This is a
          one-time download and happens on this device.
        </p>
        <progress value={progress} max={1} />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="whisper-setup">
        <p className="save-status error">
          The speech recognition model couldn't be downloaded. You can try again, or record
          without a transcript.
        </p>
        <button type="button" onClick={handleDownload}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="whisper-setup">
      <p className="save-status">
        Your browser has no built-in speech recognition. You can optionally download an
        on-device model (about {MODEL_DOWNLOAD_MB} MB, one time) to transcribe your answers.
        It's downloaded from this app, cached for next time, and runs entirely on this
        device — your audio is never uploaded.
      </p>
      <button type="button" onClick={handleDownload}>
        Download speech model (~{MODEL_DOWNLOAD_MB} MB)
      </button>
      <p className="save-status">
        Or skip this and record without a transcript.
      </p>
    </div>
  )
}
