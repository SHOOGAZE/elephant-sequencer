/* ---------- sequencer ---------- */
function condPass(c,cyc,fill){
  if(c===0)return true;
  if(c<=2)return cyc%2===c-1;
  if(c<=6)return cyc%4===c-3;
  if(c<=11)return Math.random()<[.1,.25,.5,.75,.9][c-7];
  if(c===12)return cyc===0;
  if(c===13)return cyc>0;
  if(c===14)return !!fill;
  return !fill;
}
GR.condPass=condPass;
/* sidechain: tracks with tr.sc>0 duck whenever the source track plays a step */
GR.duck=function(ctx,G,P,t,vel){
  const sd=P.side;if(!sd)return;const rel=.06+sd.rel*.5;
  P.tracks.forEach((tr,j)=>{
    if(!(tr.sc>0)||j===sd.src)return;
    const g=G.track(j).dk.gain,fl=1-Math.min(1,tr.sc)*.94*Math.min(1,.5+vel);
    g.setTargetAtTime(fl,Math.max(0,t-.004),.004);g.setTargetAtTime(1,t+.02,rel/3);
  });
};
GR.stepEvents=function(ctx,G,P,g,tBase,stepDur,fill,only,applyPat){
  const pat=P.patterns[P.pat];
  if(P.side&&trackAudible(P,P.side.src)){
    const tr0=P.tracks[P.side.src],st0=stepAt(pat[P.side.src],tr0.len,g%tr0.len);
    if(st0.on&&condPass(st0.cond,Math.floor(g/tr0.len),fill)){
      let t0=tBase+((g&1)?P.swing*stepDur:0)+st0.micro/24*stepDur;if(t0<ctx.currentTime)t0=ctx.currentTime;
      GR.duck(ctx,G,P,t0,st0.vel==null?.8:st0.vel);
    }
  }
  for(let ti=0;ti<NT;ti++){
    if(only!=null&&only!==ti)continue;
    if(!trackAudible(P,ti))continue;
    const tr=P.tracks[ti],pos=g%tr.len,cyc=Math.floor(g/tr.len),st=stepAt(pat[ti],tr.len,pos);
    if(!st.on||!condPass(st.cond,cyc,fill))continue;
    const sw=(g&1)?P.swing*stepDur:0;
    let t=tBase+sw+st.micro/24*stepDur;
    if(t<ctx.currentTime)t=ctx.currentTime;
    const n=Math.max(1,Math.min(8,st.rtg|0||1));
    GR.trigger(ctx,G,P,ti,st,t,stepDur/n);
    for(let k=1;k<n;k++)GR.trigger(ctx,G,P,ti,Object.assign({},st,{vel:Math.max(.05,(st.vel==null?.8:st.vel)*Math.pow(.82,k))}),t+k*stepDur/n,stepDur/n);
  }
};

GR.renderOffline=async function(opts){
  opts=opts||{};const P=GR.proj,sr=44100,bars=opts.bars||1,sd=60/P.bpm/4,steps=bars*16,tail=opts.tail==null?2:opts.tail;
  const ctx=new OfflineAudioContext(2,Math.ceil((steps*sd+tail)*sr),sr);
  const G=GR.buildGraph(ctx);await GR.attachFx(G);GR.applyFx(G,P,0);
  const P2=P;
  for(let g=0;g<steps;g++)GR.stepEvents(ctx,G,P2,g,g*sd,sd,false,opts.only);
  const buf=await ctx.startRendering();
  return buf;
};
GR.bufToChannels=function(buf){const r=[];for(let c=0;c<buf.numberOfChannels;c++)r.push(buf.getChannelData(c).slice());return r};

