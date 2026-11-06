/* ---------- modulation matrix: sources are dragged onto knobs (BEHEMOTH style) ---------- */
const MSRC=[{n:'LFO 1',g:'#ffffff',d:''},{n:'LFO 2',g:'#b4b4b4',d:'6 3'},{n:'ENV',g:'#8a8a8a',d:'2 3'},{n:'VEL',g:'#e6e6e6',d:'9 2 2 2'}];
const MDST={8:'cut',2:'pitch',24:'level',25:'pan'},MDN={cut:'CUTOFF',pitch:'PITCH',level:'LEVEL',pan:'PAN'};
const MST={sel:null};
const routesOf=()=>{const t=trk();return t.routes||(t.routes=[])};
const findR=(s,d)=>routesOf().find(r=>r.s===s&&r.d===d);
const validR=(s,d)=>!(s===2&&(d==='level'||d==='pan'));
function setR(s,d,a){let r=findR(s,d);if(!r){r={s,d,a};routesOf().push(r)}r.a=a;dirty()}
function delR(s,d){trk().routes=routesOf().filter(r=>!(r.s===s&&r.d===d));dirty()}
function refreshKnobs(){document.querySelectorAll('.knob').forEach(k=>k.draw&&k.draw())}
function modRings(g,dest,n,bi){
  g.replaceChildren();if(!dest)return;let idx=0;
  routesOf().forEach(r=>{if(r.d!==dest)return;const s=MSRC[r.s];let lo=r.a>=0?n:n+r.a,hi=r.a>=0?n+r.a:n;
    if(r.s===0||r.s===1){lo=n-Math.abs(r.a);hi=n+Math.abs(r.a)}
    lo=clamp(lo,0,1);hi=clamp(hi,0,1);
    const p=document.createElementNS(SVGNS,'path');p.setAttribute('class','mod');p.setAttribute('d',karc(-135+270*lo,-135+270*hi,29+idx*3.6));p.style.stroke=s.g;if(s.d)p.style.strokeDasharray=s.d;g.appendChild(p);idx++});
}
let cableSvg=null;
function cableEl(){if(cableSvg)return cableSvg;cableSvg=document.createElementNS(SVGNS,'svg');cableSvg.setAttribute('id','cable');
  cableSvg.innerHTML='<path class="glow"/><path class="core"/><circle class="end" r="5"/><circle class="start" r="4"/>';document.body.append(cableSvg);return cableSvg}
function cableTo(from,x,y){const c=cableEl(),r=from.getBoundingClientRect(),x0=r.left+r.width/2,y0=r.top+r.height/2,sag=Math.max(y0,y)+70+Math.abs(x-x0)*.12;
  const d='M'+x0+' '+y0+'C'+(x0+(x-x0)*.2)+' '+sag+' '+(x0+(x-x0)*.8)+' '+sag+' '+x+' '+y;
  c.querySelector('.glow').setAttribute('d',d);c.querySelector('.core').setAttribute('d',d);
  const e=c.querySelector('.end'),s=c.querySelector('.start');e.setAttribute('cx',x);e.setAttribute('cy',y);s.setAttribute('cx',x0);s.setAttribute('cy',y0)}
function modHint(){const el=document.querySelector('.modhint');if(!el)return;
  if(MST.sel==null)el.textContent=T('Drag a source onto a knob, or tap it and drag knobs to set the depth.');
  else{el.replaceChildren(h('b',{text:MSRC[MST.sel].n}),T(' armed. Drag a ringed knob to set the depth, double tap to remove.'))}}
function selSrc(i){MST.sel=MST.sel===i?null:i;document.querySelectorAll('.msrc').forEach((b,k)=>b.classList.toggle('on',MST.sel===k));
  document.querySelectorAll('.knob[data-dest]').forEach(k=>k.classList.toggle('armed',MST.sel!=null&&validR(MST.sel,k.dataset.dest)));modHint();vib(6)}
