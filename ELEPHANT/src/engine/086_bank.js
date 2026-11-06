/* ---------- sound bank: ~55 synthesised one-shots by role. Made on demand, so nothing is stored until a sound is picked ---------- */
const BW={saw:p=>2*p-1,sq:p=>p<.5?1:-1,sin:p=>Math.sin(6.2832*p),tri:p=>p<.5?4*p-1:3-4*p};
const bex=(t,k)=>Math.exp(-t*k);
function bseed(n){pseed=7;for(let i=0;i<n.length;i++)pseed=(pseed*31+n.charCodeAt(i))>>>0}
function bsvf(a,fc,q){let lo=0,bp=0;for(let i=0;i<a.length;i++){const c=typeof fc==='function'?fc(i/PSR):fc,f=2*Math.sin(Math.PI*Math.min(.22,c/PSR));const hi=a[i]-lo-q*bp;bp+=f*hi;lo+=f*bp;a[i]=lo}return a}
function bbp(a,fc,q){let lo=0,bp=0;for(let i=0;i<a.length;i++){const f=2*Math.sin(Math.PI*Math.min(.22,fc/PSR));const hi=a[i]-lo-q*bp;bp+=f*hi;lo+=f*bp;a[i]=bp}return a}
function bfade(a,at,rel){const n=a.length;for(let i=0;i<n;i++)a[i]*=Math.min(1,i/(at*PSR))*Math.min(1,(n-i)/(rel*PSR));return a}
function bosc(a,fr,wave,det,g,fm){fr.forEach(f=>det.forEach(dt=>{const fq=f*Math.pow(2,dt/12);let p=(prnd()+1)/2;for(let i=0;i<a.length;i++){p+=fq*(fm?fm(i/PSR):1)/PSR;p-=Math.floor(p);a[i]+=wave(p)*g}}));return a}
const DM7=[146.83,174.61,220,261.63];
/* drums */
const bkick=(f0,f1,dk,dec,cl,dr,len)=>()=>{let ph=0;const a=psnd(len||.5,t=>{ph+=6.2832*(f1+(f0-f1)*bex(t,dk))/PSR;return Math.sin(ph)*bex(t,dec)*(t<.002?t/.002:1)});const m=Math.min(a.length,PSR*.006|0);for(let i=0;i<m;i++)a[i]+=prnd()*cl*(1-i/m);return norm(psat(a,dr),.92)};
const bsnare=(f,td,nd,nl,hp)=>()=>{const a=psnd(.5,t=>Math.sin(6.2832*f*(1+.6*bex(t,40))*t)*bex(t,td)*.6+prnd()*bex(t,nd)*nl);php(a,hp);return norm(psat(a,1.5),.85)};
const bclap=(bursts,gap,tail,fc)=>()=>{const a=psnd(.1+tail*6,t=>{let e=0;for(let k=0;k<bursts;k++){const t0=k*gap;if(t>=t0)e=Math.max(e,bex(t-t0,k===bursts-1?1/tail:140))}return prnd()*e});return norm(plp(php(a,800),fc),.8)};
const bhat=(dec,hp,len,metal)=>()=>{const F=[205.3,304.4,369.6,522.7,540,800];const a=psnd(len,t=>{let s=prnd()*.6;if(metal)F.forEach(f=>{s+=(Math.sin(6.2832*f*3.1*t)>0?1:-1)*.12});return s*bex(t,dec)});php(a,hp);return norm(a,.7)};
const btom=(f,dec)=>()=>{let ph=0;const a=psnd(.6,t=>{ph+=6.2832*(f*(1+.45*bex(t,25)))/PSR;return Math.sin(ph)*bex(t,dec)});return norm(psat(a,1.3),.85)};
const bpitch=(f,dec,len,h2)=>()=>norm(psnd(len,t=>(Math.sin(6.2832*f*t)+(h2||0)*Math.sin(6.2832*f*2.76*t))*bex(t,dec)*Math.min(1,t/.001)),.8);
/* synth sounds, root D */
const bbass=(kind)=>()=>{const L=kind==='reese'?1.6:kind==='wob'?1.6:.9,a=psnd(L,()=>0);
  if(kind==='reese'){bosc(a,[73.42],BW.saw,[-.12,.12,0],.3);bsvf(a,t=>300+250*Math.sin(6.2832*.6*t),.5);bfade(a,.01,.2)}
  else if(kind==='wob'){bosc(a,[73.42],BW.saw,[-.06,.06],.4);bsvf(a,t=>180+700*(.5+.5*Math.sin(6.2832*3*t)),.3);bfade(a,.01,.2)}
  else if(kind==='pluck'){bosc(a,[73.42],BW.saw,[0,.05],.4);bsvf(a,t=>150+2400*bex(t,14),.45);for(let i=0;i<a.length;i++)a[i]*=bex(i/PSR,3.2)}
  else if(kind==='acid'){bosc(a,[73.42],BW.saw,[0],.6);bsvf(a,t=>200+3200*bex(t,9),.18);for(let i=0;i<a.length;i++)a[i]*=bex(i/PSR,2.2)}
  else if(kind==='fm'){let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*73.42/PSR;a[i]=Math.sin(p+2.4*bex(t,5)*Math.sin(p*2))*bex(t,2.4)}}
  else if(kind==='sq'){bosc(a,[73.42],BW.sq,[0],.5);bsvf(a,700,.7);for(let i=0;i<a.length;i++)a[i]*=bex(i/PSR,2.8)}
  else if(kind==='808'){let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*(36.71+30*bex(t,40))/PSR;a[i]=Math.sin(p)*bex(t,1.7)*Math.min(1,t/.003)}psat(a,2.2)}
  else{for(let i=0;i<a.length;i++){const t=i/PSR;a[i]=(Math.sin(6.2832*36.71*t)+.12*Math.sin(6.2832*73.42*t))*Math.min(1,t/.012)*bex(t,2.6)}}
  return norm(psat(a,kind==='reese'||kind==='wob'?1.8:1.3),.88)};
