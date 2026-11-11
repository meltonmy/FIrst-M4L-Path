import {describe,it,expect} from 'vitest';
import {KEY,emptyProgress,blankRecord} from '../../src/progress';
import {V2_KEY} from '../../src/migration/progressV2';
import {activateProfiles,addProfile,exportBackup,loadSession,restoreBackup,saveSession,selectProfile,validateBackup} from '../../src/profiles/session';
const storage=(initial:Record<string,string>={})=>{
 const data=new Map(Object.entries(initial));
 return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
};
describe('V2 profile sessions and recovery',()=>{
 it('does not migrate on startup until explicitly activated',()=>{
  const s=storage({[KEY]:JSON.stringify(emptyProgress())});
  expect(loadSession(s).v2).toBeNull();
  expect(s.getItem(V2_KEY)).toBeNull();
 });
 it('copies V1 on activation and saves each learner independently without touching V1',()=>{
  const v1=emptyProgress();v1.lessons.linux={...blankRecord(),completed:true};
  const raw=JSON.stringify(v1),s=storage({[KEY]:raw});
  let session=activateProfiles(s);
  expect(session.progress.lessons.linux.completed).toBe(true);
  session=addProfile(s,session,'kid','Child','kids');
  session=selectProfile(s,session,'kid');
  expect(session.progress.lessons.linux).toBeUndefined();
  const kid={...session.progress,lessons:{...session.progress.lessons,terminal:{...blankRecord(),completed:true}}};
  session=saveSession(s,session,kid);
  session=selectProfile(s,session,'original-learner');
  expect(session.progress.lessons.linux.completed).toBe(true);
  expect(session.progress.lessons.terminal).toBeUndefined();
  expect(s.getItem(KEY)).toBe(raw);
  session=selectProfile(s,session,'kid');
  expect(session.progress.lessons.terminal.completed).toBe(true);
  expect(loadSession(s).progress.lessons.terminal.completed).toBe(true);
 });
 it('exports both versions and restores a verified backup',()=>{
  const s=storage({[KEY]:JSON.stringify(emptyProgress())});
  activateProfiles(s);
  const backup=exportBackup(s);
  expect(validateBackup(backup).v2?.version).toBe(2);
  const dest=storage();
  const restored=restoreBackup(dest,backup);
  expect(restored.v2?.version).toBe(2);
  expect(dest.getItem(KEY)).toBeTruthy();
 });
 it('rejects corrupt backup before writing anything',()=>{
  const s=storage({[KEY]:JSON.stringify(emptyProgress())});
  expect(()=>restoreBackup(s,'{"format":"linux-path-backup","version":1,"v1":{"version":99},"v2":null}')).toThrow();
  expect(s.getItem(V2_KEY)).toBeNull();
 });
 it('retains corrupt V2 and surfaces warning instead of overwriting it',()=>{
  const s=storage({[KEY]:JSON.stringify(emptyProgress()),[V2_KEY]:'{broken'});
  const session=loadSession(s);
  expect(session.warning).toMatch(/could not be read/);
  expect(s.getItem(V2_KEY)).toBe('{broken');
 });
});
