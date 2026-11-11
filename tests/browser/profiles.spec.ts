import {test,expect} from '@playwright/test';
test('opt-in learner profiles preserve V1 and isolate lesson completion across reloads',async({page})=>{
 await page.goto('/#profiles');
 await expect(page.getByRole('heading',{name:'Learner profiles',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Enable profiles'})).toBeVisible();
 await page.getByRole('button',{name:'Enable profiles'}).click();
 // Empty browser has no V1 progress; activation must not silently initialize storage.
 await expect(page.getByRole('alert')).toContainText('Save lesson progress');
 await page.evaluate(()=>localStorage.setItem('linux-path-progress-v1',JSON.stringify({version:1,mode:'explorer',textSize:'standard',reducedMotion:false,lessons:{linux:{completed:true,challenge:false,guided:true,correct:2,missed:0,due:null,lastAnswer:true}}})));
 await page.getByRole('button',{name:'Enable profiles'}).click();
 await expect(page.getByLabel('Active learner')).toHaveValue('original-learner');
 await page.getByLabel('Learner name').fill('Child');
 await page.getByLabel('Learning style').selectOption('kids');
 await page.getByRole('button',{name:'Create learner'}).click();
 await page.getByLabel('Active learner').selectOption({label:'Child (kids)'});
 await page.reload();
 await expect(page.getByLabel('Active learner')).toHaveValue(/learner-/);
 const state=await page.evaluate(()=>({
  v1:JSON.parse(localStorage.getItem('linux-path-progress-v1')!),
  v2:JSON.parse(localStorage.getItem('linux-path-progress-v2')!)
 }));
 expect(state.v1.lessons.linux.completed).toBe(true);
 expect(state.v2.learners['original-learner'].legacy.lessons.linux.completed).toBe(true);
 expect(state.v2.learners[state.v2.activeLearnerId].legacy.lessons.linux).toBeUndefined();
});