const bkey=(kind)=>()=>{const L={bell:2.2,dub:3,brass:.9,str:1.6,clav:.5,piano:2.4,rave:1.2,choir:1.5,dust:2.6}[kind]||1.4,a=psnd(L,()=>0);
  if(kind==='organ'){DM7.forEach(f=>{[1,2,3,4,6].forEach((h,k)=>{let p=0;const g=[.5,.4,.25,.2,.12][k];for(let i=0;i<a.length;i++){p+=6.2832*f*h/PSR;a[i]+=Math.sin(p)*g*.3}})});bfade(a,.01,.25)}
  else if(kind==='ep'){DM7.forEach(f=>{let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*f/PSR;a[i]+=(Math.sin(p+1.1*bex(t,6)*Math.sin(p*14))*.7+.3*Math.sin(p*2)*bex(t,5))*bex(t,2.2)*.35}})}
  else if(kind==='pluck'){bosc(a,DM7,BW.saw,[-.05,.05],.14);bsvf(a,t=>300+3200*bex(t,11),.5);for(let i=0;i<a.length;i++)a[i]*=bex(i/PSR,3.2)}
  else if(kind==='bell'){[587.33,880].forEach(f=>{let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*f/PSR;a[i]+=Math.sin(p+3*bex(t,4)*Math.sin(p*3.5))*bex(t,2.2)*.5}})}
  else if(kind==='sq'){bosc(a,DM7,BW.sq,[0,.07],.16);bsvf(a,t=>400+1800*bex(t,9),.6);for(let i=0;i<a.length;i++)a[i]*=bex(i/PSR,3.5)}
  else if(kind==='m7'){bosc(a,[146.83,174.61,220,261.63,329.63],BW.saw,[-.09,0,.09],.1);bsvf(a,t=>500+2500*bex(t,5),.6);for(let i=0;i<a.length;i++)a[i]*=Math.min(1,i/PSR/.003)*bex(i/PSR,2.2)}
  else if(kind==='dub'){bosc(a,[146.83,174.61,220,261.63,329.63,392],BW.saw,[-.1,0,.1],.07);bsvf(a,t=>260+1500*bex(t,2.4),.8);for(let i=0;i<a.length;i++)a[i]*=Math.min(1,i/PSR/.006)*bex(i/PSR,1.5)}
  else if(kind==='brass'){bosc(a,[146.83,220,293.66],BW.saw,[-.06,.06],.2);bsvf(a,t=>350+3800*Math.min(1,t/.07)*bex(t,5),.35);for(let i=0;i<a.length;i++){const t=i/PSR;a[i]*=Math.min(1,t/.02)*bex(t,4.5)}}
  else if(kind==='str'){bosc(a,[146.83,174.61,220,261.63],BW.saw,[-.16,-.05,.05,.16],.08);bsvf(a,t=>1200+900*bex(t,3),.2);for(let i=0;i<a.length;i++){const t=i/PSR;a[i]*=Math.min(1,t/.04)*bex(t,2.6)}}
  else if(kind==='clav'){bosc(a,[146.83,220,261.63],BW.sq,[0],.2);bsvf(a,t=>900+4200*bex(t,24),.5);for(let i=0;i<a.length;i++)a[i]*=bex(i/PSR,11)}
  else if(kind==='piano'){DM7.forEach(f=>{let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*f/PSR;let v=0;for(let h=1;h<=6;h++)v+=Math.sin(p*h)*bex(t,2.2+h*1.7)/h;a[i]+=v*.3*Math.min(1,t/.002)}})}
  else if(kind==='rave'){[220,277.18,329.63].forEach(f=>{[-.2,0,.2].forEach(dt=>{let p=Math.random()*6.28;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*f*Math.pow(2,dt/12+.25*bex(t,14))/PSR;a[i]+=(2*((p/6.2832)%1)-1)*.08*bex(t,3.5)}})});bsvf(a,t=>800+3500*bex(t,6),.3)}
  else if(kind==='choir'){bosc(a,[146.83,220,293.66],BW.saw,[-.08,.08],.2);bbp(a,700,.9);const b=Float32Array.from(a);bbp(b,1200,.9);for(let i=0;i<a.length;i++){const t=i/PSR;a[i]=(a[i]*1.4+b[i]*.9)*Math.min(1,t/.08)*bex(t,2.6)}}
  else if(kind==='dust'){DM7.forEach(f=>{let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*f*(1+.004*Math.sin(6.2832*5*t))/PSR;a[i]+=Math.sin(p)*.22*bex(t,1.4)+.08*Math.sin(p*2)*bex(t,2.5)}});plp(a,2600);for(let i=0;i<a.length;i++)a[i]+=prnd()*.012*bex(i/PSR,1.2)}
  else{[146.83,220,293.66,349.23].forEach(f=>{let p=0;for(let i=0;i<a.length;i++){const t=i/PSR;p+=6.2832*f/PSR;a[i]+=Math.sin(p)*(bex(t,1.6)*.5+.2*Math.sin(p*3))*.3}});bfade(a,.003,.3)}
  return norm(a,.82)};
