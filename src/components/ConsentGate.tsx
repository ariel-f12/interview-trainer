interface ConsentGateProps {
  onAccept: () => void
}

export function ConsentGate({ onAccept }: ConsentGateProps) {
  return (
    <div className="app">
      <h1>Interview Trainer</h1>
      <p>
        This app uses your camera and microphone to record practice answers.
        Recordings stay on this device — nothing is uploaded or sent anywhere.
      </p>
      <button type="button" onClick={onAccept}>
        Continue
      </button>
    </div>
  )
}
