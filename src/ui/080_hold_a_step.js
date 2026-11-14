/* ---------- hold a step: popup editor, swipe up/down = value, left/right = function ---------- */
const SFN_ALL=[
 {n:'VEL',get:s=>s.vel,set:(s,v)=>{s.vel=Math.max(.02,v)},fmt:v=>Math.round(v*127)},
 {n:'NOTE',get:s=>(s.note+24)/48,set:(s,v)=>{s.note=Math.round(v*48-24)},fmt:v=>noteLabel(U.tr,Math.round(v*48-24))||'0'},
 {n:'MICRO',get:s=>(s.micro+12)/24,set:(s,v)=>{s.micro=Math.round(v*24-12)},fmt:v=>{const m=Math.round(v*24-12);return (m>0?'+':'')+m}},
 {n:'COND',get:s=>dnorm(s.cond,16),set:(s,v)=>{s.cond=dval(v,16)},fmt:v=>COND[dval(v,16)]},
 {n:'LEN',get:s=>dnorm(s.len-1,16),set:(s,v)=>{s.len=dval(v,16)+1},fmt:v=>(dval(v,16)+1)+'st'},
 {n:'RETRIG',get:s=>dnorm((s.rtg||1)-1,8),set:(s,v)=>{s.rtg=dval(v,8)+1},fmt:v=>'x'+(dval(v,8)+1)},
 {n:'P-LOCKS',lock:true}
];
let SFN=U.ui==='full'?SFN_ALL:SFN_ALL.slice(0,6);
function openStepPop(st,el,hd){
  if(!U.holdSeen){U.holdSeen=true;try{localStorage.setItem('elephant-hold','1')}catch(e){}}
  const r=el.getBoundingClientRect(),W=250,vw=window.innerWidth;
  const pills=SFN.map(f=>h('span',{class:'spp',text:f.n}));
  const val=h('b',{}),bar=h('i',{}),hint=h('small',{text:'↕ value  ↔ function'});
  const box=h('div',{class:'stpop'},h('div',{class:'spfn'},pills),h('div',{class:'spmid'},val,h('div',{class:'spbar'},bar)),hint);
  box.style.width=W+'px';box.style.left=Math.max(8,Math.min(vw-W-8,r.left+r.width/2-W/2))+'px';
  document.body.append(box);
  const bh=box.offsetHeight;box.style.top=Math.max(8,r.top-bh-10)+'px';
  hd.box=box;hd.pills=pills;hd.val=val;hd.bar=bar;hd.fi=0;hd.xa=hd.x;hd.ya=hd.y;hd.v=SFN[0].get(st);
  stepPopShow(hd,st);return true;
}
function stepPopShow(hd,st){
  const f=SFN[hd.fi];hd.pills.forEach((p,i)=>p.classList.toggle('on',i===hd.fi));
  if(f.lock){hd.val.textContent='→';hd.bar.style.height='0%';return}
  hd.val.textContent=f.fmt(hd.v);hd.bar.style.height=(hd.v*100).toFixed(0)+'%';
}
function stepPopMove(hd,e,st){
  const dx=e.clientX-hd.xa;
  if(Math.abs(dx)>48){
    const n=Math.max(0,Math.min(SFN.length-1,hd.fi+(dx>0?1:-1)));
    if(n!==hd.fi){hd.fi=n;vib(8);if(!SFN[n].lock)hd.v=SFN[n].get(st)}
    hd.xa=e.clientX;hd.ya=e.clientY;
    stepPopShow(hd,st);return;
  }
  const f=SFN[hd.fi];if(f.lock)return;
  const dy=hd.ya-e.clientY;
  if(Math.abs(dy)>1){hd.v=clamp(hd.v+dy/140,0,1);hd.ya=e.clientY;f.set(st,hd.v);stepPopShow(hd,st)}
}
window.addEventListener('pointerdown',()=>{U.ptrDown=true;U.ptrT=performance.now()},true);
['pointerup','pointercancel','blur'].forEach(n=>window.addEventListener(n,()=>{U.ptrDown=false},true));
function killStepPops(){document.querySelectorAll('.stpop').forEach(e=>e.remove())}
/* a hold popup must never outlive its finger: a re-render, a tab change, a lost pointer or a backgrounded page all clear it */
['pointerup','pointercancel'].forEach(n=>window.addEventListener(n,()=>setTimeout(killStepPops,0)));
window.addEventListener('blur',killStepPops);document.addEventListener('visibilitychange',()=>{if(document.hidden)killStepPops()});
function closeStepPop(hd){const lk=!!SFN[hd.fi].lock;if(hd.box)hd.box.remove();hd.box=null;return lk}
/* SEQ, Digitakt style: track keys 1-16, the 16 trig keys of the selected track (two rows of 8), pages of 16, then the trig panel.
   Tap a trig to switch it. Tap a lit trig to select it. Hold a trig for the quick editor. VEL draws velocities. */
