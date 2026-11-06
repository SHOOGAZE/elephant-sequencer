/* ---------- samples ---------- */
const Samples=GR.Samples={slots:[],MAX:64,rate:44100};
function mkBuffer(rate,chs){
  const b=new AudioBuffer({length:chs[0].length,numberOfChannels:chs.length,sampleRate:rate});
  chs.forEach((c,i)=>b.copyToChannel(c,i));
  return b;
}
Samples.add=function(name,chs,rate,user){
  if(Samples.slots.length>=Samples.MAX)return -1;
  const maxLen=Math.floor(rate*30);
  chs=chs.map(c=>c.length>maxLen?c.slice(0,maxLen):c);
  Samples.slots.push({name,rate,ch:chs,user:!!user,buf:null,rev:null});
  return Samples.slots.length-1;
};
Samples.buf=function(i,rev){
  const s=Samples.slots[i];if(!s)return null;
  if(!s.buf)s.buf=mkBuffer(s.rate,s.ch);
  if(rev){
    if(!s.rev)s.rev=mkBuffer(s.rate,s.ch.map(c=>{const r=new Float32Array(c.length);for(let k=0;k<c.length;k++)r[c.length-1-k]=c[k];return r}));
    return s.rev;
  }
  return s.buf;
};
Samples.replace=function(i,name,chs,rate){
  Samples.slots[i]={name,rate,ch:chs,user:true,buf:null,rev:null};
};
function norm(a,pk){let m=0;for(let i=0;i<a.length;i++)m=Math.max(m,Math.abs(a[i]));if(m>0){const g=(pk||.9)/m;for(let i=0;i<a.length;i++)a[i]*=g}return a}
Samples.builtin=function(){Samples.slots=[]};

