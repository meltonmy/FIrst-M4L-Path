import type { Attempt, MasteryRecord } from './types';

export const REVIEW_POLICY = Object.freeze({
  retryMinutes: 10,
  assistedDays: 1,
  initialDays: 2,
  maximumDays: 30,
  growthFactor: 2
});

/** Deterministic UTC-duration scheduler; independent of browser timezone and wall-clock locale.
 * These intervals are configurable heuristics, not an empirically universal optimum.
 * Does not modify V1 production scheduling.
 */
export function scheduleReview(previous: MasteryRecord, attempt: Attempt, now: Date): Pick<MasteryRecord,'intervalDays'|'dueAt'> {
  const timestamp=now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error('Invalid review timestamp');
  if (typeof attempt.correct!=='boolean' || !Number.isSafeInteger(attempt.hintsUsed) || attempt.hintsUsed<0)
    throw new Error('Invalid review attempt');
  if (!['recall','guided','practical','transfer'].includes(attempt.kind)) throw new Error('Invalid review kind');
  const independent=attempt.correct && attempt.hintsUsed===0 && attempt.kind!=='guided';
  if (!independent) {
    const delay=attempt.correct ? REVIEW_POLICY.assistedDays*86400000 : REVIEW_POLICY.retryMinutes*60000;
    return {intervalDays:0,dueAt:new Date(timestamp+delay).toISOString()};
  }
  const prior=Number.isFinite(previous.intervalDays) && previous.intervalDays>0
    ? previous.intervalDays : 0;
  const days=prior===0 ? REVIEW_POLICY.initialDays
    : Math.min(REVIEW_POLICY.maximumDays,Math.max(REVIEW_POLICY.initialDays,prior*REVIEW_POLICY.growthFactor));
  return {intervalDays:days,dueAt:new Date(timestamp+days*86400000).toISOString()};
}

/** A due queue for the future V2 integration. Excludes unseen and undated competencies. */
export function dueCompetencies(records: readonly MasteryRecord[], now:Date): MasteryRecord[] {
  const timestamp=now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error('Invalid review timestamp');
  return records.filter(r=>r.dueAt!==null && Number.isFinite(Date.parse(r.dueAt)) && Date.parse(r.dueAt)<=timestamp)
    .sort((a,b)=>Date.parse(a.dueAt!)-Date.parse(b.dueAt!) || a.competencyId.localeCompare(b.competencyId));
}