function seqGrid(){
  const Pj=P(),pats=curPat(),t=trk(),row=pats[U.tr],ti=U.tr,sty=tcStyle(ti);
  const W=isLand()?32:16;/* sideways: 32 big trigs at once, the dim ones past the length extend it when tapped */
  const npg=Math.max(1,Math.ceil(t.len/W));U.gOff=Math.min(U.gOff||0,npg-1);
  const o=U.gOff*W;GR.growRow(row,o+W);
  const keys=h('div',{class:'tkeys'+(U.tkOpen?' open':'')},Pj.tracks.map((tr,k)=>{
    const b=h('button',{class:'tk'+(k===ti?' sel':'')+(tr.mute?' mute':'')+(tr.solo?' solo':''),text:String(k+1),'aria-label':'Track '+(k+1)+' '+trackLabel(k)+'. Hold for mute and solo',onclick:()=>{if(b._lp){b._lp=false;return}U.tr=k;U.step=-1;U.tkOpen=false;vib(6);R.seq()}});
    b.addEventListener('pointerdown',e=>{b._lp=false;startLP(e,()=>{b._lp=true;vib(18);openPadMenu(k,b)})});return b}));
  const head=h('div',{class:'thead'},h('b',{text:'T'+(ti+1)}),h('span',{text:trackLabel(ti)}),h('small',{text:'PAT '+PATL[Pj.pat]}),h('span',{class:'kspacer'}),
    h('button',{class:'chip xs tkbtn'+(U.tkOpen?' on':''),text:'TRACK','aria-label':'Choose a track',onclick:()=>{U.tkOpen=!U.tkOpen;vib(6);R.seq()}}),
    h('button',{class:'chip xs',text:'SOUND',onclick:()=>openSndSheet(ti)}),h('button',{class:'chip xs',text:'PATTERN',onclick:openPatSheet}));
  const quiet=t.mute||(Pj.tracks.some(x=>x.solo)&&!t.solo);
  const g=h('div',{class:'gview trigs',style:'--c:'+W});
  for(let k=0;k<W;k++){
    const i=o+k,st=row[i]||GR.newStep();
    const nl=st.on&&st.note?noteLabel(ti,st.note):'',alt=st.on&&((st.cond|0)>0||(st.micro|0)!==0||(st.len||1)>1||(st.rtg|0)>1);
    const b=h('button',{class:'gc'+(k%4===0?' beat':'')+(st.on?' on':'')+(st.lock?' lk':'')+(alt?' alt':'')+(i===U.step?' sel':'')+(i>=t.len?' out':'')+(quiet?' mt':''),style:sty+';--v:'+(st.vel==null?.8:st.vel).toFixed(2),'data-t':ti,'data-i':i,'aria-label':'Step '+(i+1)+(st.on?', velocity '+Math.round((st.vel==null?.8:st.vel)*127):'')},h('i',{text:String(i+1)}),nl?h('small',{text:nl}):null);
    let hold=null,vd=null;
    const vset=v=>{st.vel=clamp(v,.04,1);st.on=1;b.classList.add('on');b.style.setProperty('--v',st.vel.toFixed(2));oled('VEL '+Math.round(st.vel*127),'T'+(ti+1)+' STEP '+(i+1))};
    b.addEventListener('pointerdown',e=>{
      e.preventDefault();vib(7);ensureAudio();if(i>=t.len){if(W>16&&i<64){t.len=Math.min(64,Math.ceil((i+1)/16)*16);const s2=row[i];s2.on=1;U.step=i;playNow(ti,s2.note,s2.vel,s2.len);dirty();histCommit();R.seq()}return}
      if(U.gVel){const rc=b.getBoundingClientRect();U.step=i;vset(1-(e.clientY-rc.top)/rc.height);vd={y:e.clientY,v:st.vel};try{b.setPointerCapture(e.pointerId)}catch(x){}return}
      hold={x:e.clientX,y:e.clientY,moved:false,pop:null};try{b.setPointerCapture(e.pointerId)}catch(x){}
      const hd=hold;hd.timer=setTimeout(()=>{if(hold!==hd||hd.moved)return;U.step=i;U.seqTab='step';if(!st.on)st.on=1;b.classList.add('on');vib(16);hd.pop=openStepPop(st,b,hd)},260);
    });
    b.addEventListener('pointermove',e=>{if(vd){vset(vd.v+(vd.y-e.clientY)/110);return}if(!hold)return;if(hold.pop){stepPopMove(hold,e,st);return}if(Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>10){hold.moved=true;clearTimeout(hold.timer)}});
    b.addEventListener('pointerup',()=>{
      if(vd){vd=null;dirty();R.seq();return}
      if(!hold)return;const hd=hold;hold=null;clearTimeout(hd.timer);
      if(hd.pop){const lk=closeStepPop(hd);dirty();if(lk){U.lockStep=i;U.page=0;go('sound')}else R.seq();return}
      if(hd.moved)return;
      if(st.on&&U.step!==i){U.step=i;U.seqTab='step'}
      else{st.on=st.on?0:1;if(st.on){U.step=i;playNow(ti,st.note,st.vel,st.len)}else U.step=-1}
      dirty();R.seq();
    });
    b.addEventListener('pointercancel',()=>{vd=null;if(hold){clearTimeout(hold.timer);if(hold.pop)closeStepPop(hold);hold=null}});
    g.append(b);
  }
  const pages=h('div',{class:'row nw pager'+(W>16&&npg<2?' solo':'')},h('span',{class:'plbl',text:'PAGE'}),...Array.from({length:npg},(_,k)=>h('button',{class:'chip xs grow'+(k===U.gOff?' on':''),text:W>16?(k*2+1)+'-'+(k*2+2):String(k+1),'aria-label':'Steps '+(k*W+1)+' to '+(k*W+W),onclick:()=>{U.gOff=k;U.gFollow=false;R.seq()}})),
    npg>1?h('button',{class:'chip xs'+(U.gFollow?' on':''),text:'FOLLOW','aria-label':'Follow the playhead',onclick:()=>{U.gFollow=!U.gFollow;R.seq()}}):null);
  const lenRow=h('div',{class:'row nw lenk',style:'gap:4px'},
    h('span',{class:'note lbl',text:'LENGTH'}),
    h('button',{class:'chip xs',text:'-',onclick:()=>{t.len=Math.max(1,t.len-1);dirty();R.seq()}}),
    h('button',{class:'chip xs lenv',text:t.len,'aria-label':'Add a page of 16 steps',onclick:()=>{t.len=t.len>=64?16:Math.floor(t.len/16)*16+16;dirty();histCommit();vib(8);R.seq()}}),
    h('button',{class:'chip xs',text:'+',onclick:()=>{t.len=Math.min(64,t.len+1);dirty();R.seq()}}),
    h('span',{class:'kspacer'}),
    h('button',{class:'chip xs'+(U.gVel?' on':''),text:'VEL','aria-label':'Velocity: drag a trig up or down',onclick:()=>{U.gVel=!U.gVel;vib(6);R.seq()}}));
  const cs=row[U.step],nlk=cs&&cs.lock?Object.keys(cs.lock).length:0;
  const info=h('div',{class:'sinfo'+(cs&&cs.on?' on':''),style:sty},
    cs&&cs.on?[h('b',{text:'T'+(ti+1)+' · STEP '+(U.step+1)}),
      h('span',{text:'VEL '+Math.round((cs.vel==null?.8:cs.vel)*127)}),
      cs.note?h('span',{text:'PITCH '+noteLabel(ti,cs.note)}):null,
      h('span',{text:'LEN '+(cs.len||1)}),
      (cs.rtg|0)>1?h('span',{text:'RTG x'+cs.rtg}):null,
      (cs.cond|0)>0?h('span',{text:'COND '+COND[cs.cond]}):null,
      (cs.micro|0)!==0?h('span',{text:'MICRO '+(cs.micro>0?'+':'')+cs.micro}):null,
      nlk?h('span',{text:nlk+' P-LOCK'+(nlk>1?'S':'')}):null]
    :[h('b',{text:'T'+(ti+1)+' '+trackLabel(ti)}),h('span',{text:'tap a lit trig to see its settings'})]);
  return h('div',{class:'plate seqtop'},keys,head,g,pages,lenRow);}
