# whisper-tiny.en — model provenance

These files are vendored into the build so speech transcription runs
entirely from this app's own origin. Nothing here is fetched from a CDN
or third party at runtime.

## Source

- Hugging Face repo: `Xenova/whisper-tiny.en`
- Pinned revision (git commit on the Hub):
  `79fb389fc764e7c395bd330e9531d9d32ada7049`
- The same revision string is recorded in `src/speech/whisperModel.ts`
  as `MODEL_REVISION`.

(The `onnx-community/whisper-tiny.en` repo was tried first; its
`decoder_model_merged_quantized.onnx` uses a newer block-quant scheme
that the pinned onnxruntime-web build fails to load
— "Missing required scale ... MatMulNBits". Xenova's classic
per-tensor quantised export loads cleanly.)

## Files kept

Only what the `automatic-speech-recognition` pipeline loads for this
model, at the dtypes we select in `whisperModel.ts`:

- `config.json`, `generation_config.json`, `preprocessor_config.json`,
  `quantize_config.json`
- `tokenizer.json`, `tokenizer_config.json`, `special_tokens_map.json`,
  `added_tokens.json`, `normalizer.json`, `merges.txt`, `vocab.json`
- `onnx/encoder_model.onnx` — encoder, fp32 (~31 MB)
- `onnx/decoder_model_merged_quantized.onnx` — decoder, q8 (~29 MB)

The other quantisation variants in the upstream repo are intentionally
not vendored.

## Refreshing

To move to a newer revision:

1. Download the file set above from
   `https://huggingface.co/Xenova/whisper-tiny.en/resolve/<new-sha>/<path>`
2. Replace the files here.
3. Update `MODEL_REVISION` in `src/speech/whisperModel.ts`.
4. Bump the consent version if anything about what is downloaded, where
   it runs, or how long it is kept has changed (see CLAUDE.md).
