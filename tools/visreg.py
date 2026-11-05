"""Visual regression helper.
Usage: python3 tools/visreg.py DIR_BEFORE, change CSS, python3 build.py, python3 tools/visreg.py DIR_AFTER, python3 tools/viscmp.py DIR_BEFORE DIR_AFTER.
Shots every screen in six viewports with a starter preset loaded; tiny antialiasing noise is ignored by viscmp."""
import sys,os
from playwright.sync_api import sync_playwright
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
out=sys.argv[1];os.makedirs(out,exist_ok=True)
VP=[(390,844),(844,390),(932,430),(768,1024),(1180,820),(1440,900)]
if os.environ.get('VPS'):VP=[tuple(map(int,v.split('x'))) for v in os.environ['VPS'].split(',')]
HIDE="canvas,.lvm,.toast,#toast,.wave{visibility:hidden!important}*{animation:none!important;transition:none!important;caret-color:transparent!important}"
with sync_playwright() as p:
    b=p.chromium.launch();n=0;errs=[]
    for W,H in VP:
        pg=b.new_context(viewport={'width':W,'height':H},device_scale_factor=1).new_page()
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.add_init_script("sessionStorage.setItem('elephant-boot','1');localStorage.setItem('elephant-tour','1');localStorage.setItem('elephant-coach','all')")
        pg.route('**/fonts.g*/**',lambda r:r.abort());pg.goto('file://'+D+'index.html');pg.wait_for_timeout(700);pg.add_style_tag(content=HIDE)
        def shot(name):
            global n
            pg.wait_for_timeout(120);pg.screenshot(path=f'{out}/{W}x{H}_{name}.png');n+=1
        shot('empty_play')
        pg.evaluate("GR.loadPreset(0);GRUI.renderTab()");pg.wait_for_timeout(200)
        pg.evaluate("GRUI.A.playing=false")
        for t in ['play','mix','fx','sys','smpl']:
            pg.evaluate(f"GRUI.go('{t}')");shot(t)
        pg.evaluate("GRUI.go('seq')")
        for st in ['step','snd','gen','edit']:
            pg.evaluate(f"GRUI.U.seqTab='{st}';GRUI.U.step=4;GRUI.U.page=1;GRUI.renderTab()");shot('seq_'+st)
        pg.evaluate("GRUI.U.seqTab='snd';GRUI.U.page=2;GRUI.renderTab()");shot('seq_mod')
        pg.evaluate("GR.proj.tracks[5].routes=[{s:0,d:'cut',a:.5},{s:2,d:'pitch',a:-.4}];GRUI.U.tr=5")
        pg.evaluate("GRUI.go('sound')")
        for pgn in range(5):
            pg.evaluate(f"GRUI.U.lockStep=-1;GRUI.U.page={pgn};GRUI.renderTab()");shot(f'sound_p{pgn}')
        pg.evaluate("GRUI.U.lockStep=3;GRUI.U.page=1;GRUI.renderTab()");shot('sound_lock')
        pg.evaluate("GRUI.U.lockStep=-1;GRUI.go('mix')")
        if H<=560 and W>560:
            pg.click('.fsmenu');shot('mix_drawer');pg.evaluate("document.body.classList.remove('fsopen')")
        pg.close()
    print('shots',n,'errors',errs);b.close()
