import {competencies} from './competencies';
import type {MasteryRecord} from '../mastery/types';
import {statusAt} from '../mastery/engine';
export type SkillNode={id:string;title:string;stageId:string;prerequisites:readonly string[];state:'locked'|'available'|'developing'|'proficient'|'review_due'};
/** Progress visualization only; does not mutate progress or award mastery. */
export function skillTree(records:Readonly<Record<string,MasteryRecord>>,now:Date):SkillNode[]{
 return competencies.map(c=>{
  const r=records[c.id];
  const unlocked=c.prerequisites.every(p=>records[p]?.status==='proficient'||records[p]?.status==='review_due');
  const state:SkillNode['state']=r?statusAt(r,now):unlocked?'available':'locked';
  return {id:c.id,title:c.title,stageId:c.stageId,prerequisites:c.prerequisites,state};
 });
}