function modTray(){
  const tray=h('div',{class:'modtray'},h('span',{class:'mtl',text:'MOD'}));
  MSRC.forEach((s,i)=>{
    const n=routesOf().filter(r=>r.s===i).length;
    const b=h('button',{class:'msrc'+(MST.sel===i?' on':'')+(n?' has':''),style:'--sg:'+s.g},h('i'),s.n,n?h('sup',{text:n}):null);
    let sx=0,sy=0,dr=null,ghost=null,moved=false;
    /* hover / press: light up every knob this source can drive, dim the rest */
    const cand=on=>{document.body.classList.toggle('modcand',on);document.body.style.setProperty('--cg',s.g);
      document.querySelectorAll('.knob[data-dest]').forEach(k=>k.classList.toggle('cand',on&&validR(i,k.dataset.dest)))
      /* the page tabs that hold a valid destination glow too: pitch > SRC, cutoff > FLT, level / pan > MIX */
      const pg={pitch:0,cut:1,level:3,pan:3},ok=new Set(Object.keys(pg).filter(d=>validR(i,d)).map(d=>pg[d]));
      document.querySelectorAll('.ptabs .chip').forEach((c,n)=>c.classList.toggle('cand',on&&ok.has(n)&&n!==U.page))};
    b.addEventListener('pointerenter',()=>cand(true));b.addEventListener('pointerleave',()=>{if(!dr)cand(false)});
    b.addEventListener('pointerdown',e=>{cand(true);e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(x){}sx=e.clientX;sy=e.clientY;moved=false;dr=true});
    b.addEventListener('pointermove',e=>{if(!dr)return;
      if(!moved&&Math.hypot(e.clientX-sx,e.clientY-sy)>8){moved=true;ghost=h('div',{class:'mghost',text:s.n,style:'border-color:'+s.g});document.body.append(ghost);const cb=cableEl();cb.style.setProperty('--sc',s.g);cb.classList.remove('plug');cb.classList.add('show');cableTo(b,e.clientX,e.clientY);
        document.querySelectorAll('.knob[data-dest]').forEach(k=>k.classList.toggle('armed',validR(i,k.dataset.dest)))}
      if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';cableTo(b,e.clientX,e.clientY);
        const k=document.elementFromPoint(e.clientX,e.clientY),kn=k&&k.closest&&k.closest('.knob[data-dest]');
        document.querySelectorAll('.knob.drop').forEach(x=>{if(x!==kn)x.classList.remove('drop')});if(kn&&validR(i,kn.dataset.dest))kn.classList.add('drop')}});
    const end=e=>{if(!dr)return;dr=null;cand(false);
      if(ghost){const k=document.elementFromPoint(e.clientX,e.clientY),kn=k&&k.closest&&k.closest('.knob[data-dest]');ghost.remove();ghost=null;const cb=cableEl();
        if(kn){const kr=kn.getBoundingClientRect();cableTo(b,kr.left+kr.width/2,kr.top+kr.width/2-4)}cb.classList.add('plug');setTimeout(()=>cb.classList.remove('show'),380);
        document.querySelectorAll('.knob.drop').forEach(x=>x.classList.remove('drop'));
        if(kn&&validR(i,kn.dataset.dest)){const d=kn.dataset.dest;if(!findR(i,d))setR(i,d,.5);MST.sel=i;vib(14);toast(s.n+' > '+MDN[d]+'. Drag the knob to set the amount');rerender();
          const nk=document.querySelector('.knob[data-dest="'+d+'"]');if(nk){nk.style.setProperty('--arm',s.g);nk.classList.add('zap');setTimeout(()=>nk.classList.remove('zap'),700)}return}
        selSrc(MST.sel===i?i:i);return}
      selSrc(i)};
    b.addEventListener('pointerup',end);b.addEventListener('pointercancel',()=>{dr=null;cand(false);if(ghost){ghost.remove();ghost=null}});
    tray.append(b)});
  const w=h('div',{class:'modwrap'},tray,h('div',{class:'modhint',text:'Drag a source onto a knob, or tap it and drag knobs to set the depth.'}));
  requestAnimationFrame(modHint);return w;
}
function routeList(){
  const L=routesOf();
  if(!L.length)return h('div',{class:'note',text:'No routes yet. Drag LFO 1, LFO 2, ENV or VEL from the MOD row onto a knob that has a ring around it (CUTOFF, TUNE, LEVEL, PAN). Tap a source, then drag the knob to set the amount. Double tap the knob to remove the route.'});
  return h('div',{class:'rlist'},L.map(r=>h('div',{class:'rrow'},
    h('span',{class:'rn',text:MSRC[r.s].n+' > '+MDN[r.d]}),
    HFader(()=>(r.a+1)/2,v=>{r.a=Math.round((v*2-1)*100)/100;dirty();refreshKnobs()}),
    h('b',{class:'rv',text:(r.a>0?'+':'')+Math.round(r.a*100)+'%'}),
    h('button',{class:'chip xs',text:'X',onclick:()=>{delR(r.s,r.d);rerender()}}))));
}
