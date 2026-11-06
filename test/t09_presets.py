"""Starter presets: each loads, renders finite audible sound at sane levels."""
from common import *
r=Run()
n=r.ev("GR.presets.length")
check('presets present',n>=9,n)
for i in range(n):
    res=r.ev("""async(i)=>{GR.loadPreset(i);const P=GR.proj,out=[];
for(let k=0;k<GR.presets[i].patterns;k++){P.pat=k;const b=await GR.renderOffline({bars:2,tail:1});const L=b.getChannelData(0);let m=0,e=0,bad=0;for(let j=0;j<L.length;j++){const v=L[j];if(!isFinite(v))bad++;m=Math.max(m,Math.abs(v));e+=v*v}out.push([m,e,bad])}
return {out,slots:GR.Samples.slots.length,name:P.name}}""" if False else "0") if False else None
fl=r.pg.evaluate("""async()=>{const R=[];for(let i=0;i<GR.presets.length;i++){GR.loadPreset(i);const P=GR.proj,o=[];for(let k=0;k<GR.presets[i].patterns;k++){P.pat=k;const b=await GR.renderOffline({bars:2,tail:1});const L=b.getChannelData(0);let m=0,e=0,bad=0;for(let j=0;j<L.length;j++){const v=L[j];if(!isFinite(v))bad++;m=Math.max(m,Math.abs(v));e+=v*v}o.push([m,e,bad])}R.push({o,slots:GR.Samples.slots.length,name:P.name})}return R}""")
for i,x in enumerate(fl):
    check(x['name']+' loads 8 sounds',x['slots']==8)
    for k,(m,e,bad) in enumerate(x['o']):
        check(x['name']+' pattern '+'ABC'[k]+' finite, audible, not clipping',bad==0 and .05<m<1.6 and e>1,(round(m,2),round(e,1),bad))
# UI: empty PADS offers the starters; a tap loads one
r.ev("GR.Samples.slots.length=0;GR.proj=GR.defaultProject()");r.go('play');r.ev("GRUI.renderTab()")
check('empty pads show the starter row',r.pg.locator('.startrow .chip').count()==r.ev('GR.presets.length'))
r.pg.locator('.startrow .chip').first.click();r.pg.wait_for_timeout(500)
check('tapping a starter loads it',r.ev("GR.Samples.slots.length")==8 and r.ev("GRUI.A.playing")==False)
check('pads show names',r.pg.locator('.pad .pe').first.inner_text().strip()!='-')
check('starter row gone once loaded',r.pg.locator('.startrow').count()==0)
r.close();done()
