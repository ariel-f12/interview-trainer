interface TranscriptBlockProps {
  transcript: string
  transcriptSource: 'on-device' | 'none'
}

export function TranscriptBlock({ transcript, transcriptSource }: TranscriptBlockProps) {
  if (transcriptSource === 'none') {
    return <p className="save-status">No transcript for this attempt.</p>
  }

  return (
    <div>
      <h2>Transcript</h2>
      <p>{transcript.trim() ? transcript : '(no speech detected)'}</p>
    </div>
  )
}
