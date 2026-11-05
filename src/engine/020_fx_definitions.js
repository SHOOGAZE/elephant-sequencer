/* ---------- FX definitions ---------- */
const DLY_BEATS=[.125,.25,.375,.5,.75,1,1.5,2];
const DLY_L=['1/32','1/16','1/16.','1/8','1/8.','1/4','1/4.','1/2'];
const FXDEF={
  delay:[{n:'TIME',d:DLY_L},{n:'FEEDBACK',f:v=>pct(v)},{n:'LEVEL',f:pct}],
  chorus:[{n:'RATE',f:v=>(.05*Math.pow(80,v)).toFixed(1)+'Hz'},{n:'DEPTH',f:pct},{n:'LEVEL',f:pct}],
  reverb:[{n:'SIZE',f:pct},{n:'DAMP',f:pct},{n:'LEVEL',f:pct}],
  filter:[{n:'FREQ',f:v=>v<.48?'LP '+hzs(60*Math.pow(300,v/.5))+'Hz':v>.52?'HP '+hzs(20*Math.pow(200,(v-.5)/.5))+'Hz':'OFF'},{n:'RESO',f:pct},{n:'VOLUME',f:pct}],
  comp:[{n:'THRESH',f:v=>(-v*40).toFixed(0)+'dB'},{n:'RATIO',f:v=>(1+v*19).toFixed(1)+':1'},{n:'ATTACK',f:v=>secs(.001+v*.1)},{n:'RELEASE',f:v=>secs(.03+v*.5)},{n:'MAKEUP',f:v=>(v*18).toFixed(1)+'dB'}]
};
const FX_ORDER=['delay','chorus','reverb','filter','comp'];
const FX_TITLE={delay:'DELAY',chorus:'CHORUS',reverb:'REVERB',filter:'M.FILTER',comp:'COMP/LIM'};
function defaultFx(){return{
  delay:[D(3,8),.4,.5],
  chorus:[.35,.5,.5],
  reverb:[.6,.4,.5],
  filter:[.5,0,.7],
  comp:[0,0,.1,.3,0]
}}
GR.fx={FXDEF,FX_ORDER,FX_TITLE,defaultFx,DLY_BEATS,DLY_L};

