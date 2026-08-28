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
- No analytics, telemetry, error reporting, or third-party scripts. Ever.
- Consent notice is versioned. Any change to what data is collected,
  where it is processed, or how long it is kept requires bumping the
  version in the consent localStorage key so existing users re-consent.
- Speech recognition is on-device only. Never set processLocally = false or fall back to a cloud speech service under any circumstance.

## Privacy and compliance
This app processes biometric data (face geometry via MediaPipe) from a
developer who is an Illinois resident, so it is built to BIPA's notice
and consent requirements regardless of whether the statute strictly
applies to a non-commercial tool.

Before adding or changing any data handling, check:
- Does the consent notice still accurately describe what is collected,
  where it is processed, and how long it is kept?
- If not, update the notice text and bump the consent key version.
- Can the user delete this data? Deletion must ship in the same session
  as any new storage, never deferred to a later one.

Notice text lives in one exported constant and is rendered by both the
consent gate and the privacy screen. Do not duplicate it.

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
- If a change would make the consent notice inaccurate, stop and tell me
  before building it.