/* ---------- PLAY ---------- */
let btnPat,patSheet,mvol;
function patLabel(){const Pj=P();return T('PAT ')+PATL[Pj.pat]+(Pj.nextPat>=0?' > '+PATL[Pj.nextPat]:'')}
function pickPat(i){const Pj=P();vib(8);if(Pj.song){Pj.song=false;toast('Song off')}if(A.playing&&i!==Pj.pat)Pj.nextPat=i;else{Pj.pat=i;Pj.nextPat=-1}dirty();U.step=-1;syncTransport();renderTab();if(patSheet)renderPatSheet()}
function closePatSheet(){if(patSheet){patSheet.remove();patSheet=null}}
function openPatSheet(){if(patSheet){closePatSheet();return}patSheet=h('div',{class:'psheet',onpointerdown:e=>{if(e.target===patSheet)closePatSheet()}});document.body.append(patSheet);renderPatSheet()}
function renderPatSheet(){
  const Pj=P(),filled=i=>Pj.patterns[i].some(t=>t.some(s=>s.on));
  patSheet.replaceChildren(h('div',{class:'pcard'},
    h('h3',{},h('span',{text:'PATTERNS'}),h('button',{class:'chip xs',text:'DONE',onclick:closePatSheet})),
    h('div',{class:'pgrid'},PATL.split('').map((l,i)=>h('button',{class:'pbtn'+(Pj.pat===i?' on':'')+(Pj.nextPat===i?' nx':'')+(filled(i)?' full':''),onclick:()=>pickPat(i)},h('b',{text:l}),h('small',{text:filled(i)?'':'EMPTY'})))),
    h('div',{class:'row nw'},
      h('button',{class:'chip grow or'+(Pj.song?' on':''),text:Pj.song?'SONG ON':'SONG OFF',onclick:()=>{
        if(!Pj.song&&!(Pj.chain&&Pj.chain.length))Pj.chain=PATL.split('').map((_,i)=>i).filter(filled);
        if(!Pj.chain.length){toast('Add steps to a pattern first');return}
        Pj.song=!Pj.song;A.sp=0;dirty();histCommit();syncTransport();renderPatSheet()}}),
      h('button',{class:'chip grow',text:'AUTO CHAIN',onclick:()=>{Pj.chain=PATL.split('').map((_,i)=>i).filter(filled);Pj.song=Pj.chain.length>0;A.sp=0;dirty();histCommit();toast('Song: '+Pj.chain.map(i=>PATL[i]).join(' '));renderPatSheet()}})),
    h('div',{class:'note',text:Pj.song&&Pj.chain.length?T('SEQUENCE')+': '+Pj.chain.map(i=>PATL[i]).join(' > '):T('Song off. Build a sequence below or tap AUTO CHAIN.')}),
    h('div',{class:'row nw wrap seqrow'},
      Pj.chain.length?Pj.chain.map((i,n)=>h('button',{class:'chip xs'+(Pj.song&&((A.sp-1+Pj.chain.length)%Pj.chain.length===n&&A.playing)?' on':''),text:PATL[i],'aria-label':'Remove step '+(n+1),onclick:()=>{Pj.chain.splice(n,1);if(!Pj.chain.length)Pj.song=false;A.sp=0;dirty();histCommit();syncTransport();renderPatSheet()}})):h('span',{class:'note',text:T('Empty. Tap letters to add.')})),
    h('div',{class:'row nw wrap seqrow'},
      h('span',{class:'note',text:T('ADD')}),
      PATL.split('').map((l,i)=>h('button',{class:'chip xs',text:l,onclick:()=>{if(Pj.chain.length>=16){toast(T('Sequence is full'));return}Pj.chain.push(i);Pj.song=true;if(Pj.chain.length===1)A.sp=0;dirty();histCommit();syncTransport();renderPatSheet()}})),
      h('button',{class:'chip xs',text:'DEL',onclick:()=>{Pj.chain.pop();if(!Pj.chain.length)Pj.song=false;A.sp=0;dirty();histCommit();syncTransport();renderPatSheet()}}),
      h('button',{class:'chip xs',text:'CLR',onclick:()=>{Pj.chain=[];Pj.song=false;A.sp=0;dirty();histCommit();syncTransport();renderPatSheet()}})),
    h('div',{class:'row nw'},
      h('button',{class:'chip grow',text:'DUP '+PATL[Pj.pat]+' > '+PATL[(Pj.pat+1)%8],onclick:()=>{const n=(Pj.pat+1)%8;Pj.patterns[n]=JSON.parse(JSON.stringify(Pj.patterns[Pj.pat]));Pj.pat=n;dirty();histCommit();toast('Copied to pattern '+PATL[n]);syncTransport();renderTab();renderPatSheet()}}),
      h('button',{class:'chip grow',text:'COPY',onclick:()=>{U.patClip=JSON.stringify(Pj.patterns[Pj.pat]);toast('Pattern '+PATL[Pj.pat]+' copied')}}),
      h('button',{class:'chip grow',text:'PASTE',onclick:()=>{if(!U.patClip){toast('Copy a pattern first');return}Pj.patterns[Pj.pat]=JSON.parse(U.patClip);dirty();histCommit();toast('Pasted into '+PATL[Pj.pat]);renderTab();renderPatSheet()}}),
      h('button',{class:'chip grow',text:'CLEAR',onclick:()=>{Pj.patterns[Pj.pat].forEach((t,ti)=>{t.forEach((x,si)=>{t[si]=GR.newStep()})});dirty();histCommit();toast('Pattern '+PATL[Pj.pat]+' cleared');renderTab();renderPatSheet()}})),
    h('div',{class:'note',text:'While playing, a new pattern starts at the end of the bar.'})));
}
function closePadMenu(){const m=$('.padmenu');if(m)m.remove();document.removeEventListener('pointerdown',U.pmOut,true)}
function openPadMenu(ti,pad){
  closePadMenu();const t=P().tracks[ti];
  const b=(txt,on,fn)=>h('button',{class:'chip'+(on?' on':''),text:txt,onclick:e=>{e.stopPropagation();fn();}});
  const done=()=>{closePadMenu();if(U.tab==='play')R.play();else if(U.tab==='seq')R.seq();dirty();vib(8)};
const vv=h('span',{class:'note lbl val',text:Math.round(t.params[24]*100)});
  const m=h('div',{class:'padmenu',style:tcStyle(ti)},
    h('div',{class:'pmh',text:'T'+(ti+1)+' '+trackLabel(ti)}),
    h('div',{class:'row nw'},b('MUTE',t.mute,()=>{t.mute=!t.mute;done()}),b('SOLO',t.solo,()=>{t.solo=!t.solo;done()}),b('SOUND',false,()=>{closePadMenu();openSndSheet(ti)})),
    h('div',{class:'row nw'},b('SEQ',false,()=>{closePadMenu();U.tr=ti;U.step=-1;U.lockStep=-1;go('seq')}),b('EDIT',false,()=>{closePadMenu();U.tr=ti;U.step=-1;U.lockStep=-1;go('sound')})),
    h('div',{class:'row nw pmvol'},h('span',{class:'note lbl',text:'VOL'}),HFader(()=>t.params[24],v=>{t.params[24]=v;vv.textContent=Math.round(v*100);dirty()}),vv));
  document.body.append(m);
  const r=pad.getBoundingClientRect(),mw=m.offsetWidth,mh=m.offsetHeight;
  m.style.left=Math.max(6,Math.min(innerWidth-mw-6,r.left+r.width/2-mw/2))+'px';
  m.style.top=Math.max(6,Math.min(innerHeight-mh-6,r.top-mh-6<6?r.bottom+6:r.top-mh-6))+'px';
  U.pmOut=e=>{if(!m.contains(e.target)){closePadMenu()}};
  setTimeout(()=>document.addEventListener('pointerdown',U.pmOut,true),0);
}
/* master encoders under the pads: the main mix and FX levels at hand */
function masterEnc(){
  const F=()=>P().fx,pc=v=>Math.round(v*100)+'%';
  const fo=()=>F().off||(F().off={}),cf=()=>F().comp;
  const camt=()=>fo().comp||cf()[0]<.04?0:clamp((cf()[0]-.12)/.4,0,1);
  const csetA=a=>{const c=cf();if(a<.03){c[0]=0;c[1]=0;c[4]=0}else{c[0]=.12+a*.4;c[1]=.08+a*.14;c[2]=.12;c[3]=.35;c[4]=a*.28;fo().comp=false}};
  const K=(label,get,set,def,fmt)=>Knob({small:true,label,get,set:v=>{set(v);fxChanged();dirty()},fmt:fmt||pc,reset:()=>{set(def);fxChanged();dirty()},end:()=>{histCommit&&histCommit()}});
  const ks=[
    K('VOL',()=>P().vol==null?1:P().vol,v=>{P().vol=v},1),
    K('FILTER',()=>F().filter[0],v=>{F().filter[0]=v},.5,v=>v>.47&&v<.53?'OFF':(v<.5?'LP ':'HP ')+pc(v)),
    K('RESO',()=>F().filter[1],v=>{F().filter[1]=v},0),
    K('COMP',camt,csetA,0,v=>v<.03?'OFF':pc(v)),
    K('DELAY',()=>F().delay[2],v=>{F().delay[2]=v},0),
    K('FEEDBK',()=>F().delay[1],v=>{F().delay[1]=v},.4),
    K('REVERB',()=>F().reverb[2],v=>{F().reverb[2]=v},0),
    K('SIZE',()=>F().reverb[0],v=>{F().reverb[0]=v},.5)];
  return h('div',{class:'mastenc'},h('div',{class:'mtl',text:'MASTER'}),h('div',{class:'kgrid mkg'},ks));
}
R.play=function(){
  const root=$('#s-play');root.replaceChildren();const Pj=P();
  const pads=h('div',{class:'pads'});
  Pj.tracks.forEach((t,ti)=>{
    const pad=h('button',{class:'pad'+(S.slots[t.slot]?'':' empty')+(ti===U.tr?' sel':'')+(t.mute?' mute':'')+(t.solo?' solo':''),'data-t':ti,style:tcStyle(ti)},
      h('span',{class:'pn',text:String(ti+1).padStart(2,'0')}),h('span',{class:'pe',text:trackLabel(ti)}));
    pad.addEventListener('pointerdown',e=>{
      e.preventDefault();vib(8);ensureAudio();
      const r=pad.getBoundingClientRect(),vel=clamp(.4+.6*((e.clientY-r.top)/r.height),.3,1);
      const changed=U.tr!==ti;U.tr=ti;
      if(e.isPrimary!==false)startLP(e,()=>{vib(18);openPadMenu(ti,pad)});
      if(!S.slots[t.slot]){clearTimeout(LPT);openSndSheet(ti);return}
      playNow(ti,0,vel,1);
      if(changed){pads.querySelectorAll('.pad').forEach(p=>p.classList.toggle('sel',+p.dataset.t===ti));if(U.fsEncRefresh)U.fsEncRefresh()}
    });
    pads.append(pad);
  });
  if(!S.slots.length&&!isLandPhone())root.append(h('div',{class:'startrow'},h('span',{class:'mtl',text:'START FROM'}),GR.presets.map((p,i)=>h('button',{class:'chip grow',text:p.name,onclick:()=>startPreset(i)}))));
  U.fsEncRefresh=null;
  if(isLandPhone()){
    const box=h('div',{class:'fsenc'}),fill=()=>{const t=trk();box.replaceChildren(...fsEncParts(t,null),h('div',{class:'fsmaster'},masterEnc()))};
    U.fsEncRefresh=fill;fill();
    root.append(h('div',{class:'fsplay2'},h('div',{class:'fspadz'},pads),box));
  }else{root.append(pads);root.append(masterEnc())}
  const fitPads=()=>{if(!pads.isConnected||!isLandPhone()||pads.parentNode.classList.contains('fspadz'))return;pads.style.height='';const top=pads.getBoundingClientRect().top;pads.style.height=Math.max(150,Math.round(innerHeight-top-12))+'px'};
  U.fitPads=fitPads;fitPads();requestAnimationFrame(fitPads);
};
const isLand=()=>window.innerWidth>window.innerHeight&&window.innerWidth>560;
const isLandPhone=()=>isLand();
const isTabLand=()=>window.innerWidth>=900&&window.innerHeight>=600&&window.innerWidth>window.innerHeight;
addEventListener('resize',()=>{if(U.tab==='play'&&U.fitPads)U.fitPads()});
