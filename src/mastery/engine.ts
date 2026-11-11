import type { Attempt, MasteryRecord } from './types';
import { scheduleReview } from './scheduler';

export function blankMastery(competencyId: string): MasteryRecord {
  return {competencyId,status:'new',reviewCount:0,successfulReviews:0,intervalDays:0,dueAt:null,lastAttemptAt:null,evidence:[]};
}
function validTime(s:string):number {
  const t=Date.parse(s);
  if (!Number.isFinite(t)) throw new Error('Invalid attempt timestamp');
  return t;
}
export function statusAt(record:MasteryRecord, now:Date):MasteryRecord['status'] {
  if (record.status==='proficient' && record.dueAt && Date.parse(record.dueAt)<=now.getTime()) return 'review_due';
  return record.status;
}
/** Returns a new record. Same attempt ID is idempotent; existing history is never mutated. */
export function recordAttempt(record:MasteryRecord, attempt:Attempt):MasteryRecord {
  if (!attempt.id || !attempt.activityId || attempt.competencyId!==record.competencyId) throw new Error('Invalid attempt identity');
  if (!Number.isSafeInteger(attempt.hintsUsed) || attempt.hintsUsed<0 || typeof attempt.correct!=='boolean') throw new Error('Invalid attempt result');
  const time=validTime(attempt.attemptedAt);
  if (record.evidence.some(a=>a.id===attempt.id)) return record;
  if (record.lastAttemptAt && time<validTime(record.lastAttemptAt)) throw new Error('Out-of-order attempt');
  const independent=attempt.correct && attempt.hintsUsed===0 && attempt.kind!=='guided';
  const practical=independent && (attempt.kind==='practical'||attempt.kind==='transfer');
  const previousIndependent=record.evidence.some(a=>a.correct && a.hintsUsed===0 && a.kind==='recall' && time-validTime(a.attemptedAt)>=86400000);
  const priorPractical=record.evidence.some(a=>a.correct && a.hintsUsed===0 && (a.kind==='practical'||a.kind==='transfer'));
  const proficiency=independent && (practical||priorPractical) && (previousIndependent||attempt.kind==='recall' && record.evidence.some(a=>a.correct && a.hintsUsed===0 && (a.kind==='practical'||a.kind==='transfer') && time-validTime(a.attemptedAt)>=86400000));
  const review=scheduleReview(record,attempt,new Date(time));
  return {...record,...review,evidence:[...record.evidence,attempt],lastAttemptAt:new Date(time).toISOString(),
    reviewCount:record.reviewCount+1,successfulReviews:record.successfulReviews+(independent?1:0),
    status:proficiency?'proficient':record.status==='proficient'&&independent?'proficient':'developing'};
}
