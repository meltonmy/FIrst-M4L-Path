import {describe,it,expect} from 'vitest';
import {lessons,competencies,validateCompetencies} from '../../src/lessons';
import {blankMastery,recordAttempt,statusAt} from '../../src/mastery/engine';
import type {Attempt} from '../../src/mastery/types';

const attempt=(id:string,kind:Attempt['kind'],day:number,correct=true,hintsUsed=0):Attempt=>({
 id,competencyId:'filesystem.navigate',activityId:'paths',attemptedAt:new Date(Date.UTC(2026,0,day)).toISOString(),kind,correct,hintsUsed
});
describe('competency registry',()=>{
 it('covers every existing lesson and has stable unique references',()=>{
  validateCompetencies();
  const lessonIds=new Set(lessons.map(l=>l.id));
  expect(new Set(competencies.map(c=>c.id)).size).toBe(competencies.length);
  for(const c of competencies) for(const id of c.lessonIds) expect(lessonIds.has(id)).toBe(true);
  for(const l of lessons) expect(competencies.some(c=>c.lessonIds.includes(l.id))).toBe(true);
  expect(lessons).toHaveLength(12);
 });
 it('rejects missing prerequisites and cycles',()=>{
  expect(()=>validateCompetencies([{id:'a',title:'a',stageId:'s',lessonIds:['linux'],prerequisites:['missing']}])).toThrow(/Unknown/);
  expect(()=>validateCompetencies([{id:'a',title:'a',stageId:'s',lessonIds:['linux'],prerequisites:['b']},{id:'b',title:'b',stageId:'s',lessonIds:['linux'],prerequisites:['a']}])).toThrow(/Circular/);
 });
});
describe('memory and mastery engine',()=>{
 it('tracks independent attempts and ignores duplicate submissions',()=>{
  const initial=blankMastery('filesystem.navigate');
  const a=attempt('one','recall',1);
  const next=recordAttempt(initial,a);
  expect(initial.evidence).toHaveLength(0);
  expect(next.evidence).toHaveLength(1);
  expect(recordAttempt(next,a)).toBe(next);
  expect(next.status).toBe('developing');
  expect(next.dueAt).toBe('2026-01-03T00:00:00.000Z');
 });
 it('does not award proficiency from repeated immediate recall',()=>{
  let r=blankMastery('filesystem.navigate');
  r=recordAttempt(r,attempt('one','recall',1));
  r=recordAttempt(r,attempt('two','recall',1));
  expect(r.status).toBe('developing');
 });
 it('requires practical evidence and delayed independent retrieval',()=>{
  let r=blankMastery('filesystem.navigate');
  r=recordAttempt(r,attempt('practical','practical',1));
  expect(r.status).toBe('developing');
  r=recordAttempt(r,attempt('recall','recall',3));
  expect(r.status).toBe('proficient');
  expect(statusAt(r,new Date('2026-01-08T00:00:00Z'))).toBe('review_due');
 });
 it('does not treat guided or hinted work as independent',()=>{
  let r=blankMastery('filesystem.navigate');
  r=recordAttempt(r,attempt('guided','guided',1));
  r=recordAttempt(r,attempt('hint','practical',2,true,1));
  r=recordAttempt(r,attempt('recall','recall',4));
  expect(r.status).toBe('developing');
  expect(r.successfulReviews).toBe(1);
 });
 it('schedules misses in ten minutes and hinted successes tomorrow',()=>{
  let r=recordAttempt(blankMastery('filesystem.navigate'),attempt('miss','recall',1,false));
  expect(r.dueAt).toBe('2026-01-01T00:10:00.000Z');
  r=recordAttempt(r,attempt('hint','recall',2,true,1));
  expect(r.dueAt).toBe('2026-01-03T00:00:00.000Z');
 });
 it('rejects malformed, mismatched, and out-of-order attempts',()=>{
  const r=recordAttempt(blankMastery('filesystem.navigate'),attempt('a','recall',3));
  expect(()=>recordAttempt(r,attempt('b','recall',2))).toThrow(/Out-of-order/);
  expect(()=>recordAttempt(r,{...attempt('b','recall',4),competencyId:'other'})).toThrow(/identity/);
  expect(()=>recordAttempt(r,{...attempt('b','recall',4),hintsUsed:-1})).toThrow(/result/);
 });
});
