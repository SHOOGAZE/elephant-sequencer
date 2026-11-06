/* ---------- storage ---------- */
function idb(){return new Promise((res,rej)=>{try{const r=indexedDB.open('elephant',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'name'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
/* sample signature: lets the autosave skip rewriting unchanged samples */
function smpSig(){
  return Samples.slots.map((s,i)=>{
    if(!s.user)return '';
    const c=s.ch[0],n=c.length;let h=0;
    for(let k=0;k<64;k++)h+=c[Math.floor(k*(n-1)/63)]*(k+1);
    return i+'|'+s.name+'|'+n+'|'+s.ch.length+'|'+s.rate+'|'+Math.round(h*1e4)+'|'+(GR.smpRev||0);
  }).join(';');
}
const userSamples=()=>Samples.slots.map((s,i)=>s.user?{i,name:s.name,key:s.key,rate:s.rate,ch:s.ch.map(c=>c.buffer.slice(0))}:null).filter(Boolean);
function putRec(db,recs){return new Promise((res,rej)=>{const tx=db.transaction('projects','readwrite'),os=tx.objectStore('projects');recs.forEach(r=>os.put(r));tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
GR.store={
  async put(name){
    const db=await idb(),P=GR.serialize(GR.proj);P.name=name==='__auto__'?GR.proj.name:name;
    const bc=Samples.slots.filter(s=>!s.user).length;
    if(name==='__auto__'){
      const sig=smpSig(),rec={name,json:P,smpRef:'__auto_smp__',builtinCount:bc,updated:Date.now()};
      if(sig===GR._smpSig)return putRec(db,[rec]);
      await putRec(db,[{name:'__auto_smp__',samples:userSamples(),updated:Date.now()},rec]);
      GR._smpSig=sig;return;
    }
    return putRec(db,[{name,json:P,samples:userSamples(),builtinCount:bc,updated:Date.now()}]);
  },
  async get(name){const db=await idb();return new Promise((res,rej)=>{const r=db.transaction('projects').objectStore('projects').get(name);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async list(){const db=await idb();return new Promise((res,rej)=>{const r=db.transaction('projects').objectStore('projects').getAll();r.onsuccess=()=>res(r.result.filter(x=>x.name.slice(0,2)!=='__').map(x=>({name:x.name,updated:x.updated})).sort((a,b)=>b.updated-a.updated));r.onerror=()=>rej(r.error)})},
  async del(name){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').delete(name);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})},
  async load(name){
    const rec=await GR.store.get(name);if(!rec)return false;
    let smp=rec.samples;
    if(!smp&&rec.smpRef){const r2=await GR.store.get(rec.smpRef);smp=r2&&r2.samples||[]}
    GR.placeSamples(smp||[]);
    GR.proj=GR.revive(rec.json);
    if(name==='__auto__')GR._smpSig=smpSig();
    return true;
  }
};
GR.placeSamples=function(list){
  Samples.builtin();
  list.forEach(s=>{const slot={name:s.name,rate:s.rate,ch:s.ch.map(b=>new Float32Array(b)),key:s.key,user:true,buf:null,rev:null};
    while(Samples.slots.length<s.i)Samples.slots.push({name:'-',rate:Samples.rate,ch:[new Float32Array(1)],user:false,buf:null,rev:null});
    Samples.slots[s.i]=slot});
};
/* one-file project: pattern data plus the user's samples (16 bit) */
const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x6000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x6000));return btoa(s)};
const unb64=t=>{const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
GR.packProject=function(){
  const smp=Samples.slots.map((s,i)=>s.user?{i,name:s.name,key:s.key,rate:s.rate,ch:s.ch.map(c=>{const q=new Int16Array(c.length);for(let k=0;k<c.length;k++)q[k]=Math.max(-32768,Math.min(32767,Math.round(c[k]*32767)));return b64(new Uint8Array(q.buffer))})}:null).filter(Boolean);
  return JSON.stringify({elephant:1,project:GR.serialize(GR.proj),samples:smp});
};
GR.unpackProject=function(text){
  const o=JSON.parse(text);
  if(o&&o.elephant&&o.project){
    GR.placeSamples((o.samples||[]).map(s=>({i:s.i,name:s.name,key:s.key,rate:s.rate,ch:s.ch.map(t=>{const u=unb64(t),q=new Int16Array(u.buffer,0,u.length>>1),f=new Float32Array(q.length);for(let k=0;k<q.length;k++)f[k]=q[k]/32767;return f.buffer})})));
    GR.proj=GR.revive(o.project);return 'full';
  }
  if(o&&o.tracks&&o.patterns){GR.proj=GR.revive(o);return 'pattern'}
  throw new Error('not an ELEPHANT file');
};
GR.crushRefresh=()=>{};
