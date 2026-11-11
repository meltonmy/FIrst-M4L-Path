import {describe,it,expect} from 'vitest';
import {mysteryLabs,checkMysteryLab} from '../../src/missions/scenarios';
import {skillTree} from '../../src/curriculum/skillTree';
import {blankMastery} from '../../src/mastery/engine';
describe('safe mystery labs',()=>{
 it('accepts exact virtual commands and rejects shell injection',()=>{
  expect(checkMysteryLab(mysteryLabs[0],' pwd ')).toBe(true);
  expect(checkMysteryLab(mysteryLabs[0],'pwd; rm -rf /')).toBe(false);
  expect(checkMysteryLab(mysteryLabs[0],'$(pwd)')).toBe(false);
  expect(checkMysteryLab(mysteryLabs[2],'ip  addr')).toBe(true);
 });
 it('rejects unknown lab objects',()=>{
  expect(()=>checkMysteryLab({...mysteryLabs[0],id:'unknown'},'pwd')).toThrow();
 });
});
describe('skill tree',()=>{
 it('starts with only root competency available',()=>{
  const nodes=skillTree({},new Date('2026-11-10T00:00:00Z'));
  expect(nodes.find(n=>n.id==='linux.kernel-distribution')?.state).toBe('available');
  expect(nodes.find(n=>n.id==='terminal.command-prompt')?.state).toBe('locked');
 });
 it('unlocks prerequisites and exposes due reviews',()=>{
  const r={...blankMastery('linux.kernel-distribution'),status:'proficient' as const,dueAt:'2026-11-01T00:00:00.000Z'};
  const nodes=skillTree({'linux.kernel-distribution':r},new Date('2026-11-10T00:00:00Z'));
  expect(nodes.find(n=>n.id==='linux.kernel-distribution')?.state).toBe('review_due');
  expect(nodes.find(n=>n.id==='terminal.command-prompt')?.state).toBe('available');
 });
});
