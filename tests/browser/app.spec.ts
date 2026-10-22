import {test,expect} from '@playwright/test';
const command=async(page:import('@playwright/test').Page,cmd:string)=>{await page.getByRole('textbox',{name:'Terminal command'}).fill(cmd);await page.getByRole('button',{name:'Run practice command'}).click();};
test('home and lesson workflow, completion separate from challenge, local reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/Your Linux journey starts here/})).toBeVisible();
 await page.getByRole('button',{name:'Let’s get started'}).click();await expect(page.getByRole('heading',{name:/Meet your new operating system/})).toBeVisible();
 await page.getByRole('button',{name:'Let’s try it'}).click();await command(page,'cat welcome.txt');await page.getByRole('button',{name:'Check my work'}).click();await expect(page.getByRole('heading',{name:'Your turn to explore.'})).toBeVisible();await command(page,'cd ./documents');await page.getByRole('button',{name:'Check my work'}).click();await expect(page.getByRole('button',{name:'Challenge solved'})).toBeDisabled();
 await page.getByRole('button',{name:'Check your understanding'}).click();await page.getByLabel('It is a Linux distribution: the kernel plus a collection of tools.').check();await page.getByRole('button',{name:'Check answer',exact:true}).click();await expect(page.getByText('That’s it. Nicely reasoned.')).toBeVisible();
 await page.getByRole('button',{name:'Finish lesson & continue'}).click();await expect(page.getByRole('heading',{name:/Say hello to the terminal/})).toBeVisible();
 await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('linux-path-progress-v1')!));expect(saved.lessons.linux.completed).toBe(true);expect(saved.lessons.linux.challenge).toBe(true);expect(saved.lessons.linux.due).toBeTruthy();expect(errors).toEqual([]);
});
test('simulator history, unsupported input, hints and reset',async({page})=>{
 await page.goto('/#practice');await command(page,'mkdir garden');await command(page,'touch garden/seed.txt');await command(page,'ls garden');await expect(page.getByRole('log')).toContainText('seed.txt');await command(page,'sudo apt update');await expect(page.getByRole('log')).toContainText('not implemented');await page.getByRole('textbox',{name:'Terminal command'}).press('ArrowUp');await expect(page.getByRole('textbox',{name:'Terminal command'})).toHaveValue('sudo apt update');
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await command(page,'ls garden');await expect(page.getByRole('log')).toContainText('seed.txt');
 await page.getByRole('button',{name:'Reset',exact:true}).click();await page.getByRole('button',{name:'Reset simulator'}).click();await command(page,'ls garden');await expect(page.getByRole('log')).toContainText('no such file');
 await page.goto('/#lesson/create');await page.getByRole('tab',{name:'2. Try it'}).click();await page.getByRole('button',{name:'A little hint?'}).click();await expect(page.getByText('Run mkdir garden from /home/learner.')).toBeVisible();
});
test('JSON download, invalid import, confirmation, modes and reset',async({page})=>{
 await page.goto('/#settings');await page.getByRole('button',{name:/Engineer mode/}).click();await page.getByLabel('Text size').selectOption('large');await page.getByLabel('Reduce motion').check();
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON'}).click();const download=await downloadEvent;expect(download.suggestedFilename()).toBe('linux-path-progress.json');const stream=await download.createReadStream();let data='';for await(const chunk of stream!)data+=chunk;const exported=JSON.parse(data);expect(exported.mode).toBe('engineer');expect(exported.reducedMotion).toBe(true);
 await page.getByLabel('Import progress JSON').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{nope')});await expect(page.getByRole('alert')).toContainText('not valid JSON');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('linux-path-progress-v1')!).mode)).toBe('engineer');
 exported.mode='explorer';exported.lessons.linux={completed:true,challenge:false,guided:true,correct:1,missed:0,due:'2020-01-01T00:00:00.000Z',lastAnswer:true};
 await page.getByLabel('Import progress JSON').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Import progress',exact:true}).click();await expect(page.getByRole('button',{name:'Explorer mode',exact:false}).first()).toBeVisible();
 await page.goto('/#review');await expect(page.getByRole('heading',{name:'1 concept ready for review'})).toBeVisible();await page.getByLabel('It is a terminal command.').check();await page.getByRole('button',{name:'Check answer',exact:true}).click();await expect(page.getByText('A useful thing to revisit.')).toBeVisible();
 await page.goto('/#progress');await expect(page.getByText('Revisit concept')).toBeVisible();await expect(page.getByText('Challenge open').first()).toBeVisible();
 await page.goto('/#settings');await page.getByRole('button',{name:'Reset all progress',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('linux-path-progress-v1')!).lessons.linux.completed)).toBe(true);
 await page.getByRole('button',{name:'Reset all progress',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Reset all progress',exact:true}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('linux-path-progress-v1')!).lessons)).toEqual({});
});
test('offline shell, downloaded lessons and stateful simulator after reload',async({page,context})=>{
 await page.goto('/');await expect(page.getByText('Offline ready',{exact:true})).toBeVisible({timeout:15000});
 const count=await page.evaluate(async()=>{const keys=await caches.keys();const cache=await caches.open(keys.find(k=>k.startsWith('linux-path-'))!);return (await cache.keys()).length;});expect(count).toBeGreaterThanOrEqual(8);
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:/Your Linux journey starts here/})).toBeVisible();await page.goto('/#lesson/network');await expect(page.getByRole('heading',{name:/An address and a way out/})).toBeVisible();await page.getByRole('tab',{name:'2. Try it'}).click();await command(page,'ip addr');await expect(page.getByRole('log')).toContainText('192.168.10.20/24');await command(page,'ip route');await page.getByRole('button',{name:'Check my work'}).click();await command(page,'ping 192.168.10.1');await page.getByRole('button',{name:'Check my work'}).click();await expect(page.getByRole('button',{name:'Challenge solved'})).toBeDisabled();await page.reload();await expect(page.getByRole('heading',{name:/An address and a way out/})).toBeVisible();
});
for(const width of [390,768,1440])test(`responsive layout at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});for(const path of ['home','path','lesson/permissions','practice','review','progress','settings']){
  await page.goto('/#'+path);await page.getByRole('main').waitFor();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`overflow on ${path}`).toBe(true);
 }
 await page.goto('/');if(width<700){await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.getByRole('navigation')).toBeInViewport();await page.getByRole('navigation').getByRole('link',{name:'Practice terminal'}).click();await expect(page.getByRole('heading',{name:/Your practice terminal/})).toBeVisible();}
 await page.goto('/');await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
});

test('GitHub Pages repository base path, deep links, manifest and offline reload',async({page,context})=>{
 const base='http://127.0.0.1:4180/FIrst-M4L-Path/';await page.goto(base+'#lesson/paths');await expect(page.getByRole('heading',{name:/Take the right path/})).toBeVisible();await expect(page.getByText('Offline ready',{exact:true})).toBeVisible({timeout:15000});
 const manifest=await page.request.get(base+'manifest.webmanifest');expect(manifest.ok()).toBe(true);expect((await manifest.json()).start_url).toBe('./');expect(await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)).toBe(base+'sw.js');
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:/Take the right path/})).toBeVisible();await page.getByRole('tab',{name:'2. Try it'}).click();await command(page,'cd documents');await page.getByRole('button',{name:'Check my work'}).click();await command(page,'cd ../projects');await page.getByRole('button',{name:'Check my work'}).click();await expect(page.getByRole('button',{name:'Challenge solved'})).toBeDisabled();
});

test('practice state survives lesson-section and mode switches',async({page})=>{
 await page.goto('/#lesson/create');await page.getByRole('tab',{name:'2. Try it'}).click();await command(page,'mkdir garden');await page.getByRole('button',{name:'Check my work'}).click();await page.getByRole('tab',{name:'1. Discover'}).click();await page.getByRole('button',{name:'Explorer mode',exact:false}).click();await expect(page.getByRole('heading',{name:'What you need to know'})).toBeVisible();await page.getByRole('tab',{name:'2. Try it'}).click();await command(page,'touch garden/seeds.txt');await page.getByRole('button',{name:'Check my work'}).click();await expect(page.getByRole('button',{name:'Challenge solved'})).toBeDisabled();
});
