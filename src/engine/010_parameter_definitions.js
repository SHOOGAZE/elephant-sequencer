/* ---------- parameter definitions ---------- */
const SRC={
  SAMP:[{n:'START',f:pct},{n:'END',f:pct},{n:'TUNE',f:semi},{n:'FINE',f:cents},{n:'LOOP',d:['OFF','ON']},{n:'REV',d:['OFF','ON']},{n:'SLICES',d:['1','2','4','8','16']},{n:'SLICE',f:pct}]
};
const FLT_TYPES=['LP 12','LP 24','HP','BAND','NOTCH','LADDER','COMB','FORMANT'];
const FLT=[{n:'CUTOFF',f:v=>hzs(CUTHZ(v))+'Hz'},{n:'RESO',f:pct},{n:'ENV AMT',f:pct},{n:'A.ATK',f:v=>secs(T_ATK(v))},{n:'A.DEC',f:v=>secs(T_DEC(v))},{n:'A.SUS',f:pct},{n:'A.REL',f:v=>secs(T_REL(v))},{n:'TYPE',d:FLT_TYPES}];
const LFO_DEST=['CUT','PITCH','SHAPE','AMP','PAN'];
const LFO_SHAPE=['SIN','TRI','SQR','RMP','RND'];
const MOD=[
  {n:'L1 RATE',f:v=>LFOHZ(v).toFixed(1)+'Hz'},{n:'L1 DEPTH',f:pct},{n:'L1 DEST',d:LFO_DEST},{n:'L1 WAVE',d:LFO_SHAPE},
  {n:'L2 RATE',f:v=>LFOHZ(v).toFixed(1)+'Hz'},{n:'L2 DEPTH',f:pct},{n:'L2 DEST',d:LFO_DEST},{n:'L2 WAVE',d:LFO_SHAPE}
];
const MIX=[{n:'LEVEL',f:pct},{n:'PAN',f:v=>v<.47?'L'+Math.round((.5-v)*200):v>.53?'R'+Math.round((v-.5)*200):'C'},{n:'DELAY',f:pct},{n:'REVERB',f:pct},{n:'CHORUS',f:pct},{n:'DRIVE',f:pct},{n:'CRUSH',f:v=>v<.02?'OFF':(12-Math.floor(v*9))+'bit'},{n:'GATE',f:v=>Math.round((.2+v*1.6)*100)+'%'}];
const ENVP=[{n:'F.ATK',f:v=>secs(T_ATK(v))},{n:'F.DEC',f:v=>secs(T_DEC(v))},{n:'F.SUS',f:pct},{n:'F.REL',f:v=>secs(T_REL(v))},{n:'VEL>CUT',f:pct},{n:'VEL>AMP',f:pct}];
const PAGES=['SRC','FLT','MOD','MIX'];
const pagesFor=eng=>['SRC','FLT','MOD','MIX','ENV'];
const pageNo=(eng,tab)=>tab;
function pageDefs(engine,page){return page===0?SRC[engine]:page===1?FLT:page===2?MOD:page===3?MIX:ENVP}
function fmtParam(engine,idx,v){
  const d=pageDefs(engine,idx>>3)[idx&7];
  if(d.d)return d.d[dval(v,d.d.length)];
  return d.f(v);
}
const tailDef=fd=>[0,fd,0,.3,0,.5];
function baseParams(src){
  const p=new Float32Array(NPAR);
  p.set(src,0);
  p.set([.75,.1,.2,.02,.5,.6,.3,dnorm(0,8)],8);
  p.set([.4,0,dnorm(0,5),dnorm(0,5),.3,0,dnorm(1,5),dnorm(0,5)],16);
  p.set([.8,.5,0,0,0,0,0,.5],24);
  p.set(tailDef(.2),32);
  return p;
}
const D=dnorm;
const ENGINE_DEFAULT={
  SAMP:()=>baseParams([0,1,.5,.5,D(0,2),D(0,2),D(0,5),0])
};
GR.defs={FLT_TYPES,pageNo,SRC,FLT,MOD,MIX,PAGES,pagesFor,ENGINES,ENG_NAME,COND,pageDefs,fmtParam,dval,dnorm,clamp,lerp,ENGINE_DEFAULT,NT,NS,NP,NPAR};

