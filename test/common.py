"""Shared helpers for the ELEPHANT browser tests (Playwright, Chromium)."""
import os,sys
from playwright.sync_api import sync_playwright
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
INIT="sessionStorage.setItem('elephant-boot','1');localStorage.setItem('elephant-tour','1');localStorage.setItem('elephant-coach','all')"
class Run:
    def __init__(s,w=390,h=844,touch=False):
        s.p=sync_playwright().start()
        s.b=s.p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        kw=dict(viewport={'width':w,'height':h})
        if touch:kw.update(has_touch=True,is_mobile=True)
        s.c=s.b.new_context(**kw);s.pg=s.c.new_page();s.errs=[]
        s.pg.on('pageerror',lambda e:s.errs.append(str(e)))
        s.pg.on('console',lambda m:s.errs.append(m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        s.pg.add_init_script(INIT)
        s.pg.goto('file://'+D+'index.html');s.pg.wait_for_timeout(700)
    def go(s,tab):s.pg.evaluate("GRUI.go('%s')"%tab);s.pg.wait_for_timeout(250)
    def ev(s,js):return s.pg.evaluate(js)
    def close(s):
        errs=s.errs;s.b.close();s.p.stop()
        assert not errs,('page errors',errs[:3])
fails=[]
def check(name,cond,info=''):
    print(('ok   ' if cond else 'FAIL ')+name+('' if cond else '  '+str(info)))
    if not cond:fails.append(name)
def done():
    if fails:print('FAILED:',fails);sys.exit(1)
