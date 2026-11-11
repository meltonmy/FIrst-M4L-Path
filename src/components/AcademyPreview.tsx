import {useState} from 'react';
import {curriculumFor} from '../curriculum/variants';
import type {Academy} from '../profiles/learners';
import {mysteryLabs,checkMysteryLab} from '../missions/scenarios';

/** Read-only curriculum preview: deliberately does not migrate or modify V1 progress. */
export function AcademyPreview(){
 const [academy,setAcademy]=useState<Academy>('adult');
 const [command,setCommand]=useState('');
 const [result,setResult]=useState<string>('');
 const stages=curriculumFor(academy);
 return <div className="page-content" aria-label="Academy preview">
  <div className="page-heading"><div><span className="eyebrow">COMING LEARNING PATH</span><h1>Explore the Linux Academy</h1><p>Preview the learning stages. Your current lessons and progress are unchanged.</p></div></div>
  <section className="panel"><h2>Choose a learning style</h2><p>Every age group works toward the same Linux competencies; the presentation and pacing change.</p>
   <label htmlFor="academy-preview-age">Learning style</label>
   <select id="academy-preview-age" value={academy} onChange={e=>setAcademy(e.target.value as Academy)}>
    <option value="kids">Kids · visual and playful</option><option value="teen">Teens · guided challenges</option><option value="adult">Adults · technical and practical</option>
   </select>
  </section>
  <section className="panel"><h2>Seven stages of Linux understanding</h2>
   <ol>{stages.map(stage=><li key={stage.id}><strong>{stage.title}</strong> — {stage.competencies.length} competencies{stage.competencies.length>0&&<ul>{stage.competencies.map(c=><li key={c.id}>{c.title}</li>)}</ul>}</li>)}</ol>
   <p className="muted-text">Some advanced stages will receive lessons in future releases.</p>
  </section>
  <section className="panel"><h2>Try a mystery lab</h2><p>{mysteryLabs[0].prompt}</p>
   <label htmlFor="mystery-command">Virtual command</label>
   <input id="mystery-command" value={command} onChange={e=>{setCommand(e.target.value);setResult('');}} autoComplete="off" spellCheck={false}/>
   <button className="primary" onClick={()=>setResult(checkMysteryLab(mysteryLabs[0],command)?'Correct! You found the working directory command.':'Try again. Hint: the command has three letters.')}>Check answer</button>
   {result&&<p role="status">{result}</p>}
   <p className="muted-text">This exercise only checks your typed answer; it never runs a command.</p>
  </section>
 </div>;
}
