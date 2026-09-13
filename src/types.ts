export type Track = 'banking' | 'pm' | 'consulting' | 'behavioral'

export interface Question {
  id: string
  track: Track
  text: string
}

// How an attempt's transcript is produced.
// - 'web-speech': the browser's built-in on-device speech recognition,
//   captured live while recording.
// - 'whisper': an on-device Whisper model, run after recording finishes.
// - 'none': no transcription.
export type TranscriptionMode = 'none' | 'web-speech' | 'whisper'

// What actually produced a stored transcript. Records written before
// Whisper shipped only ever hold 'on-device' or 'none'; older records
// may have no value at all (normalised to 'none' on read).
export type TranscriptSource = 'on-device' | 'on-device-whisper' | 'none'

// Progress of the post-recording Whisper pass on the review screen.
// 'skipped' means Whisper was never the chosen mode for this attempt.
export type WhisperStatus = 'skipped' | 'running' | 'done' | 'error'

export type Stage =
  | { name: 'track-select' }
  | { name: 'duration-config'; track: Track }
  | {
      name: 'question'
      track: Track
      prepSeconds: number
      answerSeconds: number
      transcriptionMode: TranscriptionMode
      question: Question
    }
  | {
      name: 'prep'
      prepSeconds: number
      answerSeconds: number
      transcriptionMode: TranscriptionMode
      question: Question
    }
  | {
      name: 'recording'
      prepSeconds: number
      answerSeconds: number
      transcriptionMode: TranscriptionMode
      question: Question
    }
  | {
      name: 'review'
      prepSeconds: number
      answerSeconds: number
      transcriptionMode: TranscriptionMode
      question: Question
      recording: Blob
      actualDurationSeconds: number
      saveStatus: 'saving' | 'saved' | 'error'
      transcript: string
      transcriptSource: TranscriptSource
      whisperStatus: WhisperStatus
    }
