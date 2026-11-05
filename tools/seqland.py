import os,sys; D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
from playwright.sync_api import sync_playwright
sizes=[(896,414),(667,375),(932,430)]
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in sizes:
        c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True);pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.add_init_script("sessionStorage.setItem('elephant-boot','1');localStorage.setItem('elephant-tour','1');localStorage.setItem('elephant-coach','all');localStorage.setItem('elephant-seqv','track');localStorage.setItem('elephant-simple','0')")
        pg.goto('file://'+D+'index.html');pg.wait_for_timeout(500)
        pg.evaluate("GRUI.go('seq')");pg.wait_for_timeout(500)
        pg.screenshot(path=D+'test/out/sq_%d.png'%w)
        if len(sys.argv)>1:
            pg.evaluate(sys.argv[1]);pg.wait_for_timeout(400);pg.screenshot(path=D+'test/out/sq_%d_b.png'%w)
        print(w,errs)