R.seq=function(){
  killStepPops();const root=$('#s-seq');root.replaceChildren();const t=trk(),pat=curPat()[U.tr];
  GR.growRow(pat,Math.ceil(t.len/16)*16);
  if(U.step>=t.len)U.step=-1;
  const tabs=['step','snd','gen','edit'],tn=['TRIG','SOUND','GEN','EDIT'];if(!tabs.includes(U.seqTab))U.seqTab='step';
  const tl=seqTools(pat);
  const body=h('div',{class:'sbody'},U.seqTab==='step'?seqEditor(pat):U.seqTab==='snd'?seqSound(pat,t):U.seqTab==='gen'?h('div',{class:'tgen'},tl.gen,h('div',{class:'tgrp'},euclRow(pat,t))):h('div',{class:'tedit'},tl.edit));
  const panel=h('div',{class:'plate seqpanel'},h('div',{class:'row nw stabs',style:'gap:4px'},chipRow(tn,i=>U.seqTab===tabs[i],i=>{U.seqTab=tabs[i];R.seq()},'grow')),body);
  const sg=seqGrid();if(isLandPhone())sg.append(fsEnc(pat,t));
  root.append(sg,panel);
};
/* phone held sideways: the sound knobs of the current track in a column at the right, always in reach (p-lock aware on SEQ) */
function fsEncParts(t,st){
  const PG=pagesFor(t.engine);if(U.page>=PG.length)U.page=0;const pn=U.page,defs=pageDefs(t.engine,pn);
  return [h('div',{class:'fspg'},PG.map((n,i)=>h('button',{class:'chip xs'+(U.page===i?' on':''),text:n,onclick:()=>{U.page=i;if(U.tab==='play'){if(U.fsEncRefresh)U.fsEncRefresh()}else R.seq()}}))),
    h('div',{class:'fsk'+(st&&st.lock?' lk':'')},(pn===2?[0,3,4,7]:defs.map((d,i)=>i)).map(i=>paramKnob(pn*8+i)))];
}
function fsEnc(pat,t){return h('div',{class:'fsenc'},...fsEncParts(t,U.step>=0?pat[U.step]:null))}
function euclRow(pat,t){
  const run=()=>{const n=t.len,k=U.eucK;pat.forEach((s,i)=>{if(i>=n)return;const pos=((i-U.eucR)%n+n)%n;s.on=Math.floor(pos*k/n)!==Math.floor((pos-1)*k/n)?1:0;if(s.on&&s.vel<.3)s.vel=.8});U.step=-1;dirty();histCommit();vib(6);R.seq()};
  const b=(txt,fn)=>h('button',{class:'chip xs',text:txt,onclick:fn});
  const v=txt=>h('span',{class:'note eucv',text:txt});
  return h('div',{class:'row nw eucrow'},h('span',{class:'note lbl',text:'EUCLID'}),
    b('-',()=>{U.eucK=Math.max(0,U.eucK-1);run()}),v(U.eucK+' '+T('HITS')),b('+',()=>{U.eucK=Math.min(t.len,U.eucK+1);run()}),
    h('span',{class:'kspacer'}),
    h('span',{class:'note lbl',text:'ROT'}),b('<',()=>{U.eucR=(U.eucR+t.len-1)%t.len;run()}),v(String(U.eucR)),b('>',()=>{U.eucR=(U.eucR+1)%t.len;run()}));
}
function seqEditor(pat){
  const box=h('div',{class:pat[U.step]?'tstep':'shint'}),st=pat[U.step];
  if(!st){box.append(h('h3',{text:'STEP'}),h('div',{class:'note',text:'Tap a step to switch it on, tap a lit step to select it. VEL: drag a step up or down to set its velocity. Hold any step to open its P-locks.'}));return box}
  const nl=v=>noteLabel(U.tr,Math.round(v*48-24))||'0';
  const nLocks=st.lock?Object.keys(st.lock).length:0;
  box.append(h('h3',{},h('span',{text:'STEP '+(U.step+1)}),h('span',{text:nLocks?nLocks+' P-LOCK'+(nLocks>1?'S':''):'NO LOCKS'})),
    h('div',{class:'kgrid',style:'grid-template-columns:repeat(3,1fr)'},
      Knob({label:'NOTE',small:isLandPhone(),disc:49,get:()=>(st.note+24)/48,set:v=>{st.note=Math.round(v*48-24);dirty()},fmt:nl,def:.5,reset:()=>{st.note=0},end:()=>R.seq()}),
      Knob({label:'VEL',small:isLandPhone(),get:()=>st.vel,set:v=>{st.vel=v;dirty()},fmt:v=>Math.round(v*127),reset:()=>{st.vel=.8}}),
      Knob({label:'MICRO',small:isLandPhone(),disc:25,get:()=>(st.micro+12)/24,set:v=>{st.micro=Math.round(v*24-12);dirty()},fmt:v=>{const m=Math.round(v*24-12);return (m>0?'+':'')+m},reset:()=>{st.micro=0},end:()=>R.seq()}),
      Knob({label:'COND',small:isLandPhone(),disc:16,get:()=>dnorm(st.cond,16),set:v=>{st.cond=dval(v,16);dirty()},fmt:v=>COND[dval(v,16)],reset:()=>{st.cond=0},end:()=>R.seq()}),
      Knob({label:'LENGTH',small:isLandPhone(),disc:16,get:()=>dnorm(st.len-1,16),set:v=>{st.len=dval(v,16)+1;dirty()},fmt:v=>(dval(v,16)+1)+'st',reset:()=>{st.len=1}}),
      Knob({label:'RETRIG',small:isLandPhone(),disc:8,get:()=>dnorm((st.rtg||1)-1,8),set:v=>{st.rtg=dval(v,8)+1;dirty()},fmt:v=>'x'+(dval(v,8)+1),reset:()=>{st.rtg=1},end:()=>R.seq()})),
    h('div',{class:'row nw'},
      h('button',{class:'chip grow',text:'PREVIEW',onclick:()=>playNow(U.tr,st.note,st.vel,st.len)}),
      h('button',{class:'chip grow or on eplk',text:'EDIT P-LOCKS',onclick:()=>{U.lockStep=U.step;U.page=0;go('sound')}}),
      h('button',{class:'chip grow',text:'CLEAR LOCKS',onclick:()=>{st.lock=null;dirty();R.seq()}})),
    h('div',{class:'row nw'},
      h('button',{class:'chip grow',text:'COPY STEP',onclick:()=>{U.stepClip=JSON.stringify(st);toast('Step '+(U.step+1)+' copied')}}),
      h('button',{class:'chip grow',text:'PASTE STEP',onclick:()=>{if(!U.stepClip){toast('Nothing copied');return}pat[U.step]=Object.assign(GR.newStep(),JSON.parse(U.stepClip));dirty();R.seq()}})));
  return box;
}
const SCALE=[0,3,5,7,10,12,15,17,19,22,24];
function seqTools(pat){
  const t=trk(),mel=!isSamp(t.engine);
  const box=h('div',{}),Pj=P();
  const rndTrig=()=>{pat.forEach((s,i)=>{if(i>=t.len)return;const beat=i%4===0,p=mel?(beat?.55:.38):(beat?.5:.32);s.on=Math.random()<p?1:0;s.vel=s.on?clamp(.55+Math.random()*.45,.3,1):s.vel;s.len=1;s.cond=0});U.step=-1};
  const rndNote=()=>{pat.forEach(s=>{if(!s.on)return;if(mel)s.note=SCALE[Math.floor(Math.random()*SCALE.length)]-(Math.random()<.3?12:0);else s.note=Math.random()<.2?[-12,-5,5,7,12][Math.floor(Math.random()*5)]:0})};
  const rndLock=()=>{
    const hi=t.engine==='SAMP'?[0,1,7,8,9]:[0,1,2,3,4,5,8,9,10,12,16,17];
    pat.forEach(s=>{if(!s.on||Math.random()>.3)return;s.lock=s.lock||{};
      const k=hi[Math.floor(Math.random()*hi.length)],d=pageDefs(t.engine,k>>3)[k&7];
      let v=clamp(t.params[k]+(Math.random()-.5)*.6,0,1);if(d.d)v=dnorm(dval(v,d.d.length),d.d.length);s.lock[k]=v});
  };

  box.append(h('h3',{text:'TOOLS'}),
    h('div',{class:'tgrp'},h('div',{class:'tsub',text:'RANDOM'}),h('div',{class:'row'},
      h('button',{class:'chip',text:'RND TRIG',onclick:()=>{rndTrig();dirty();R.seq()}}),
      h('button',{class:'chip',text:'RND NOTE',onclick:()=>{rndNote();dirty();R.seq()}}),
      h('button',{class:'chip',text:'RND LOCK',onclick:()=>{rndLock();dirty();R.seq()}}))),
    h('div',{class:'tgrp'},h('div',{class:'tsub',text:'CLIPBOARD'}),h('div',{class:'row'},
      h('button',{class:'chip',text:'CLEAR',onclick:()=>{pat.forEach((s,i)=>{pat[i]=GR.newStep()});U.step=-1;dirty();R.seq()}}),
      h('button',{class:'chip',text:'COPY',onclick:()=>{U.clip=JSON.parse(JSON.stringify(pat));toast('Track pattern copied')}}),
      h('button',{class:'chip',text:'PASTE',onclick:()=>{if(!U.clip){toast('Nothing copied');return}U.clip.forEach((s,i)=>{pat[i]=JSON.parse(JSON.stringify(s))});dirty();R.seq()}})),
      h('div',{class:'row',style:'margin-top:6px'},
        h('button',{class:'chip',text:'COPY TRACK',onclick:()=>{U.trkClip={engine:t.engine,params:Array.from(t.params),slot:t.slot,len:t.len,sc:t.sc||0,steps:JSON.stringify(pat)};toast('Track '+(U.tr+1)+' copied with its sound')}}),
        h('button',{class:'chip',text:'DOUBLE',onclick:()=>{const n=t.len;if(n>=64){toast('Already 64 steps');return}const m=Math.min(64,n*2);GR.growRow(pat,m);for(let i=n;i<m;i++)pat[i]=JSON.parse(JSON.stringify(pat[i-n]));t.len=m;dirty();histCommit();vib(8);R.seq()}}),
      h('button',{class:'chip',text:'PASTE TRACK',onclick:()=>{const c=U.trkClip;if(!c){toast('Nothing copied');return}t.engine=c.engine;t.params=Float32Array.from(c.params);t.slot=c.slot;t.len=c.len;t.sc=c.sc;JSON.parse(c.steps).forEach((x,i)=>{pat[i]=x});U.step=-1;dirty();R.seq()}}))),
    h('div',{class:'tgrp'},h('div',{class:'tsub',text:'QUANTIZE'}),h('div',{class:'row'},h('span',{class:'note lbl',text:'GRID'}),
      chipRow(QNAME,i=>(Pj.quant.grid===i),i=>{Pj.quant.grid=i;dirty();R.seq()})),
    h('div',{class:'row nw',style:'margin-top:10px'},
      h('div',{class:'kgrid',style:'grid-template-columns:90px'},Knob({label:'DEPTH',small:true,get:()=>Pj.quant.depth,set:v=>{Pj.quant.depth=Math.round(v*20)/20;dirty()},fmt:v=>v<=0?'OFF':Math.round(v*100)+'%',reset:()=>{Pj.quant.depth=1}})),
      h('div',{class:'grow'},h('div',{class:'note',text:'Q '+qtxt(Pj.quant)+'. '+T('Applies to live REC and keys. Depth 100% snaps to the grid, lower values keep part of your feel, OFF records raw timing.')}),
        h('button',{class:'chip or on',text:'QUANTIZE TRACK',onclick:()=>{pat.forEach(s=>{if(!s.on)return;const p=s.micro/24,q=qpos(p,Pj.quant);s.micro=Math.max(-12,Math.min(12,Math.round(q*24)))});dirty();toast('T'+(U.tr+1)+' quantized '+qtxt(Pj.quant));R.seq()}})))));
  const k=[...box.children];return{gen:k[1],edit:[k[2],k[3]]};
}


