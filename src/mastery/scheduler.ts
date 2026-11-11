import type { Attempt, MasteryRecord } from './types';

/** Pure, deterministic heuristic. Intervals are product defaults, not proven optimal for every learner. */
export function scheduleReview(previous: MasteryRecord, attempt: Attempt, now: Date): Pick<MasteryRecord,'intervalDays'|'dueAt'> {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid review timestamp');
  const minutes = 10 * 60 * 1000;
  const success = attempt.correct && attempt.hintsUsed === 0 && attempt.kind !== 'guided';
  if (!success) {
    const delay = attempt.correct ? 86400000 : minutes;
    return {intervalDays:0,dueAt:new Date(now.getTime()+delay).toISOString()};
  }
  const days = previous.intervalDays > 0 ? Math.min(30,Math.max(1,previous.intervalDays*2)) : 2;
  return {intervalDays:days,dueAt:new Date(now.getTime()+days*86400000).toISOString()};
}
