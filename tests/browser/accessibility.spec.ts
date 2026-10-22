import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const route of ['home','path','lesson/network','practice','review','progress','settings'])test('accessibility: '+route,async({page})=>{
 await page.goto('/#'+route);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
});
test('lesson tabs support arrow-key navigation',async({page})=>{await page.goto('/#lesson/linux');await page.getByRole('tab',{name:'1. Discover'}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'2. Try it'})).toBeFocused();await expect(page.getByRole('textbox',{name:'Terminal command'})).toBeVisible();await page.keyboard.press('End');await expect(page.getByRole('tab',{name:'3. Remember'})).toBeFocused();});
