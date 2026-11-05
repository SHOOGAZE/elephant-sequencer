/* ---------- starter presets: samples are synthesised here, so a preset needs no files ---------- */
const PSR=44100;
let pseed=1;const prnd=()=>{pseed=(pseed*1664525+1013904223)>>>0;return pseed/4294967296*2-1};
const psnd=(sec,fn)=>{const n=Math.floor(PSR*sec),a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=fn(i/PSR,i);return a};
const plp=(a,fc)=>{const k=1-Math.exp(-6.2832*fc/PSR);let y=0;for(let i=0;i<a.length;i++){y+=k*(a[i]-y);a[i]=y}return a};
const php=(a,fc)=>{const k=1-Math.exp(-6.2832*fc/PSR);let y=0;for(let i=0;i<a.length;i++){y+=k*(a[i]-y);a[i]-=y}return a};
const psat=(a,d)=>{const m=Math.tanh(d);for(let i=0;i<a.length;i++)a[i]=Math.tanh(a[i]*d)/m;return a};
function pkick(){let ph=0;const a=psnd(.55,(t)=>{ph+=6.2832*(44+95*Math.exp(-t*32))/PSR;return Math.sin(ph)*Math.exp(-t*6.5)*(t<.002?t/.002:1)});
  for(let i=0;i<300;i++)a[i]+=prnd()*.25*(1-i/300);return norm(psat(a,1.6),.92)}
function psub(){return norm(psat(psnd(.9,(t)=>{const e=Math.min(1,t/.006)*Math.exp(-t*2.1);return (Math.sin(6.2832*36.71*t)+.18*Math.sin(6.2832*73.42*t))*e}),1.4),.9)}
function pstab(){
  const notes=[146.83,174.61,220,261.63],a=psnd(1.5,()=>0);
  notes.forEach(f=>[-.07,0,.07].forEach(dt=>{const fr=f*Math.pow(2,dt/12);let ph=Math.random()*6.28;for(let i=0;i<a.length;i++){ph+=6.2832*fr/PSR;let s=0;for(let h=1;h<=9;h++)s+=Math.sin(ph*h)/h;a[i]+=s*.12}}));
  let y=0;for(let i=0;i<a.length;i++){const t=i/PSR,fc=260+2600*Math.exp(-t*8),k=1-Math.exp(-6.2832*fc/PSR);y+=k*(a[i]-y);a[i]=y*Math.min(1,t/.004)*Math.exp(-t*3)}
  return norm(a,.85)}