const bpad=(kind)=>()=>{const L=kind==='drone'?5:kind==='swell'?4:3.6,a=psnd(L,()=>0);
  if(kind==='warm'){bosc(a,DM7,BW.saw,[-.1,0,.1],.07);bsvf(a,900,.9);bfade(a,.7,1.2)}
  else if(kind==='dark'){bosc(a,[73.42,110,146.83],BW.saw,[-.08,.08],.1);bsvf(a,420,.8);bfade(a,.9,1.4)}
  else if(kind==='strings'){bosc(a,DM7,BW.saw,[-.15,-.05,.05,.15],.05);bsvf(a,2200,.9);bfade(a,.5,1)}
  else if(kind==='choir'){bosc(a,[146.83,220,293.66],BW.saw,[-.06,.06],.1);const b=Float32Array.from(a);bbp(a,700,.18);bbp(b,1150,.18);for(let i=0;i<a.length;i++)a[i]=a[i]+b[i]*.6;bfade(a,.5,1.1)}
  else if(kind==='glass'){[1,2,3,5,7].forEach((h,k)=>[1,1.004].forEach(d=>{let p=0;for(let i=0;i<a.length;i++){p+=6.2832*293.66*h*d/PSR;a[i]+=Math.sin(p)*.18/(k+1)}}));bfade(a,.4,1.2)}
  else if(kind==='drone'){[36.71,55,73.42,110].forEach(f=>[1,1.003].forEach(d=>{let p=0;for(let i=0;i<a.length;i++){p+=6.2832*f*d/PSR;a[i]+=Math.sin(p)*.2}}));bfade(a,1.2,1.5)}
  else if(kind==='air'){for(let i=0;i<a.length;i++)a[i]=prnd();bbp(a,1500,.12);const b=psnd(L,t=>Math.sin(6.2832*587.33*t)*.15+Math.sin(6.2832*880*t)*.1);for(let i=0;i<a.length;i++)a[i]=a[i]*3+b[i];bfade(a,.9,1.3)}
  else{bosc(a,DM7,BW.saw,[-.1,.1],.08);bsvf(a,t=>200+2400*Math.min(1,t/3),.8);bfade(a,2.4,.5)}
  return norm(a,.7)};
