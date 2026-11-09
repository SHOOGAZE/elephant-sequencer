"""README screenshots: python3 tools/shots.py (needs Playwright + Chromium, run python3 build.py first)."""
import asyncio
from playwright.async_api import async_playwright
import os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
os.makedirs(D+'screenshots',exist_ok=True)
S=[('01-pads-landscape',874,402,'play',3,''),
   ('02-sequencer-landscape',874,402,'seq',3,"GRUI.U.tr=0"),
   ('03-sample-wave-landscape',874,402,'sound',3,"GRUI.U.tr=5;GRUI.renderTab()"),
   ('04-mixer-landscape',1180,820,'mix',3,''),
   ('05-pads-portrait',390,844,'play',3,''),
   ('06-sequencer-tablet',1366,1024,'seq',3,''),
   ('08-sequencer-portrait',390,844,'seq',3,''),
   ('09-sample-portrait',390,844,'sound',3,"GRUI.U.tr=5;GRUI.renderTab()"),
   ('10-mixer-portrait',390,844,'mix',3,''),
   ('11-fx-portrait',390,844,'fx',3,''),
   ('12-wave-portrait',390,844,'smpl',3,''),
   ('13-sample-filter-portrait',390,844,'sound',3,"GRUI.U.tr=5;GRUI.U.page=1;GRUI.renderTab()"),
   ('14-system-portrait',390,844,'sys',3,''),
   ('07-menu-landscape',874,402,'play',3,"document.querySelector('.fsmenu').click()")]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for name,W,H,tab,pre,js in S:
            c=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2)
            pg=await c.new_page();await pg.route('**/fonts.g*/**',lambda r:r.abort())
            await pg.add_init_script("sessionStorage.setItem('elephant-boot','1');localStorage.setItem('elephant-tour','1');localStorage.setItem('elephant-coach','all')")
            await pg.goto('file://'+D+'index.html');await pg.wait_for_timeout(700)
            await pg.evaluate("GR.loadPreset(%d);GRUI.renderTab();GRUI.A.playing=false"%pre)
            await pg.evaluate(f"GRUI.go('{tab}')");await pg.wait_for_timeout(300)
            if js: await pg.evaluate(js);await pg.wait_for_timeout(400)
            await pg.screenshot(path=D+'screenshots/'+name+'.png');await c.close()
        await b.close()
asyncio.run(main())
