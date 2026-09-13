// Whisper hallucinates during silence, and interview answers contain long
// pauses. The artefacts are almost always exact repetition — a phrase or
// word repeated many times — so we collapse runs of duplicates. This is
// deliberately conservative: it never removes non-repeated content, so a
// stray phantom phrase can survive, but real speech is never deleted.
//
// String/regex only, matching the project's "arithmetic and regex" rule
// for anything downstream of a transcript.

// Notorious pure-silence / end-of-clip artefacts from Whisper's training
// data (video captions). These essentially never occur in a spoken
// interview answer, so we drop them when they land as the final segment.
const TRAILING_ARTIFACTS: RegExp[] = [
  /^thanks? for watching\.?$/i,
  /^please subscribe.*$/i,
  /^like and subscribe.*$/i,
  /^subtitles?(?: and closed captioning)? by .*$/i,
  /^transcription by .*$/i,
  /^amara\.org.*$/i,
  /^\s*[♪♫♩╠]+\s*$/,
]

function splitSegments(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function collapseConsecutiveSegments(segments: string[]): string[] {
  const out: string[] = []
  for (const segment of segments) {
    const previous = out[out.length - 1]
    if (!previous || previous.toLowerCase() !== segment.toLowerCase()) {
      out.push(segment)
    }
  }
  return out
}

// "I I I I I said" -> "I said"; "the the the the" -> "the the".
// Requires 4+ in a row before touching it, so ordinary doubling
// ("had had", "that that") is left alone.
function collapseRepeatedWords(text: string): string {
  return text.replace(
    /\b(\w+)(?:\s+\1\b){3,}/gi,
    (_match, word: string) => word,
  )
}

export function sanitizeWhisperTranscript(raw: string): string {
  const normalized = collapseRepeatedWords(raw.replace(/\s+/g, ' ').trim())
  if (!normalized) return ''

  const segments = collapseConsecutiveSegments(splitSegments(normalized))

  if (segments.length > 1) {
    const last = segments[segments.length - 1]
    if (TRAILING_ARTIFACTS.some((pattern) => pattern.test(last))) {
      segments.pop()
    }
  }

  return segments.join(' ').trim()
}
