import { useEffect, useRef, useState } from 'react'
import './App.css'
import { ConsentGate } from './components/ConsentGate'
import { PrivacyPanel } from './components/PrivacyPanel'
import { TrackSelect } from './components/TrackSelect'
import { DurationConfig } from './components/DurationConfig'
import { QuestionStage } from './components/QuestionStage'
import { PrepStage } from './components/PrepStage'
import { RecordingStage } from './components/RecordingStage'
import { ReviewStage } from './components/ReviewStage'
import { pickRandomQuestion } from './data/questions'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './data/consent'
import type { ConsentRecord } from './data/consent'
import type { Stage } from './types'

function readStoredConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return false
    const record = JSON.parse(raw) as Partial<ConsentRecord>
    return record.version === CONSENT_VERSION
  } catch {
    return false
  }
}

function App() {
  const [hasConsented, setHasConsented] = useState(readStoredConsent)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>({ name: 'track-select' })

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!hasConsented) return

    let activeStream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        activeStream = mediaStream
        setStream(mediaStream)
      })
      .catch((err: Error) => setPermissionError(err.message))

    return () => {
      activeStream?.getTracks().forEach((track) => track.stop())
    }
  }, [hasConsented])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const acceptConsent = () => {
    const record: ConsentRecord = {
      version: CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
    }
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    setHasConsented(true)
  }

  const withdrawConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
    if (stage.name === 'review') {
      URL.revokeObjectURL(stage.recordedUrl)
    }
    setStage({ name: 'track-select' })
    setShowPrivacy(false)
    setStream(null)
    setPermissionError(null)
    setHasConsented(false)
  }

  const resetToStart = () => {
    if (stage.name === 'review') {
      URL.revokeObjectURL(stage.recordedUrl)
    }
    setStage({ name: 'track-select' })
  }

  const rerecord = () => {
    if (stage.name !== 'review') return
    URL.revokeObjectURL(stage.recordedUrl)
    setStage(
      stage.prepSeconds > 0
        ? {
            name: 'prep',
            prepSeconds: stage.prepSeconds,
            answerSeconds: stage.answerSeconds,
            question: stage.question,
          }
        : {
            name: 'recording',
            prepSeconds: stage.prepSeconds,
            answerSeconds: stage.answerSeconds,
            question: stage.question,
          },
    )
  }

  if (!hasConsented) {
    return <ConsentGate onAccept={acceptConsent} />
  }

  const showPreview = (stage.name === 'prep' || stage.name === 'recording') && !showPrivacy

  return (
    <div className="app">
      <div className="app-header">
        <h1>Interview Trainer</h1>
        {!showPrivacy && (
          <button type="button" className="link-button" onClick={() => setShowPrivacy(true)}>
            Privacy and data
          </button>
        )}
      </div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={showPreview ? undefined : 'hidden'}
      />

      {showPrivacy && (
        <PrivacyPanel onWithdraw={withdrawConsent} onClose={() => setShowPrivacy(false)} />
      )}

      {!showPrivacy && permissionError && (
        <p className="error">Camera/microphone access is required: {permissionError}</p>
      )}

      {!showPrivacy && !permissionError && stage.name === 'track-select' && (
        <TrackSelect onSelect={(track) => setStage({ name: 'duration-config', track })} />
      )}

      {!showPrivacy && stage.name === 'duration-config' && (
        <DurationConfig
          track={stage.track}
          onSubmit={(prepSeconds, answerSeconds) =>
            setStage({
              name: 'question',
              track: stage.track,
              prepSeconds,
              answerSeconds,
              question: pickRandomQuestion(stage.track),
            })
          }
        />
      )}

      {!showPrivacy && stage.name === 'question' && (
        <QuestionStage
          track={stage.track}
          question={stage.question}
          onReroll={() =>
            setStage({
              ...stage,
              question: pickRandomQuestion(stage.track, stage.question.id),
            })
          }
          onStart={() =>
            stage.prepSeconds > 0
              ? setStage({
                  name: 'prep',
                  prepSeconds: stage.prepSeconds,
                  answerSeconds: stage.answerSeconds,
                  question: stage.question,
                })
              : setStage({
                  name: 'recording',
                  prepSeconds: stage.prepSeconds,
                  answerSeconds: stage.answerSeconds,
                  question: stage.question,
                })
          }
        />
      )}

      {!showPrivacy && stage.name === 'prep' && (
        <PrepStage
          prepSeconds={stage.prepSeconds}
          onComplete={() =>
            setStage({
              name: 'recording',
              prepSeconds: stage.prepSeconds,
              answerSeconds: stage.answerSeconds,
              question: stage.question,
            })
          }
        />
      )}

      {!showPrivacy && stage.name === 'recording' && (
        <RecordingStage
          stream={stream}
          question={stage.question}
          answerSeconds={stage.answerSeconds}
          onComplete={(recordedUrl) =>
            setStage({
              name: 'review',
              prepSeconds: stage.prepSeconds,
              answerSeconds: stage.answerSeconds,
              question: stage.question,
              recordedUrl,
            })
          }
        />
      )}

      {!showPrivacy && stage.name === 'review' && (
        <ReviewStage
          question={stage.question}
          recordedUrl={stage.recordedUrl}
          onRestart={resetToStart}
          onRerecord={rerecord}
        />
      )}
    </div>
  )
}

export default App
