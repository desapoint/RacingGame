import { chromium } from '@playwright/test';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/kia-2022-sedans-brochure.pdf#page=10');
await page.waitForTimeout(3000);
await page.screenshot({path:'/home/desapoint/Projets/RacingGame/docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b/previews/official-brochure-page10.png'});
await browser.close();
