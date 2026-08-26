import { useState } from 'react'
import { CONSENT_NOTICE } from '../data/consent'

interface ConsentGateProps {
  onAccept: () => void
}

export function ConsentGate({ onAccept }: ConsentGateProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="app">
      <h1>Interview Trainer</h1>
      {CONSENT_NOTICE.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <label className="consent-checkbox">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        I understand and agree to camera and microphone access.
      </label>
      <button type="button" onClick={onAccept} disabled={!agreed}>
        Continue
      </button>
    </div>
  )
}
