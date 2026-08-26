import type { Question, Track } from '../types'

export const TRACKS: { id: Track; label: string }[] = [
  { id: 'banking', label: 'Investment Banking' },
  { id: 'pm', label: 'Product Management' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'behavioral', label: 'General Behavioral' },
]

export const DEFAULT_DURATIONS: Record<
  Track,
  { prepSeconds: number; answerSeconds: number }
> = {
  banking: { prepSeconds: 30, answerSeconds: 180 },
  pm: { prepSeconds: 30, answerSeconds: 120 },
  consulting: { prepSeconds: 45, answerSeconds: 180 },
  behavioral: { prepSeconds: 0, answerSeconds: 120 },
}

export const QUESTIONS: Record<Track, Question[]> = {
  banking: [
    { id: 'banking-1', track: 'banking', text: 'Walk me through a DCF valuation.' },
    { id: 'banking-2', track: 'banking', text: 'Why investment banking, and why this firm?' },
    {
      id: 'banking-3',
      track: 'banking',
      text: 'Walk me through how the three financial statements link together.',
    },
    {
      id: 'banking-4',
      track: 'banking',
      text: 'A company’s EBITDA is up but its share price is down — what could explain that?',
    },
    {
      id: 'banking-5',
      track: 'banking',
      text: 'Tell me about a deal or transaction in the news recently. What’s your view on it?',
    },
    {
      id: 'banking-6',
      track: 'banking',
      text: 'Describe a time you had to work under a tight deadline with limited information.',
    },
  ],
  pm: [
    {
      id: 'pm-1',
      track: 'pm',
      text: 'Design a product to help elderly users stay connected with family.',
    },
    { id: 'pm-2', track: 'pm', text: 'How would you prioritize a roadmap with three competing feature requests?' },
    {
      id: 'pm-3',
      track: 'pm',
      text: 'Tell me about a product you admire and how you’d improve it.',
    },
    {
      id: 'pm-4',
      track: 'pm',
      text: 'A key metric dropped 10% last week — how do you investigate?',
    },
    {
      id: 'pm-5',
      track: 'pm',
      text: 'Describe a time you disagreed with an engineer or designer on scope. How did you resolve it?',
    },
    {
      id: 'pm-6',
      track: 'pm',
      text: 'How would you measure the success of a new onboarding flow?',
    },
  ],
  consulting: [
    {
      id: 'consulting-1',
      track: 'consulting',
      text: 'A client’s profits are declining despite steady revenue — how would you diagnose why?',
    },
    {
      id: 'consulting-2',
      track: 'consulting',
      text: 'Estimate the number of coffee shops in your city.',
    },
    {
      id: 'consulting-3',
      track: 'consulting',
      text: 'Should a mid-size airline expand into a new international market? How would you approach that question?',
    },
    {
      id: 'consulting-4',
      track: 'consulting',
      text: 'Tell me about a time you had to influence someone without formal authority.',
    },
    {
      id: 'consulting-5',
      track: 'consulting',
      text: 'Walk me through how you’d structure an analysis of a failing product line.',
    },
    {
      id: 'consulting-6',
      track: 'consulting',
      text: 'Why consulting, and why this firm specifically?',
    },
  ],
  behavioral: [
    { id: 'behavioral-1', track: 'behavioral', text: 'Tell me about yourself.' },
    {
      id: 'behavioral-2',
      track: 'behavioral',
      text: 'Describe a time you failed at something. What did you learn?',
    },
    {
      id: 'behavioral-3',
      track: 'behavioral',
      text: 'Tell me about a time you had to persuade a team to adopt your idea.',
    },
    {
      id: 'behavioral-4',
      track: 'behavioral',
      text: 'Describe a conflict with a coworker or teammate and how you handled it.',
    },
    { id: 'behavioral-5', track: 'behavioral', text: 'What’s your greatest weakness?' },
    {
      id: 'behavioral-6',
      track: 'behavioral',
      text: 'Where do you see yourself in five years?',
    },
  ],
}

export function pickRandomQuestion(track: Track, excludeId?: string): Question {
  const bank = QUESTIONS[track]
  const pool = excludeId && bank.length > 1 ? bank.filter((q) => q.id !== excludeId) : bank
  return pool[Math.floor(Math.random() * pool.length)]
}
