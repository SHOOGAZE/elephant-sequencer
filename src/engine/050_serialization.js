/* ---------- serialization ---------- */
GR.serialize=function(P){
  const o=JSON.parse(JSON.stringify(P,(k,v)=>v instanceof Float32Array?Array.from(v):v));
  o.ver=3;
  return o;
};
GR.revive=function(o){
  o.ver=3;
  o.tracks.forEach(t=>{t.params=Float32Array.from(t.params)});
  const fx=defaultFx();for(const k in fx)if(!o.fx[k]||o.fx[k].length!==fx[k].length)o.fx[k]=fx[k];
  if(o.scenes){['a','b'].forEach(k=>{if(o.scenes[k])o.scenes[k]=o.scenes[k].map(a=>Float32Array.from(a))})}
  if(!o.quant)o.quant={grid:2,depth:1};
  if(!o.side)o.side={src:0,rel:.4};o.tracks.forEach(t=>{if(t.sc==null)t.sc=0});
  if(o.vol==null)o.vol=1;
  if(!Array.isArray(o.chain))o.chain=[];o.chain=o.chain.filter(i=>i>=0&&i<8);o.song=!!o.song&&o.chain.length>0;if(o.morph)o.morph.on=false;
  o.nextPat=-1;
  return o;
};
