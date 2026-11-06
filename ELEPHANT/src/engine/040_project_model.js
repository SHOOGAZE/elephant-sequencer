/* ---------- project model ---------- */
function newStep(){return{on:0,note:0,vel:.8,micro:0,cond:0,len:1,rtg:1,lock:null}}
const MAXS=64;
/* pattern rows start at 16 steps and grow on demand up to 64, so old projects and saves stay small */
function growRow(row,len){while(row.length<len)row.push(newStep());return row}
function stepAt(row,len,pos){if(row.length<=pos)growRow(row,Math.min(MAXS,Math.max(len,pos+1)));return row[pos]}
function patLen(P){let m=16;for(const t of P.tracks)if(t.len>m)m=t.len;return Math.ceil(Math.min(MAXS,m)/16)*16}
function newPattern(){const p=[];for(let t=0;t<NT;t++){const r=[];for(let s=0;s<NS;s++)r.push(newStep());p.push(r)}return p}
function newTrack(engine,slot){return{engine,params:ENGINE_DEFAULT[engine](),slot:slot==null?-1:slot,mute:false,solo:false,len:16,sc:0}}
function defaultProject(){
  const P={name:'untitled',vol:1,bpm:100,swing:0,quant:{grid:2,depth:1},chain:[],song:false,pat:0,nextPat:-1,tracks:[],patterns:[],fx:defaultFx(),scenes:{a:null,b:null},morph:{on:false,x:0},side:{src:0,rel:.4},ver:3};
  /* 16 pads, one empty sampler track each: load or record a sample into a pad to hear it */
  for(let i=0;i<16;i++){const t=newTrack('SAMP',-1);Object.assign(t.params,{13:1,12:.3,14:.15,11:0,8:.95,24:.9,25:.5});P.tracks.push(t)}
  for(let p=0;p<NP;p++)P.patterns.push(newPattern());
  return P;
}
GR.defaultProject=defaultProject;GR.growRow=growRow;GR.stepAt=stepAt;GR.patLen=patLen;GR.MAXS=MAXS;
GR.newStep=newStep;GR.newTrack=newTrack;GR.newPattern=newPattern;
GR.proj=null;

