import type { TaskId } from '../simulator';

export type Competency = {
  id: string;
  title: string;
  stageId: string;
  prerequisites: readonly string[];
  lessonIds: readonly TaskId[];
};

/** Stable IDs: never repurpose an ID for a different skill. */
export const competencies: readonly Competency[] = [
  {id:'linux.kernel-distribution',title:'Distinguish kernel and distribution',stageId:'kernel-explorer',prerequisites:[],lessonIds:['linux']},
  {id:'terminal.command-prompt',title:'Use the terminal prompt',stageId:'terminal-navigator',prerequisites:['linux.kernel-distribution'],lessonIds:['terminal']},
  {id:'filesystem.working-directory',title:'Locate the working directory',stageId:'terminal-navigator',prerequisites:['terminal.command-prompt'],lessonIds:['list','paths']},
  {id:'filesystem.list',title:'Inspect directory contents',stageId:'terminal-navigator',prerequisites:['terminal.command-prompt'],lessonIds:['list']},
  {id:'filesystem.navigate',title:'Navigate absolute and relative paths',stageId:'terminal-navigator',prerequisites:['filesystem.working-directory'],lessonIds:['paths']},
  {id:'filesystem.create',title:'Create files and directories',stageId:'shell-apprentice',prerequisites:['filesystem.navigate'],lessonIds:['create']},
  {id:'filesystem.read',title:'Read file content',stageId:'shell-apprentice',prerequisites:['filesystem.list'],lessonIds:['read']},
  {id:'filesystem.copy-move',title:'Copy and move files',stageId:'shell-apprentice',prerequisites:['filesystem.create'],lessonIds:['copy']},
  {id:'filesystem.delete',title:'Delete files safely',stageId:'shell-apprentice',prerequisites:['filesystem.create'],lessonIds:['delete']},
  {id:'security.permissions',title:'Inspect and modify file permissions',stageId:'shell-apprentice',prerequisites:['filesystem.list'],lessonIds:['permissions']},
  {id:'network.address-route',title:'Inspect addresses and routes',stageId:'system-operator',prerequisites:['terminal.command-prompt'],lessonIds:['network','troubleshoot']},
  {id:'network.diagnose',title:'Investigate basic connectivity failures',stageId:'system-operator',prerequisites:['network.address-route'],lessonIds:['troubleshoot']},
  {id:'containers.fundamentals',title:'Explain container fundamentals',stageId:'infrastructure-engineer',prerequisites:['linux.kernel-distribution'],lessonIds:['containers']}
] as const;

export function validateCompetencies(items: readonly Competency[] = competencies): void {
  const byId = new Map<string, Competency>();
  for (const item of items) {
    if (!item.id || byId.has(item.id)) throw new Error('Duplicate or empty competency ID: '+item.id);
    if (!item.lessonIds.length) throw new Error('Competency has no lessons: '+item.id);
    byId.set(item.id,item);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(id:string):void {
    if (visiting.has(id)) throw new Error('Circular competency prerequisite: '+id);
    if (visited.has(id)) return;
    const item=byId.get(id);
    if (!item) throw new Error('Unknown competency prerequisite: '+id);
    visiting.add(id);
    for (const dep of item.prerequisites) visit(dep);
    visiting.delete(id);visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
}
validateCompetencies();
