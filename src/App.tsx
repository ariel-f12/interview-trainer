import { useEffect, useRef, useState } from 'react'
import './App.css'
import { ConsentGate } from './components/ConsentGate'
import { PrivacyPanel } from './components/PrivacyPanel'
import { HistoryScreen } from './components/HistoryScreen'
import { TrackSelect } from './components/TrackSelect'
import { DurationConfig } from './components/DurationConfig'
import { QuestionStage } from './components/QuestionStage'
import { PrepStage } from './components/PrepStage'
import { RecordingStage } from './components/RecordingStage'
import { ReviewStage } from './components/ReviewStage'
import { pickRandomQuestion } from './data/questions'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './data/consent'
import type { ConsentRecord } from './data/consent'
import { clearAllSessions, saveSession, updateSessionTranscript } from './db/sessions'
import { removeWhisperModel, transcribeBlob } from './speech/whisperTranscriber'
import type { Stage } from './types'

type Overlay = 'none' | 'privacy' | 'history'

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
  const [activeOverlay, setActiveOverlay] = useState<Overlay>('none')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>({ name: 'track-select' })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const whisperAbortRef = useRef<AbortController | null>(null)

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

  const cancelWhisper = () => {
    whisperAbortRef.current?.abort()
    whisperAbortRef.current = null
  }

  // Runs after recording, off the saved blob, only in 'whisper' mode.
  const runWhisper = (recording: Blob, sessionId: string | null) => {
    cancelWhisper()
    const controller = new AbortController()
    whisperAbortRef.current = controller

    transcribeBlob(recording, undefined, controller.signal)
      .then((text) => {
        if (controller.signal.aborted) return
        setStage((current) =>
          current.name === 'review' && current.recording === recording
            ? {
                ...current,
                transcript: text,
                transcriptSource: 'on-device-whisper',
                whisperStatus: 'done',
              }
            : current,
        )
        if (sessionId) {
          updateSessionTranscript(sessionId, text, 'on-device-whisper')
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setStage((current) =>
          current.name === 'review' && current.recording === recording
            ? { ...current, whisperStatus: 'error' }
            : current,
        )
      })
  }

  const acceptConsent = () => {
    const record: ConsentRecord = {
      version: CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
    }
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    setHasConsented(true)
  }

  const withdrawConsent = () => {
    cancelWhisper()
    localStorage.removeItem(CONSENT_STORAGE_KEY)
    clearAllSessions()
    removeWhisperModel()
    setStage({ name: 'track-select' })
    setActiveOverlay('none')
    setStream(null)
    setPermissionError(null)
    setHasConsented(false)
  }

  const resetToStart = () => {
    cancelWhisper()
    setStage({ name: 'track-select' })
  }

  const rerecord = () => {
    if (stage.name !== 'review') return
    cancelWhisper()
    setStage(
      stage.prepSeconds > 0
        ? {
            name: 'prep',
            prepSeconds: stage.prepSeconds,
            answerSeconds: stage.answerSeconds,
            transcriptionMode: stage.transcriptionMode,
            question: stage.question,
          }
        : {
            name: 'recording',
            prepSeconds: stage.prepSeconds,
            answerSeconds: stage.answerSeconds,
            transcriptionMode: stage.transcriptionMode,
            question: stage.question,
          },
    )
  }

  if (!hasConsented) {
    return <ConsentGate onAccept={acceptConsent} />
  }

  const showPreview =
    (stage.name === 'prep' || stage.name === 'recording') && activeOverlay === 'none'

  return (
    <div className="app">
      <div className="app-header">
        <h1>Interview Trainer</h1>
        {activeOverlay === 'none' && (
          <button
            type="button"
            className="link-button"
            onClick={() => setActiveOverlay('privacy')}
          >
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

      {activeOverlay === 'privacy' && (
        <PrivacyPanel
          onWithdraw={withdrawConsent}
          onClose={() => setActiveOverlay('none')}
        />
      )}

      {activeOverlay === 'history' && (
        <HistoryScreen onClose={() => setActiveOverlay('none')} />
      )}

      {activeOverlay === 'none' && permissionError && (
        <p className="error">Camera/microphone access is required: {permissionError}</p>
      )}

      {activeOverlay === 'none' && !permissionError && stage.name === 'track-select' && (
        <>
          <TrackSelect onSelect={(track) => setStage({ name: 'duration-config', track })} />
          <button
            type="button"
            className="link-button"
            onClick={() => setActiveOverlay('history')}
          >
            Past sessions
          </button>
        </>
      )}

      {activeOverlay === 'none' && stage.name === 'duration-config' && (
        <DurationConfig
          track={stage.track}
          onSubmit={(prepSeconds, answerSeconds, transcriptionMode) =>
            setStage({
              name: 'question',
              track: stage.track,
              prepSeconds,
              answerSeconds,
              transcriptionMode,
              question: pickRandomQuestion(stage.track),
            })
          }
        />
      )}

      {activeOverlay === 'none' && stage.name === 'question' && (
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
                  transcriptionMode: stage.transcriptionMode,
                  question: stage.question,
                })
              : setStage({
                  name: 'recording',
                  prepSeconds: stage.prepSeconds,
                  answerSeconds: stage.answerSeconds,
                  transcriptionMode: stage.transcriptionMode,
                  question: stage.question,
                })
          }
        />
      )}

      {activeOverlay === 'none' && stage.name === 'prep' && (
        <PrepStage
          prepSeconds={stage.prepSeconds}
          onComplete={() =>
            setStage({
              name: 'recording',
              prepSeconds: stage.prepSeconds,
              answerSeconds: stage.answerSeconds,
              transcriptionMode: stage.transcriptionMode,
              question: stage.question,
            })
          }
        />
      )}

      {activeOverlay === 'none' && stage.name === 'recording' && (
        <RecordingStage
          stream={stream}
          question={stage.question}
          answerSeconds={stage.answerSeconds}
          transcriptionMode={stage.transcriptionMode}
          onComplete={(recording, actualDurationSeconds, transcript, transcriptSource) => {
            const runsWhisper = stage.transcriptionMode === 'whisper'

            setStage({
              name: 'review',
              prepSeconds: stage.prepSeconds,
              answerSeconds: stage.answerSeconds,
              transcriptionMode: stage.transcriptionMode,
              question: stage.question,
              recording,
              actualDurationSeconds,
              saveStatus: 'saving',
              transcript,
              transcriptSource,
              whisperStatus: runsWhisper ? 'running' : 'skipped',
            })

            saveSession({
              questionId: stage.question.id,
              questionText: stage.question.text,
              track: stage.question.track,
              prepSeconds: stage.prepSeconds,
              answerSeconds: stage.answerSeconds,
              actualDurationSeconds,
              recording,
              transcript,
              transcriptSource,
            }).then((result) => {
              setStage((current) =>
                current.name === 'review' && current.recording === recording
                  ? { ...current, saveStatus: result.ok ? 'saved' : 'error' }
                  : current,
              )
              if (runsWhisper) {
                runWhisper(recording, result.ok ? result.value.id : null)
              }
            })
          }}
        />
      )}

      {activeOverlay === 'none' && stage.name === 'review' && (
        <ReviewStage
          question={stage.question}
          recording={stage.recording}
          saveStatus={stage.saveStatus}
          transcript={stage.transcript}
          transcriptSource={stage.transcriptSource}
          whisperStatus={stage.whisperStatus}
          onRestart={resetToStart}
          onRerecord={rerecord}
        />
      )}
    </div>
  )
}

export default App
