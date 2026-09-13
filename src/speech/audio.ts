// Decode a recorded media Blob to the mono 16 kHz Float32 PCM that Whisper
// expects. Runs entirely on the device via the Web Audio API.

const TARGET_SAMPLE_RATE = 16_000

type AudioContextCtor = typeof AudioContext

function getAudioContextCtor(): AudioContextCtor | null {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ??
    null
  )
}

export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const Ctor = getAudioContextCtor()
  if (!Ctor) throw new Error('Web Audio API is not available in this browser.')

  const arrayBuffer = await blob.arrayBuffer()

  // A short-lived context just to decode the container. decodeAudioData
  // rejects on formats the browser can't parse (e.g. WebM on Safari) —
  // callers treat that as "no transcript" rather than an error.
  const decodeContext = new Ctor()
  let decoded: AudioBuffer
  try {
    decoded = await decodeContext.decodeAudioData(arrayBuffer)
  } finally {
    void decodeContext.close()
  }

  if (
    decoded.numberOfChannels === 1 &&
    decoded.sampleRate === TARGET_SAMPLE_RATE
  ) {
    return decoded.getChannelData(0).slice()
  }

  const frameCount = Math.max(
    1,
    Math.ceil(decoded.duration * TARGET_SAMPLE_RATE),
  )
  const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()
  return rendered.getChannelData(0).slice()
}
