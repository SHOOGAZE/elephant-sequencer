/* ---------- WAV / ZIP ---------- */
GR.encodeWav=function(chs,rate){
  const n=chs[0].length,nc=chs.length,out=new DataView(new ArrayBuffer(44+n*nc*2));
  const w=(o,s)=>{for(let i=0;i<s.length;i++)out.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');out.setUint32(4,36+n*nc*2,true);w(8,'WAVE');w(12,'fmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,nc,true);
  out.setUint32(24,rate,true);out.setUint32(28,rate*nc*2,true);out.setUint16(32,nc*2,true);out.setUint16(34,16,true);w(36,'data');out.setUint32(40,n*nc*2,true);
  let o=44;for(let i=0;i<n;i++)for(let c=0;c<nc;c++){const s=clamp(chs[c][i],-1,1);out.setInt16(o,s<0?s*32768:s*32767,true);o+=2}
  return new Uint8Array(out.buffer);
};
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
GR.zipMulti=function(files){
  const enc=new TextEncoder(),parts=[],cds=[];let off=0;
  files.forEach(f=>{
    const nb=enc.encode(f.name),n=f.data.length,crc=crc32(f.data);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(12,0x21,true);lh.setUint32(14,crc,true);lh.setUint32(18,n,true);lh.setUint32(22,n,true);lh.setUint16(26,nb.length,true);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(14,0x21,true);ch.setUint32(16,crc,true);ch.setUint32(20,n,true);ch.setUint32(24,n,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);
    parts.push(new Uint8Array(lh.buffer),nb,f.data);cds.push(new Uint8Array(ch.buffer),nb);
    off+=30+nb.length+n;
  });
  const cdSize=cds.reduce((a,p)=>a+p.length,0),end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,off,true);
  const all=parts.concat(cds,[new Uint8Array(end.buffer)]),total=all.reduce((a,p)=>a+p.length,0),res=new Uint8Array(total);
  let o=0;all.forEach(p=>{res.set(p,o);o+=p.length});return res;
};
GR.zipStore=(name,data)=>GR.zipMulti([{name,data}]);
/* standard MIDI file of the current pattern, one track per groove track */
GR.midiFile=function(P,bars){
  const PPQ=96,ST=PPQ/4,bytes=[];
  const w32=v=>[v>>>24&255,v>>>16&255,v>>>8&255,v&255],w16=v=>[v>>8&255,v&255];
  const vlq=v=>{const o=[v&127];while((v>>=7)>0)o.unshift((v&127)|128);return o};
  const chunk=(id,d)=>[...id].map(c=>c.charCodeAt(0)).concat(w32(d.length),d);
  const trks=[];
  const mpq=Math.round(60e6/P.bpm);
  trks.push(chunk('MTrk',[0,255,81,3,mpq>>16&255,mpq>>8&255,mpq&255,0,255,3,P.name.length?Math.min(P.name.length,60):1,...(P.name||'g').slice(0,60).split('').map(c=>c.charCodeAt(0)&127),0,255,47,0]));
  const pat=P.patterns[P.pat];
  for(let ti=0;ti<NT;ti++){
    const tr=P.tracks[ti],ev=[],samp=true;
    for(let g=0;g<bars*16;g++){
      const pos=g%tr.len,st=stepAt(pat[ti],tr.len,pos);if(!st.on||!condPass(st.cond,Math.floor(g/tr.len),false))continue;
      const sw=(g&1)?P.swing*ST*4:0,t=Math.max(0,Math.round(g*ST+sw+st.micro/24*ST)),note=clamp((samp?60:48)+st.note,0,127),vel=Math.max(1,Math.round(clamp(st.vel,0,1)*127)),len=Math.max(2,Math.round(st.len*ST*.9));
      ev.push([t,1,note,vel]);ev.push([t+len,0,note,0]);
    }
    if(!ev.length)continue;
    ev.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const nm=('T'+(ti+1)+' '+tr.engine).split('').map(c=>c.charCodeAt(0));
    const d=[0,255,3,nm.length,...nm];let last=0;
    ev.forEach(x=>{d.push(...vlq(x[0]-last),(x[1]?0x90:0x80)|(ti&15),x[2],x[3]);last=x[0]});
    d.push(0,255,47,0);trks.push(chunk('MTrk',d));
  }
  const head=chunk('MThd',[...w16(1),...w16(trks.length),...w16(PPQ)]);
  return Uint8Array.from(head.concat(...trks));
};