function phat(open){const a=psnd(open?.38:.09,(t)=>prnd()*Math.exp(-t*(open?13:95)));php(a,5500);return norm(a,.7)}
function prim(){const a=psnd(.12,(t)=>(Math.sin(6.2832*1750*t)*.7+prnd()*.5)*Math.exp(-t*60));return norm(php(a,500),.75)}
function pclap(){const a=psnd(.4,(t)=>{let e=0;[0,.011,.022].forEach(t0=>{if(t>=t0)e=Math.max(e,Math.exp(-(t-t0)*(t0===.022?20:140)))});return prnd()*e});return norm(plp(php(a,800),3600),.8)}
function ptex(){let p=0;const a=psnd(3,(t)=>prnd()*(.6+.4*Math.sin(6.2832*.7*t)));plp(a,700);plp(a,900);for(let i=0;i<a.length;i++){const t=i/PSR;a[i]*=Math.min(1,t/.4)*Math.min(1,(3-t)/.6)}return norm(a,.6)}
const PSOUNDS=[['KICK',pkick],['RIM',prim],['CLAP',pclap],['HAT',()=>phat(false)],['OPEN HAT',()=>phat(true)],['STAB',pstab],['SUB',psub],['TEXTURE',ptex]];
/* tracks: [sound index, params {idx:value}] */
const PTRK=[
  [0,{24:.95}],
  [1,{24:.7,25:.45,26:.55,27:.35}],
  [2,{24:.75,26:.3,27:.5}],
  [3,{24:.55,25:.62,26:.3,8:.9}],
  [4,{24:.6,25:.38,26:.45,27:.25,8:.85}],
  [5,{24:.8,26:.72,27:.55,8:.62,9:.25,10:.3,33:.45,16:.18,19:0}],
  [6,{24:.85,8:.55,29:.1}],
  [7,{24:.5,26:.2,27:.7,4:1,31:.5,14:.5}]
];
function pset(row,steps,o){(Array.isArray(steps)?steps:[steps]).forEach(i=>{const s=row[i];s.on=1;s.vel=o.vel==null?.8:o.vel;s.note=o.note||0;s.len=o.len||1;s.micro=o.micro||0;if(o.cond)s.cond=o.cond})}
const PRESETS=[
 {name:'DUB CHORDS',bpm:122,dly:[4,.66,.55],rev:[.82,.45,.5],pats:[
  p=>{pset(p[0],[0,4,8,12],{vel:1});pset(p[4],[2,6,10,14],{vel:.75});pset(p[3],[1,3,5,7,9,11,13,15],{vel:.32,micro:1});pset(p[1],[7,15],{vel:.5});pset(p[5],3,{vel:.9});pset(p[5],10,{vel:.7});pset(p[6],0,{len:3,vel:.9});pset(p[6],8,{len:2,vel:.8})},
  p=>{pset(p[0],[0,4,8,12],{vel:1});pset(p[4],[2,6,10,14],{vel:.75});pset(p[3],[1,3,5,7,9,11,13,15],{vel:.35,micro:1});pset(p[2],[4,12],{vel:.8});pset(p[5],3,{vel:.9});pset(p[5],10,{vel:.75,note:3});pset(p[5],14,{vel:.55,note:3});pset(p[6],0,{len:3,vel:.9});pset(p[6],10,{len:3,vel:.8,note:3});pset(p[7],0,{len:16,vel:.5})},
  p=>{pset(p[5],0,{vel:.9});pset(p[5],6,{vel:.75,note:3});pset(p[5],12,{vel:.7,note:5});pset(p[6],0,{len:6,vel:.8});pset(p[6],12,{len:4,vel:.7,note:5});pset(p[4],[4,12],{vel:.5});pset(p[7],0,{len:16,vel:.6})}]},
 {name:'DEEP MINIMAL',bpm:124,dly:[3,.55,.5],rev:[.7,.5,.4],pats:[
  p=>{pset(p[0],[0,4,8,12],{vel:1});pset(p[3],[2,6,10,14],{vel:.5});pset(p[1],[4,12],{vel:.6});pset(p[5],6,{vel:.65});pset(p[5],11,{vel:.5,note:5});pset(p[6],0,{len:4,vel:.85});pset(p[6],8,{len:4,vel:.8,note:3})},
  p=>{pset(p[0],[0,4,8,12],{vel:1});pset(p[3],[2,6,10,14],{vel:.55});pset(p[4],14,{vel:.6});pset(p[2],12,{vel:.7});pset(p[1],[4],{vel:.55});pset(p[5],6,{vel:.7});pset(p[5],9,{vel:.5,note:3});pset(p[5],11,{vel:.6,note:5});pset(p[6],0,{len:4,vel:.85});pset(p[6],8,{len:4,vel:.8,note:5});pset(p[7],0,{len:16,vel:.35})}]},
 {name:'ECHO SPACE',bpm:118,dly:[5,.72,.62],rev:[.9,.5,.55],pats:[
  p=>{pset(p[0],[0,8],{vel:1});pset(p[0],11,{vel:.5});pset(p[4],[4,12],{vel:.7});pset(p[3],[2,6,10,14],{vel:.35});pset(p[2],12,{vel:.75});pset(p[5],2,{vel:.9});pset(p[5],7,{vel:.7,note:3});pset(p[5],14,{vel:.7,note:5});pset(p[6],0,{len:6,vel:.85});pset(p[6],10,{len:4,vel:.8,note:3});pset(p[7],0,{len:16,vel:.45})},
  p=>{pset(p[5],2,{vel:.9});pset(p[5],10,{vel:.7,note:5});pset(p[6],0,{len:8,vel:.8});pset(p[7],0,{len:16,vel:.7});pset(p[1],[6,14],{vel:.4})}]}
];
GR.presets=PRESETS.map(p=>({name:p.name,bpm:p.bpm,patterns:p.pats.length}));
GR.loadPreset=function(i){
  const pr=PRESETS[i];if(!pr)return false;pseed=7+i;
  Samples.slots=[];const sl=PSOUNDS.map(([n,f])=>Samples.add(n,[f()],PSR,true));
  const P=defaultProject();P.name=pr.name;P.bpm=pr.bpm;
  PTRK.forEach(([si,par],ti)=>{const t=P.tracks[ti];t.slot=sl[si];Object.assign(t.params,par);t.len=16});
  P.tracks[5].routes=[{s:0,d:'cut',a:.2}];
  P.fx.delay=[dnorm(pr.dly[0],8),pr.dly[1],pr.dly[2]];P.fx.reverb=pr.rev.slice();
  pr.pats.forEach((f,k)=>f(P.patterns[k]));
  GR.proj=P;return true;
};
