// On-device Whisper transcription, used only when the browser's built-in
// speech recognition reports 'unavailable'. Everything here runs in the
// browser: the model and the ONNX runtime are served from this app's own
// origin (see whisperModel.ts), transcription happens on the device, and
// no audio ever leaves it.
//
// @huggingface/transformers (and its onnxruntime-web dependency) is heavy
// and node-flavoured, so it is only ever pulled in via dynamic import()
// from here — the main bundle never touches it.

import { decodeToMono16k } from './audio'
import { sanitizeWhisperTranscript } from './sanitize'
import { MODEL_DTYPE, MODEL_ID, MODEL_WEIGHT_FILES } from './whisperModel'

type ProgressFn = (fraction: number) => void

type TransformersModule = typeof import('@huggingface/transformers')

// The Cache Storage bucket @huggingface/transformers writes model files
// into (env.cacheKey default). Used to tell whether the one-time download
// has already happened.
const TRANSFORMERS_CACHE = 'transformers-cache'

let modulePromise: Promise<TransformersModule> | null = null
let pipelinePromise: Promise<unknown> | null = null
let pipelineReady = false

async function loadModule(): Promise<TransformersModule> {
  if (!modulePromise) {
    modulePromise = import('@huggingface/transformers').then((mod) => {
      const { env } = mod
      // Only ever load the vendored model from our origin.
      env.allowLocalModels = true
      env.allowRemoteModels = false
      env.localModelPath = `${import.meta.env.BASE_URL}models/`
      // Serve onnxruntime-web's runtime from our origin (it otherwise
      // defaults to cdn.jsdelivr.net). A path prefix (not a {mjs,wasm}
      // object — that form makes ORT blob-import the loader, which the
      // CSP's `script-src 'self'` blocks). numThreads=1 because GitHub
      // Pages can't send COOP/COEP, so there's no SharedArrayBuffer;
      // under that config ORT only ever loads the Asyncify SIMD build,
      // which is the single variant vendored in public/ort/.
      const onnxWasm = env.backends?.onnx?.wasm
      if (onnxWasm) {
        onnxWasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`
        onnxWasm.numThreads = 1
      }
      return mod
    })
    modulePromise.catch(() => {
      modulePromise = null
    })
  }
  return modulePromise
}

function makeProgressAggregator(onProgress?: ProgressFn) {
  const perFile = new Map<string, number>()
  return (info: { status?: string; file?: string; progress?: number }) => {
    if (!onProgress || !info.file) return
    if (info.status === 'progress' && typeof info.progress === 'number') {
      perFile.set(info.file, Math.min(100, info.progress))
    } else if (info.status === 'done') {
      perFile.set(info.file, 100)
    } else {
      return
    }
    const values = [...perFile.values()]
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    onProgress(Math.max(0, Math.min(1, mean / 100)))
  }
}

async function getPipeline(onProgress?: ProgressFn): Promise<unknown> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await loadModule()
      const built = await pipeline('automatic-speech-recognition', MODEL_ID, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dtype: MODEL_DTYPE as any,
        device: 'wasm',
        // The bundled onnxruntime-web's "all" graph optimisation pass
        // (TransposeDQWeightsForMatMulNBits) fails to load the quantised
        // Whisper decoder. 'basic' skips it and loads cleanly.
        session_options: { graphOptimizationLevel: 'basic' },
        progress_callback: makeProgressAggregator(onProgress),
      })
      pipelineReady = true
      return built
    })()
    pipelinePromise.catch(() => {
      pipelinePromise = null
    })
  }
  return pipelinePromise
}

async function modelFilesInCache(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  try {
    const cache = await caches.open(TRANSFORMERS_CACHE)
    const keys = await cache.keys()
    const urls = keys.map((request) => request.url)
    return MODEL_WEIGHT_FILES.every((file) =>
      urls.some((url) => url.includes(`/models/${MODEL_ID}/${file}`)),
    )
  } catch {
    return false
  }
}

// Has the one-time model download already happened (this session, or a
// previous one via the browser cache)?
export async function isWhisperModelReady(): Promise<boolean> {
  if (pipelineReady) return true
  return modelFilesInCache()
}

// Kick off (and cache) the model download. Resolves once the pipeline is
// ready; rejects if anything fails so the caller can offer a retry.
export async function downloadWhisperModel(onProgress?: ProgressFn): Promise<void> {
  await getPipeline(onProgress)
}

// Remove the downloaded model (and cached wasm) from Cache Storage.
export async function removeWhisperModel(): Promise<void> {
  pipelinePromise = null
  pipelineReady = false
  if (typeof caches === 'undefined') return
  try {
    await caches.delete(TRANSFORMERS_CACHE)
  } catch {
    // Nothing actionable — the user can clear site data as a fallback.
  }
}

// Transcribe a recorded clip. Returns '' when no speech is detected.
// Throws on decode failure (e.g. a container the browser can't parse) or
// when aborted.
export async function transcribeBlob(
  blob: Blob,
  onProgress?: ProgressFn,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const mod = await loadModule()
  const asr = await getPipeline()
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const audio = await decodeToMono16k(blob)
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StoppingCriteria = (mod as any).InterruptableStoppingCriteria
  const stopper = StoppingCriteria ? new StoppingCriteria() : null
  const onAbort = () => stopper?.interrupt()
  signal?.addEventListener('abort', onAbort)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = asr as (input: Float32Array, options: Record<string, unknown>) => Promise<any>
    onProgress?.(0)
    const output = await run(audio, {
      // Interview answers run well past Whisper's 30s window.
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
      // Dampens in-window repetition loops during silence.
      no_repeat_ngram_size: 3,
      ...(stopper ? { stopping_criteria: stopper } : {}),
    })
    onProgress?.(1)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    const text: string = Array.isArray(output)
      ? output.map((part: { text?: string }) => part.text ?? '').join(' ')
      : (output?.text ?? '')
    return sanitizeWhisperTranscript(text)
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}
