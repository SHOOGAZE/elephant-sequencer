"""SAMPLE > SRC wave: finger gestures set start/end, zoom/pan, slice tap; fullscreen MIX/SEQ layout."""
from common import *
r=Run();r.ev("GR.loadPreset(0);GRUI.renderTab()");r.ev("GRUI.U.tr=0;GRUI.U.page=0");r.go('sound')
cv=r.pg.locator('canvas.viz.wv');check('SRC wave canvas present',cv.count()==1)
bb=cv.bounding_box();y=bb['y']+bb['height']/2
P=lambda:r.ev("[GRUI.trk().params[0],GRUI.trk().params[1]]")
# drag the end handle (right edge) to the middle
r.pg.mouse.move(bb['x']+bb['width']-4,y);r.pg.mouse.down();r.pg.mouse.move(bb['x']+bb['width']*.5,y,steps=6);r.pg.mouse.up()
p=P();check('dragging the end edge sets END near 50%',.4<p[1]<.6,p)
# drag the start handle
r.pg.mouse.move(bb['x']+4,y);r.pg.mouse.down();r.pg.mouse.move(bb['x']+bb['width']*.2,y,steps=6);r.pg.mouse.up()
p=P();check('dragging the start edge sets START near 20%',.1<p[0]<.3 and p[1]>p[0],p)
# swipe in the middle draws a fresh region
r.pg.mouse.move(bb['x']+bb['width']*.3,y);r.pg.mouse.down();r.pg.mouse.move(bb['x']+bb['width']*.45,y,steps=6);r.pg.mouse.up()
# zoom (what a pinch writes) keeps drawing and handles still map to the zoomed view
r.ev("GRUI.U.vz={slot:GRUI.trk().slot,v0:.2,v1:.6}");r.ev("GRUI.renderTab()");r.pg.wait_for_timeout(150)
cv=r.pg.locator('canvas.viz.wv');bb=cv.bounding_box();y=bb['y']+bb['height']/2
before=r.ev("GRUI.U.vz.v0")
r.pg.mouse.move(bb['x']+bb['width']*.5,y);r.pg.mouse.down();r.pg.mouse.move(bb['x']+bb['width']*.2,y,steps=6);r.pg.mouse.up()
check('one finger pans a zoomed wave',r.ev("GRUI.U.vz.v0")!=before and r.ev("GRUI.U.vz.v1-GRUI.U.vz.v0")>.39,r.ev("GRUI.U.vz"))
r.pg.mouse.dblclick(bb['x']+bb['width']*.5,y);r.pg.wait_for_timeout(100)
check('double tap resets zoom',r.ev("GRUI.U.vz.v0")==0 and r.ev("GRUI.U.vz.v1")==1)
# slices: tap picks one
r.ev("GRUI.trk().params[6]=.5;GRUI.renderTab()");r.pg.wait_for_timeout(150)
cv=r.pg.locator('canvas.viz.wv');bb=cv.bounding_box();y=bb['y']+bb['height']/2
ns=r.ev("[1,2,4,8,16][dval(GRUI.trk().params[6],5)]") if False else None
r.pg.mouse.click(bb['x']+bb['width']*.9,y);r.pg.wait_for_timeout(100)
check('tapping a slice selects it',r.ev("GRUI.trk().params[7]")>.6,r.ev("GRUI.trk().params[7]"))
r.close()
# fullscreen landscape: MIX faders fill the height, SEQ trigs are square
r=Run(874,402,touch=True);r.ev("GR.loadPreset(0);GRUI.renderTab()");r.go('mix')
H=r.ev("document.querySelector('#s-mix .fader').getBoundingClientRect().height")
check('fullscreen MIX faders are tall',H>150,H)
r.go('seq');g=r.ev("(()=>{const a=document.querySelector('#s-seq .trigs .gc').getBoundingClientRect();return [a.width,a.height]})()")
check('fullscreen SEQ trigs are square',abs(g[0]-g[1])<1.5 and g[0]>50,g)
ph=r.ev("document.querySelector('#s-seq .pager .chip').getBoundingClientRect().width")
check('PAGE button is small',ph<80,ph)
r.close();done()
