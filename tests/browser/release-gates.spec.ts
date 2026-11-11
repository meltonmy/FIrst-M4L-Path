import {test,expect} from '@playwright/test';
test('learner switching restores independent preferences and progress',async({page})=>{
 await page.goto('/#profiles');
 await page.evaluate(()=>{
  const original={version:1,mode:'engineer',textSize:'large',reducedMotion:true,lessons:{linux:{completed:true,challenge:false,guided:false,correct:2,missed:0,due:null,lastAnswer:true}}};
  const child={version:1,mode:'explorer',textSize:'standard',reducedMotion:false,lessons:{}};
  localStorage.setItem('linux-path-progress-v1',JSON.stringify(original));
  localStorage.setItem('linux-path-progress-v2',JSON.stringify({version:2,activeLearnerId:'original-learner',learners:{
   'original-learner':{id:'original-learner',displayName:'Original Learner',academy:'adult',legacy:original,competencies:{}},
   kid:{id:'kid',displayName:'Child',academy:'kids',legacy:child,competencies:{}}
  }}));
 });
 await page.reload();
 await expect(page.getByRole('button',{name:/Engineer mode/})).toBeVisible();
 await page.getByLabel('Active learner').selectOption('kid');
 await expect(page.getByRole('button',{name:/Explorer mode/})).toBeVisible();
 await page.reload();
 await expect(page.getByLabel('Active learner')).toHaveValue('kid');
 await page.getByLabel('Active learner').selectOption('original-learner');
 await expect(page.getByRole('button',{name:/Engineer mode/})).toBeVisible();
 const v1=await page.evaluate(()=>JSON.parse(localStorage.getItem('linux-path-progress-v1')!));
 expect(v1.lessons.linux.completed).toBe(true);
});
test('invalid recovery file is rejected without changing existing progress',async({page})=>{
 await page.goto('/#profiles');
 await page.evaluate(()=>localStorage.setItem('linux-path-progress-v1',JSON.stringify({version:1,mode:'explorer',textSize:'standard',reducedMotion:false,lessons:{}})));
 await page.reload();
 const before=await page.evaluate(()=>localStorage.getItem('linux-path-progress-v1'));
 await page.getByLabel('Choose learner backup JSON').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"wrong"}')});
 await expect(page.getByRole('alert')).toContainText('Unsupported backup');
 expect(await page.evaluate(()=>localStorage.getItem('linux-path-progress-v1'))).toBe(before);
});