/* SOUND under the trigs: the same knobs as the SAMPLE tab. A selected step takes p-locks, no step edits the track */
function seqSound(pat,t){
  const PG=pagesFor(t.engine);if(U.page>=PG.length)U.page=0;const pn=U.page,defs=pageDefs(t.engine,pn);
  const st=U.step>=0?pat[U.step]:null,n=st&&st.lock?Object.keys(st.lock).length:0;
  const info=h('div',{class:'lkinfo'});
  if(st)info.append(T('STEP '),h('b',{text:String(U.step+1)}),'  '+T('P-LOCKS')+(n?' ('+n+')':'')+'. '+T('Turn a knob to lock it for this step.'));
  else info.textContent=T('EDITING THE TRACK SOUND. Select a trig to lock values for that step only.');
  return h('div',{class:'seqsnd'},modTray(),
    h('div',{class:'row nw ptabs',style:'gap:4px'},chipRow(PG,i=>U.page===i,i=>{U.page=i;R.seq()},'grow')),info,
    h('div',{class:'kgrid'},(pn===2?[0,3,4,7]:defs.map((d,i)=>i)).map(i=>paramKnob(pn*8+i))),
    pn===2?routeList():null,
    h('div',{class:'row nw'},h('button',{class:'chip grow',text:'SOUND ▾',onclick:()=>openSndSheet(U.tr)}),
      st&&st.lock?h('button',{class:'chip grow',text:'CLEAR LOCKS',onclick:()=>{st.lock=null;dirty();R.seq()}}):null));
}
