import {describe,it,expect} from 'vitest';
import {dailyMissions} from '../../src/missions/daily';
import {assessPlacement} from '../../src/assessment/placement';
import {blankMastery} from '../../src/mastery/engine';
describe('daily memory missions',()=>{
 it('selects due items in order without modifying records',()=>{
  const a={...blankMastery('a'),dueAt:'2026-11-01T00:00:00.000Z'};
  const b={...blankMastery('b'),dueAt:'2026-11-02T00:00:00.000Z'};
  const input=[b,a,blankMastery('new')];
  expect(dailyMissions(input,new Date('2026-11-03T00:00:00Z'),1)).toEqual([{competencyId:'a',kind:'review',dueAt:a.dueAt}]);
  expect(input[0]).toBe(b);
 });
 it('rejects invalid mission sizes',()=>expect(()=>dailyMissions([],new Date(),0)).toThrow());
});
describe('placement assessment',()=>{
 it('recommends entry competency for unassessed learner without claiming mastery',()=>{
  const result=assessPlacement([]);
  expect(result.recommendedCompetencyIds).toContain('linux.kernel-distribution');
  expect(result.demonstratedCompetencyIds).toEqual([]);
 });
 it('unlocks next competencies from independent correct placement responses',()=>{
  const result=assessPlacement([{competencyId:'linux.kernel-distribution',correct:true,independent:true}]);
  expect(result.recommendedCompetencyIds).toContain('terminal.command-prompt');
  expect(result.demonstratedCompetencyIds).toContain('linux.kernel-distribution');
 });
 it('rejects duplicate, invalid and assisted responses',()=>{
  expect(()=>assessPlacement([{competencyId:'bad',correct:true,independent:true}])).toThrow();
  expect(()=>assessPlacement([{competencyId:'linux.kernel-distribution',correct:true,independent:true},{competencyId:'linux.kernel-distribution',correct:true,independent:true}])).toThrow();
  expect(assessPlacement([{competencyId:'linux.kernel-distribution',correct:true,independent:false}]).needsPracticeIds).toContain('linux.kernel-distribution');
 });
});
