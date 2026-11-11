import {describe,it,expect} from 'vitest';
import {emptyProgress,KEY} from '../../src/progress';
import {activateProfiles,addProfile,selectProfile} from '../../src/profiles/session';
import {saveLearningEvent} from '../../src/mastery/integration';
import {V2_KEY} from '../../src/migration/progressV2';
const storage=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
const event=(id:string,kind:'recall'|'guided'|'practical',day:number,correct=true)=>({
 id,lessonId:'paths',activityId:'paths-'+kind,kind,correct,hintsUsed:0,attemptedAt:new Date(Date.UTC(2026,0,day)).toISOString()
});
describe('mastery evidence integration',()=>{
 it('does not create mastery for V1 users',()=>{
  const s=storage();const session={v2:null,progress:emptyProgress(),warning:''};
  const next=saveLearningEvent(s,session,emptyProgress(),event('a','recall',1));
  expect(next.v2).toBeNull();expect(s.getItem(V2_KEY)).toBeNull();expect(s.getItem(KEY)).toBeTruthy();
 });
 it('records guided, practical and delayed recall without awarding premature mastery',()=>{
  const s=storage();s.setItem(KEY,JSON.stringify(emptyProgress()));
  let session=activateProfiles(s);
  session=saveLearningEvent(s,session,session.progress,event('g','guided',1));
  session=saveLearningEvent(s,session,session.progress,event('p','practical',2));
  expect(session.v2!.learners['original-learner'].competencies['filesystem.navigate'].status).toBe('developing');
  session=saveLearningEvent(s,session,session.progress,event('r','recall',4));
  const r=session.v2!.learners['original-learner'].competencies['filesystem.navigate'];
  expect(r.status).toBe('proficient');expect(r.evidence).toHaveLength(3);
  expect(s.getItem(KEY)).toBe(JSON.stringify(emptyProgress()));
 });
 it('never leaks evidence to a second learner',()=>{
  const s=storage();s.setItem(KEY,JSON.stringify(emptyProgress()));
  let session=activateProfiles(s);
  session=addProfile(s,session,'kid','Child','kids');
  session=selectProfile(s,session,'kid');
  session=saveLearningEvent(s,session,session.progress,event('kid-1','practical',1));
  expect(session.v2!.learners['original-learner'].competencies['filesystem.navigate']).toBeUndefined();
  expect(session.v2!.learners.kid.competencies['filesystem.navigate'].evidence).toHaveLength(1);
 });
 it('rejects unmapped lessons without writing V2',()=>{
  const s=storage();s.setItem(KEY,JSON.stringify(emptyProgress()));
  const session=activateProfiles(s);const before=s.getItem(V2_KEY);
  expect(()=>saveLearningEvent(s,session,session.progress,{...event('a','recall',1),lessonId:'unknown'})).toThrow();
  expect(s.getItem(V2_KEY)).toBe(before);
 });
});
