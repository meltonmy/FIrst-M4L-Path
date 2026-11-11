import {test,expect} from '@playwright/test';
test('academy preview keeps V1 progress intact and checks virtual answers',async({page})=>{
 await page.goto('/#home');
 const before=await page.evaluate(()=>localStorage.getItem('linux-path-progress-v1'));
 await page.getByRole('link',{name:'Academy preview'}).click();
 await expect(page.getByRole('heading',{name:'Explore the Linux Academy'})).toBeVisible();
 await page.getByLabel('Learning style').selectOption('kids');
 await expect(page.getByText('Kernel Explorer')).toBeVisible();
 await page.getByLabel('Virtual command').fill('pwd');
 await page.getByRole('button',{name:'Check answer'}).click();
 await expect(page.getByRole('status')).toContainText('Correct!');
 expect(await page.evaluate(()=>localStorage.getItem('linux-path-progress-v1'))).toBe(before);
});
