import {test,expect} from '@playwright/test';
test('mastery dashboard explains opt-in before V2 activation',async({page})=>{
 await page.goto('/#mastery');
 await expect(page.getByRole('heading',{name:'Memory and mastery'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Set up learner profiles'})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('linux-path-progress-v2'))).toBeNull();
});
test('mastery dashboard shows due competency, skill tree and provisional placement',async({page})=>{
 await page.goto('/#mastery');
 await page.evaluate(()=>{
  const legacy={version:1,mode:'explorer',textSize:'standard',reducedMotion:false,lessons:{}};
  const mastery={competencyId:'linux.kernel-distribution',status:'proficient',reviewCount:2,successfulReviews:2,intervalDays:2,dueAt:'2026-01-01T00:00:00.000Z',lastAttemptAt:'2025-12-30T00:00:00.000Z',evidence:[]};
  localStorage.setItem('linux-path-progress-v2',JSON.stringify({version:2,activeLearnerId:'original-learner',learners:{'original-learner':{id:'original-learner',displayName:'Original Learner',academy:'adult',legacy,competencies:{'linux.kernel-distribution':mastery}}}}));
 });
 await page.reload();
 await expect(page.getByRole('heading',{name:"Original Learner's skills"})).toBeVisible();
 await expect(page.getByRole('heading',{name:"Today's memory missions"})).toBeVisible();
 await expect(page.getByText('Distinguish kernel and distribution — review due')).toBeVisible();
 await expect(page.getByRole('heading',{name:'Skill tree'})).toBeVisible();
 await expect(page.getByRole('button',{name:'See suggested starting point'})).toBeDisabled();
 const before=await page.evaluate(()=>localStorage.getItem('linux-path-progress-v2'));
 expect(before).toBeTruthy();
});
