import { useEffect, useRef, useState } from 'react'
import './App.css'
import { ConsentGate } from './components/ConsentGate'
import { TrackSelect } from './components/TrackSelect'
import { DurationConfig } from './components/DurationConfig'
import { QuestionStage } from './components/QuestionStage'
import { PrepStage } from './components/PrepStage'
import { RecordingStage } from './components/RecordingStage'
import { ReviewStage } from './components/ReviewStage'
import { pickRandomQuestion } from './data/questions'
import type { Stage } from './types'

const CONSENT_KEY = 'interview-trainer:consent'

function App() {
  const [hasConsented, setHasConsented] = useState(
    () => localStorage.getItem(CONSENT_KEY) === 'true',
  )
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
    localStorage.setItem(CONSENT_KEY, 'true')
    setHasConsented(true)
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

  if (permissionError) {
    return (
      <div className="app">
        <p className="error">
          Camera/microphone access is required: {permissionError}
        </p>
      </div>
    )
  }

  const showPreview = stage.name === 'prep' || stage.name === 'recording'

  return (
    <div className="app">
      <h1>Interview Trainer</h1>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={showPreview ? undefined : 'hidden'}
      />

      {stage.name === 'track-select' && (
        <TrackSelect onSelect={(track) => setStage({ name: 'duration-config', track })} />
      )}

      {stage.name === 'duration-config' && (
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

      {stage.name === 'question' && (
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

      {stage.name === 'prep' && (
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

      {stage.name === 'recording' && (
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

      {stage.name === 'review' && (
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
