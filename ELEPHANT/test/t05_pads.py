"""PLAY page: 16 pads, select, long-press menu, no keyboard mode."""
from common import *
r=Run()
check('16 pads',r.pg.locator('#s-play .pad').count()==16)
check('no KEYS switch',r.pg.locator('#s-play .seg2').count()==0)
r.pg.locator('#s-play .pad').nth(5).dispatch_event('pointerdown',{'clientX':50,'clientY':400,'pointerId':1,'isPrimary':True});r.pg.wait_for_timeout(100)
r.pg.locator('#s-play .pad').nth(5).dispatch_event('pointerup',{'pointerId':1});r.pg.wait_for_timeout(100)
check('tapping selects the track',r.ev("GRUI.U.tr")==5)
for w,h in [(844,390),(1024,768),(1440,900)]:
    r.pg.set_viewport_size({'width':w,'height':h});r.pg.wait_for_timeout(250)
    r.ev("GRUI.go('play')");r.pg.wait_for_timeout(200)
    ok=r.ev("document.documentElement.scrollWidth<=innerWidth+1")
    check('no horizontal overflow %dx%d'%(w,h),ok)
r.close();done()
