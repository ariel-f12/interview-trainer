export const CONSENT_VERSION = 'v3'

export const CONSENT_STORAGE_KEY = `interview-trainer:consent:${CONSENT_VERSION}`

export interface ConsentRecord {
  version: string
  consentedAt: string
}

export const CONSENT_NOTICE: string[] = [
  'This app uses your device camera and microphone to record practice interview answers.',
  'Video, audio, and face-position data are processed to power the practice features, such as the live preview and delivery feedback.',
  'All processing happens locally, in your browser. Nothing is transmitted to any server — this app has no backend.',
  'Recordings, and any on-device transcripts, are saved to this browser’s local database (IndexedDB) on this device, so you can review them again after closing or reloading the tab. They remain stored until you delete them — individually, by question, or all at once from the history screen — or until you clear this browser’s site data. They never leave this device.',
  'When your browser supports it, your speech is transcribed to text entirely on this device. Audio is never sent to any cloud or third-party speech recognition service. If on-device transcription isn’t available in your browser, the app records without a transcript rather than falling back to one.',
  'This is a practice tool only. It does not predict, score, or simulate how any real employer would evaluate you.',
]
