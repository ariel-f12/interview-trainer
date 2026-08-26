export const CONSENT_VERSION = 'v1'

export const CONSENT_STORAGE_KEY = `interview-trainer:consent:${CONSENT_VERSION}`

export interface ConsentRecord {
  version: string
  consentedAt: string
}

export const CONSENT_NOTICE: string[] = [
  'This app uses your device camera and microphone to record practice interview answers.',
  'Video, audio, and face-position data are processed to power the practice features, such as the live preview and delivery feedback.',
  'All processing happens locally, in your browser. Nothing is transmitted to any server — this app has no backend.',
  'Recordings currently exist only in memory, for this browser tab. They are not saved anywhere, and are discarded the moment you close or reload the tab.',
  'This is a practice tool only. It does not predict, score, or simulate how any real employer would evaluate you.',
]
