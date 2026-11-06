/* ---------- loops ---------- */
function updatePlayhead(pg){
  const t=trk();
  if(U.tab==='seq'){
    const Tk=P().tracks;document.querySelectorAll('.gview .gc').forEach(b=>b.classList.toggle('now',pg>=0&&+b.dataset.i===pg%Tk[+b.dataset.t].len));
    if(pg>=0&&U.gFollow&&!U.ptrDown){const C=$('#s-seq .gview')?+$('#s-seq .gview').style.getPropertyValue('--c'):0,ml=t.len;if(C&&ml>C){const p=Math.floor((pg%ml)/C);if(p!==(U.gOff||0)){U.gOff=p;R.seq();return}}}
  }
  if(pg>=0){
    const pat=curPat(),Pj=P(),anyS=Pj.tracks.some(x=>x.solo);
    Pj.tracks.forEach((tr,ti)=>{const st=GR.stepAt(pat[ti],tr.len,pg%tr.len);if(st.on&&!tr.mute&&(!anyS||tr.solo))flashTrack(ti)});
  }
}
/* soft trigger glow on every visible track button (pads, track row, track sheet) */
const FLQ=new Set();let flRaf=0,flGen=0;
function flashTrack(ti){FLQ.add(ti);if(!flRaf)flRaf=requestAnimationFrame(flashFlush)}
function flashFlush(){
  flRaf=0;if(!FLQ.size)return;
  const els=[];document.querySelectorAll('.pad[data-t],.tkb[data-t]').forEach(el=>{if(FLQ.has(+el.dataset.t))els.push(el)});
  FLQ.clear();if(!els.length)return;
  els.forEach(el=>el.classList.remove('hit'));void document.body.offsetWidth;
  const g=++flGen;els.forEach(el=>{el.classList.add('hit');el._hg=g});
  setTimeout(()=>els.forEach(el=>{if(el._hg===g)el.classList.remove('hit')}),340);
}
const setT=(el,t)=>{if(el._t!==t){el._t=t;el.textContent=t}};
let mbuf=null;
function frame(){
  requestAnimationFrame(frame);
  /* nothing is sounding: refresh at about 10 fps instead of 60 to save battery */
  if(!A.playing&&U.quiet>45&&U.tab!=='mix'&&(U.skipF=(U.skipF+1)%6))return;
  if(U.tab==='mix'&&A.G){
    if(!mbuf)mbuf=new Float32Array(256);
    const mmEl=document.querySelector('.mmeter');
    if(mmEl&&A.G.an){const mb=U.mmBuf||(U.mmBuf=new Float32Array(A.G.an.fftSize));A.G.an.getFloatTimeDomainData(mb);let pk=0;for(let i=0;i<mb.length;i++){const v=Math.abs(mb[i]);if(v>pk)pk=v}
      const db=20*Math.log10(pk+1e-6),lv=Math.max(0,Math.min(1,(db+48)/48)),bar=mmEl.firstChild,pv=+(bar.dataset.v||0),nv=Math.max(lv,pv*.9);bar.dataset.v=nv;bar.style.width=(nv*100).toFixed(0)+'%';bar.style.background=nv>.92?'#dcd8d1':nv>.78?'#e0b030':'#3fae5a';
      const gm=document.querySelector('.grm i');if(gm&&A.G.cp){const gr=Math.min(0,A.G.cp.comp.reduction||0);gm.style.width=Math.min(100,-gr/18*100).toFixed(0)+'%'}
      if(pk>.97)U.mmClip=performance.now();mmEl.classList.toggle('clip',performance.now()-(U.mmClip||-9e9)<700)}
    document.querySelectorAll('.meter').forEach(m=>{
      const tb=A.G.tb[+m.dataset.m];let pk=0;
      if(tb&&tb.an){tb.an.getFloatTimeDomainData(mbuf);for(let i=0;i<256;i++){const v=Math.abs(mbuf[i]);if(v>pk)pk=v}}
      const lv=Math.min(1,Math.pow(pk*4,.6)),bar=m.firstChild,prev=+(bar.dataset.v||0),nv=Math.max(lv,prev*.88);
      bar.dataset.v=nv;bar.style.height=(nv*100).toFixed(0)+'%';
    });
  }
  if(U.tab==='fx'&&U.fxLive)U.fxLive();
  const pg=playPos();
  if(pg!==U.lastPG){U.lastPG=pg;updatePlayhead(pg)}
  /* the song moves to the next pattern on its own: never rebuild the screen under a finger that is still down, wait for it to lift */
  if(U.patDirty&&!(U.ptrDown&&performance.now()-U.ptrT<12000)){U.patDirty=false;syncTransport();if(patSheet)renderPatSheet();if(U.tab==='seq')renderTab()}/* the play tab shows nothing that depends on the pattern: rebuilding it dropped held keys and made the keyboard flicker */
  const Pj=P(),now=performance.now();
  const l1=$('#ol1'),l2=$('#ol2'),l3=$('#ol3');
  if(l1){
    setT(l1,'T'+String(U.tr+1).padStart(2,'0')+' '+trackLabel(U.tr)+'  '+T('PAT ')+PATL[Pj.pat]+(Pj.nextPat>=0?'>'+PATL[Pj.nextPat]:'')+'  '+(A.playing?T('RUN ')+String((pg<0?0:pg%GR.patLen(Pj))+1).padStart(2,'0'):T('STOP')));
    if(U.fsInfo&&document.body.classList.contains('fs')){const tb=(TABS.find(x=>x[0]===U.tab)||['',''])[1];setT(U.fsInfo,T(tb)+'  \u00B7  T'+String(U.tr+1).padStart(2,'0')+' '+trackLabel(U.tr)+'  \u00B7  '+T('PAT ')+PATL[Pj.pat]+'  \u00B7  '+Pj.bpm+' BPM')}
    const show=now-U.msgT<1600&&U.msg;
    const ol=l1.parentNode.parentNode;if(ol&&ol.classList&&ol._m!==!!show){ol._m=!!show;ol.classList.toggle('msg',!!show)}
    setT(l2,show?U.msg:T(Pj.name||'untitled'));
    setT(l3,show?(U.msgL3||''):('BPM '+Pj.bpm+'  '+T('SWING')+' '+Math.round(50+Pj.swing*50)+'%'+'  Q '+qtxt(Pj.quant||{grid:2,depth:1})+(A.rec?'  '+T('REC'):'')+(Pj.morph.on?'  MORPH':'')));
  }
  if(scope&&sc2){
    if(!U.scN||(U.scN=(U.scN+1)%30)===0||!U.scW){const r=scope.getBoundingClientRect(),d=window.devicePixelRatio||1;U.scD=d;U.scW=Math.max(10,Math.floor(r.width*d));U.scH=Math.max(10,Math.floor(r.height*d));U.scN=U.scN||1}
    const d=U.scD,w=U.scW,hh=U.scH;
    if(scope.width!==w||scope.height!==hh){scope.width=w;scope.height=hh}
    sc2.clearRect(0,0,w,hh);sc2.strokeStyle=TH.sc||'#dcd8d1';sc2.lineWidth=1.5*d;sc2.beginPath();
    if(A.G&&A.G.an){
      if(!anBuf)anBuf=new Float32Array(A.G.an.fftSize);
      A.G.an.getFloatTimeDomainData(anBuf);
      let s=0;for(let i=1;i<anBuf.length/2;i++){if(anBuf[i-1]<0&&anBuf[i]>=0){s=i;break}}
      const n=anBuf.length/2;
      for(let i=0;i<n;i++){const x=i/(n-1)*w,y=hh/2-anBuf[s+i]*hh*.9;i?sc2.lineTo(x,y):sc2.moveTo(x,y)}
    }else{sc2.moveTo(0,hh/2);sc2.lineTo(w,hh/2)}
    sc2.stroke();
    if(A.G&&A.G.an){let pk=0;for(let i=0;i<anBuf.length;i+=4){const v=Math.abs(anBuf[i]);if(v>pk)pk=v}U.quiet=pk<.0006?Math.min(999,(U.quiet||0)+1):0}
  }
}

