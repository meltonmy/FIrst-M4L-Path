import {KEY as V1_KEY, importProgress, validateProgress} from '../progress';
import type {Progress} from '../progress';
import type {MasteryRecord} from '../mastery/types';

/** Additive V2 schema. V1 is kept as an exact validated snapshot until UI migration. */
export const V2_KEY='linux-path-progress-v2';
export const V2_STAGING_KEY='linux-path-progress-v2-staging';
export type LearnerV2={
  id:string;
  displayName:string;
  academy:'kids'|'teen'|'adult';
  legacy:Progress;
  competencies:Record<string,MasteryRecord>;
};
export type ProgressV2={
  version:2;
  activeLearnerId:string;
  learners:Record<string,LearnerV2>;
};
export type MigrationResult={progress:ProgressV2|null;source:'v2'|'v1'|'empty'|'error';warning:string};
type ReadWriteStorage=Pick<Storage,'getItem'|'setItem'>;

function object(value:unknown):value is Record<string,unknown>{
  return !!value && typeof value==='object' && !Array.isArray(value);
}
function validMastery(value:unknown,id:string):value is MasteryRecord {
  if(!object(value)||value.competencyId!==id||!['new','developing','proficient','review_due'].includes(String(value.status)))return false;
  if(![value.reviewCount,value.successfulReviews,value.intervalDays].every(n=>Number.isSafeInteger(n)&&Number(n)>=0))return false;
  if(Number(value.successfulReviews)>Number(value.reviewCount))return false;
  if(value.dueAt!==null && (typeof value.dueAt!=='string'||!Number.isFinite(Date.parse(value.dueAt))))return false;
  if(value.lastAttemptAt!==null && (typeof value.lastAttemptAt!=='string'||!Number.isFinite(Date.parse(value.lastAttemptAt))))return false;
  if(!Array.isArray(value.evidence)||value.evidence.length>10000)return false;
  const ids=new Set<string>();
  for(const a of value.evidence){
    if(!object(a)||typeof a.id!=='string'||!a.id||ids.has(a.id)||a.competencyId!==id||typeof a.activityId!=='string'||!a.activityId||typeof a.attemptedAt!=='string'||!Number.isFinite(Date.parse(a.attemptedAt))||!['recall','guided','practical','transfer'].includes(String(a.kind))||typeof a.correct!=='boolean'||!Number.isSafeInteger(a.hintsUsed)||Number(a.hintsUsed)<0)return false;
    ids.add(a.id);
  }
  return true;
}
export function validateV2(input:unknown):ProgressV2 {
  if(!object(input)||input.version!==2||typeof input.activeLearnerId!=='string'||!object(input.learners))throw Error('Invalid Version 2 progress. Existing data was not changed.');
  const entries=Object.entries(input.learners);
  if(entries.length===0||entries.length>100||!Object.hasOwn(input.learners,input.activeLearnerId))throw Error('Invalid Version 2 learner list.');
  const learners:Record<string,LearnerV2>={};
  for(const [id,value] of entries){
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!object(value)||value.id!==id||typeof value.displayName!=='string'||!value.displayName.trim()||value.displayName.length>80||!['kids','teen','adult'].includes(String(value.academy))||!object(value.competencies))throw Error('Invalid Version 2 learner.');
    const competencies:Record<string,MasteryRecord>={};
    if(Object.keys(value.competencies).length>1000)throw Error('Too many competency records.');
    for(const [cid,mastery] of Object.entries(value.competencies)){
      if(!validMastery(mastery,cid))throw Error('Invalid mastery record.');
      competencies[cid]=mastery;
    }
    learners[id]={id,displayName:value.displayName,academy:value.academy as LearnerV2['academy'],legacy:validateProgress(value.legacy),competencies};
  }
  return {version:2,activeLearnerId:input.activeLearnerId,learners};
}
export function migrateV1(v1:Progress):ProgressV2 {
  const legacy=validateProgress(v1);
  const id='original-learner';
  return {version:2,activeLearnerId:id,learners:{[id]:{
    id,displayName:'Original Learner',academy:'adult',legacy,competencies:{}
  }}};
}
function parseV2(raw:string):ProgressV2 {
  if(raw.length>5000000)throw Error('Version 2 progress exceeds the size limit.');
  return validateV2(JSON.parse(raw));
}
/** Does not modify any storage keys on read or migration failure. Never deletes V1. */
export function loadOrMigrateV2(storage:ReadWriteStorage):MigrationResult {
  try{
    const existing=storage.getItem(V2_KEY);
    if(existing!==null)return {progress:parseV2(existing),source:'v2',warning:''};
    const legacyRaw=storage.getItem(V1_KEY);
    if(legacyRaw===null)return {progress:null,source:'empty',warning:''};
    const migrated=migrateV1(importProgress(legacyRaw));
    const encoded=JSON.stringify(migrated);
    // Staging and read-back protect against truncated or rejected writes.
    storage.setItem(V2_STAGING_KEY,encoded);
    if(storage.getItem(V2_STAGING_KEY)!==encoded)throw Error('Staging verification failed.');
    storage.setItem(V2_KEY,encoded);
    const confirmed=storage.getItem(V2_KEY);
    if(confirmed!==encoded)throw Error('Version 2 verification failed.');
    return {progress:parseV2(confirmed),source:'v1',warning:''};
  }catch{
    return {progress:null,source:'error',warning:'Migration could not be verified. Original Version 1 data has not been deleted. Do not reset or overwrite browser storage; export a backup before retrying.'};
  }
}
/** Explicit V2 writes, separate from the unchanged V1 application path. */
export function saveV2(storage:Pick<Storage,'setItem'>,progress:ProgressV2):void {
  storage.setItem(V2_KEY,JSON.stringify(validateV2(progress)));
}