/* fx */
const bfx=(kind)=>()=>{let a;
  if(kind==='riser'){a=psnd(2.5,t=>prnd());bsvf(a,t=>200+7000*Math.pow(t/2.5,2),.35);for(let i=0;i<a.length;i++)a[i]*=Math.pow(i/a.length,1.5)}
  else if(kind==='down'){a=psnd(2,t=>prnd());bsvf(a,t=>7000*Math.exp(-t*2.2)+150,.35);for(let i=0;i<a.length;i++)a[i]*=Math.pow(1-i/a.length,1.4)}
  else if(kind==='impact'){let p=0;a=psnd(2,t=>{p+=6.2832*(34+90*bex(t,12))/PSR;return Math.sin(p)*bex(t,2.2)+prnd()*bex(t,9)*.5});plp(a,1800);psat(a,2)}
  else if(kind==='zap'){let p=0;a=psnd(.35,t=>{p+=6.2832*(80+3000*bex(t,18))/PSR;return Math.sin(p)*bex(t,9)})}
  else if(kind==='laser'){let p=0;a=psnd(.5,t=>{p+=6.2832*(300+2800*t*t*8)/PSR;return (Math.sin(p)>0?1:-1)*.4*bex(t,5)});plp(a,5000)}
  else if(kind==='vinyl'){a=psnd(2,t=>{let s=prnd()*.04;if(Math.random()<.0008)s+=prnd()*.8;return s});php(a,300);plp(a,6000)}
  else if(kind==='noise'){a=psnd(.25,t=>prnd()*bex(t,16));plp(a,9000)}
  else{a=psnd(3,t=>prnd());plp(a,90);plp(a,110);bfade(a,.5,.8);for(let i=0;i<a.length;i++)a[i]*=1+.5*Math.sin(6.2832*.9*i/PSR)}
  return norm(a,.8)};
