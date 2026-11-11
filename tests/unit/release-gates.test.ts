import {describe,it,expect} from 'vitest';
import {emptyProgress,KEY} from '../../src/progress';
import {migrateV1,validateV2,V2_KEY} from '../../src/migration/progressV2';
import {activateProfiles,saveSession} from '../../src/profiles/session';
describe('release data-integrity gates',()=>{
 it('rejects prototype-sensitive learner IDs and competency keys',()=>{
  const base=migrateV1(emptyProgress());
  const malicious=JSON.parse(JSON.stringify(base));
  Object.defineProperty(malicious.learners,'__proto__',{value:{...malicious.learners['original-learner'],id:'__proto__'},enumerable:true});
  expect(()=>validateV2(malicious)).toThrow(/Invalid Version 2 learner/);
  const other=JSON.parse(JSON.stringify(base));
  other.learners['original-learner'].competencies.constructor={};
  expect(()=>validateV2(other)).toThrow(/Invalid mastery record/);
 });
 it('does not write V1 or advance session on failed V2 persistence',()=>{
  const data=new Map<string,string>([[KEY,JSON.stringify(emptyProgress())]]);
  const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{if(k===V2_KEY&&data.has(V2_KEY))throw Error('quota');data.set(k,v);}};
  const session=activateProfiles(storage);
  const original=data.get(KEY);
  expect(()=>saveSession(storage,session,{...session.progress,mode:'engineer'})).toThrow(/quota/);
  expect(data.get(KEY)).toBe(original);
  expect(session.progress.mode).toBe('explorer');
 });
});
