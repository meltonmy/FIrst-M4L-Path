import {dueCompetencies} from '../mastery/scheduler';
import type {MasteryRecord} from '../mastery/types';
export type DailyMission={competencyId:string;kind:'review'|'practice';dueAt:string|null};
/** Review-first deterministic selection, no random or punitive streak mechanics. */
export function dailyMissions(records:readonly MasteryRecord[],now:Date,limit=5):DailyMission[]{
 if(!Number.isSafeInteger(limit)||limit<1||limit>20)throw Error('Invalid mission limit');
 return dueCompetencies(records,now).slice(0,limit).map(r=>({competencyId:r.competencyId,kind:'review',dueAt:r.dueAt}));
}
