type SpeechRecognitionAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable'

interface SpeechRecognitionAvailabilityOptions {
  langs: string[]
  processLocally: boolean
  quality?: 'dictation'
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  processLocally: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
  available(options: SpeechRecognitionAvailabilityOptions): Promise<SpeechRecognitionAvailability>
  install(options: SpeechRecognitionAvailabilityOptions): Promise<unknown>
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}
