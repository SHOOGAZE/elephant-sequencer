/* ---------- SOUND ---------- */
const lkIdx=()=>U.tab==='seq'?U.step:U.tab==='play'?-1:U.lockStep;
const rerender=()=>{if(U.tab==='seq')R.seq();else R.sound()};
function lockObj(create){
  if(lkIdx()<0)return null;
  const st=curPat()[U.tr][lkIdx()];
  if(create&&!st.lock)st.lock={};
  return st.lock||null;
}
function vizGesture(t,idx){
  if(!U.gAct){U.gAct=1;const L=lkIdx()>=0?lockObj(false):null,g=new Float32Array(NPAR);for(let i=0;i<NPAR;i++)g[i]=L&&L[i]!=null?L[i]:t.params[i];U.ghost=g;U.gShow=true}
  U.hot={idx};clearTimeout(U.hotT);
}
function paramKnob(idx){
  const t=trk(),d=pageDefs(t.engine,idx>>3)[idx&7];
  return Knob({
    label:d.n,disc:d.d?d.d.length:0,dest:MDST[idx],
    get:()=>{const L=lockObj(false);return L&&L[idx]!=null?L[idx]:t.params[idx]},
    set:v=>{vizGesture(t,idx);if(lkIdx()>=0)lockObj(true)[idx]=v;else{t.params[idx]=v;if(idx===30&&A.G)A.G.refreshTrack(U.tr)}dirty();if(U.viz)U.viz()},
    fmt:v=>fmtParam(t.engine,idx,v),
    locked:()=>{const L=lockObj(false);return !!(L&&L[idx]!=null)},
    reset:()=>{U.gAct=0;vizGesture(t,idx);U.gAct=0;if(lkIdx()>=0){const L=lockObj(false);if(L){delete L[idx];if(!Object.keys(L).length)curPat()[U.tr][lkIdx()].lock=null}}else t.params[idx]=ENGINE_DEFAULT[t.engine]()[idx];dirty();if(U.viz)U.viz()},
    end:()=>{U.gAct=0;clearTimeout(U.hotT);U.hotT=setTimeout(()=>{U.hot=null;if(U.viz)U.viz()},1300)}
  });
}
/* ---- sound page helpers: live graphs ---- */
const tAtk=v=>.001*Math.pow(1500,v),tDec=v=>.015*Math.pow(300,v),tRel=v=>.01*Math.pow(400,v);
function envPath(c,x,y,w,hh,a,d,s,r,amt,fill,hl){
  const wa=Math.sqrt(a)*.9+.04,wd=Math.sqrt(d)*.9+.04,wh=.7,wr=Math.sqrt(r)*.9+.04,T=wa+wd+wh+wr,sx=w/T,Y=v=>y+hh-4-(hh-8)*v*amt;
  const pts=[[x,Y(0),0],[x+wa*sx,Y(1),0]];
  const N=14;for(let i=1;i<=N;i++){const u=i/N;pts.push([x+(wa+wd*u)*sx,Y(s+(1-s)*Math.exp(-3.2*u)),1])}
  const lv=s+(1-s)*Math.exp(-3.2);pts.push([x+(wa+wd+wh)*sx,Y(lv),2]);
  for(let i=1;i<=N;i++){const u=i/N;pts.push([x+(wa+wd+wh+wr*u)*sx,Y(lv*Math.exp(-3.2*u)),3])}
  c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));
  c.stroke();if(fill){c.lineTo(x+w,Y(0));c.lineTo(x,Y(0));c.closePath();c.fill()}
  if(hl!=null&&hl>=0){c.save();c.lineWidth=4;c.lineCap='round';c.beginPath();let st=false,last=null;pts.forEach((q,i)=>{if(i&&q[2]===hl){if(!st){c.moveTo(pts[i-1][0],pts[i-1][1]);st=true}c.lineTo(q[0],q[1]);last=q}});c.stroke();if(last){c.beginPath();c.arc(last[0],last[1],3.4,0,7);c.fillStyle=c.strokeStyle;c.fill()}c.restore()}
}
function peaksOf(i){
  const s=S.slots[i];if(!s||!s.ch||!s.ch[0])return null;const x=s.ch[0];
  if(s._pk&&s._pkn===x.length)return s._pk;
  const N=320,pk=new Float32Array(N),per=Math.max(1,Math.floor(x.length/N));
  for(let k=0;k<N;k++){let m=0;for(let j=0;j<per;j+=Math.max(1,per>>5)){const v=Math.abs(x[k*per+j]||0);if(v>m)m=v}pk[k]=m}
  let mx=1e-6;for(let k=0;k<N;k++)mx=Math.max(mx,pk[k]);for(let k=0;k<N;k++)pk[k]/=mx;
  s._pk=pk;s._pkn=x.length;return pk;
}
/* exact min/max of the sample for every pixel column of the visible span, so the wave shows real detail and keeps getting sharper while zooming */
function wavCols(i,v0,v1,n){
  const sm=S.slots[i],x=sm.ch[0],L=x.length;
  if(sm._gmL!==L){let m=1e-6;for(let k=0;k<L;k++){const v=x[k]<0?-x[k]:x[k];if(v>m)m=v}sm._gmx=m;sm._gmL=L}
  const g=sm._gmx,mn=new Float32Array(n),mx=new Float32Array(n);
  for(let k=0;k<n;k++){
    const s0=Math.min(L-1,Math.floor((v0+(v1-v0)*k/n)*L)),s1=Math.min(L,Math.max(s0+1,Math.floor((v0+(v1-v0)*(k+1)/n)*L))),st=Math.max(1,Math.floor((s1-s0)/48));
    let lo=0,hi=0;for(let j=s0;j<s1;j+=st){const v=x[j];if(v<lo)lo=v;if(v>hi)hi=v}
    mn[k]=lo/g;mx[k]=hi/g}
  return{mn,mx}}
