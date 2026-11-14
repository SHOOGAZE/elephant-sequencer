/* ---------- FX ---------- */
/* live picture of the selected effect */
function fxViz(cv,name,v){
  const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1,w=Math.max(40,Math.floor(r.width*d)),hh=Math.max(40,Math.floor(r.height*d));
  if(cv.width!==w||cv.height!==hh){cv.width=w;cv.height=hh}
  const c=cv.getContext('2d'),fg=getComputedStyle(cv).color||'#888',OR='#dcd8d1',on=!(P().fx.off&&P().fx.off[name]);
  c.clearRect(0,0,w,hh);c.lineWidth=1.5*d;c.font=(9*d)+'px ui-monospace,Menlo,Consolas,monospace';c.textBaseline='top';
  const pad=6*d,X=t=>pad+t*(w-2*pad),Y=t=>hh-pad-t*(hh-2*pad-10*d);
  const grid=(n)=>{c.save();c.globalAlpha=.16;c.strokeStyle=fg;c.lineWidth=d;for(let i=0;i<=n;i++){c.beginPath();c.moveTo(X(i/n),Y(0));c.lineTo(X(i/n),Y(1));c.stroke()}c.restore()};
  const txt=(s,x,y,al)=>{c.save();c.fillStyle=fg;c.globalAlpha=.7;c.textAlign=al||'left';c.fillText(s,x,y);c.restore()};
  c.strokeStyle=on?OR:fg;c.fillStyle=on?OR:fg;if(!on)c.globalAlpha=.45;
  if(name==='filter'){
    const f0=v[0],q=Math.pow(10,(.7+v[1]*(f0<.5?10:6))/20),N=140;
    const fcl=f0<.5?60*Math.pow(300,f0/.5):null,fch=f0>.5?20*Math.pow(200,(f0-.5)/.5):null;
    const mag=f=>{let m=1;if(fcl){const x=f/fcl;m*=1/Math.sqrt(Math.pow(1-x*x,2)+x*x/(q*q))}if(fch){const x=f/fch;m*=x*x/Math.sqrt(Math.pow(1-x*x,2)+x*x/(q*q))}return m};
    const yy=m=>Y(Math.max(0,Math.min(1,(20*Math.log10(Math.max(m,1e-4))+36)/54)));
    c.save();c.globalAlpha=.16;c.strokeStyle=fg;c.lineWidth=d;[100,1000,10000].forEach(f=>{const x=X(Math.log10(f/20)/3);c.beginPath();c.moveTo(x,Y(0));c.lineTo(x,Y(1));c.stroke()});c.restore();
    c.beginPath();for(let i=0;i<=N;i++){const f=20*Math.pow(1000,i/N),x=X(i/N),y=yy(mag(f));i?c.lineTo(x,y):c.moveTo(x,y)}
    c.stroke();c.lineTo(X(1),Y(0));c.lineTo(X(0),Y(0));c.save();c.globalAlpha*=.18;c.fill();c.restore();
    txt('100',X(Math.log10(5)/3)+3*d,4*d);txt('1k',X(Math.log10(50)/3)+3*d,4*d);txt('10k',X(Math.log10(500)/3)+3*d,4*d);
    txt(!fcl&&!fch?'FLAT':fcl?'LP':'HP',X(1),Y(0)-11*d,'right');
  }else if(name==='comp'){
    const T=-v[0]*40,R=1+v[1]*19,mk=v[4]*18,W=6,lo=-48,hi=6;
    const out=i=>{let o;if(i<T-W/2)o=i;else if(i>T+W/2)o=T+(i-T)/R;else o=i+(1/R-1)*Math.pow(i-T+W/2,2)/(2*W);return o+mk};
    const Y2=o=>Y(Math.max(0,Math.min(1,(o-lo)/(hi-lo))));
    const sx=X(.62);c.save();c.globalAlpha=.16;c.strokeStyle=fg;c.lineWidth=d;c.beginPath();c.moveTo(X(0),Y2(lo));c.lineTo(sx,Y2(0));c.stroke();c.restore();
    c.beginPath();for(let i=lo;i<=0;i+=2){const x=X(0)+(i-lo)/(0-lo)*(sx-X(0)),y=Y2(out(i));i>lo?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
    if(T>lo){const x=X(0)+(T-lo)/(0-lo)*(sx-X(0));c.save();c.globalAlpha=.35;c.setLineDash([3*d,3*d]);c.beginPath();c.moveTo(x,Y(0));c.lineTo(x,Y(1));c.stroke();c.restore()}
    /* live gain reduction meter */
    const gr=(A.G&&A.G.cp&&A.G.cp.comp.reduction)||0,g=Math.max(0,Math.min(1,-(typeof gr==='number'?gr:0)/24));
    const bw=Math.round((w-2*pad)*.26),bx=sx+(w-pad-sx-bw)/2,by=pad,bh=hh-2*pad;c.save();c.globalAlpha=.18;c.fillStyle=fg;c.fillRect(bx,by,bw,bh);c.restore();
    c.fillRect(bx,by,bw,bh*g);
    txt('GR',bx+bw/2,by+bh/2-11*d,'center');txt((-(typeof gr==='number'?gr:0)).toFixed(1)+'dB',bx+bw/2,by+bh/2+1*d,'center');txt('IN > OUT',X(0)+2*d,4*d);
  }else if(name==='delay'){
    const bt=GR.fx.DLY_BEATS[dval(v[0],8)],fb=v[1]*.92,tot=4;grid(tot);let a=1,k=0;
    for(let t=0;t<=tot+1e-6&&a>.03&&k<48;t+=bt,k++){const x=X(t/tot),bw=Math.max(2*d,Math.min(7*d,(w-2*pad)*bt/tot*.5));c.save();c.globalAlpha=(on?1:.45)*(k%2?.55:1);c.fillRect(x-bw/2,Y(a),bw,Y(0)-Y(a));c.restore();a*=fb||0;if(!fb&&k>0)break}
    txt(GR.fx.DLY_L[dval(v[0],8)]+'  FB '+Math.round(v[1]*100)+'%',X(1),4*d,'right');txt('4 BEATS',X(0),4*d);
  }else if(name==='reverb'){
    const size=.4+v[0]*3.6,pre=0,tot=4,N=100;grid(4);
    const curve=(rt,dash)=>{c.save();if(dash)c.setLineDash([4*d,3*d]);c.beginPath();for(let i=0;i<=N;i++){const t=i/N*tot,a=t<pre?1:Math.exp(-(t-pre)*6.9/rt),x=X(i/N),y=Y(a);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore()};
    curve(size,false);curve(size*(1-v[1]*.75),true);
    txt('RT '+size.toFixed(1)+'s  DAMP '+Math.round(v[1]*100)+'%',X(1),4*d,'right');txt('4 s',X(0),4*d);
  }else if(name==='chorus'){
    const N=160;grid(4);const cyc=Math.min(8,Math.max(1,.05*Math.pow(80,v[0])*2)),dp=.15+v[1]*.8;
    [1,1.13].forEach((m,j)=>{c.save();c.globalAlpha*=j?.5:1;c.beginPath();for(let i=0;i<=N;i++){const t=i/N,y=Y(.5+.5*dp*Math.sin(2*Math.PI*cyc*m*t)),x=X(t);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore()});
    txt((.05*Math.pow(80,v[0])).toFixed(1)+'Hz  DEPTH '+Math.round(v[1]*100)+'%',X(1),4*d,'right');
  }
  c.globalAlpha=1;
}
R.fx=function(){
  const root=U.fxRoot&&U.fxRoot.isConnected?U.fxRoot:$('#s-fx');root.replaceChildren();const name=U.fxTab,defs=FXD.FXDEF[name],vals=P().fx[name],dflt=FXD.defaultFx()[name];
  const cv=h('canvas',{class:'fxviz'}),draw=()=>{if(cv.isConnected)fxViz(cv,name,vals)};U.fxDraw=draw;U.fxLive=name==='comp'?draw:null;const fxOff=P().fx.off||(P().fx.off={});requestAnimationFrame(draw);
  const tabs=h('div',{class:'fxtabs'},FXD.FX_ORDER.map(n=>h('button',{class:'chip'+(n===name?' on':'')+(fxOff[n]?' fxo':''),text:FXD.FX_TITLE[n],onclick:()=>{U.fxTab=n;vib(6);R.fx()}})));
  const knobs=h('div',{class:'kgrid'},defs.map((d,i)=>Knob({
    label:d.n,disc:d.d?d.d.length:0,get:()=>vals[i],set:v=>{vals[i]=v;fxChanged();dirty();draw()},
    fmt:v=>d.d?d.d[dval(v,d.d.length)]:d.f(v),reset:()=>{vals[i]=dflt[i];fxChanged();dirty();draw()}})));
  const hint={delay:'Ping-pong delay synced to the tempo. Use the DELAY knob on each track to send into it.',
    chorus:'Stereo chorus. Use the CHORUS knob on each track to send into it.',reverb:'Room reverb. Use the REVERB knob on each track to send into it.',
    filter:'Master filter. Left of center is a low pass, right of center is a high pass, center is off.',comp:'Compressor and limiter on the master. The limiter is always on.'}[name];
  root.append(h('div',{class:'plate'},h('h3',{text:'MASTER FX'}),tabs),h('div',{class:'plate'},h('h3',{},h('span',{text:FXD.FX_TITLE[name]}),h('span',{class:'fxbtns'},h('button',{class:'chip xs fxon'+(fxOff[name]?'':' on'),text:fxOff[name]?'OFF':'ON',onclick:()=>{fxOff[name]=fxOff[name]?0:1;if(!fxOff[name])delete fxOff[name];fxChanged();dirty();vib(8);R.fx()}}),h('button',{class:'chip xs',text:'RESET',onclick:()=>{for(let i=0;i<vals.length;i++)vals[i]=dflt[i];fxChanged();dirty();R.fx()}}))),cv,knobs,h('div',{class:'note',text:hint})));
};

