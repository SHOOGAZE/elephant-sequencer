/* ---------- FX engine: delay, chorus and reverb in one AudioWorklet (the DSP of BEHEMOTH) ----------
   Three send inputs (0 delay, 1 reverb, 2 chorus), one stereo output of wet signal only. */
const FX_WORKLET=`
function th(x){if(x>3)return 1;if(x<-3)return -1;return x*(27+x*x)/(27+9*x*x)}
class ElephantFx extends AudioWorkletProcessor{
  static get parameterDescriptors(){
    const d=(n,v,a,b)=>({name:n,defaultValue:v,minValue:a,maxValue:b,automationRate:'k-rate'});
    return [d('dlTime',320,20,1500),d('dlFb',.4,0,.95),d('dlMix',.5,0,1),d('chRate',.4,.05,6),d('chDepth',.5,0,1),d('chMix',.5,0,1),d('rvSize',.6,0,1),d('rvDamp',.4,0,1),d('rvMix',.5,0,1)];
  }
  constructor(){
    super();const sr=sampleRate,sc=sr/44100;this.sr=sr;
    this.cbL=new Float32Array(16384);this.cbR=new Float32Array(16384);this.cw=0;this.cph=0;
    const dlen=Math.ceil(sr*1.6)+8;this.dlen=dlen;
    this.dbL=new Float32Array(dlen);this.dbR=new Float32Array(dlen);this.dw=0;this.dt=320*sr/1000;this.dlpL=0;this.dlpR=0;
    const ct=[1116,1188,1277,1356,1422,1491,1557,1617],at=[556,441,341,225];
    this.rcL=[];this.rcR=[];this.rci=new Int32Array(16);this.rcs=new Float64Array(16);
    for(let i=0;i<8;i++){this.rcL.push(new Float32Array(Math.round(ct[i]*sc)));this.rcR.push(new Float32Array(Math.round((ct[i]+23)*sc)))}
    this.raL=[];this.raR=[];this.rai=new Int32Array(8);
    for(let i=0;i<4;i++){this.raL.push(new Float32Array(Math.round(at[i]*sc)));this.raR.push(new Float32Array(Math.round((at[i]+23)*sc)))}
  }
  process(inp,out,p){
    const o=out[0],oL=o[0],oR=o[1]||o[0],n=oL.length,sr=this.sr;
    const ch=(i,c)=>{const a=inp[i];return a&&a.length?(a[c]||a[0]):null};
    const dL=ch(0,0),dR=ch(0,1),rL=ch(1,0),rR=ch(1,1),cL=ch(2,0),cR=ch(2,1);
    const dlMix=p.dlMix[0],chMix=p.chMix[0],rvMix=p.rvMix[0];
    const chDepthS=(.002+p.chDepth[0]*.006)*sr,chBase=.012*sr,chInc=p.chRate[0]/sr;
    const dtT=p.dlTime[0]*sr/1000,fb=Math.min(.95,p.dlFb[0]),dlen=this.dlen;
    const rvFb=.7+.28*p.rvSize[0],rvDamp=.15+.6*p.rvDamp[0];
    const cbL=this.cbL,cbR=this.cbR,dbL=this.dbL,dbR=this.dbR,rcL=this.rcL,rcR=this.rcR,rci=this.rci,rcs=this.rcs,raL=this.raL,raR=this.raR,rai=this.rai;
    let cw=this.cw,cph=this.cph,dw=this.dw,dt=this.dt,dlpL=this.dlpL,dlpR=this.dlpR;
    for(let i=0;i<n;i++){
      const dn=(i&1)?1e-15:-1e-15;let yl=0,yr=0;
      /* chorus */
      {const xl=cL?cL[i]:0,xr=cR?cR[i]:xl;
        cbL[cw&16383]=xl;cbR[cw&16383]=xr;
        if(chMix>.002){
          const a=chBase+chDepthS*Math.sin(6.2831853*cph),b=chBase+chDepthS*Math.sin(6.2831853*cph+1.5708);
          const ra=cw-a,ia=Math.floor(ra),fa=ra-ia,rb=cw-b,ib=Math.floor(rb),fbb=rb-ib;
          const wl=cbL[ia&16383]+(cbL[(ia+1)&16383]-cbL[ia&16383])*fa,wr=cbR[ib&16383]+(cbR[(ib+1)&16383]-cbR[ib&16383])*fbb;
          yl+=wl*chMix*.8;yr+=wr*chMix*.8;
        }
        cw=(cw+1)&16383;cph+=chInc;if(cph>=1)cph-=1;}
      /* delay: ping-pong with a soft saturating feedback */
      {const xl=dL?dL[i]:0,xr=dR?dR[i]:xl;
        dt+=(dtT-dt)*.0008;let rd=dw-dt;if(rd<0)rd+=dlen;
        const ri=Math.floor(rd),fr=rd-ri,i1=ri+1>=dlen?0:ri+1;
        const wl=dbL[ri]+(dbL[i1]-dbL[ri])*fr,wr=dbR[ri]+(dbR[i1]-dbR[ri])*fr;
        dlpL+=(wl-dlpL)*.45;dlpR+=(wr-dlpR)*.45;
        dbL[dw]=th(xl+dlpR*fb)+dn;dbR[dw]=th(xr+dlpL*fb)+dn;
        dw++;if(dw>=dlen)dw=0;
        yl+=wl*dlMix;yr+=wr*dlMix;}
      /* reverb: eight combs and four allpasses per side */
      if(rvMix>.002){
        const xl=rL?rL[i]:0,xr=rR?rR[i]:xl,inp2=(xl+xr)*.015+dn;let ol=0,or=0;
        for(let j=0;j<8;j++){
          const bl=rcL[j],br=rcR[j],ix=rci[j],iy=rci[8+j],a=bl[ix],b=br[iy];
          rcs[j]=a*(1-rvDamp)+rcs[j]*rvDamp;bl[ix]=inp2+rcs[j]*rvFb;
          rcs[8+j]=b*(1-rvDamp)+rcs[8+j]*rvDamp;br[iy]=inp2+rcs[8+j]*rvFb;
          rci[j]=ix+1>=bl.length?0:ix+1;rci[8+j]=iy+1>=br.length?0:iy+1;
          ol+=a;or+=b;
        }
        for(let j=0;j<4;j++){
          const al=raL[j],ar=raR[j],ax=rai[j],ay=rai[4+j];
          let bo=al[ax],no=-ol+bo;al[ax]=ol+bo*.5;ol=no;
          bo=ar[ay];no=-or+bo;ar[ay]=or+bo*.5;or=no;
          rai[j]=ax+1>=al.length?0:ax+1;rai[4+j]=ay+1>=ar.length?0:ay+1;
        }
        yl+=ol*rvMix*3.2;yr+=or*rvMix*3.2;
      }
      oL[i]=yl;oR[i]=yr;
    }
    this.cw=cw;this.cph=cph;this.dw=dw;this.dt=dt;this.dlpL=dlpL;this.dlpR=dlpR;
    return true;
  }
}
registerProcessor('elefx',ElephantFx);
`;
/* the module is added once per context, the node is made after that and wired to the three send buses (G.d.in, G.r.in, G.c.in) */
GR.attachFx=async function(G){
  const ctx=G.ctx;if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined')return false;
  try{
    if(!ctx._elefx)ctx._elefx=ctx.audioWorklet.addModule('data:text/javascript;base64,'+btoa(FX_WORKLET));
    await ctx._elefx;
    const n=new AudioWorkletNode(ctx,'elefx',{numberOfInputs:3,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit'});
    G.d.in.connect(n,0,0);G.r.in.connect(n,0,1);G.c.in.connect(n,0,2);n.connect(G.sum);G.fxn=n;return true;
  }catch(e){return false}
};
