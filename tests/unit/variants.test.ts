import {describe,it,expect} from 'vitest';
import {competencies} from '../../src/curriculum/competencies';
import {ACADEMY_VARIANTS,STAGES,curriculumFor,validateStages,variantFor} from '../../src/curriculum/variants';
describe('age-adaptive curriculum',()=>{
 it('has seven stable Linux-themed stages with no belts',()=>{
  validateStages();
  expect(STAGES.map(s=>s.id)).toEqual(['kernel-explorer','terminal-navigator','shell-apprentice','system-operator','root-administrator','infrastructure-engineer','system-architect']);
 });
 it('retains the same competency IDs for all ages',()=>{
  const ids=(age:'kids'|'teen'|'adult')=>curriculumFor(age).flatMap(s=>s.competencies.map(c=>c.id)).sort();
  expect(ids('kids')).toEqual(ids('teen'));
  expect(ids('teen')).toEqual(ids('adult'));
  expect(ids('adult')).toEqual(competencies.map(c=>c.id).sort());
 });
 it('uses distinct accessible presentation defaults without changing mastery criteria',()=>{
  expect(variantFor('kids').readingLevel).toBe('simple');
  expect(variantFor('teen').readingLevel).toBe('standard');
  expect(variantFor('adult').readingLevel).toBe('technical');
  expect(ACADEMY_VARIANTS.kids.lessonMinutes).toBeLessThan(ACADEMY_VARIANTS.adult.lessonMinutes);
 });
});
