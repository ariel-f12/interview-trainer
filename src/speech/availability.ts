const AVAILABILITY_OPTIONS: SpeechRecognitionAvailabilityOptions = {
  langs: ['en-US'],
  processLocally: true,
  quality: 'dictation',
}

const INSTALL_TIMEOUT_MS = 30_000

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export async function checkAvailability(): Promise<SpeechRecognitionAvailability> {
  const Ctor = getSpeechRecognitionConstructor()
  if (!Ctor || typeof Ctor.available !== 'function') return 'unavailable'
  try {
    return await Ctor.available(AVAILABILITY_OPTIONS)
  } catch {
    return 'unavailable'
  }
}

export async function installLanguagePack(): Promise<SpeechRecognitionAvailability> {
  const Ctor = getSpeechRecognitionConstructor()
  if (!Ctor || typeof Ctor.install !== 'function') return 'unavailable'

  const timedOut = Symbol('install-timeout')
  const timeout = new Promise<typeof timedOut>((resolve) =>
    setTimeout(() => resolve(timedOut), INSTALL_TIMEOUT_MS),
  )

  try {
    const outcome = await Promise.race([
      Ctor.install(AVAILABILITY_OPTIONS).catch(() => undefined),
      timeout,
    ])
    if (outcome === timedOut) return 'unavailable'
  } catch {
    return 'unavailable'
  }

  return checkAvailability()
}