const vzOf=slot=>{if(!U.vz||U.vz.slot!==slot)U.vz={slot,v0:0,v1:1};return U.vz};
/* finger gestures on the SRC wave: drag the two edges, swipe to draw a region, tap a slice, pinch to zoom, drag to pan, double tap resets */
function wireViz(cv,t,pv){
  if(cv._wired)return;cv._wired=true;cv.style.touchAction='none';
  const P=new Map(),PX=2;let g=null,lastTap=0;
  const geo=()=>{const r=cv.getBoundingClientRect(),W=Math.max(1,r.width-2*PX),vz=vzOf(t.slot);return{r,W,vz,spn:vz.v1-vz.v0}};
  const posAt=x=>{const G=geo();return Math.max(0,Math.min(1,G.vz.v0+G.spn*((x-G.r.left-PX)/G.W)))};
  const xOf=p=>{const G=geo();return G.r.left+PX+(p-G.vz.v0)/G.spn*G.W};
  const rev=()=>dval(pv(5),2)===1,ns=()=>[1,2,4,8,16][dval(pv(6),5)];
  const edges=()=>{let a=Math.min(pv(0),pv(1)),b=Math.max(pv(0),pv(1));if(rev()){const q=1-b;b=1-a;a=q}return[a,b]};
  const setEdges=(a,b)=>{a=Math.max(0,Math.min(a,b));b=Math.min(1,Math.max(a+.004,b));const lo=rev()?1-b:a,hi=rev()?1-a:b;setP(0,lo);setP(1,hi)};
  const setP=(idx,v)=>{vizGesture(t,idx);if(lkIdx()>=0)lockObj(true)[idx]=v;else t.params[idx]=v;dirty();U.viz&&U.viz()};
  const done=()=>{U.gAct=0;clearTimeout(U.hotT);U.hotT=setTimeout(()=>{U.hot=null;U.viz&&U.viz()},900)};
  cv.addEventListener('pointerdown',e=>{
    e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}
    P.set(e.pointerId,{x:e.clientX});
    if(P.size>=2){const [p1,p2]=[...P.values()],G=geo();g={m:'pinch',d0:Math.abs(p1.x-p2.x)||1,span0:G.spn,anchor:posAt((p1.x+p2.x)/2)};return}
    if(!S.slots[t.slot])return;
    if(ns()===1){const [a,b]=edges(),da=Math.abs(e.clientX-xOf(a)),db=Math.abs(e.clientX-xOf(b));
      if(Math.min(da,db)<28){g={m:da<=db?'a':'b'};return}}
    g={m:geo().spn<.995&&ns()===1?'pan':ns()===1?'sel':'tap',x0:e.clientX,p0:posAt(e.clientX),v00:geo().vz.v0,moved:false};
    if(ns()>1&&geo().spn<.995)g.m='pan';
  });
  cv.addEventListener('pointermove',e=>{
    if(!P.has(e.pointerId)||!g)return;P.get(e.pointerId).x=e.clientX;const G=geo();
    if(g.m==='pinch'&&P.size>=2){const [p1,p2]=[...P.values()],dd=Math.abs(p1.x-p2.x)||1,cx=(p1.x+p2.x)/2,ns_=Math.max(.02,Math.min(1,g.span0*g.d0/dd)),f=Math.max(0,Math.min(1,(cx-G.r.left-PX)/G.W));
      let v0=Math.max(0,Math.min(1-ns_,g.anchor-f*ns_));G.vz.v0=v0;G.vz.v1=v0+ns_;U.viz&&U.viz();return}
    if(g.m==='a'||g.m==='b'){const [a,b]=edges(),q=posAt(e.clientX);g.m==='a'?setEdges(Math.min(q,b-.004),b):setEdges(a,Math.max(q,a+.004));return}
    if(Math.abs(e.clientX-g.x0)>6)g.moved=true;
    if(g.m==='pan'&&g.moved){const d=(e.clientX-g.x0)/G.W*G.spn;G.vz.v0=Math.max(0,Math.min(1-G.spn,g.v00-d));G.vz.v1=G.vz.v0+G.spn;U.viz&&U.viz();return}
    if(g.m==='sel'&&g.moved){const q=posAt(e.clientX);setEdges(Math.min(g.p0,q),Math.max(g.p0,q))}
  });
  const end=e=>{
    if(!P.has(e.pointerId))return;P.delete(e.pointerId);if(!g)return;const gg=g;
    if(gg.m==='pinch'){if(P.size<2)g={m:'none'};return}
    if(P.size>0)return;g=null;
    if(gg.m==='a'||gg.m==='b'||(gg.m==='sel'&&gg.moved)){done();vib(6);return}
    if(!gg.moved){const now=performance.now();
      if(now-lastTap<330){const G=geo();G.vz.v0=0;G.vz.v1=1;lastTap=0;U.viz&&U.viz();return}lastTap=now;
      if(ns()>1&&S.slots[t.slot]){const n=ns();let q=gg.p0;if(rev())q=1-q;setP(7,(Math.min(n-1,Math.floor(q*n))+.5)/n);done();vib(6);playNow&&playNow(U.tr,0,1,1)}}
  };
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
}
function drawViz(cv,t,pn,pv){
  const dpr=window.devicePixelRatio||1,w=cv.clientWidth,hh=cv.clientHeight;if(!w||!hh)return;
  if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(hh*dpr)}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,hh);
  const cs=getComputedStyle(document.documentElement),dim=cs.getPropertyValue('--text2').trim()||'#888',acc=cs.getPropertyValue('--orange').trim()||'#e8561c';
  c.lineWidth=1.6;c.lineJoin='round';c.font='600 8px '+(cs.getPropertyValue('--font-ui')||'sans-serif');c.textBaseline='top';
  const run=(pv,ghost)=>{
  c.save();if(ghost)c.globalAlpha=.3;
  const hot=!ghost&&U.hot?U.hot.idx:-1;
  const frame=(x,wd)=>{if(ghost)return;c.save();c.fillStyle=cs.getPropertyValue('--well').trim()||dim+'12';c.strokeStyle=cs.getPropertyValue('--well-ln').trim()||dim+'66';c.lineWidth=1;c.beginPath();c.roundRect?c.roundRect(x+.5,.5,wd-1,hh-1,8):c.rect(x+.5,.5,wd-1,hh-1);c.fill();c.stroke();c.restore()};
  const half=(i)=>({x:i?w/2+12:8,w:w/2-20}),lab=(tx,x)=>{if(ghost)return;c.fillStyle=dim;c.fillText(tx,x+2,3)};
  const ampEnv=r=>{c.strokeStyle=acc;c.fillStyle=acc+'33';envPath(c,r.x,10,r.w,hh-10,tAtk(pv(11)),tDec(pv(12)),pv(13),tRel(pv(14)),1,true,hot>=11&&hot<=14?hot-11:-1)};
  if(pn===1){
    frame(0,w/2-4);frame(w/2+4,w/2-4);
    const r0=half(0),r1=half(1);lab('FILTER',r0.x);lab('AMP ENV',r1.x);
    const fc=30*Math.pow(600,pv(8)),Q=.3+pv(9)*pv(9)*16,ty=Math.min(2,Math.floor(pv(15)*3)),n=64;
    c.beginPath();
    for(let i=0;i<=n;i++){const f=30*Math.pow(650,i/n),x=f/fc,lp=1/Math.sqrt(Math.pow(1-x*x,2)+x*x/(Q*Q));
      const m=ty===0?lp:ty===1?lp*x*x:lp*x/Q,db=Math.max(-36,Math.min(24,20*Math.log10(Math.max(m,1e-4)))),X=r0.x+r0.w*i/n,Y=10+(hh-14)*(1-(db+36)/60);
      i?c.lineTo(X,Y):c.moveTo(X,Y)}
    c.strokeStyle=acc;c.stroke();c.lineTo(r0.x+r0.w,hh-4);c.lineTo(r0.x,hh-4);c.closePath();c.fillStyle=acc+'33';c.fill();
    if(hot===8||hot===9){const fx=r0.x+r0.w*Math.log(fc/30)/Math.log(650);c.save();c.lineWidth=1.4;c.strokeStyle=acc;
      if(hot===8){c.setLineDash([3,3]);c.beginPath();c.moveTo(fx,10);c.lineTo(fx,hh-4);c.stroke()}
      else{const db=Math.max(-36,Math.min(24,20*Math.log10(Math.max(ty===2?Q/Q:Q,1e-4)))),fy=10+(hh-14)*(1-(db+36)/60);c.beginPath();c.arc(fx,fy,4,0,7);c.stroke();c.fillStyle=acc+'55';c.fill()}
      c.restore()}
    ampEnv(r1);
  }else if(pn===4){
    frame(0,w/2-4);frame(w/2+4,w/2-4);
    const r0=half(0),r1=half(1);lab('FILTER ENV  x'+(pv(10)*6).toFixed(1)+' oct',r0.x);lab('AMP ENV',r1.x);
    c.strokeStyle=acc;c.fillStyle=acc+'33';envPath(c,r0.x,10,r0.w,hh-10,tAtk(pv(32)),tDec(pv(33)),pv(34),tRel(pv(35)),Math.max(.12,pv(10)),true,hot>=32&&hot<=35?hot-32:-1);
    ampEnv(r1);
  }else if(pn===0){
    const sm=S.slots[t.slot],pk=peaksOf(t.slot),top=17,bot=hh>=90?hh-14:hh-3,PX=2,W=w-2*PX,mid=(top+bot)/2,amp=(bot-top)/2;
    frame(0,w);c.save();c.translate(PX,0);
    if(!sm||!pk){if(!ghost){c.fillStyle=dim;c.textAlign='center';c.fillText('NO SAMPLE - PICK ONE ON WAVE',W/2,hh/2-4);c.textAlign='left'}}
    else{
      const len=sm.ch[0].length/(sm.rate||44100),N=pk.length,vz=vzOf(t.slot),spn=vz.v1-vz.v0,bwid=W/N/spn,rev=dval(pv(5),2)===1,XX=p=>(p-vz.v0)/spn*W;
      let a=0,b=1,ns=1;
      {ns=[1,2,4,8,16][dval(pv(6),5)];if(ns>1){const si=Math.min(ns-1,Math.floor(pv(7)*ns));a=si/ns;b=(si+1)/ns}else{a=Math.min(pv(0),pv(1));b=Math.max(pv(0),pv(1))}if(rev){const q=1-b;b=1-a;a=q}}
      const cols=Math.max(1,Math.round(W*dpr)),colw=W/cols,WV=wavCols(t.slot,vz.v0,vz.v1,cols);
      if(!ghost){
        c.fillStyle=dim+'33';c.fillRect(0,mid-.5,W,1);
        for(let k=0;k<cols;k++){const p=vz.v0+spn*(k+.5)/cols,y0=mid-WV.mx[k]*amp,y1=mid-WV.mn[k]*amp;c.fillStyle=p>=a&&p<=b?acc:dim+'66';c.fillRect(k*colw,y0,colw+.3,Math.max(.8,y1-y0))}
        if(hh>=90){const vis=len*spn,t0=vz.v0*len,steps=[.005,.01,.02,.05,.1,.2,.5,1,2,5,10],stp=steps.find(q=>q/vis*W>=64)||10;c.fillStyle=dim;c.strokeStyle=dim+'55';c.lineWidth=1;c.textAlign='left';
          for(let q=Math.ceil(t0/stp)*stp;q<=t0+vis+1e-9;q+=stp){const X=(q-t0)/vis*W;c.beginPath();c.moveTo(X,bot);c.lineTo(X,bot+4);c.stroke();c.fillText(q.toFixed(stp<.1?3:stp<1?2:1)+'s',X+3,bot+3)}}
        {
          if(ns>1){c.strokeStyle=dim;c.lineWidth=hot===6||hot===7?1.8:1;for(let k=1;k<ns;k++){c.beginPath();c.moveTo(XX(k/ns),top);c.lineTo(XX(k/ns),bot);c.stroke()}}
          c.strokeStyle=acc;c.lineWidth=hot===0?4:2;c.beginPath();c.moveTo(XX(a)+1,top);c.lineTo(XX(a)+1,bot);c.stroke();
          c.lineWidth=hot===1?4:2;c.beginPath();c.moveTo(XX(b)-1,top);c.lineTo(XX(b)-1,bot);c.stroke();
          lab((rev?'REVERSE  ':'')+(ns>1?'SLICE '+(Math.floor(a*ns+.5)+1)+'/'+ns:'REGION'),0);
          if(hot<0){c.fillStyle=dim;c.textAlign='right';c.fillText(((b-a)*len).toFixed(2)+' s'+(spn<.995?'   x'+(1/spn).toFixed(1):''),W+PX-4,1.5)};c.textAlign='left';
        }
      }else{
        c.strokeStyle=acc;c.lineWidth=1.4;const X=XX(a);c.beginPath();c.moveTo(X,top);c.lineTo(X,bot);c.stroke();
        c.beginPath();c.moveTo(XX(b),top);c.lineTo(XX(b),bot);c.stroke();
      }
    }
  c.restore();
  }
  c.restore();
  };
  if(U.ghost&&U.gShow){const g=U.ghost,L=null;run(i=>g[i],true)}
  run(pv,false);
  if(U.hot){const d=pageDefs(t.engine,U.hot.idx>>3)[U.hot.idx&7];if(d){const tx=d.n+'  '+fmtParam(t.engine,U.hot.idx,pv(U.hot.idx));c.font='700 9px '+(cs.getPropertyValue('--font-ui')||'sans-serif');const tw=c.measureText(tx).width+10;
    c.fillStyle=getComputedStyle(cv).backgroundColor;c.fillRect(w-tw-3,1,tw,13);c.fillStyle=acc;c.textAlign='right';c.textBaseline='top';c.fillText(tx,w-8,3);c.textAlign='left'}}
}
R.sound=function(){U.ghost=null;U.gShow=false;U.hot=null;U.gAct=0;
  const root=$('#s-sound');root.replaceChildren();const t=trk(),pat=curPat()[U.tr];U.viz=null;
  const ls=h('div',{class:'lkstrip'},pat.map((st,i)=>h('button',{class:(st.on?'on ':'')+(st.lock?'has ':'')+(i===U.lockStep?'sel':''),text:i+1,onclick:()=>{vib(6);U.lockStep=U.lockStep===i?-1:i;R.sound()}})));
  const info=h('div',{class:'lkinfo'});
  if(U.lockStep>=0){const n=pat[U.lockStep].lock?Object.keys(pat[U.lockStep].lock).length:0;info.append(T('EDITING '),h('b',{text:T('P-LOCKS OF STEP ')+(U.lockStep+1)}),'  '+n+' '+T('locked. Double tap a knob to remove its lock.'))}
  else info.textContent=T('EDITING THE SOUND. Pick a step below to lock values for that step only.');
  const PG=pagesFor(t.engine);if(U.page>=PG.length)U.page=0
  const pn=pageNo(t.engine,U.page),defs=pageDefs(t.engine,pn);
  const pv=i=>{const L=lockObj(false);return L&&L[i]!=null?L[i]:t.params[i]};
  const ns0=[1,2,4,8,16][dval(pv(6),5)];
  const vizOn=pn===0||pn===1||pn===4;
  const cv=vizOn?h('canvas',{class:'viz'+(pn===0?' wv':'')}):null;
  if(cv){U.viz=()=>{if(cv.isConnected)drawViz(cv,t,pn,pv)};requestAnimationFrame(()=>U.viz&&U.viz());if(pn===0)wireViz(cv,t,pv)}
  const locking=U.lockOpen||U.lockStep>=0;
  root.append(h('div',{class:'plate splate'},
    h('div',{class:'scol sleft'},
      h('div',{class:'sbar'},
        h('b',{class:'stt',text:'T'+(U.tr+1)+'  '+trackLabel(U.tr)}),
        h('span',{class:'snav'},
          t.engine==='SAMP'?h('button',{class:'chip xs'+(ns0>1?' slon':''),text:'SLICE','aria-label':'Slice mode '+(ns0>1?'on':'off'),onclick:()=>{const L=lkIdx()>=0?lockObj(true):t.params,cur=dval(L[6]!=null?L[6]:t.params[6],5),mem=U.sliceMem||(U.sliceMem={});if(cur>0){mem[t.slot]=cur;L[6]=0}else{const k=mem[t.slot]||3;L[6]=(k+.5)/5;L[7]=.5/[1,2,4,8,16][k]}dirty();vib(6);R.sound()}}):null,
          h('button',{class:'chip xs'+(t.cmp&&t.cmp.on?' on':''),text:'COMP',onclick:openCompSheet}),
          h('button',{class:'chip xs',text:'<','aria-label':'Previous track',onclick:()=>{U.tr=(U.tr+15)%16;U.step=-1;U.lockStep=-1;R.sound()}}),
          h('button',{class:'chip xs',text:'>','aria-label':'Next track',onclick:()=>{U.tr=(U.tr+1)%16;U.step=-1;U.lockStep=-1;R.sound()}})),
        sampSeg('sound'),
        h('button',{class:'chip or sndpick',text:'SOUND ▾',onclick:()=>openSndSheet(U.tr)})),
      modTray(),h('div',{class:'stabs'},
        h('div',{class:'row nw ptabs',style:'gap:4px'},chipRow(PG,i=>U.page===i,i=>{U.page=i;R.sound()},'grow')),
        h('button',{class:'chip plk'+(locking?' on':''),text:'P-LOCKS','aria-label':'Edit p-locks',onclick:()=>{U.lockOpen=!(U.lockOpen||U.lockStep>=0);if(!U.lockOpen)U.lockStep=-1;R.sound()}})),
      locking?ls:null,locking?info:null),
    h('div',{class:'scol sright'},
      h('div',{class:'sl'},cv),
      h('div',{class:'sr'},
        h('div',{class:'kgrid',style:'margin-top:10px'},(pn===2?[0,3,4,7]:defs.map((d,i)=>i)).map(i=>paramKnob(pn*8+i))),
        pn===2?routeList():null,
        h('div',{class:'row nw'},
          h('button',{class:'chip grow',text:'RESET PAGE',onclick:()=>{if(U.lockStep>=0){const st=pat[U.lockStep];if(st.lock){for(let i=0;i<8;i++)delete st.lock[pn*8+i];if(!Object.keys(st.lock).length)st.lock=null}}else{const dflt=ENGINE_DEFAULT[t.engine]();for(let i=0;i<defs.length;i++)t.params[pn*8+i]=dflt[pn*8+i]}dirty();R.sound()}}))))));
};

