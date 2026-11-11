import {describe,it,expect} from 'vitest';
import {blankRecord,emptyProgress,KEY,exportProgress} from '../../src/progress';
import {loadOrMigrateV2,migrateV1,saveV2,validateV2,V2_KEY,V2_STAGING_KEY} from '../../src/migration/progressV2';

function memoryStorage(initial:Record<string,string>={}){
 const data=new Map(Object.entries(initial));
 return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
}
const legacy=()=>{
 const p=emptyProgress();p.mode='engineer';p.textSize='large';p.reducedMotion=true;
 p.lessons.paths={...blankRecord(),completed:true,guided:true,challenge:true,correct:7,missed:2,due:'2026-12-01T00:00:00.000Z',lastAnswer:false};
 return p;
};
describe('non-destructive V1 to V2 migration',()=>{
 it('preserves all V1 lesson fields, settings and review dates exactly',()=>{
  const original=legacy();const raw=exportProgress(original);
  const storage=memoryStorage({[KEY]:raw});
  const result=loadOrMigrateV2(storage);
  expect(result.source).toBe('v1');
  expect(result.progress?.learners['original-learner'].legacy).toEqual(original);
  expect(result.progress?.learners['original-learner'].competencies).toEqual({});
  expect(storage.getItem(KEY)).toBe(raw);
  expect(storage.getItem(V2_STAGING_KEY)).toBe(storage.getItem(V2_KEY));
 });
 it('is idempotent and never overwrites newer V2 records',()=>{
  const storage=memoryStorage({[KEY]:exportProgress(legacy())});
  const first=loadOrMigrateV2(storage).progress!;
  first.learners['original-learner'].displayName='Updated Learner';
  saveV2(storage,first);
  const before=storage.getItem(V2_KEY);
  expect(loadOrMigrateV2(storage).progress?.learners['original-learner'].displayName).toBe('Updated Learner');
  expect(storage.getItem(V2_KEY)).toBe(before);
 });
 it('does not invent historical competency mastery',()=>{
  const migrated=migrateV1(legacy());
  expect(migrated.learners['original-learner'].competencies).toEqual({});
  expect(migrated.learners['original-learner'].legacy.lessons.paths.completed).toBe(true);
 });
 it('does not write on an empty browser',()=>{
  const storage=memoryStorage();
  expect(loadOrMigrateV2(storage).source).toBe('empty');
  expect(storage.data.size).toBe(0);
 });
 it('rejects corrupt V1 without overwriting it',()=>{
  const storage=memoryStorage({[KEY]:'{broken'});
  expect(loadOrMigrateV2(storage).source).toBe('error');
  expect(storage.getItem(KEY)).toBe('{broken');
  expect(storage.getItem(V2_KEY)).toBeNull();
 });
 it('refuses corrupt V2 rather than silently replacing it from V1',()=>{
  const storage=memoryStorage({[KEY]:exportProgress(legacy()),[V2_KEY]:'{}'});
  expect(loadOrMigrateV2(storage).source).toBe('error');
  expect(storage.getItem(V2_KEY)).toBe('{}');
 });
 it('leaves V1 intact after quota or interrupted write failures',()=>{
  const original=exportProgress(legacy());
  const data=new Map([[KEY,original]]);
  const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{
   if(k===V2_KEY)throw Error('QuotaExceededError');
   data.set(k,v);
  }};
  expect(loadOrMigrateV2(storage).source).toBe('error');
  expect(storage.getItem(KEY)).toBe(original);
  expect(storage.getItem(V2_KEY)).toBeNull();
 });
 it('detects a truncated read-back',()=>{
  const original=exportProgress(legacy());
  const data=new Map([[KEY,original]]);
  const storage={getItem:(k:string)=>k===V2_KEY?'truncated':data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  expect(loadOrMigrateV2(storage).source).toBe('error');
  expect(data.get(KEY)).toBe(original);
 });
 it('rejects invalid learner references and malformed nested progress',()=>{
  const base=migrateV1(legacy());
  expect(()=>validateV2({...base,activeLearnerId:'missing'})).toThrow();
  expect(()=>validateV2({...base,learners:{'original-learner':{...base.learners['original-learner'],legacy:{...legacy(),version:99}}}})).toThrow();
  expect(()=>validateV2({...base,learners:{'original-learner':{...base.learners['original-learner'],competencies:{bad:{status:'proficient'}}}}})).toThrow();
 });
});
