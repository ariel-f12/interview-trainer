import { useEffect, useState } from 'react'
import { checkAvailability, installLanguagePack } from '../speech/availability'
import { WhisperSetup } from './WhisperSetup'
import type { TranscriptionMode } from '../types'

type Status = 'checking' | SpeechRecognitionAvailability | 'requesting-install'

interface SpeechAvailabilityProps {
  onChange: (mode: TranscriptionMode) => void
}

export function SpeechAvailability({ onChange }: SpeechAvailabilityProps) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    checkAvailability().then((result) => setStatus(result))
  }, [])

  useEffect(() => {
    if (status === 'available') {
      onChange('web-speech')
    } else if (status !== 'unavailable') {
      // 'checking', 'downloadable', 'downloading', 'requesting-install':
      // Web Speech might become available but isn't yet.
      onChange('none')
    }
    // When 'unavailable', WhisperSetup drives onChange instead.
  }, [status, onChange])

  const handleInstall = () => {
    setStatus('requesting-install')
    installLanguagePack().then((result) => setStatus(result))
  }

  if (status === 'checking') {
    return <p className="save-status">Checking on-device transcription availability…</p>
  }

  if (status === 'available') {
    return <p className="save-status">On-device transcription: available.</p>
  }

  if (status === 'downloadable') {
    return (
      <div>
        <p className="save-status">
          On-device transcription needs a one-time language pack download. This happens on this
          device — nothing is uploaded.
        </p>
        <button type="button" onClick={handleInstall}>
          Download language pack
        </button>
      </div>
    )
  }

  if (status === 'downloading' || status === 'requesting-install') {
    return (
      <p className="save-status">
        Downloading on-device transcription language pack… Continuing without transcription for
        now.
      </p>
    )
  }

  // status === 'unavailable'
  return <WhisperSetup onModeChange={onChange} />
}
