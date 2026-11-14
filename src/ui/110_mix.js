/* ---------- MIX ---------- */
R.mix=function(){
  const root=$('#s-mix');root.replaceChildren();
  const wide=isTabLand()||isTabPort()||fsWant(),mp=wide?0:(U.mixPage||0),strips=h('div',{class:'mix'+(wide?' wide':'')},P().tracks.map((t,i)=>({t,i})).slice(mp*8,wide?16:mp*8+8).map(({t,i})=>{
    const m=h('button',{class:'m'+(t.mute?' on':''),text:'M'}),s=h('button',{class:(t.solo?'on':''),text:'S'});
    m.addEventListener('click',()=>{t.mute=!t.mute;dirty();vib(6);R.mix()});
    s.addEventListener('click',()=>{t.solo=!t.solo;dirty();vib(6);R.mix()});
    return h('div',{class:'strip'+(i===U.tr?' cur':''),'data-i':i,style:tcStyle(i)},
      h('button',{class:'sn',style:'background:none;border:0;color:inherit',text:String(i+1).padStart(2,'0'),onclick:()=>{U.tr=i;R.mix()}}),
      h('b',{class:'lvl',text:Math.round(t.params[24]*100)}),h('div',{class:'fm'},VFader(()=>t.params[24],v=>{t.params[24]=v;oled('T'+(i+1)+' LEVEL '+Math.round(v*100));dirty();const lb=document.querySelector('.strip[data-i="'+i+'"] .lvl');if(lb)lb.textContent=Math.round(v*100)}),h('div',{class:'meter','data-m':i},h('i'))),
      h('div',{class:'ms'},m,s),
      h('button',{class:'scb'+(t.sc>0?' on':''),text:t.sc>0?'SC '+Math.round(t.sc*100):'SC',onclick:e=>{const L=[0,.3,.6,.9],k=(L.findIndex(x=>Math.abs(x-(t.sc||0))<.01)+1)%L.length;t.sc=L[k];e.target.textContent=t.sc>0?'SC '+Math.round(t.sc*100):'SC';e.target.classList.toggle('on',t.sc>0);dirty();vib(6);if(t.sc>0&&i!==P().side.src)oled('T'+(i+1)+' DUCKED BY T'+(P().side.src+1),Math.round(t.sc*100)+'%')}}),
      h('div',{class:'sl',text:trackLabel(i)}));
  }));
  const Tk=P().tracks,allMuted=Tk.every(t=>t.mute),anyMS=Tk.some(t=>t.mute||t.solo);
  const acts=h('div',{class:'row nw mixact',style:'gap:6px;margin-top:8px'},
    h('button',{class:'chip grow'+(allMuted?' on':''),text:allMuted?'UNMUTE ALL':'MUTE ALL',onclick:()=>{const to=!Tk.every(t=>t.mute);Tk.forEach(t=>{t.mute=to;if(to)t.solo=false});dirty();histCommit();vib(8);R.mix()}}),
    h('button',{class:'chip grow',text:'CLEAR M/S',onclick:()=>{if(!Tk.some(t=>t.mute||t.solo)){toast('Nothing to clear');return}Tk.forEach(t=>{t.mute=false;t.solo=false});dirty();histCommit();vib(8);R.mix()}}),
    );
  const mm=h('div',{class:'mmeter'},h('i'));
  /* master compressor: one AMOUNT slider writes the glue settings of the COMP/LIM effect (the full controls stay on the FX page) */
  const fxo=P().fx.off||(P().fx.off={}),cf=P().fx.comp;
  const amt=()=>fxo.comp||cf[0]<.04?0:clamp((cf[0]-.12)/.4,0,1);
  const setAmt=a=>{if(a<.03){cf[0]=0;cf[1]=0;cf[4]=0}else{cf[0]=.12+a*.4;cf[1]=.08+a*.14;cf[2]=.12;cf[3]=.35;cf[4]=a*.28;fxo.comp=false}};
  const cv=h('b',{class:'cval',text:amt()?Math.round(amt()*100)+'%':'OFF'});
  const cmp=h('div',{class:'mcomp'},h('span',{class:'mcl',text:'COMP'}),
    HFader(amt,a=>{setAmt(a);cv.textContent=a<.03?'OFF':Math.round(a*100)+'%';fxChanged();oled('MASTER COMP '+(a<.03?'OFF':Math.round(a*100)+'%'),'MASTER');dirty()}),
    cv,h('div',{class:'grm','aria-label':'Gain reduction'},h('i')));
  const mast=h('div',{class:'plate mastplate'},
    h('h3',{},h('span',{text:'MASTER'}),h('button',{class:'chip xs or'+(GR.mmute?' on':''),text:'MUTE',onclick:()=>{masterMute();R.mix()}})),
    h('div',{class:'mrow'},h('span',{class:'mcl',text:'VOL'}),HFader(()=>P().vol==null?1:P().vol,v=>{P().vol=v;fxChanged();oled('VOL '+Math.round(v*100)+'%','MASTER');dirty()})),
    h('div',{class:'mrow'},h('span',{class:'mcl',text:'OUT'}),mm),cmp);
  root.append(mast,h('div',{class:'plate trkplate'},h('h3',{},h('span',{text:'TRACK LEVELS'}),h('span',{text:T('TRACK ')+(U.tr+1)+' '+T('SELECTED')})),wide?null:h('div',{class:'row nw',style:'gap:6px'},chipRow(['1 - 8','9 - 16'],i=>mp===i,i=>{U.mixPage=i;R.mix()},'grow')),strips,acts,
    h('div',{class:'note',text:'M mutes a track, S solos it. SC sets how much the track ducks when the kick hits. Pan, sends, drive and crush are on the MIX page of SOUND.'})));
  U.fxRoot=null;if(U.ui!=='full'){const fr=h('div',{class:'mixfx'});root.append(fr);U.fxRoot=fr;R.fx()}
  if(fsWant()){strips.addEventListener('scroll',()=>{U.mixSX=strips.scrollLeft},{passive:true});const sx=U.mixSX||0;strips.scrollLeft=sx;requestAnimationFrame(()=>{strips.scrollLeft=sx})}
};

