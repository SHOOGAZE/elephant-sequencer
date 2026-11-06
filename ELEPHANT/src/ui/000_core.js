const GR=window.GR,Df=GR.defs,FXD=GR.fx,S=GR.Samples;
const {pageNo,IVL,pageDefs,fmtParam,dval,dnorm,clamp,PAGES,pagesFor,ENGINES,ENG_NAME,COND,ENGINE_DEFAULT,NPAR}=Df;
const $=(s,r)=>(r||document).querySelector(s);
const P=()=>GR.proj;
const NN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const PATL='ABCDEFGH';
const U={tab:'play',tr:0,page:0,step:-1,lockStep:-1,fxTab:'delay',slot:0,kb:false,kbBase:0,oct2:(()=>{try{const v=localStorage.getItem('elephant-oct2');return v===null?null:v==='1'}catch(e){return null}})(),lock:false,hold:false,scale:0,chord:false,bend:0,mod:0,trim:{a:0,b:1,slot:-1},midi:null,sr:{on:false,pos:0},countIn:false,hintOff:false,patClip:null,
  held:[],quiet:0,skipF:0,msg:'',msgT:0,clip:null,eucK:4,eucR:0,expBars:2,rsSrc:'master',rsBars:1,saved:[],lastPG:-2,saveName:'',busy:false};
const A={sp:0,metro:false,ctx:null,G:null,playing:false,g:0,nextT:0,queue:[],fill:false,rec:false};

