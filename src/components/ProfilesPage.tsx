import {useRef,useState} from 'react';
import type {Session} from '../profiles/session';
import {exportBackup,validateBackup} from '../profiles/session';
import type {Academy} from '../profiles/learners';

type Props={session:Session;activate:()=>void;add:(id:string,name:string,academy:Academy)=>void;select:(id:string)=>void;restore:(text:string)=>void};
export function ProfilesPage({session,activate,add,select,restore}:Props){
 const [name,setName]=useState('');
 const [academy,setAcademy]=useState<Academy>('adult');
 const [error,setError]=useState('');
 const [pending,setPending]=useState<string|null>(null);
 const file=useRef<HTMLInputElement>(null);
 function attempt(fn:()=>void){try{fn();setError('');}catch(e){setError((e as Error).message);}}
 function backup(){
  attempt(()=>{
   const data=exportBackup(localStorage);
   const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
   const link=document.createElement('a');link.href=url;link.download='linux-path-backup.json';link.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
 }
 return <div className="page-content">
  <div className="page-heading"><div><span className="eyebrow">LOCAL LEARNING SPACES</span><h1>Learner profiles</h1><p>Separate progress for each learner, stored only in this browser.</p></div></div>
  {error&&<p className="warning" role="alert">{error}</p>}
  {!session.v2?<section className="panel"><h2>Enable separate learner profiles</h2>
   <p>Your current Version 1 progress will be copied into an Original Learner profile. The existing Version 1 backup is retained.</p>
   <p>Before continuing, export a backup. Profile activation changes where future progress is saved on this device.</p>
   <button className="secondary" onClick={backup}>Export existing backup</button>{' '}
   <button className="primary" onClick={()=>attempt(activate)}>Enable profiles</button>
  </section>:<>
   <section className="panel"><h2>Choose learner</h2>
    <label htmlFor="active-learner">Active learner</label>
    <select id="active-learner" value={session.v2.activeLearnerId} onChange={e=>attempt(()=>select(e.target.value))}>
     {Object.values(session.v2.learners).map(l=><option key={l.id} value={l.id}>{l.displayName} ({l.academy})</option>)}
    </select><p className="muted-text">Lessons, review dates and preferences are saved independently for each learner.</p>
   </section>
   <section className="panel"><h2>Add a learner</h2>
    <label htmlFor="new-learner-name">Learner name</label><input id="new-learner-name" maxLength={80} value={name} onChange={e=>setName(e.target.value)}/>
    <label htmlFor="new-learner-age">Learning style</label>
    <select id="new-learner-age" value={academy} onChange={e=>setAcademy(e.target.value as Academy)}>
     <option value="kids">Kids</option><option value="teen">Teens</option><option value="adult">Adults</option>
    </select>
    <button className="primary" onClick={()=>attempt(()=>{
     const id='learner-'+crypto.randomUUID().replace(/-/g,'').slice(0,20);
     add(id,name,academy);setName('');
    })}>Create learner</button>
   </section>
  </>}
  <section className="panel"><h2>Backup and recovery</h2>
   <p>Export a backup of both progress formats. Restoring a backup can replace existing learner records; review it before confirming.</p>
   <button className="secondary" onClick={backup}>Download backup JSON</button>{' '}
   <button className="secondary" onClick={()=>file.current?.click()}>Choose backup to restore</button>
   <input className="sr-only" ref={file} type="file" accept=".json,application/json" aria-label="Choose learner backup JSON" onChange={async e=>{
    const f=e.target.files?.[0];e.target.value='';if(!f)return;
    try{if(f.size>6000000)throw Error('Backup is too large');const text=await f.text();validateBackup(text);setPending(text);setError('');}
    catch(err){setError((err as Error).message);}
   }}/>
   {pending&&<div className="warning" role="alert"><p>Replace saved progress with this validated backup? This cannot be undone without another backup.</p>
    <button className="secondary" onClick={()=>setPending(null)}>Cancel restore</button>{' '}
    <button className="primary" onClick={()=>attempt(()=>{restore(pending);setPending(null);})}>Confirm restore</button>
   </div>}
  </section>
 </div>;
}
