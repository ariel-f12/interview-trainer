import { CONSENT_NOTICE } from '../data/consent'

interface PrivacyPanelProps {
  onWithdraw: () => void
  onClose: () => void
}

export function PrivacyPanel({ onWithdraw, onClose }: PrivacyPanelProps) {
  return (
    <div className="privacy-panel">
      <h2>Privacy and data</h2>
      {CONSENT_NOTICE.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
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
