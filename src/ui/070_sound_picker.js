/* ---------- sound picker: loaded samples + own files catalog ---------- */
let sndSheet=null;
const CAT={db:null,list:[]};
function catDb(){return new Promise((res,rej)=>{if(CAT.db)return res(CAT.db);try{const r=indexedDB.open('elephant-catalog',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>{CAT.db=r.result;res(r.result)};r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
async function catLoad(){try{const db=await catDb();CAT.list=await new Promise((res,rej)=>{const q=db.transaction('files').objectStore('files').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}catch(e){CAT.list=[];CAT.off=true}}
async function catPut(rec){const db=await catDb();return new Promise((res,rej)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').add(rec);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function catDel(id){const db=await catDb();return new Promise((res,rej)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
function assignSlot(ti,idx){
  const t=P().tracks[ti];if(idx<0){toast('Sample slots are full');return false}
  t.slot=idx;U.slot=idx;
  if(!isSamp(t.engine)){t.engine='SAMP';t.params=ENGINE_DEFAULT.SAMP();[24,13,8].forEach((k,j)=>t.params[k]=[.95,1,.95][j]);t.params[14]=.15}
  dirty();return true;
}
function openSndSheet(ti){
  closeSndSheet();U.pickT=ti==null?U.tr:ti;if(U.pickCat!=='pool'&&U.pickCat!=='mine')U.pickCat=S.slots.length?'pool':'mine';
  sndSheet=h('div',{class:'psheet',onpointerdown:e=>{if(e.target===sndSheet)closeSndSheet()}});document.body.append(sndSheet);
  renderSndSheet();catLoad().then(()=>{if(sndSheet)renderSndSheet()});
}
function closeSndSheet(){if(sndSheet){sndSheet.remove();sndSheet=null;if(U.tab==='play')R.play();else if(U.tab==='sound')R.sound();else if(U.tab==='smpl')R.smpl();else if(U.tab==='seq')R.seq()}}
function renderSndSheet(){
  if(!sndSheet)return;
  const ti=U.pickT,t=P().tracks[ti],cur=S.slots[t.slot];
  const cats=[['pool','LOADED'],['mine','MY FILES']];
  const body=h('div',{class:'sgrid'});
  const pick=(mk)=>{ensureAudio();const idx=mk();if(assignSlot(ti,idx)){previewSlot(idx);vib(8);renderSndSheet()}};
  if(U.pickCat==='pool'){
    if(!S.slots.length)body.append(h('div',{class:'note',text:'No samples loaded. Open MY FILES, add some, or record one on SMPL.'}));
    S.slots.forEach((x,i)=>body.append(h('button',{class:'sitem'+(i===t.slot?' on':''),text:x.name,onclick:()=>pick(()=>i)})));
  }else if(U.pickCat==='mine'){
    if(CAT.off)body.append(h('div',{class:'note',text:'Catalog storage is not available in this browser'}));
    else if(!CAT.list.length)body.append(h('div',{class:'note',text:'No files yet. Tap ADD FROM PHONE and choose sounds'}));
    CAT.list.forEach(r=>{
      const on=cur&&cur.key==='cat:'+r.id;
      const b=h('div',{class:'sitem mine'+(on?' on':'')},
        h('button',{class:'sname',text:r.name,onclick:()=>pick(()=>{
          const key='cat:'+r.id;let i=S.slots.findIndex(x=>x.key===key);
          if(i<0){i=S.add(r.name,r.ch.map(c=>new Float32Array(c)),r.rate,true);if(i>=0)S.slots[i].key=key}return i})}),
        h('button',{class:'sdel',text:'×',title:'Remove',onclick:async()=>{await catDel(r.id);await catLoad();renderSndSheet()}}));
      body.append(b);
    });
  }
  const inp=h('input',{type:'file',accept:'audio/*,.wav,.mp3,.m4a,.aif,.aiff,.flac,.ogg',multiple:true,style:'display:none',onchange:async()=>{
    const fs=[...inp.files];if(!fs.length||!ensureAudio())return;let n=0;toast('Loading '+fs.length+' file(s)');
    for(const f of fs){
      try{
        const d=await decodeFile(f,30);
        await catPut({name:f.name.replace(/\.[^.]+$/,'').toUpperCase().slice(0,12)||'FILE',rate:d.rate,ch:d.ch,added:Date.now()});n++;
      }catch(e){}
    }
    await catLoad();U.pickCat='mine';toast(n?n+' added to My files':'Could not read this file. Try wav, mp3 or m4a.');renderSndSheet();
  }});
  sndSheet.replaceChildren(h('div',{class:'pcard'},
    h('h3',{},h('span',{text:'SOUND  T'+(ti+1)+'  '+(cur?cur.name:'EMPTY')}),h('button',{class:'chip xs',text:'DONE',onclick:closeSndSheet})),
    h('div',{class:'row nw cats'},cats.map(c=>h('button',{class:'chip grow xs'+(U.pickCat===c[0]?' on':''),text:c[1],onclick:()=>{U.pickCat=c[0];renderSndSheet()}}))),
    body,
    U.pickCat==='mine'?h('button',{class:'chip or on',text:'ADD FROM PHONE',onclick:()=>{inp.value='';inp.click()}}):null,
    inp));
}
function openTrkSheet(){if(trkSheet){closeTrkSheet();return}trkSheet=h('div',{class:'psheet',onpointerdown:e=>{if(e.target===trkSheet)closeTrkSheet()}});document.body.append(trkSheet);renderTrkSheet()}
function renderTrkSheet(){
  const Pj=P(),pat=curPat();
  trkSheet.replaceChildren(h('div',{class:'pcard'},
    h('h3',{},h('span',{text:'TRACKS'}),h('button',{class:'chip xs',text:'DONE',onclick:closeTrkSheet})),
    h('div',{class:'tkgrid'},Pj.tracks.map((t,i)=>h('button',{'data-t':i,class:'tkb'+(i===U.tr?' on':'')+(t.mute?' mute':'')+(pat[i].some(x=>x.on)?' full':''),style:tcStyle(i),onclick:()=>{setTrack(i);closeTrkSheet()}},
      h('b',{text:String(i+1).padStart(2,'0')}),h('small',{text:trackLabel(i)})))),
    h('div',{class:'row nw',style:'margin-top:10px'},
      h('button',{class:'chip or on grow',text:'EDIT SOUND',onclick:()=>{closeTrkSheet();go('sound')}}))));
}
let LPT=0,LPX=0,LPY=0;
function startLP(e,fn){clearTimeout(LPT);LPX=e.clientX;LPY=e.clientY;LPT=setTimeout(()=>{LPT=0;fn()},480)}
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,()=>{clearTimeout(LPT);LPT=0;if(U.seqPending){U.seqPending=false;if(U.tab==='seq')R.seq()}},true));
document.addEventListener('pointermove',e=>{if(LPT&&Math.hypot(e.clientX-LPX,e.clientY-LPY)>12){clearTimeout(LPT);LPT=0}},true);

