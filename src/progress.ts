import { lessons } from './lessons';
export type RecordProgress={completed:boolean; challenge:boolean; guided:boolean; correct:number; missed:number; due:string|null; lastAnswer:boolean|null};
export type Progress={version:1;mode:'explorer'|'engineer';textSize:'standard'|'large';reducedMotion:boolean;lessons:Record<string,RecordProgress>};
export const KEY='linux-path-progress-v1';
export function emptyProgress():Progress{return {version:1,mode:'explorer',textSize:'standard',reducedMotion:false,lessons:{}};}
export function blankRecord():RecordProgress{return {completed:false,challenge:false,guided:false,correct:0,missed:0,due:null,lastAnswer:null};}
export function validateProgress(value:unknown):Progress {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Choose a Linux Path progress JSON file.');
 const p=value as Progress;
 if(p.version!==1||!['explorer','engineer'].includes(p.mode)||!['standard','large'].includes(p.textSize)||typeof p.reducedMotion!=='boolean'||!p.lessons||typeof p.lessons!=='object'||Array.isArray(p.lessons))throw Error('This progress file is invalid or from an unsupported version. Nothing was changed.');
 const clean=emptyProgress();clean.mode=p.mode;clean.textSize=p.textSize;clean.reducedMotion=p.reducedMotion;
 for(const [id,r] of Object.entries(p.lessons)){
  if(!lessons.some(l=>l.id===id)||!r||typeof r!=='object')throw Error('The progress file contains an unknown lesson.');
  if(['completed','challenge','guided'].some(k=>typeof r[k as keyof RecordProgress]!=='boolean')||![r.correct,r.missed].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000)||!(r.lastAnswer===null||typeof r.lastAnswer==='boolean')||!(r.due===null||typeof r.due==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(r.due)&&Number.isFinite(Date.parse(r.due))))throw Error('The progress file contains invalid lesson data. Nothing was changed.');
  clean.lessons[id]={completed:r.completed,challenge:r.challenge,guided:r.guided,correct:r.correct,missed:r.missed,due:r.due,lastAnswer:r.lastAnswer};
 }
 return clean;
}
export function importProgress(text:string):Progress{if(text.length>1000000)throw Error('Progress files must be smaller than 1 MB.');try{return validateProgress(JSON.parse(text));}catch(e){if(e instanceof SyntaxError)throw Error('This is not valid JSON. Your progress has not changed.');throw e;}}
export function loadProgress(storage:Pick<Storage,'getItem'>):{progress:Progress;warning:string}{try{const saved=storage.getItem(KEY);return {progress:saved?importProgress(saved):emptyProgress(),warning:''};}catch{return {progress:emptyProgress(),warning:'Saved progress could not be read. Your existing browser data has not been overwritten. Export your data or explicitly save new progress to continue.'};}}
export function saveProgress(storage:Pick<Storage,'setItem'>,progress:Progress){storage.setItem(KEY,JSON.stringify(progress));}
export function answerQuestion(p:Progress,id:string,correct:boolean,now=new Date()):Progress{const r={...blankRecord(),...p.lessons[id]};if(correct)r.correct++;else r.missed++;r.lastAnswer=correct;const days=correct?Math.min(30,2**Math.min(r.correct,4)):0;const due=new Date(now.getTime()+(correct?days*86400000:10*60000));r.due=due.toISOString();return {...p,lessons:{...p.lessons,[id]:r}};}
export function dueLessons(p:Progress,now=new Date()){return lessons.filter(l=>{const r=p.lessons[l.id];return r?.due&&new Date(r.due)<=now;});}
export function exportProgress(p:Progress){return JSON.stringify(p,null,2);}
