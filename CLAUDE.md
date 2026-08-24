# Virtual Interview Practice

## What this is
Browser-based tool for practicing virtual interviews. Users pick a track
(banking, PM, consulting, general behavioral), get a question, record an
answer under time pressure, then review playback with delivery metrics.

## Hard constraints
- No backend. No API keys. No LLM calls. Everything runs client-side.
- Must deploy to GitHub Pages as static files.
- Recordings never leave the device. IndexedDB only.
- No dependency that requires a paid tier.

## Stack
- Vite + React
- getUserMedia / MediaRecorder for capture
- MediaPipe Tasks Vision (CDN) for face landmarks
- Web Speech API for transcription
- Web Audio API AnalyserNode for volume and pitch
- IndexedDB for session history

## Metrics
Computed locally with arithmetic and regex only:
time utilization, words per minute, filler rate per minute,
I-to-we ratio, gaze-away percentage, pause count.
Report raw observations, never composite scores out of 100.
Content quality is self-rated by the user, not scored by the app.

## Working style
- Default to Plan mode. Show me the plan before editing files.
- One feature per session. Stop when it works and let me commit.
- I write the metric calculation logic myself. You handle scaffolding,
  browser API wiring, build config, and styling.
- If I ask for something that breaks a hard constraint above, say so
  instead of building it.