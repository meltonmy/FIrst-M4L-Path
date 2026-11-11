import {competencies} from './competencies';
import type {Academy} from '../profiles/learners';
export type PresentationVariant={academy:Academy;readingLevel:'simple'|'standard'|'technical';lessonMinutes:number;hintStyle:'visual'|'guided'|'minimal';scenarioTone:'playful'|'practical'|'professional'};
export const ACADEMY_VARIANTS:Readonly<Record<Academy,PresentationVariant>>={
 kids:{academy:'kids',readingLevel:'simple',lessonMinutes:8,hintStyle:'visual',scenarioTone:'playful'},
 teen:{academy:'teen',readingLevel:'standard',lessonMinutes:12,hintStyle:'guided',scenarioTone:'practical'},
 adult:{academy:'adult',readingLevel:'technical',lessonMinutes:18,hintStyle:'minimal',scenarioTone:'professional'}
};
export const STAGES=[
 {id:'kernel-explorer',title:'Kernel Explorer',order:1},
 {id:'terminal-navigator',title:'Terminal Navigator',order:2},
 {id:'shell-apprentice',title:'Shell Apprentice',order:3},
 {id:'system-operator',title:'System Operator',order:4},
 {id:'root-administrator',title:'Root Administrator',order:5},
 {id:'infrastructure-engineer',title:'Infrastructure Engineer',order:6},
 {id:'system-architect',title:'System Architect',order:7}
] as const;
export function variantFor(academy:Academy):PresentationVariant{return ACADEMY_VARIANTS[academy];}
export function curriculumFor(academy:Academy){
 const variant=variantFor(academy);
 return STAGES.map(stage=>({...stage,variant,competencies:competencies.filter(c=>c.stageId===stage.id)}));
}
export function validateStages():void{
 const ids=new Set(STAGES.map(s=>s.id));
 if(ids.size!==STAGES.length)throw Error('Duplicate stage ID');
 for(const c of competencies)if(!ids.has(c.stageId as typeof STAGES[number]['id']))throw Error('Unmapped stage: '+c.stageId);
}
validateStages();
