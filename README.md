# Interview Trainer

A browser-based tool for practicing virtual interviews under realistic time pressure. Everything runs on your device. No account, no server, no upload.
The value of this tool comes from its flexibility to be used by the individual according to how they want to practice.

**Live demo:** https://ariel-f12.github.io/interview-trainer/

---

## What it does

Virtual interviews are a different skill from in-person ones. You are talking to a camera with no reaction to read, under a fixed timer, with no second take. This tool reproduces those conditions so you can practice them deliberately.

1. Pick a track: banking, product management, consulting, or general behavioral.
2. Set your prep time (none, 30s, 45s, 60s) and answer time (1, 2, 3 minutes, or a custom value up to 5).
3. Get a question. Repick if you want a different one.
4. Record your answer. Only a countdown timer is on screen, matching the real format.
5. Review the playback and transcript, then practice again.

Every take is saved locally, grouped by question, so you can compare attempts on identical material over time.

---

## Privacy architecture

This app captures video and audio of your face and voice. That is sensitive data, so the architecture is built around never transmitting it.

**Nothing leaves your device.** There is no backend. Recordings, transcripts, and session history are stored in your browser's IndexedDB and Cache Storage. No analytics, no telemetry, no error reporting, no third-party scripts.

**Enforced, not just intended.** A Content-Security-Policy restricts `connect-src` and `script-src` to `'self'`. The speech recognition model and the ONNX Runtime WebAssembly binaries are vendored into the repository rather than loaded from a CDN, so the deployed site makes zero third-party requests. You can verify this in your browser's Network tab.

**Consent before capture.** The camera is not requested until you have read the notice and checked the box. The notice is versioned; any change to what is collected, where it is processed, or how long it is kept bumps the version and re-prompts everyone.

**Deletion is first-class.** You can delete a single take, all takes of one question, or everything. Withdrawing consent is a full reset: it clears your history, deletes the downloaded speech model, and returns you to the consent screen.

---

## Transcription

Two engines, both on-device, never a cloud service.

**Web Speech API** when your browser supports on-device processing. Chrome ships local speech models to many desktop users. The app sets `processLocally = true` and checks availability before recording.

**Whisper via Transformers.js** as a fallback when it does not. A quantized `whisper-tiny.en` model runs in-browser through WebAssembly. First use requires a one-time download of roughly 64MB, offered explicitly with a size estimate and a decline option. It is cached afterward and works offline.

**Never a cloud fallback.** If neither path is available, the app records without a transcript and says so. It does not silently set `processLocally = false`, which would send your audio to a third-party speech service.

---

## What it currently measures, and what's coming next

Right now the tool gives you the recording, the transcript, and the practice structure. Delivery metrics are the next feature.

When deployed, they will report raw observations (words per minute, filler rate, percentage of allotted time used) rather than composite scores out of 100.

---

## Tech

Vite, React, TypeScript. `idb` for IndexedDB. `@huggingface/transformers` with `onnxruntime-web` for local inference. Deployed as static files to GitHub Pages.

Navigation is an in-memory state machine built on a discriminated union, not a router. Each stage carries only the data valid for that stage, so states like "recording with no question loaded" cannot be represented. A router is not used.
