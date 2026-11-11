import {describe,it,expect} from 'vitest';
import {emptyProgress,blankRecord} from '../../src/progress';
import {migrateV1,validateV2} from '../../src/migration/progressV2';
import {createLearner,deleteLearner,exportLearner,switchLearner,updateLearner} from '../../src/profiles/learners';
describe('learner profile isolation',()=>{
 const initial=()=>migrateV1(emptyProgress());
 it('creates empty isolated profiles and preserves original',()=>{
  const v1=initial();const next=createLearner(v1,'kid-1','Learner','kids');
  expect(next.learners['kid-1'].legacy.lessons).toEqual({});
  expect(next.learners['original-learner'].legacy).toEqual(v1.learners['original-learner'].legacy);
  expect(v1.learners['kid-1']).toBeUndefined();
  expect(next.activeLearnerId).toBe('original-learner');
 });
 it('switches active learner without modifying data',()=>{
  const v1=createLearner(initial(),'kid-1','Learner','kids');
  const next=switchLearner(v1,'kid-1');
  expect(next.activeLearnerId).toBe('kid-1');
  expect(v1.activeLearnerId).toBe('original-learner');
  expect(()=>switchLearner(next,'missing')).toThrow(/not found/);
 });
 it('rejects duplicate IDs, unsafe IDs and invalid names',()=>{
  const v1=initial();
  expect(()=>createLearner(v1,'original-learner','Again','adult')).toThrow(/exists/);
  expect(()=>createLearner(v1,'../evil','No','adult')).toThrow(/Invalid/);
  expect(()=>createLearner(v1,'kid',' ','kids')).toThrow(/Invalid/);
 });
 it('updates metadata only and does not cross-contaminate progress',()=>{
  const v1=createLearner(initial(),'kid-1','Child','kids');
  v1.learners['original-learner'].legacy.lessons.paths={...blankRecord(),completed:true};
  const next=updateLearner(v1,'kid-1',{academy:'teen',displayName:'Student'});
  expect(next.learners['kid-1'].legacy.lessons.paths).toBeUndefined();
  expect(next.learners['original-learner'].legacy.lessons.paths.completed).toBe(true);
  expect(next.learners['kid-1'].academy).toBe('teen');
 });
 it('never deletes the last profile and chooses a surviving active profile',()=>{
  expect(()=>deleteLearner(initial(),'original-learner')).toThrow(/last/);
  const v1=switchLearner(createLearner(initial(),'kid-1','Child','kids'),'kid-1');
  const next=deleteLearner(v1,'kid-1');
  expect(next.activeLearnerId).toBe('original-learner');
  expect(next.learners['kid-1']).toBeUndefined();
 });
 it('exports only selected learner without leaking other profiles',()=>{
  const v1=createLearner(initial(),'kid-1','Child','kids');
  const exported=exportLearner(v1,'kid-1');
  const parsed=validateV2(JSON.parse(exported));
  expect(Object.keys(parsed.learners)).toEqual(['kid-1']);
  expect(exported).not.toContain('original-learner');
 });
});
