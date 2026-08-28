import { useState } from 'react'
import { DEFAULT_DURATIONS } from '../data/questions'
import { SpeechAvailability } from './SpeechAvailability'
import type { Track } from '../types'

const PREP_PRESETS = [0, 30, 45, 60]
const ANSWER_PRESETS = [60, 120, 180]
const MIN_ANSWER_SECONDS = 1
const MAX_ANSWER_SECONDS = 300

interface DurationConfigProps {
  track: Track
  onSubmit: (prepSeconds: number, answerSeconds: number, transcriptionEnabled: boolean) => void
}

function clampAnswerSeconds(value: number): number {
  if (Number.isNaN(value)) return MIN_ANSWER_SECONDS
  return Math.min(MAX_ANSWER_SECONDS, Math.max(MIN_ANSWER_SECONDS, Math.round(value)))
}

export function DurationConfig({ track, onSubmit }: DurationConfigProps) {
  const defaults = DEFAULT_DURATIONS[track]
  const [prepSeconds, setPrepSeconds] = useState(defaults.prepSeconds)
  const [answerSeconds, setAnswerSeconds] = useState(defaults.answerSeconds)
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false)

  return (
    <>
      <h1>Set your time</h1>

      <SpeechAvailability onChange={setTranscriptionEnabled} />

      <button
        type="button"
        onClick={() =>
          onSubmit(defaults.prepSeconds, defaults.answerSeconds, transcriptionEnabled)
        }
      >
        Use defaults ({defaults.prepSeconds}s prep / {Math.round(defaults.answerSeconds / 60)}
        min answer)
      </button>

      <div>
        <h2>Prep time</h2>
        <div className="preset-group">
          {PREP_PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              aria-pressed={prepSeconds === seconds}
              className={prepSeconds === seconds ? 'active' : ''}
              onClick={() => setPrepSeconds(seconds)}
            >
              {seconds === 0 ? 'None' : `${seconds}s`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2>Answer time</h2>
        <div className="preset-group">
          {ANSWER_PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              aria-pressed={answerSeconds === seconds}
              className={answerSeconds === seconds ? 'active' : ''}
              onClick={() => setAnswerSeconds(seconds)}
            >
              {seconds / 60} min
            </button>
          ))}
          <label>
            Custom (seconds):
            <input
              type="number"
              min={MIN_ANSWER_SECONDS}
              max={MAX_ANSWER_SECONDS}
              value={answerSeconds}
              onChange={(event) =>
                setAnswerSeconds(clampAnswerSeconds(Number(event.target.value)))
              }
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onSubmit(prepSeconds, clampAnswerSeconds(answerSeconds), transcriptionEnabled)
        }
      >
        Continue
      </button>
    </>
  )
}
