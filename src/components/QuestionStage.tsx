import { QUESTIONS } from '../data/questions'
import type { Question, Track } from '../types'

interface QuestionStageProps {
  track: Track
  question: Question
  onReroll: () => void
  onStart: () => void
}

export function QuestionStage({ track, question, onReroll, onStart }: QuestionStageProps) {
  const canReroll = QUESTIONS[track].length > 1

  return (
    <>
      <h1>Your question</h1>
      <p className="question-card">{question.text}</p>
      {canReroll && (
        <button type="button" onClick={onReroll}>
          Different question
        </button>
      )}
      <button type="button" onClick={onStart}>
        Start
      </button>
    </>
  )
}
