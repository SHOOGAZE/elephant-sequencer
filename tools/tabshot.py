import os,sys; D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
os.makedirs(D+'test/out',exist_ok=True)
from playwright.sync_api import sync_playwright
sizes={'mini_p':(744,1133),'air_p':(820,1180),'pro_p':(1024,1366),'air_l':(1180,820),'pro_l':(1366,1024)}
tabs=sys.argv[1].split(',') if len(sys.argv)>1 else ['play','seq']
pre=sys.argv[2] if len(sys.argv)>2 else 'tb'
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,(w,h) in sizes.items():
        c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
        pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.add_init_script("sessionStorage.setItem('elephant-boot','1');localStorage.setItem('elephant-tour','1');localStorage.setItem('elephant-coach','all');localStorage.setItem('elephant-seqv','track');localStorage.setItem('elephant-simple','0')")
        pg.goto('file://'+D+'index.html');pg.wait_for_timeout(500)
        for t in tabs:
            pg.evaluate(f"GRUI.go('{t}')");pg.wait_for_timeout(300)
            pg.screenshot(path=D+f'test/out/{pre}_{n}_{t}.png')
        m=pg.evaluate("(()=>{const a=document.querySelector('#app').getBoundingClientRect();return [Math.round(a.width),Math.round(a.height),getComputedStyle(document.documentElement).getPropertyValue('--z'),document.documentElement.scrollHeight>innerHeight+2]})()")
        print(n,m,errs)
    b.close()
