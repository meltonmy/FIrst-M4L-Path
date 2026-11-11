import {competencies} from '../curriculum/competencies';
export type PlacementResponse={competencyId:string;correct:boolean;independent:boolean};
export type PlacementResult={recommendedCompetencyIds:string[];demonstratedCompetencyIds:string[];needsPracticeIds:string[]};
/** Placement recommendations are provisional; never award mastery from a single quiz. */
export function assessPlacement(responses:readonly PlacementResponse[]):PlacementResult{
 const known=new Set(competencies.map(c=>c.id)),seen=new Set<string>(),demonstrated=new Set<string>();
 for(const r of responses){
  if(!known.has(r.competencyId)||seen.has(r.competencyId)||typeof r.correct!=='boolean'||typeof r.independent!=='boolean')throw Error('Invalid placement response');
  seen.add(r.competencyId);
  if(r.correct&&r.independent)demonstrated.add(r.competencyId);
 }
 const needsPracticeIds=competencies.filter(c=>seen.has(c.id)&&!demonstrated.has(c.id)).map(c=>c.id);
 const recommendedCompetencyIds=competencies.filter(c=>!demonstrated.has(c.id)&&c.prerequisites.every(p=>demonstrated.has(p))).map(c=>c.id);
 return {demonstratedCompetencyIds:[...demonstrated],needsPracticeIds,recommendedCompetencyIds};
}
