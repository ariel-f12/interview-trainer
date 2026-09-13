# onnxruntime-web WebAssembly runtime

Vendored so the ONNX runtime that powers Whisper transcription loads
from this app's own origin instead of a CDN (onnxruntime-web otherwise
pulls its `.wasm` from `cdn.jsdelivr.net` by default).

- Copied verbatim from `node_modules/onnxruntime-web/dist/`
- Version: `1.26.0-dev.20260416-b7804b056c` (the exact build
  `@huggingface/transformers` depends on — keep them in lockstep)

Files:

- `ort-wasm-simd-threaded.asyncify.{mjs,wasm}` — the SIMD build with the
  Asyncify transform, i.e. the single-threaded runtime for contexts
  without cross-origin isolation. This is the **only** variant this app
  loads: `whisperTranscriber.ts` pins
  `env.backends.onnx.wasm.wasmPaths` to exactly these two files, and
  `numThreads` is forced to 1 because GitHub Pages can't send
  COOP/COEP, so `SharedArrayBuffer` (and the threaded build) is
  unavailable.

The threaded, JSPI, and non-Asyncify variants are deliberately not
vendored. Trade-off: Safari, which onnxruntime-web would otherwise hand
the non-Asyncify build, also gets the Asyncify build here. If that ever
misbehaves on Safari, `transcribeBlob` fails gracefully and the app
records without a transcript.

If `@huggingface/transformers` is upgraded, re-copy this pair from the
new `onnxruntime-web` version.
