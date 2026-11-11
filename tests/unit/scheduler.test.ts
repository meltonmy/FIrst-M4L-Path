import {describe,it,expect} from 'vitest';
import {blankMastery} from '../../src/mastery/engine';
import {dueCompetencies,REVIEW_POLICY,scheduleReview} from '../../src/mastery/scheduler';
import type {Attempt,MasteryRecord} from '../../src/mastery/types';
const when='2026-11-01T01:30:00.000Z';
const attempt=(overrides:Partial<Attempt>={}):Attempt=>({
 id:'a',competencyId:'filesystem.navigate',activityId:'paths',attemptedAt:when,kind:'recall',correct:true,hintsUsed:0,...overrides
});
const record=(id='filesystem.navigate'):MasteryRecord=>blankMastery(id);
describe('adaptive review scheduler',()=>{
 it('starts independent recall at two days and doubles to the 30-day cap',()=>{
  let r=record();
  for(const expected of [2,4,8,16,30,30]){
   const next=scheduleReview(r,attempt(),new Date(when));
   expect(next.intervalDays).toBe(expected);
   r={...r,...next};
  }
  expect(REVIEW_POLICY.maximumDays).toBe(30);
 });
 it('schedules incorrect responses after ten minutes and resets the next successful interval',()=>{
  const prior={...record(),intervalDays:16};
  const miss=scheduleReview(prior,attempt({correct:false}),new Date(when));
  expect(miss).toEqual({intervalDays:0,dueAt:'2026-11-01T01:40:00.000Z'});
  expect(scheduleReview({...prior,...miss},attempt(),new Date(when)).intervalDays).toBe(2);
 });
 it('does not treat guided or hinted answers as independent',()=>{
  for(const a of [attempt({hintsUsed:1}),attempt({kind:'guided'})]){
   expect(scheduleReview(record(),a,new Date(when))).toEqual({intervalDays:0,dueAt:'2026-11-02T01:30:00.000Z'});
  }
 });
 it('is deterministic across DST and timezone boundaries using UTC durations',()=>{
  const result=scheduleReview(record(),attempt(),new Date(when));
  expect(result.dueAt).toBe('2026-11-03T01:30:00.000Z');
  expect(scheduleReview(record(),attempt(),new Date(when))).toEqual(result);
 });
 it('rejects malformed input',()=>{
  expect(()=>scheduleReview(record(),attempt(),new Date(NaN))).toThrow(/timestamp/);
  expect(()=>scheduleReview(record(),attempt({hintsUsed:-1}),new Date(when))).toThrow(/attempt/);
  expect(()=>scheduleReview(record(),attempt({kind:'invalid' as Attempt['kind']}),new Date(when))).toThrow(/kind/);
 });
 it('returns only due competencies ordered by due date and ID without mutating input',()=>{
  const a={...record('a'),dueAt:'2026-11-01T00:00:00.000Z'};
  const b={...record('b'),dueAt:'2026-11-01T00:00:00.000Z'};
  const later={...record('later'),dueAt:'2026-11-04T00:00:00.000Z'};
  const unseen=record('unseen');
  const input=[later,b,unseen,a];
  expect(dueCompetencies(input,new Date(when)).map(r=>r.competencyId)).toEqual(['a','b']);
  expect(input[0]).toBe(later);
 });
});
