"""FX engine (AudioWorklet): delay, chorus and reverb return sound from the track sends."""
from common import *
r=Run()
res=r.ev("""async()=>{
GR.proj=GR.defaultProject();const P=GR.proj,n=4000,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=Math.sin(6.2832*220*i/44100)*Math.exp(-i/600);
const k=GR.Samples.add('CLK',[a],44100,true);P.tracks[0].slot=k;P.bpm=120;
const tail=async(send,fr)=>{P.patterns[0].forEach(rw=>rw.forEach(s=>{s.on=0}));const s0=P.patterns[0][0][0];s0.on=1;s0.vel=1;
  const pr=P.tracks[0].params;pr[26]=0;pr[27]=0;pr[28]=0;if(send!=null)pr[send]=1;
  const b=await GR.renderOffline({bars:1,tail:1});const L=b.getChannelData(0);let e=0,bad=0;const from=Math.floor(44100*(fr==null?.35:fr));for(let i=from;i<L.length;i++){if(!isFinite(L[i]))bad++;e+=L[i]*L[i]}return [e,bad]};
const dry=await tail(null),dl=await tail(26),rv=await tail(27),ch=await tail(28,0),dry0=await tail(null,0);
return {dry,dl,rv,ch,dry0}}""")
print(res)
check('delay repeats are heard',res['dl'][0]>res['dry'][0]*5+1e-9,res)
check('reverb tail is heard',res['rv'][0]>res['dry'][0]*5+1e-9,res)
check('chorus adds a doubled signal',res['ch'][0]>res['dry0'][0]*1.02,res)
check('no NaN in fx',all(res[k][1]==0 for k in res))
check('fx tabs',r.ev("(()=>{GRUI.go('fx');return [...document.querySelectorAll('#s-fx .fxtabs .chip')].map(c=>c.textContent).join()})()")=='DELAY,CHORUS,REVERB,M.FILTER,COMP/LIM')
r.close();done()
