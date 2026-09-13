// Whisper speech-recognition model, vendored with the build and served
// from this app's own origin (see public/models/whisper-tiny.en/SOURCING.md
// and public/ort/README.md). Nothing here is fetched from a CDN at runtime.

// Hugging Face repo the vendored files were taken from.
export const MODEL_REPO = 'Xenova/whisper-tiny.en'

// Pinned revision (git commit on the Hub) of the vendored files. Kept for
// provenance; bump this and re-vendor the files together (see SOURCING.md).
export const MODEL_REVISION = '79fb389fc764e7c395bd330e9531d9d32ada7049'

// Directory name under env.localModelPath (which we set to
// `${BASE_URL}models/`). Matches the folder in public/models/.
export const MODEL_ID = 'whisper-tiny.en'

// dtype per ONNX graph: encoder in fp32 for acoustic fidelity, decoder
// quantised (q8 -> `_quantized` suffix) to keep the download reasonable.
export const MODEL_DTYPE = {
  encoder_model: 'fp32',
  decoder_model_merged: 'q8',
} as const

// Files the pipeline actually requests, relative to the model directory.
// Used to detect whether the model is already in the browser cache.
export const MODEL_WEIGHT_FILES = [
  'onnx/encoder_model.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
] as const

// Rough size of the first-use download, for the UI copy. encoder (~31 MB)
// + quantised decoder (~29 MB) + tokenizer/config JSON (~4 MB).
export const MODEL_DOWNLOAD_MB = 65
