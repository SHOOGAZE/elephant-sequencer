"""Modulation matrix: routes change the rendered sound, UI drag creates routes."""
from common import *
r=Run()
res=r.ev("""async()=>{GR.proj=GR.defaultProject();const P=GR.proj,n=44100,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=Math.sin(i*.05)*.6+(Math.random()*2-1)*.3;
const k=GR.Samples.add('N',[a],44100,true);const T=P.tracks[0];T.slot=k;P.patterns[0].forEach(rw=>rw.forEach(s=>{s.on=0}));const s0=P.patterns[0][0][0];s0.on=1;s0.vel=1;
const pr=T.params;pr[8]=.5;pr[9]=.3;pr[10]=0;pr[4]=1;for(let i=26;i<=30;i++)pr[i]=0;
const run=async routes=>{T.routes=routes;const b=await GR.renderOffline({bars:1,tail:.3});const L=b.getChannelData(0);let e=0,bad=0,cr=0;for(let i=1;i<L.length;i++){const v=L[i];if(!isFinite(v))bad++;e+=v*v;if(L[i-1]<0&&v>=0)cr++}return{e,bad,cr}};
const base=await run([]);
const out={base};
out.lfoCut=await run([{s:0,d:'cut',a:.9}]);
out.envCut=await run([{s:2,d:'cut',a:.8}]);
pr[33]=.9;out.envPitch=await run([{s:2,d:'pitch',a:1}]);pr[33]=.5;
out.velLevel=await run([{s:3,d:'level',a:-.9}]);
out.lfoPan=await run([{s:1,d:'pan',a:.8}]);
out.lfoLevel=await run([{s:0,d:'level',a:1}]);
return out}""")
for k in ['lfoCut','envCut','envPitch','velLevel','lfoPan','lfoLevel']:
    v=res[k]
    check(k+' is finite',v['bad']==0)
    check(k+' changes the sound',abs(v['e']-res['base']['e'])/res['base']['e']>.003 or abs(v['cr']-res['base']['cr'])>2,(round(v['e'],2),round(res['base']['e'],2),v['cr'],res['base']['cr']))
r.ev("GR.proj.tracks[0].routes=[]");r.go('sound')
r.ev("document.querySelectorAll('#s-sound .ptabs .chip')[1].click()");r.pg.wait_for_timeout(250)
check('mod tray has four sources',r.pg.locator('.msrc').count()==4)
check('cutoff knob is a drop target',r.pg.locator('.knob[data-dest=cut]').count()==1)
sb=r.pg.locator('.msrc').nth(0).bounding_box();kb=r.pg.locator('.knob[data-dest=cut]').bounding_box()
r.pg.mouse.move(sb['x']+sb['width']/2,sb['y']+sb['height']/2);r.pg.mouse.down();r.pg.mouse.move(kb['x']+kb['width']/2,kb['y']+kb['height']/2,steps=8);r.pg.mouse.up();r.pg.wait_for_timeout(300)
rt=r.ev("GR.proj.tracks[0].routes")
check('dragging LFO 1 onto cutoff makes a route',len(rt)==1 and rt[0]['s']==0 and rt[0]['d']=='cut',rt)
check('knob shows a ring',r.pg.locator('.knob[data-dest=cut] .mod').count()==1)
kb=r.pg.locator('.knob[data-dest=cut]').bounding_box();cx,cy=kb['x']+kb['width']/2,kb['y']+25
r.pg.mouse.move(cx,cy);r.pg.mouse.down();r.pg.mouse.move(cx,cy-30,steps=6);r.pg.mouse.up();r.pg.wait_for_timeout(150)
a=r.ev("GR.proj.tracks[0].routes[0].a")
check('dragging the armed knob edits the amount',abs(a-.7)<.15,a)
r.pg.wait_for_timeout(450);r.pg.mouse.dblclick(cx,cy);r.pg.wait_for_timeout(250)
check('double tap removes the route',len(r.ev("GR.proj.tracks[0].routes"))==0)
r.ev("GR.proj.tracks[0].routes=[{s:1,d:'pitch',a:.4}]");
js=r.ev("JSON.parse(GR.serialize?GR.serialize():'{}')") if False else None
r.close();done()
