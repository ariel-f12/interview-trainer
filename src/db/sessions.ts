import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Track } from '../types'

export interface SessionRecord {
  id: string
  questionId: string
  questionText: string
  attemptNumber: number
  createdAt: string
  track: Track
  prepSeconds: number
  answerSeconds: number
  actualDurationSeconds: number
  recording: Blob
  transcript: string
  transcriptSource: 'on-device' | 'none'
}

export type SessionSummary = Omit<SessionRecord, 'recording'>

export interface NewSession {
  questionId: string
  questionText: string
  track: Track
  prepSeconds: number
  answerSeconds: number
  actualDurationSeconds: number
  recording: Blob
  transcript: string
  transcriptSource: 'on-device' | 'none'
}

export type DbResult<T> = { ok: true; value: T } | { ok: false; error: string }

async function attempt<T>(fn: () => Promise<T>): Promise<DbResult<T>> {
  try {
    return { ok: true, value: await fn() }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown storage error' }
  }
}

interface SessionsDB extends DBSchema {
  sessions: { key: string; value: SessionRecord }
}

let dbPromise: Promise<IDBPDatabase<SessionsDB>> | null = null

function getDb(): Promise<IDBPDatabase<SessionsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SessionsDB>('interview-trainer', 1, {
      upgrade(db) {
        db.createObjectStore('sessions', { keyPath: 'id' })
      },
    })
    dbPromise.catch(() => {
      dbPromise = null
    })
  }
  return dbPromise
}

async function getAllSummariesRaw(db: IDBPDatabase<SessionsDB>): Promise<SessionSummary[]> {
  const summaries: SessionSummary[] = []
  let cursor = await db.transaction('sessions').store.openCursor()
  while (cursor) {
    const record = cursor.value
    summaries.push({
      id: record.id,
      questionId: record.questionId,
      questionText: record.questionText,
      attemptNumber: record.attemptNumber,
      createdAt: record.createdAt,
      track: record.track,
      prepSeconds: record.prepSeconds,
      answerSeconds: record.answerSeconds,
      actualDurationSeconds: record.actualDurationSeconds,
      // Records saved before transcription shipped won't have these keys at all.
      transcript: record.transcript ?? '',
      transcriptSource: record.transcriptSource ?? 'none',
    })
    cursor = await cursor.continue()
  }
  return summaries
}

export async function saveSession(input: NewSession): Promise<DbResult<SessionRecord>> {
  return attempt(async () => {
    const db = await getDb()
    const existing = await getAllSummariesRaw(db)
    const attemptNumber =
      existing.filter((session) => session.questionId === input.questionId).length + 1
    const record: SessionRecord = {
      ...input,
      id: crypto.randomUUID(),
      attemptNumber,
      createdAt: new Date().toISOString(),
    }
    await db.put('sessions', record)
    return record
  })
}

export async function getAllSessionSummaries(): Promise<DbResult<SessionSummary[]>> {
  return attempt(async () => {
    const db = await getDb()
    return getAllSummariesRaw(db)
  })
}

export async function getSessionRecording(id: string): Promise<DbResult<Blob | undefined>> {
  return attempt(async () => {
    const db = await getDb()
    const record = await db.get('sessions', id)
    return record?.recording
  })
}

export async function deleteSession(id: string): Promise<DbResult<void>> {
  return attempt(async () => {
    const db = await getDb()
    await db.delete('sessions', id)
  })
}

export async function deleteSessionsByQuestionId(questionId: string): Promise<DbResult<void>> {
  return attempt(async () => {
    const db = await getDb()
    const tx = db.transaction('sessions', 'readwrite')
    let cursor = await tx.store.openCursor()
    while (cursor) {
      if (cursor.value.questionId === questionId) {
        await cursor.delete()
      }
      cursor = await cursor.continue()
    }
    await tx.done
  })
}

export async function clearAllSessions(): Promise<DbResult<void>> {
  return attempt(async () => {
    const db = await getDb()
    await db.clear('sessions')
  })
}
