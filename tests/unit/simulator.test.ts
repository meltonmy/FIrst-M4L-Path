import {describe,it,expect} from 'vitest';
import {initialState,execute,resolvePath,tokenize,checkTask,HOME,permissions} from '../../src/simulator';
import type {TaskId} from '../../src/simulator';
const run=(commands:string[])=>commands.reduce((s,c)=>execute(s,c).state,initialState());
describe('command parser',()=>{
 it('handles quotes, spaces, escapes, and relative paths',()=>{expect(tokenize('touch "hello world.txt" plain\\ name')).toEqual(['touch','hello world.txt','plain name']);expect(resolvePath(HOME+'/documents','../projects/./')).toBe(HOME+'/projects');expect(resolvePath('/','../../../etc')).toBe('/etc');expect(resolvePath('/','~/documents')).toBe(HOME+'/documents');});
 it.each(['cat "unfinished','ls | cat','touch a; rm b','echo $(id)','cat > a','ls *','touch a\\'])('rejects unsupported syntax without changing state: %s',cmd=>{const before=initialState();const r=execute(before,cmd);expect(r.state).toEqual(before);expect(r.output).toMatch(/Practice:/);});
});
describe('virtual filesystem',()=>{
 it('persists creation, copying, moving, reading, chmod and deletion',()=>{let s=run(['mkdir -p "garden/new folder"','touch "garden/new folder/seed"','cp documents/notes.txt garden/notes.txt','mv garden/notes.txt garden/copy.txt','chmod 600 garden/copy.txt']);expect(s.nodes[HOME+'/garden/new folder/seed'].kind).toBe('file');expect(execute(s,'cat garden/copy.txt').output).toContain('Small steps.');expect(s.nodes[HOME+'/garden/notes.txt']).toBeUndefined();expect(s.nodes[HOME+'/garden/copy.txt'].mode).toBe('600');s=execute(s,'rm -r garden').state;expect(Object.keys(s.nodes).some(p=>p.startsWith(HOME+'/garden'))).toBe(false);});
 it('supports destination directories and protects against overwrites',()=>{const s=run(['cp documents/notes.txt projects']);expect(s.nodes[HOME+'/projects/notes.txt'].content).toContain('Small steps.');expect(execute(s,'cp welcome.txt projects/notes.txt').state).toEqual(s);expect(execute(s,'cp welcome.txt projects/notes.txt').output).toContain('Destination exists');});
 it('rolls back a command if any operand fails',()=>{const s=initialState();expect(execute(s,'touch created /etc/nope').state).toEqual(s);expect(execute(s,'rm documents/old.txt missing').state).toEqual(s);});
 it('does not mutate previous state',()=>{const s=initialState();const r=execute(s,'chmod u+x projects/run.sh');expect(s.nodes[HOME+'/projects/run.sh'].mode).toBe('644');expect(r.state.nodes[HOME+'/projects/run.sh'].mode).toBe('744');expect(execute(r.state,'chmod u-x projects/run.sh').state.nodes[HOME+'/projects/run.sh'].mode).toBe('644');expect(permissions('640')).toBe('rw-r-----');});
 it.each(['sudo rm -rf /','rm -rf documents','ls --color','chmod 999 welcome.txt','ip link','ping -c 100 1.1.1.1','cp documents projects','cd welcome.txt','rm /etc/hosts'])('honestly rejects unsupported or protected operations: %s',cmd=>{const s=initialState();const r=execute(s,cmd);expect(r.state).toEqual(s);expect(r.output).toMatch(/Practice:/);});
 it('protects the current directory and parent',()=>{const s=run(['cd documents']);expect(execute(s,'rm -r .').state).toEqual(s);});
 it('models addresses, gateway, and DNS failure consistently',()=>{const s=initialState();expect(execute(s,'ip addr').output).toContain('192.168.10.20/24');expect(execute(s,'ip route').output).toContain('default via 192.168.10.1');expect(execute(s,'ping -c 2 192.168.10.1').output.match(/64 bytes/g)).toHaveLength(2);expect(execute(s,'ping linuxpath.test').output).toContain('name resolution');expect(execute(s,'ping unknown').output).toContain('No scenario');});
 it('clears only display, not filesystem',()=>{const s=run(['mkdir garden']);expect(execute(s,'clear')).toEqual({state:s,output:'',clear:true});});
});
const solutions:{id:TaskId;guided:string[];challenge:string[]}[]=[
 {id:'linux',guided:['less ./welcome.txt'],challenge:['cd /home/learner/documents']},
 {id:'terminal',guided:['pwd'],challenge:['cat ./welcome.txt']},
 {id:'list',guided:['ls -la ~'],challenge:['ls /home/learner/projects']},
 {id:'paths',guided:['cd ./documents'],challenge:['cd ../projects']},
 {id:'create',guided:['mkdir /home/learner/garden'],challenge:['cd garden','touch ./seeds.txt']},
 {id:'read',guided:['less documents/notes.txt'],challenge:['cat /etc/hosts']},
 {id:'copy',guided:['cd documents','cp notes.txt backup.txt'],challenge:['mv backup.txt ../projects/notes.txt']},
 {id:'delete',guided:['cat documents/old.txt','rm documents/old.txt'],challenge:['touch documents/keep.txt documents/trial.txt','cat documents/keep.txt','rm documents/trial.txt']},
 {id:'permissions',guided:['chmod 744 projects/run.sh'],challenge:['chmod 640 documents/notes.txt']},
 {id:'network',guided:['ip route','ip addr'],challenge:['ping -c 3 192.168.10.1']},
 {id:'troubleshoot',guided:['ping linuxpath.test','ping -c 1 1.1.1.1'],challenge:['ip route','cat /etc/hosts']},
 {id:'containers',guided:['less containers/container.txt'],challenge:['cp documents/notes.txt containers']},
];
describe('state based task validation',()=>{
 for(const x of solutions)it(`accepts working solutions and rejects fresh state: ${x.id}`,()=>{expect(checkTask(x.id,'guided',initialState())).toBe(false);expect(checkTask(x.id,'challenge',initialState())).toBe(false);const s=run(x.guided);expect(checkTask(x.id,'guided',s)).toBe(true);expect(checkTask(x.id,'challenge',s)).toBe(false);const final=x.challenge.reduce((s,c)=>execute(s,c).state,s);expect(checkTask(x.id,'challenge',final)).toBe(true);});
 it('checks file content, not just a matching filename',()=>{const s=run(['touch documents/backup.txt']);expect(checkTask('copy','guided',s)).toBe(false);});
 it('rejects completed creation if the resulting file is removed',()=>{const s=run(['mkdir garden','touch garden/seeds.txt','rm garden/seeds.txt']);expect(checkTask('create','challenge',s)).toBe(false);});
});
