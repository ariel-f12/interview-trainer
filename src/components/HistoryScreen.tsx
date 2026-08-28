import { useEffect, useState } from 'react'
import {
  clearAllSessions,
  deleteSession,
  deleteSessionsByQuestionId,
  getAllSessionSummaries,
} from '../db/sessions'
import type { SessionSummary } from '../db/sessions'
import { TRACKS } from '../data/questions'
import { SessionPlayback } from './SessionPlayback'

interface HistoryScreenProps {
  onClose: () => void
}

interface QuestionGroup {
  questionId: string
  questionText: string
  trackLabel: string
  takes: SessionSummary[]
  lastPracticed: string
}

function trackLabel(trackId: string): string {
  return TRACKS.find((track) => track.id === trackId)?.label ?? trackId
}

function groupSessions(sessions: SessionSummary[]): QuestionGroup[] {
  const groups = new Map<string, QuestionGroup>()

  for (const session of sessions) {
    const existing = groups.get(session.questionId)
    if (existing) {
      existing.takes.push(session)
      if (session.createdAt > existing.lastPracticed) {
        existing.lastPracticed = session.createdAt
      }
    } else {
      groups.set(session.questionId, {
        questionId: session.questionId,
        questionText: session.questionText,
        trackLabel: trackLabel(session.track),
        takes: [session],
        lastPracticed: session.createdAt,
      })
    }
  }

  const result = Array.from(groups.values())
  for (const group of result) {
    group.takes.sort((a, b) => b.attemptNumber - a.attemptNumber)
  }
  result.sort((a, b) => b.lastPracticed.localeCompare(a.lastPracticed))
  return result
}

export function HistoryScreen({ onClose }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmingTakeId, setConfirmingTakeId] = useState<string | null>(null)
  const [confirmingGroupId, setConfirmingGroupId] = useState<string | null>(null)
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAllSessionSummaries().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setSessions(result.value)
      } else {
        setLoadError(result.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleExpanded = (questionId: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  const confirmDeleteTake = async (id: string) => {
    const result = await deleteSession(id)
    setConfirmingTakeId(null)
    if (result.ok) {
      setSessions((current) => current?.filter((session) => session.id !== id) ?? current)
    } else {
      setActionError(result.error)
    }
  }

  const confirmDeleteGroup = async (questionId: string) => {
    const result = await deleteSessionsByQuestionId(questionId)
    setConfirmingGroupId(null)
    if (result.ok) {
      setSessions(
        (current) => current?.filter((session) => session.questionId !== questionId) ?? current,
      )
    } else {
      setActionError(result.error)
    }
  }

  const confirmClearAll = async () => {
    const result = await clearAllSessions()
    setConfirmingClearAll(false)
    if (result.ok) {
      setSessions([])
    } else {
      setActionError(result.error)
    }
  }

  if (openSessionId && sessions) {
    const session = sessions.find((s) => s.id === openSessionId)
    if (session) {
      return <SessionPlayback session={session} onClose={() => setOpenSessionId(null)} />
    }
  }

  const groups = sessions ? groupSessions(sessions) : []

  return (
    <div className="history-screen">
      <div className="app-header">
        <h2>Practice history</h2>
        <button type="button" className="link-button" onClick={onClose}>
          Close
        </button>
      </div>

      {loadError && <p className="error">Couldn't load practice history: {loadError}</p>}
      {actionError && <p className="error">{actionError}</p>}

      {sessions === null && !loadError && <p>Loading…</p>}

      {sessions !== null && groups.length === 0 && !loadError && (
        <p>No practice sessions saved yet.</p>
      )}

      {groups.map((group) => (
        <div key={group.questionId} className="history-group">
          <button
            type="button"
            className="history-group-header"
            onClick={() => toggleExpanded(group.questionId)}
          >
            <strong>{group.questionText}</strong>
            <span>
              {group.trackLabel} · {group.takes.length} attempt
              {group.takes.length === 1 ? '' : 's'} · last practiced{' '}
              {new Date(group.lastPracticed).toLocaleDateString()}
            </span>
          </button>

          {expanded.has(group.questionId) && (
            <div className="history-group-body">
              {group.takes.map((take) => (
                <div key={take.id} className="session-row">
                  <button type="button" onClick={() => setOpenSessionId(take.id)}>
                    Attempt {take.attemptNumber} — {new Date(take.createdAt).toLocaleString()}
                  </button>
                  {confirmingTakeId === take.id ? (
                    <span className="confirm-inline">
                      Delete this attempt?
                      <button type="button" onClick={() => confirmDeleteTake(take.id)}>
                        Confirm delete
                      </button>
                      <button type="button" onClick={() => setConfirmingTakeId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmingTakeId(take.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))}

              {confirmingGroupId === group.questionId ? (
                <span className="confirm-inline">
                  Delete all {group.takes.length} attempts for this question? This cannot be
                  undone.
                  <button type="button" onClick={() => confirmDeleteGroup(group.questionId)}>
                    Confirm delete all attempts
                  </button>
                  <button type="button" onClick={() => setConfirmingGroupId(null)}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmingGroupId(group.questionId)}>
                  Delete all attempts for this question
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {sessions !== null && sessions.length > 0 && (
        <div className="clear-all">
          {confirmingClearAll ? (
            <span className="confirm-inline">
              Delete all practice data? This cannot be undone.
              <button type="button" onClick={confirmClearAll}>
                Confirm delete all practice data
              </button>
              <button type="button" onClick={() => setConfirmingClearAll(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmingClearAll(true)}>
              Delete all practice data
            </button>
          )}
        </div>
      )}
    </div>
  )
}
