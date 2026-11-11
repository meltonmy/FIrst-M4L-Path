import {KEY as V1_KEY,importProgress,loadProgress,saveProgress,validateProgress} from '../progress';
import type {Progress} from '../progress';
import {loadOrMigrateV2,saveV2,validateV2,V2_KEY} from '../migration/progressV2';
import type {ProgressV2} from '../migration/progressV2';
import {createLearner,switchLearner} from './learners';
import type {Academy} from './learners';

type StorageRW=Pick<Storage,'getItem'|'setItem'>;
export type Session={v2:ProgressV2|null;progress:Progress;warning:string};
export function loadSession(storage:StorageRW):Session{
 const v1=loadProgress(storage);
 try{
  const raw=storage.getItem(V2_KEY);
  if(raw===null)return {v2:null,progress:v1.progress,warning:v1.warning};
  if(raw.length>5000000)throw Error('Oversized V2 data');
  const v2=validateV2(JSON.parse(raw));
  return {v2,progress:v2.learners[v2.activeLearnerId].legacy,warning:''};
 }catch{
  return {v2:null,progress:v1.progress,warning:'Version 2 learner data could not be read. It has not been overwritten. Export or recover your data before changing profiles.'};
 }
}
/** Only explicitly activating profiles initiates migration. Original V1 key is never removed. */
export function activateProfiles(storage:StorageRW):Session{
 const result=loadOrMigrateV2(storage);
 if(!result.progress)throw Error(result.warning||'Save lesson progress before enabling profiles.');
 return {v2:result.progress,progress:result.progress.learners[result.progress.activeLearnerId].legacy,warning:''};
}
export function saveSession(storage:StorageRW,session:Session,next:Progress):Session{
 const validated=validateProgress(next);
 if(!session.v2){
  saveProgress(storage,validated);
  return {...session,progress:validated,warning:''};
 }
 const v2=validateV2({...session.v2,learners:{...session.v2.learners,
  [session.v2.activeLearnerId]:{...session.v2.learners[session.v2.activeLearnerId],legacy:validated}}});
 saveV2(storage,v2);
 return {v2,progress:validated,warning:''};
}
export function selectProfile(storage:StorageRW,session:Session,id:string):Session{
 if(!session.v2)throw Error('Profiles have not been activated');
 const v2=switchLearner(session.v2,id);
 saveV2(storage,v2);
 return {...session,v2,progress:v2.learners[id].legacy,warning:''};
}
export function addProfile(storage:StorageRW,session:Session,id:string,name:string,academy:Academy):Session{
 if(!session.v2)throw Error('Profiles have not been activated');
 const v2=createLearner(session.v2,id,name,academy);
 saveV2(storage,v2);
 return {...session,v2,warning:''};
}
/** Backup both storage generations; importing it is a separate, explicit operation. */
export function exportBackup(storage:Pick<Storage,'getItem'>):string{
 const rawV1=storage.getItem(V1_KEY);
 const rawV2=storage.getItem(V2_KEY);
 const v1=rawV1===null?null:importProgress(rawV1);
 const v2=rawV2===null?null:validateV2(JSON.parse(rawV2));
 if(!v1&&!v2)throw Error('No saved progress to export');
 return JSON.stringify({format:'linux-path-backup',version:1,v1,v2},null,2);
}
/** Validates the entire backup before writing. Never deletes V1. */
export function validateBackup(text:string):{v1:Progress|null;v2:ProgressV2|null}{
 if(text.length>6000000)throw Error('Backup file is too large');
 const value:unknown=JSON.parse(text);
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid backup');
 const data=value as Record<string,unknown>;
 if(data.format!=='linux-path-backup'||data.version!==1)throw Error('Unsupported backup');
 const v1=data.v1===null?null:validateProgress(data.v1);
 const v2=data.v2===null?null:validateV2(data.v2);
 if(!v1&&!v2)throw Error('Empty backup');
 return {v1,v2};
}
/** Recovery never deletes the original V1 key; call only after explicit user confirmation. */
export function restoreBackup(storage:StorageRW,text:string):Session{
 const backup=validateBackup(text);
 // Commit V2 first; keep old V1 as a separate fallback until V2 verifies.
 if(backup.v2){
  const encoded=JSON.stringify(backup.v2);
  storage.setItem(V2_KEY,encoded);
  if(storage.getItem(V2_KEY)!==encoded)throw Error('V2 restore verification failed');
 }
 if(backup.v1){
  const encoded=JSON.stringify(backup.v1);
  storage.setItem(V1_KEY,encoded);
  if(storage.getItem(V1_KEY)!==encoded)throw Error('V1 restore verification failed');
 }
 return loadSession(storage);
}
