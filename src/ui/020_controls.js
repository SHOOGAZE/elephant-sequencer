/* ---------- controls ---------- */
const SVGNS='http://www.w3.org/2000/svg';
function karc(a0,a1,r){if(a1-a0<.6)return '';const p=a=>{const t=a*Math.PI/180;return[(32+r*Math.sin(t)).toFixed(2),(32-r*Math.cos(t)).toFixed(2)]},s=p(a0),e=p(a1);return 'M'+s[0]+' '+s[1]+'A'+r+' '+r+' 0 '+((a1-a0)>180?1:0)+' 1 '+e[0]+' '+e[1]}
let vbEl=null,vbT=0;
function vbShow(el,label,text){if(!vbEl){vbEl=h('div',{id:'vbubble'},h('i'),h('b'));document.body.append(vbEl)}
  clearTimeout(vbT);const r=el.getBoundingClientRect();vbEl.firstChild.textContent=T(label);vbEl.lastChild.textContent=T(text);
  vbEl.style.left=clamp(r.left+r.width/2,70,window.innerWidth-70)+'px';vbEl.style.top=Math.max(8,r.top-62)+'px';vbEl.classList.add('on')}
function vbHide(){clearTimeout(vbT);vbT=setTimeout(()=>{vbEl&&vbEl.classList.remove('on')},450)}
function Knob(o){
  const svg=document.createElementNS(SVGNS,'svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('class','ksvg');
  svg.innerHTML='<path class="trk"/><path class="val"/><g class="mods"></g><circle class="cap" cx="32" cy="32" r="16"/><line class="ind" x1="32" y1="32" x2="32" y2="20"/>';
  const trk=svg.querySelector('.trk'),val=svg.querySelector('.val'),ind=svg.querySelector('.ind');
  trk.setAttribute('d',karc(-135,135,24));
  const vv=h('div',{class:'kv'}),mg=svg.querySelector('.mods');
  const el=h('div',{class:'knob'+(o.small?' sm':''),'data-dest':o.dest||null,role:'slider','aria-label':o.label,tabindex:'0'},svg,h('div',{class:'kl',text:o.label}),vv);
  const draw=()=>{const v=o.get(),a=-135+v*270,z=o.bi?-135+135:-135;
    val.setAttribute('d',a>=z?karc(z,a,24):karc(a,z,24));
    const t=a*Math.PI/180;ind.setAttribute('x2',(32+13*Math.sin(t)).toFixed(2));ind.setAttribute('y2',(32-13*Math.cos(t)).toFixed(2));
    modRings(mg,o.dest,v,o.bi);vv.textContent=T(o.fmt(v));el.classList.toggle('locked',!!(o.locked&&o.locked()))};
  let sy=0,sx=0,sv=0,drag=false,last=0,rt=false,ra=0;
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(x){}
    const now=performance.now();
    if(now-last<320){last=0;if(o.dest&&MST.sel!=null&&findR(MST.sel,o.dest)){delR(MST.sel,o.dest);rerender();vib(12);return}if(o.reset)o.reset();draw();vbShow(el,o.label,o.fmt(o.get()));vbHide();oled(o.label+' '+o.fmt(o.get()),'reset');vib(12);return}
    last=now;drag=true;sy=e.clientY;sx=e.clientX;sv=o.get();vib(4);el.classList.add('touch');rt=o.dest&&MST.sel!=null&&validR(MST.sel,o.dest);
    if(rt){if(!findR(MST.sel,o.dest))setR(MST.sel,o.dest,0);ra=findR(MST.sel,o.dest).a;vbShow(el,MSRC[MST.sel].n,Math.round(ra*100)+'%')}else vbShow(el,o.label,o.fmt(sv));
  });
  el.addEventListener('pointermove',e=>{
    if(!drag)return;
    if(rt){ra=clamp(ra+(sy-e.clientY)/150,-1,1);sy=e.clientY;setR(MST.sel,o.dest,Math.round(ra*100)/100);draw();vbShow(el,MSRC[MST.sel].n,(ra>0?'+':'')+Math.round(ra*100)+'%');return}
    const far=Math.abs(e.clientX-sx)>56;/* slide sideways away from the knob for fine control */
    let v=clamp(sv+(sy-e.clientY)/((o.disc&&o.disc<9?90:150)*(far?5:1)),0,1);
    if(o.disc)v=dnorm(dval(v,o.disc),o.disc);
    if(Math.abs(v-o.get())<1e-6)return;
    o.set(v);draw();vbShow(el,o.label,o.fmt(v));oled(o.label+' '+o.fmt(v),o.locked&&o.locked()?'P-LOCK':'');
  });
  const up=()=>{if(drag){drag=false;vbHide();setTimeout(()=>{if(!drag)el.classList.remove('touch')},120);if(o.end)o.end()}};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('keydown',e=>{
    if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;e.preventDefault();
    const st=o.disc?1/o.disc:.02,v=clamp(o.get()+(e.key==='ArrowUp'?st:-st),0,1);
    o.set(o.disc?dnorm(dval(v,o.disc),o.disc):v);draw();if(o.end)o.end();
  });
  el.draw=draw;draw();return el;
}
function HFader(get,set){
  const i=h('i'),el=h('div',{class:'hfader'},i);
  const draw=()=>{el.style.setProperty('--v',get())};let d=false;
  const mv=e=>{const r=el.getBoundingClientRect(),pd=parseFloat(getComputedStyle(el).getPropertyValue('--pd'))||11;set(clamp((e.clientX-r.left-pd)/Math.max(1,r.width-2*pd),0,1));draw()};
  el.addEventListener('pointerdown',e=>{try{el.setPointerCapture(e.pointerId)}catch(x){}d=true;mv(e)});
  el.addEventListener('pointermove',e=>{if(d)mv(e)});
  el.addEventListener('pointerup',()=>{d=false});el.addEventListener('pointercancel',()=>{d=false});
  draw();return el;
}
function VFader(get,set){
  const i=h('i'),el=h('div',{class:'fader'},i);
  const draw=()=>{el.style.setProperty('--v',get())};let d=false;
  const mv=e=>{const r=el.getBoundingClientRect(),pd=parseFloat(getComputedStyle(el).getPropertyValue('--pd'))||9;set(clamp(1-(e.clientY-r.top-pd)/Math.max(1,r.height-2*pd),0,1));draw()};
  el.addEventListener('pointerdown',e=>{try{el.setPointerCapture(e.pointerId)}catch(x){}d=true;mv(e)});
  el.addEventListener('pointermove',e=>{if(d)mv(e)});
  el.addEventListener('pointerup',()=>{d=false});el.addEventListener('pointercancel',()=>{d=false});
  draw();return el;
}
function chipRow(items,isOn,pick,cls){
  return items.map((lab,i)=>h('button',{class:'chip'+(cls?' '+cls:'')+(isOn(i)?' on':''),text:lab,onclick:()=>{vib(6);pick(i)}}));
}

