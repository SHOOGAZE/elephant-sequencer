"""SOUND page for sampler tracks: pages, knobs, engine switch, sound picker."""
from common import *
r=Run()
r.go('sound')
check('no macro page any more',r.pg.locator('#s-sound .ptabs .chip').count()==5 and 'MACRO' not in r.ev("document.querySelector('#s-sound').textContent"))
r.ev("document.querySelectorAll('#s-sound .ptabs .chip')[0].click()");r.pg.wait_for_timeout(250)
check('sound page renders knobs',r.pg.locator('#s-sound .knob').count()>=8,r.pg.locator('#s-sound .knob').count())
labels=r.ev("[...document.querySelectorAll('#s-sound .kl')].map(e=>e.textContent)")
check('source page is the sampler page',all(x in labels for x in ['START','END','TUNE']),labels)
check('no synth wording on the page',not any(x in ' '.join(labels) for x in ['WAVE','OSC2','ALGO','UNISON']))
r.ev("document.querySelectorAll('#s-sound .ptabs .chip')[1].click()");r.pg.wait_for_timeout(200)
labels=r.ev("[...document.querySelectorAll('#s-sound .kl')].map(e=>e.textContent)")
check('filter page',all(x in labels for x in ['CUTOFF','RESO']),labels)
r.ev("document.querySelectorAll('#s-sound .ptabs .chip')[4].click()");r.pg.wait_for_timeout(200)
labels=r.ev("[...document.querySelectorAll('#s-sound .kl')].map(e=>e.textContent)")
check('env page has six knobs',len(labels)==6 and 'F.ATK' in labels,labels)
fl=r.ev("""async()=>{GR.proj=GR.defaultProject();const P=GR.proj,n=44100,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.exp(-i/9000);const k=GR.Samples.add('N',[a],44100,true);P.tracks[0].slot=k;
const out=[];for(let ty=0;ty<8;ty++){P.patterns[0].forEach(rw=>rw.forEach(s=>{s.on=0}));const s0=P.patterns[0][0][0];s0.on=1;s0.vel=1;const pr=P.tracks[0].params;pr[15]=GR.defs.dnorm(ty,8);pr[8]=.5;pr[9]=.5;pr[10]=.4;pr[16]=.5;pr[17]=.5;pr[18]=GR.defs.dnorm(0,5);
for(let i=26;i<=30;i++)pr[i]=0;const b=await GR.renderOffline({bars:1,tail:.3});const L=b.getChannelData(0);let m=0,e=0,bad=0;for(let i=0;i<L.length;i++){const v=L[i];if(!isFinite(v))bad++;m=Math.max(m,Math.abs(v));e+=v*v}out.push([m,e,bad])}return out}""")
check('8 filter types listed',r.ev("GR.defs.FLT_TYPES.length")==8)
check('every filter type makes finite sound',all(x[2]==0 and x[0]>.001 and x[0]<3 for x in fl),[[round(a,3),round(b,1),c] for a,b,c in fl])
check('filter types sound different',len(set(round(x[1],0) for x in fl))>=6,[round(x[1],1) for x in fl])
r.close();done()