const BANK=[
 ['KICK',[['SOFT',bkick(120,48,30,7,.1,1.2)],['PUNCH',bkick(150,52,38,8,.3,2)],['808',bkick(90,40,18,2.8,.05,1.4,1.2)],['DEEP',bkick(80,38,22,4.5,.1,1.3,.7)],['TIGHT',bkick(170,60,55,14,.35,1.8,.25)],['DIST',bkick(140,45,30,5.5,.4,5)],['SUB KICK',bkick(60,34,12,3,0,1.2,.9)],['CLICK',bkick(200,70,70,16,.7,1.5,.2)]]],
 ['SNARE',[['SNARE 1',bsnare(190,28,18,.9,300)],['TIGHT SN',bsnare(220,45,32,.7,400)],['FAT SN',bsnare(160,20,12,1,200)],['LOFI SN',()=>plp(bsnare(180,30,22,1,500)(),4500)],['SNAP',bsnare(330,70,40,1,800)],['CLAP 2',bclap(4,.012,.05,4200)],['CLAP LONG',bclap(3,.014,.16,3000)],['RIM 2',bpitch(1400,70,.15,.6)]]],
 ['HAT',[['HAT CL 1',bhat(95,6500,.09)],['HAT CL 2',bhat(60,4500,.12,true)],['HAT TICK',bhat(170,8000,.05)],['HAT OP 1',bhat(13,5500,.4)],['HAT OP 2',bhat(7,4000,.7,true)],['SHAKER',()=>{const a=psnd(.18,t=>prnd()*Math.min(1,t/.02)*bex(t,22));php(a,5000);return norm(a,.6)}],['RIDE',bhat(2.5,5000,1.6,true)],['TAMBO',()=>{const a=psnd(.3,t=>prnd()*bex(t,16));bbp(a,6500,.4);return norm(a,.7)}]]],
 ['PERC',[['TOM LO',btom(95,6)],['TOM HI',btom(190,9)],['CONGA',btom(330,12)],['BONGO',btom(450,18)],['COWBELL',()=>norm(psnd(.5,t=>((Math.sin(6.2832*562*t)>0?1:-1)+(Math.sin(6.2832*845*t)>0?1:-1))*bex(t,9)*.5),.7)],['CLAVE',bpitch(2400,60,.12,.5)],['WOOD',bpitch(820,45,.2,1)],['TRIANGLE',bpitch(3000,4,1.2,.5)]]],
 ['BASS',[['SUB SOFT',bbass('sub')],['SUB 808',bbass('808')],['REESE',bbass('reese')],['PLUCK BS',bbass('pluck')],['ACID',bbass('acid')],['FM BASS',bbass('fm')],['SQ BASS',bbass('sq')],['WOBBLE',bbass('wob')]]],
 ['CHORD',[['ORGAN',bkey('organ')],['EP KEYS',bkey('ep')],['PLUCK CH',bkey('pluck')],['BELL',bkey('bell')],['SQ STAB',bkey('sq')],['M7 STAB',bkey('m7')],['VIBES',bkey('vib')],['DUB M9',bkey('dub')],['BRASS',bkey('brass')],['STRINGS ST',bkey('str')],['CLAV',bkey('clav')],['PIANO',bkey('piano')],['RAVE',bkey('rave')],['CHOIR ST',bkey('choir')],['DUST KEYS',bkey('dust')]]],
 ['PAD',[['WARM',bpad('warm')],['DARK',bpad('dark')],['STRINGS',bpad('strings')],['CHOIR',bpad('choir')],['GLASS',bpad('glass')],['DRONE',bpad('drone')],['AIR',bpad('air')],['SWELL',bpad('swell')]]],
 ['FX',[['RISER',bfx('riser')],['DOWN',bfx('down')],['IMPACT',bfx('impact')],['ZAP',bfx('zap')],['LASER',bfx('laser')],['VINYL',bfx('vinyl')],['NOISE HIT',bfx('noise')],['RUMBLE',bfx('rumble')]]]
];
/* a bank sound goes into the sample pool once; picking it again reuses the slot */
GR.bank=BANK.map(r=>({role:r[0],names:r[1].map(x=>x[0])}));
GR.bankFind=name=>{for(const r of BANK)for(const x of r[1])if(x[0]===name)return x[1];return null};
GR.bankSlot=name=>{
  const key='bank:'+name;let i=Samples.slots.findIndex(x=>x&&x.key===key);if(i>=0)return i;
  const f=GR.bankFind(name);if(!f)return -1;bseed(name);
  i=Samples.add(name,[f()],PSR,true);if(i>=0)Samples.slots[i].key=key;return i};
