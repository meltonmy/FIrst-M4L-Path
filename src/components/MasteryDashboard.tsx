import {useState} from 'react';
import type {Session} from '../profiles/session';
import {skillTree} from '../curriculum/skillTree';
import {dailyMissions} from '../missions/daily';
import {assessPlacement} from '../assessment/placement';
import {lessons} from '../lessons';

const placementLessons=['linux','terminal','list','paths','network'] as const;
const placementCompetencies=['linux.kernel-distribution','terminal.command-prompt','filesystem.list','filesystem.navigate','network.address-route'] as const;
/** Read-only V2 dashboard. Placement is provisional and never modifies mastery. */
export function MasteryDashboard({session}: {session:Session}){
 const [answers,setAnswers]=useState<Record<string,number>>({});
 const [showPlacement,setShowPlacement]=useState(false);
 if(!session.v2)return <div className="page-content"><h1>Memory and mastery</h1><p>Enable learner profiles to begin recording competency evidence. Existing Version 1 progress remains available.</p><a href="#profiles">Set up learner profiles</a></div>;
 const learner=session.v2.learners[session.v2.activeLearnerId];
 const records=learner.competencies;
 const now=new Date();
 const nodes=skillTree(records,now);
 const missions=dailyMissions(Object.values(records),now);
 const questions=placementLessons.map((id,i)=>({lesson:lessons.find(l=>l.id===id)!,competencyId:placementCompetencies[i]}));
 const placement=showPlacement?assessPlacement(questions.filter(q=>answers[q.competencyId]!==undefined).map(q=>({
  competencyId:q.competencyId,correct:answers[q.competencyId]===q.lesson.correct,independent:true
 }))):null;
 return <div className="page-content">
  <div className="page-heading"><div><span className="eyebrow">MEMORY & MASTERY</span><h1>{learner.displayName}'s skills</h1><p>Proficiency comes from practical evidence and delayed recall, not lesson completion alone.</p></div></div>
  <section className="panel"><h2>Today's memory missions</h2>
   {missions.length===0?<p>No competency reviews are due yet. Complete lessons and return later to strengthen retention.</p>:
    <ul>{missions.map(m=><li key={m.competencyId}>{nodes.find(n=>n.id===m.competencyId)?.title||m.competencyId} — review due</li>)}</ul>}
   <p className="muted-text">Your existing Daily review page remains available for lesson-based review.</p>
  </section>
  <section className="panel"><h2>Skill tree</h2>
   <p>Available skills have satisfied prerequisites. A due skill needs another review, not a restart.</p>
   <ul>{nodes.map(n=><li key={n.id}><strong>{n.title}</strong> — {n.state.replace('_',' ')} <small>({n.stageId.replace(/-/g,' ')})</small></li>)}</ul>
  </section>
  <section className="panel"><h2>Optional placement check</h2>
   <p>Answer five short questions to see a suggested starting point. Results are not saved and do not award mastery.</p>
   {questions.map(q=><fieldset key={q.competencyId}><legend>{q.lesson.question}</legend>
    {q.lesson.answers.map((answer,i)=><label key={i} style={{display:'block',margin:'0.5rem 0'}}>
     <input type="radio" name={'placement-'+q.competencyId} checked={answers[q.competencyId]===i} onChange={()=>{setAnswers(a=>({...a,[q.competencyId]:i}));setShowPlacement(false);}}/> {answer}
    </label>)}
   </fieldset>)}
   <button className="primary" disabled={Object.keys(answers).length!==questions.length} onClick={()=>setShowPlacement(true)}>See suggested starting point</button>
   {placement&&<div role="status"><h3>Suggested next skills</h3>
    {placement.recommendedCompetencyIds.length?<ul>{placement.recommendedCompetencyIds.slice(0,5).map(id=><li key={id}>{nodes.find(n=>n.id===id)?.title||id}</li>)}</ul>:<p>Continue with practical labs and spaced review.</p>}
    <p className="muted-text">This recommendation is provisional. It does not certify proficiency or change your saved progress.</p>
   </div>}
  </section>
 </div>;
}
