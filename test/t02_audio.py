"""Pads with a sample make sound, empty pads stay silent, nothing clips."""
from common import *
r=Run()
SETUP="""()=>{const n=44100,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=Math.sin(6.2832*180*i/44100)*Math.exp(-i/9000);const i=GR.Samples.add('TEST',[a],44100,true);GR.proj.tracks.forEach(t=>t.slot=i);return i}"""
r.ev(SETUP)
res=r.ev("""async()=>{const out=[];
for(let ti=0;ti<16;ti++){const p=GR.proj;p.patterns[0].forEach(rw=>rw.forEach(s=>{s.on=0}));const st=p.patterns[0][ti][0];st.on=1;st.vel=1;
  p.tracks.forEach(t=>{for(let i=26;i<=30;i++)t.params[i]=0});p.pat=0;p.song=false;
  const b=await GR.renderOffline({bars:1,tail:.5});const L=b.getChannelData(0);let m=0;for(let i=0;i<L.length;i++)m=Math.max(m,Math.abs(L[i]));out.push(m)}
return out}""")
check('all 16 pads audible',all(x>.02 for x in res),[round(x,3) for x in res])
check('no pad clips',all(x<1.0 for x in res),[round(x,3) for x in res])
sil=r.ev("""async()=>{const p=GR.proj;p.tracks[3].slot=-1;p.patterns[0].forEach(rw=>rw.forEach(s=>{s.on=0}));p.patterns[0][3][0].on=1;const b=await GR.renderOffline({bars:1,tail:.2});const L=b.getChannelData(0);let m=0;for(let i=0;i<L.length;i++)m=Math.max(m,Math.abs(L[i]));return m}""")
check('empty pad is silent',sil<1e-4,sil)
r.close();done()
