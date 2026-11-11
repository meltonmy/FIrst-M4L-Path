import {emptyProgress} from '../progress';
import {validateV2} from '../migration/progressV2';
import type {LearnerV2,ProgressV2} from '../migration/progressV2';

export type Academy = LearnerV2['academy'];
const MAX_PROFILES=20;
function validId(id:string){return /^[a-zA-Z0-9_-]{1,80}$/.test(id);}
function validName(name:string){return typeof name==='string' && name.trim().length>0 && name.length<=80;}
/** All operations are pure; never share mutable lesson or mastery records between profiles. */
export function createLearner(progress:ProgressV2, id:string, name:string, academy:Academy):ProgressV2 {
  const current=validateV2(progress);
  if(!validId(id)||!validName(name)||!['kids','teen','adult'].includes(academy))throw Error('Invalid learner profile');
  if(Object.hasOwn(current.learners,id))throw Error('Learner already exists');
  if(Object.keys(current.learners).length>=MAX_PROFILES)throw Error('Profile limit reached');
  const learner:LearnerV2={id,displayName:name.trim(),academy,legacy:emptyProgress(),competencies:{}};
  return validateV2({...current,learners:{...current.learners,[id]:learner}});
}
export function switchLearner(progress:ProgressV2,id:string):ProgressV2 {
  const current=validateV2(progress);
  if(!Object.hasOwn(current.learners,id))throw Error('Learner not found');
  return {...current,activeLearnerId:id};
}
export function updateLearner(progress:ProgressV2,id:string,changes:{displayName?:string;academy?:Academy}):ProgressV2 {
  const current=validateV2(progress);
  const previous=current.learners[id];
  if(!previous)throw Error('Learner not found');
  const next={...previous,...changes};
  if(!validName(next.displayName)||!['kids','teen','adult'].includes(next.academy))throw Error('Invalid learner profile');
  return validateV2({...current,learners:{...current.learners,[id]:next}});
}
export function deleteLearner(progress:ProgressV2,id:string):ProgressV2 {
  const current=validateV2(progress);
  if(!Object.hasOwn(current.learners,id))throw Error('Learner not found');
  if(Object.keys(current.learners).length===1)throw Error('Cannot delete the last learner');
  const learners={...current.learners};
  delete learners[id];
  return validateV2({...current,learners,activeLearnerId:current.activeLearnerId===id?Object.keys(learners).sort()[0]:current.activeLearnerId});
}
export function exportLearner(progress:ProgressV2,id:string):string {
  const current=validateV2(progress);
  const learner=current.learners[id];
  if(!learner)throw Error('Learner not found');
  return JSON.stringify({version:2,activeLearnerId:id,learners:{[id]:learner}},null,2);
}
