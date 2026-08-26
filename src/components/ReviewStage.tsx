import type { Question } from '../types'

interface ReviewStageProps {
  question: Question
  recordedUrl: string
  onRestart: () => void
  onRerecord: () => void
}

export function ReviewStage({
  question,
  recordedUrl,
  onRestart,
  onRerecord,
}: ReviewStageProps) {
  return (
    <>
      <h1>Playback</h1>
      <p className="question-card">{question.text}</p>
      <video src={recordedUrl} controls />
      <div className="actions">
        <button type="button" onClick={onRerecord}>
          Rerecord
        </button>
        <button type="button" onClick={onRestart}>
          Practice another question
        </button>
      </div>
    </>
  )
}
