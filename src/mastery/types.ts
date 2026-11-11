/** Learning evidence is separate from V1 lesson completion and is not persisted by PR 1. */
export type AttemptKind = 'recall' | 'guided' | 'practical' | 'transfer';
export type MasteryStatus = 'new' | 'developing' | 'proficient' | 'review_due';
export type Attempt = {
  id: string;
  competencyId: string;
  activityId: string;
  attemptedAt: string;
  kind: AttemptKind;
  correct: boolean;
  hintsUsed: number;
};
export type MasteryRecord = {
  competencyId: string;
  status: MasteryStatus;
  reviewCount: number;
  successfulReviews: number;
  intervalDays: number;
  dueAt: string | null;
  lastAttemptAt: string | null;
  evidence: Attempt[];
};
