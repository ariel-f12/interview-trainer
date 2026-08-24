import { useEffect, useRef, useState } from 'react'
import './App.css'

const RECORDING_DURATION_MS = 10_000

function App() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
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
      if (stopTimeoutRef.current !== null) {
        clearTimeout(stopTimeoutRef.current)
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  const startRecording = () => {
    if (!stream) return

    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
      setRecordedUrl(null)
    }

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedUrl(URL.createObjectURL(blob))
      setIsRecording(false)
    }

    mediaRecorder.start()
    setIsRecording(true)

    stopTimeoutRef.current = window.setTimeout(() => {
      mediaRecorder.stop()
    }, RECORDING_DURATION_MS)
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

  return (
    <div className="app">
      <h1>Interview Trainer</h1>
      <video ref={videoRef} autoPlay muted playsInline />
      <button
        type="button"
        onClick={startRecording}
        disabled={!stream || isRecording}
      >
        {isRecording ? 'Recording…' : 'Record 10s clip'}
      </button>
      {recordedUrl && (
        <>
          <h2>Playback</h2>
          <video src={recordedUrl} controls />
        </>
      )}
    </div>
  )
}

export default App
