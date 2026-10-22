export type Entry = { kind: 'dir' | 'file'; content: string; mode: string };
export type SimState = { cwd: string; nodes: Record<string, Entry>; observed: string[] };
export type Result = { state: SimState; output: string; clear?: boolean };
export const HOME = '/home/learner';
export function initialState(): SimState {
  const nodes: Record<string, Entry> = {};
  for (const p of ['/', '/home', HOME, HOME+'/documents', HOME+'/projects', HOME+'/downloads', HOME+'/containers', '/etc']) nodes[p] = {kind:'dir',content:'',mode:'755'};
  const files: Record<string,string> = {
    [HOME+'/welcome.txt']: 'Welcome to Linux Path!\nLinux is an operating system kernel. A distribution combines it with useful tools.\nYour practice computer is named lab.\n',
    [HOME+'/documents/notes.txt']: 'Small steps. Real skills.\nPractice paths, keep backups, and check before deleting.\n',
    [HOME+'/documents/old.txt']: 'A disposable practice file.\n',
    [HOME+'/projects/run.sh']: '#!/bin/bash\necho "Hello, learner!"\n',
    [HOME+'/containers/container.txt']: 'An image is a packaged template. A container is an isolated process created from an image.\nContainers share the host kernel; they are not full virtual machines.\nPublishing a port connects a host port to a container port.\n',
    ['/etc/hosts']: '127.0.0.1 localhost\n192.168.10.20 lab\n',
  };
  for (const [p, content] of Object.entries(files)) nodes[p] = {kind:'file',content,mode:'644'};
  return {cwd:HOME,nodes,observed:[]};
}
export function resolvePath(cwd: string, raw: string): string {
  const full = raw === '~' ? HOME : raw.startsWith('~/') ? HOME+raw.slice(1) : raw.startsWith('/') ? raw : cwd+'/'+raw;
  const parts: string[] = [];
  for (const p of full.split('/')) { if (p === '..') parts.pop(); else if (p && p !== '.') parts.push(p); }
  return '/'+parts.join('/');
}
export function tokenize(input: string): string[] {
  const result: string[] = []; let word=''; let quote=''; let active=false;
  for (let i=0;i<input.length;i++) {
    const c=input[i];
    if (quote) { if(c===quote) quote=''; else word+=c; active=true; }
    else if(c==='"'||c==="'") {quote=c;active=true;}
    else if(c==='\\') {if(i+1===input.length) throw Error('Finish the escape with a character.');word+=input[++i];active=true;}
    else if(/\s/.test(c)) {if(active){result.push(word);word='';active=false;}}
    else if(/[|;&<>`$*?\[\]{}()]/.test(c)) throw Error('Pipes, redirects, variables, wildcards, and shell operators are not implemented. Use one supported command at a time.');
    else {word+=c;active=true;}
  }
  if(quote) throw Error('Close the quotation mark and try again.');
  if(active) result.push(word);
  return result;
}
const parent = (p:string) => p.slice(0,p.lastIndexOf('/')) || '/';
const name = (p:string) => p.split('/').pop() || '/';
export function execute(original: SimState, input: string): Result {
  const state: SimState = structuredClone(original);
  try {
    const [cmd,...args] = tokenize(input.trim());
    if(!cmd) return {state,output:''};
    const paths = (v:string) => resolvePath(state.cwd,v);
    const requireNode = (p:string) => {if(!state.nodes[p]) throw Error(`${p}: no such file or directory`); return state.nodes[p];};
    const requireDir = (p:string) => {if(requireNode(p).kind!=='dir') throw Error(`${p}: not a directory`);};
    const editable = (p:string) => {if(!p.startsWith(HOME+'/')) throw Error('Only items inside /home/learner can be changed in this simulator.');};
    const usage = (ok:boolean, syntax:string) => {if(!ok) throw Error('Usage: '+syntax);};
    const noFlags = () => {if(args.some(a=>a.startsWith('-'))) throw Error('That flag is not supported here. Type help for implemented syntax.');};
    const observe = (s:string) => {if(!state.observed.includes(s)) state.observed.push(s);};
    if(cmd==='help') {usage(!args.length,'help'); return {state,output:'Supported commands:\nhelp • pwd • ls [-a] [-l] [path] • cd [path]\nmkdir [-p] path… • touch file… • cat file… • less file\ncp source destination • mv source destination • rm [-r] path…\nchmod MODE file (three octal digits or u+x / u-x) • clear\nip addr • ip route • ping [-c 1…4] TARGET\nPing targets: 127.0.0.1, 192.168.10.1, 1.1.1.1, linuxpath.test (DNS failure).\nQuotes and relative paths work. No host commands, sudo, scripts, pipelines, redirects, globbing, or real networking. less shows the whole file without a pager.'};}
    if(cmd==='clear') {usage(!args.length,'clear'); return {state,output:'',clear:true};}
    if(cmd==='pwd') {usage(!args.length,'pwd');observe('pwd:'+state.cwd);return {state,output:state.cwd};}
    if(cmd==='ls') {
      const flags=args.filter(a=>a.startsWith('-'));usage(flags.every(f=>['-a','-l','-al','-la'].includes(f))&&args.filter(a=>!a.startsWith('-')).length<=1,'ls [-a] [-l] [path]');
      const p=paths(args.find(a=>!a.startsWith('-'))||'.'); const node=requireNode(p); observe('ls:'+p);
      const list=node.kind==='file'?[p]:Object.keys(state.nodes).filter(k=>k!==p && parent(k)===p && (flags.some(f=>f.includes('a'))||!name(k).startsWith('.'))).sort();
      return {state,output:list.map(k=>flags.some(f=>f.includes('l'))?`${state.nodes[k].kind==='dir'?'d':'-'}${permissions(state.nodes[k].mode)} learner learners  ${name(k)}`:name(k)+(state.nodes[k].kind==='dir'?'/':'')).join('\n')||'(empty directory)'};
    }
    if(cmd==='cd'){noFlags();usage(args.length<=1,'cd [path]');const p=paths(args[0]||HOME);requireDir(p);state.cwd=p;return {state,output:''};}
    if(cmd==='mkdir'||cmd==='touch') {
      const recursive=cmd==='mkdir'&&args[0]==='-p'; const items=recursive?args.slice(1):args;
      usage(items.length>0 && items.every(a=>a&&!a.startsWith('-')),cmd==='mkdir'?'mkdir [-p] path…':'touch file…');
      for(const item of items){const p=paths(item);editable(p);
        if(state.nodes[p]) {if(cmd==='touch'&&state.nodes[p].kind==='file'||recursive&&state.nodes[p].kind==='dir')continue;throw Error(`${item}: already exists`);}
        if(recursive) {let current='';for(const part of p.split('/').filter(Boolean)){current+='/'+part;if(state.nodes[current])requireDir(current);else {editable(current);state.nodes[current]={kind:'dir',content:'',mode:'755'};}}}
        else {requireDir(parent(p));state.nodes[p]={kind:cmd==='mkdir'?'dir':'file',content:'',mode:cmd==='mkdir'?'755':'644'};}
      } return {state,output:''};
    }
    if(cmd==='cat'||cmd==='less') {noFlags();usage(args.length>0&&(cmd!=='less'||args.length===1),cmd+' file'+(cmd==='cat'?'…':''));const output=args.map(a=>{const p=paths(a);const n=requireNode(p);if(n.kind==='dir')throw Error(`${a}: is a directory`);observe('read:'+p);return n.content;}).join('');return {state,output:output||'(empty file)'};}
    if(cmd==='cp'||cmd==='mv') {noFlags();usage(args.length===2,cmd+' source destination');const src=paths(args[0]);let dest=paths(args[1]);const n=requireNode(src);if(state.nodes[dest]?.kind==='dir')dest+='/'+name(src);editable(dest);requireDir(parent(dest));if(src===dest)throw Error('Source and destination are the same.');if(state.nodes[dest])throw Error('Destination exists. This simulator protects against overwriting; use a new name.');if(n.kind==='dir')throw Error('Copying or moving directories is not implemented. Use files.');state.nodes[dest]={...n};if(cmd==='mv'){editable(src);delete state.nodes[src];}return {state,output:''};}
    if(cmd==='rm') {const recursive=args[0]==='-r';const items=recursive?args.slice(1):args;usage(items.length>0&&items.every(a=>a&&!a.startsWith('-')),'rm [-r] path…');for(const item of items){const p=paths(item);editable(p);const n=requireNode(p);if(n.kind==='dir'&&!recursive)throw Error(`${item}: directory; only rm -r removes directories here.`);if(state.cwd===p||state.cwd.startsWith(p+'/'))throw Error('Leave this directory before deleting it.');delete state.nodes[p];observe('removed:'+p);if(n.kind==='dir')for(const key of Object.keys(state.nodes))if(key.startsWith(p+'/'))delete state.nodes[key];}return {state,output:''};}
    if(cmd==='chmod') {usage(args.length===2&&/^([0-7]{3}|u[+-]x)$/.test(args[0]),'chmod 640 file (or u+x / u-x)');const p=paths(args[1]);editable(p);const n=requireNode(p);const m=args[0];n.mode=m.startsWith('u')?String(m==='u+x'?Number(n.mode[0])|1:Number(n.mode[0])&6)+n.mode.slice(1):m;return {state,output:''};}
    if(cmd==='ip') {usage(args.length===1&&['addr','route'].includes(args[0]),'ip addr | ip route');observe('ip:'+args[0]);return {state,output:args[0]==='addr'?'1: lo: <UP,LOOPBACK>\n    inet 127.0.0.1/8\n2: eth0: <UP>\n    inet 192.168.10.20/24 brd 192.168.10.255':'default via 192.168.10.1 dev eth0\n192.168.10.0/24 dev eth0 src 192.168.10.20'};}
    if(cmd==='ping') {usage(args.length===1||(args.length===3&&args[0]==='-c'&&/^[1-4]$/.test(args[1])),'ping [-c 1…4] TARGET');const target=args.at(-1)!;const reachable=['127.0.0.1','192.168.10.1','1.1.1.1'].includes(target);observe('ping:'+target);return {state,output:target==='linuxpath.test'?'ping: linuxpath.test: temporary failure in name resolution (simulated DNS problem)':reachable?`PING ${target}\n${Array.from({length:args.length===3?Number(args[1]):1},(_,i)=>`64 bytes from ${target}: icmp_seq=${i+1} ttl=64 time=1.0 ms`).join('\n')}\n0% packet loss (simulated)`:'No scenario exists for this target. Type help for supported targets.'};}
    throw Error(`${cmd}: not implemented in the practice simulator. Type help to see supported commands.`);
  } catch(e) {return {state:original,output:'Practice: '+(e as Error).message};}
}
export function permissions(mode:string){return mode.split('').map(n=>{const i=Number(n);return (i&4?'r':'-')+(i&2?'w':'-')+(i&1?'x':'-');}).join('');}
export type TaskId = 'linux'|'terminal'|'list'|'paths'|'create'|'read'|'copy'|'delete'|'permissions'|'network'|'troubleshoot'|'containers';
export function checkTask(id: TaskId, stage:'guided'|'challenge', s:SimState): boolean {
 const has=(p:string,k:'file'|'dir')=>s.nodes[HOME+p]?.kind===k;
 const read=(p:string)=>s.observed.includes('read:'+HOME+p);
 const seen=(e:string)=>s.observed.includes(e);
 const copied=(p:string)=>has(p,'file')&&s.nodes[HOME+p].content===initialState().nodes[HOME+'/documents/notes.txt'].content;
 switch(id){
 case 'linux':return stage==='guided'?read('/welcome.txt'):s.cwd===HOME+'/documents';
 case 'terminal':return stage==='guided'?seen('pwd:'+HOME):read('/welcome.txt');
 case 'list':return stage==='guided'?seen('ls:'+HOME):seen('ls:'+HOME+'/projects');
 case 'paths':return s.cwd===HOME+(stage==='guided'?'/documents':'/projects');
 case 'create':return stage==='guided'?has('/garden','dir'):has('/garden/seeds.txt','file');
 case 'read':return stage==='guided'?read('/documents/notes.txt'):seen('read:/etc/hosts');
 case 'copy':return stage==='guided'?copied('/documents/backup.txt'):copied('/projects/notes.txt')&&copied('/documents/notes.txt')&&!has('/documents/backup.txt','file');
 case 'delete':return stage==='guided'?!has('/documents/old.txt','file')&&read('/documents/old.txt'):!has('/documents/old.txt','file')&&has('/documents/notes.txt','file')&&has('/documents/keep.txt','file')&&!has('/documents/trial.txt','file')&&seen('removed:'+HOME+'/documents/trial.txt')&&seen('read:'+HOME+'/documents/keep.txt');
 case 'permissions':return stage==='guided'?s.nodes[HOME+'/projects/run.sh']?.mode==='744':s.nodes[HOME+'/documents/notes.txt']?.mode==='640';
 case 'network':return stage==='guided'?seen('ip:addr')&&seen('ip:route'):seen('ping:192.168.10.1');
 case 'troubleshoot':return stage==='guided'?seen('ping:1.1.1.1')&&seen('ping:linuxpath.test'):seen('read:/etc/hosts')&&seen('ip:route');
 case 'containers':return stage==='guided'?read('/containers/container.txt'):has('/containers/notes.txt','file')&&s.nodes[HOME+'/containers/notes.txt'].content===initialState().nodes[HOME+'/documents/notes.txt'].content;
 }
}
