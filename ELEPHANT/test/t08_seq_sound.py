"""SEQ SOUND tab: knobs under the trigs, p-locks on the selected step, MOD sources."""
from common import *
r=Run()
r.go('seq')
r.ev("GRUI.U.seqTab='snd';GRUI.R.seq()");r.pg.wait_for_timeout(250)
r.ev("GRUI.U.page=1;GRUI.R.seq()");r.pg.wait_for_timeout(250)
check('sound tab shows knobs and MOD tray',r.pg.locator('#s-seq .knob').count()>=8 and r.pg.locator('#s-seq .msrc').count()==4)
def drag(sel):
    b=r.pg.locator('#s-seq '+sel).first.bounding_box();cx,cy=b['x']+b['width']/2,b['y']+25
    r.pg.mouse.move(cx,cy);r.pg.mouse.down();r.pg.mouse.move(cx,cy+40,steps=6);r.pg.mouse.up();r.pg.wait_for_timeout(150)
base=r.ev("GRUI.trk().params[8]")
drag('.knob[data-dest=cut]')
after=r.ev("GRUI.trk().params[8]")
check('no step selected: knob edits the track',after<base-.1,(base,after))
r.ev("GRUI.U.step=3;GRUI.R.seq()");r.pg.wait_for_timeout(200)
r.pg.wait_for_timeout(400);drag('.knob[data-dest=cut]')
lk=r.ev("GRUI.curPat()[GRUI.U.tr][3].lock")
check('step selected: knob writes a p-lock',lk is not None and '8' in lk,lk)
check('track value untouched by the lock',abs(r.ev("GRUI.trk().params[8]")-after)<1e-6)
sb=r.pg.locator('#s-seq .msrc').nth(1).bounding_box();kb=r.pg.locator('#s-seq .knob[data-dest=cut]').bounding_box()
r.pg.mouse.move(sb['x']+sb['width']/2,sb['y']+sb['height']/2);r.pg.mouse.down();r.pg.mouse.move(kb['x']+kb['width']/2,kb['y']+30,steps=8);r.pg.mouse.up();r.pg.wait_for_timeout(300)
rt=r.ev("GRUI.trk().routes")
check('dragging LFO 2 onto a seq knob makes a route',len(rt)==1 and rt[0]['s']==1,rt)
r.close();done()
