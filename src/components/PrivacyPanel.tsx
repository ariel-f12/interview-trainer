import { useEffect, useState } from 'react'
import { CONSENT_NOTICE } from '../data/consent'
import { isWhisperModelReady, removeWhisperModel } from '../speech/whisperTranscriber'

interface PrivacyPanelProps {
  onWithdraw: () => void
  onClose: () => void
}

export function PrivacyPanel({ onWithdraw, onClose }: PrivacyPanelProps) {
  const [modelState, setModelState] = useState<'checking' | 'present' | 'absent' | 'removing'>(
    'checking',
  )

  useEffect(() => {
    let cancelled = false
    isWhisperModelReady().then((ready) => {
      if (!cancelled) setModelState(ready ? 'present' : 'absent')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleRemoveModel = async () => {
    setModelState('removing')
    await removeWhisperModel()
    setModelState('absent')
  }

  return (
    <div className="privacy-panel">
      <h2>Privacy and data</h2>
      {CONSENT_NOTICE.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}

      {modelState === 'present' && (
        <div>
          <p className="save-status">
            The downloaded speech recognition model is cached on this device.
          </p>
          <button type="button" onClick={handleRemoveModel}>
            Remove downloaded speech model
          </button>
        </div>
      )}
      {modelState === 'removing' && <p className="save-status">Removing…</p>}
      {modelState === 'absent' && (
        <p className="save-status">No speech recognition model is stored on this device.</p>
      )}

      <div className="actions">
        <button type="button" onClick={onWithdraw}>
          Withdraw consent
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
