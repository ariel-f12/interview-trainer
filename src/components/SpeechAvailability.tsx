import { useEffect, useState } from 'react'
import { checkAvailability, installLanguagePack } from '../speech/availability'

type Status = 'checking' | SpeechRecognitionAvailability | 'requesting-install'

interface SpeechAvailabilityProps {
  onChange: (enabled: boolean) => void
}

export function SpeechAvailability({ onChange }: SpeechAvailabilityProps) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    checkAvailability().then((result) => setStatus(result))
  }, [])

  useEffect(() => {
    onChange(status === 'available')
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

  return (
    <p className="save-status">
      On-device transcription isn't available in this browser. The app will record without it.
    </p>
  )
}
