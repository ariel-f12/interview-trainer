export type Track = 'banking' | 'pm' | 'consulting' | 'behavioral'

export interface Question {
  id: string
  track: Track
  text: string
}

export type Stage =
  | { name: 'track-select' }
  | { name: 'duration-config'; track: Track }
  | {
      name: 'question'
      track: Track
      prepSeconds: number
      answerSeconds: number
      question: Question
    }
  | { name: 'prep'; prepSeconds: number; answerSeconds: number; question: Question }
  | { name: 'recording'; prepSeconds: number; answerSeconds: number; question: Question }
  | {
      name: 'review'
      prepSeconds: number
      answerSeconds: number
      question: Question
      recording: Blob
      actualDurationSeconds: number
      saveStatus: 'saving' | 'saved' | 'error'
    }