let cmpSheet=null;
const CMPD=[['THRESH',.55,v=>(-40+v*40).toFixed(0)+'dB'],['RATIO',.3,v=>(1.5+v*10.5).toFixed(1)+':1'],['ATTACK',.15,v=>(1+v*49).toFixed(0)+'ms'],['RELEASE',.4,v=>(50+v*350).toFixed(0)+'ms'],['MAKEUP',.25,v=>(v*12).toFixed(1)+'dB']];
function closeCompSheet(){if(cmpSheet){cmpSheet.remove();cmpSheet=null}}
function openCompSheet(){closeCompSheet();cmpSheet=h('div',{class:'psheet',onpointerdown:e=>{if(e.target===cmpSheet)closeCompSheet()}});document.body.append(cmpSheet);renderCompSheet()}
function renderCompSheet(){
  const t=trk();if(!t.cmp)t.cmp={on:0,v:CMPD.map(d=>d[1])};const c=t.cmp,apply=()=>{if(A.G)A.G.refreshTrack(U.tr);dirty()};
  cmpSheet.replaceChildren(h('div',{class:'pcard'},
    h('h3',{},h('span',{text:'COMP  T'+(U.tr+1)+' '+trackLabel(U.tr)}),h('span',{},
      h('button',{class:'chip xs'+(c.on?' on':''),text:c.on?'ON':'OFF',onclick:()=>{c.on=c.on?0:1;apply();vib(8);renderCompSheet();if(U.tab==='sound')R.sound()}}),' ',
      h('button',{class:'chip xs',text:'DONE',onclick:closeCompSheet}))),
    h('div',{class:'kgrid',style:'margin-top:10px;grid-template-columns:repeat(5,1fr)'},CMPD.map((d,i)=>Knob({label:d[0],small:true,get:()=>c.v[i],set:v=>{c.v[i]=v;apply()},fmt:d[2],reset:()=>{c.v[i]=d[1];apply()}}))),
    h('div',{class:'note',text:'Compresses this track only, before its level and sends. Try it on the kick for more punch.'})));
}

/* SAMPLE = SOUND + WAVE under one tab */
function sampSeg(cur){return h('div',{class:'sampseg'},[['sound','SOUND'],['smpl','WAVE']].map(([k,l])=>h('button',{class:'chip grow'+(cur===k?' on':''),text:l,onclick:()=>{vib(6);if(cur!==k)go(k)}})))}
