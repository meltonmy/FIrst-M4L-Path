import {competencies} from '../curriculum/competencies';
export type MysteryLab={id:string;title:string;competencyIds:readonly string[];prompt:string;expectedCommand:string};
export const mysteryLabs:readonly MysteryLab[]=[
 {id:'lost-location',title:'Where am I?',competencyIds:['filesystem.working-directory'],prompt:'Find your current directory in the simulated terminal.',expectedCommand:'pwd'},
 {id:'find-contents',title:'What is here?',competencyIds:['filesystem.list'],prompt:'List the current directory in the simulated terminal.',expectedCommand:'ls'},
 {id:'inspect-network',title:'Find the address',competencyIds:['network.address-route'],prompt:'Show network addresses in the simulated terminal.',expectedCommand:'ip addr'}
];
const known=new Set(competencies.map(c=>c.id));
for(const lab of mysteryLabs){
 if(!lab.competencyIds.length||lab.competencyIds.some(id=>!known.has(id)))throw Error('Mystery lab references unknown competency');
}
/** Only exact allowlisted virtual commands; never invoke a shell or execute user input. */
export function checkMysteryLab(lab:MysteryLab,command:string):boolean{
 if(!mysteryLabs.some(item=>item.id===lab.id))throw Error('Unknown mystery lab');
 return command.trim().replace(/\s+/g,' ')===lab.expectedCommand;
}
