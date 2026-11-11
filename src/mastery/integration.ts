import {competencies} from '../curriculum/competencies';
import {blankMastery,recordAttempt} from '../mastery/engine';
import type {AttemptKind} from '../mastery/types';
import {validateProgress} from '../progress';
import type {Progress} from '../progress';
import {saveV2,validateV2} from '../migration/progressV2';
import type {ProgressV2} from '../migration/progressV2';
import type {Session} from '../profiles/session';
import {saveSession} from '../profiles/session';

export type LearningEvent={
 lessonId:string;activityId:string;kind:AttemptKind;correct:boolean;hintsUsed:number;
 id:string;attemptedAt:string;
};
/** Atomically commit V2 lesson progress and its associated competency evidence in one storage write.
 * For V1-only users this is a normal V1 save; no mastery records are created.
 */
export function saveLearningEvent(storage:Pick<Storage,'getItem'|'setItem'>,session:Session,next:Progress,event:LearningEvent):Session{
 if(!session.v2)return saveSession(storage,session,next);
 const legacy=validateProgress(next);
 const mapped=competencies.filter(c=>c.lessonIds.some(id=>id===event.lessonId));
 if(mapped.length===0)throw Error('Unmapped lesson evidence');
 const current=session.v2.learners[session.v2.activeLearnerId];
 const records={...current.competencies};
 for(const c of mapped){
  records[c.id]=recordAttempt(records[c.id]??blankMastery(c.id),{
   id:event.id,competencyId:c.id,activityId:event.activityId,kind:event.kind,
   correct:event.correct,hintsUsed:event.hintsUsed,attemptedAt:event.attemptedAt
  });
 }
 const v2:ProgressV2=validateV2({...session.v2,learners:{...session.v2.learners,
  [current.id]:{...current,legacy,competencies:records}}});
 saveV2(storage,v2);
 return {v2,progress:legacy,warning:''};
}
