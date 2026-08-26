import { TRACKS } from '../data/questions'
import type { Track } from '../types'

interface TrackSelectProps {
  onSelect: (track: Track) => void
}

export function TrackSelect({ onSelect }: TrackSelectProps) {
  return (
    <>
      <h1>Pick a track</h1>
      <div className="track-grid">
        {TRACKS.map((track) => (
          <button key={track.id} type="button" onClick={() => onSelect(track.id)}>
            {track.label}
          </button>
        ))}
      </div>
    </>
  )
}
