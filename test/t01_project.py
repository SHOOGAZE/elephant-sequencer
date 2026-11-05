"""Project model: 16 sampler pads, no synth leftovers, save/load round trip."""
from common import *
r=Run()
P="GR.proj"
check('16 tracks',r.ev(P+".tracks.length")==16)
check('only sampler engines',r.ev("GR.proj.tracks.every(t=>t.engine==='SAMP')"))
check('engine list',r.ev("JSON.stringify(GR.defs.ENGINES)")=='["SAMP"]')
check('no factory sounds',r.ev("GR.Samples.slots.length")==0)
check('pads start empty',r.ev("GR.proj.tracks.every(t=>t.slot<0)"))
check('param length',r.ev("GR.proj.tracks.every(t=>t.params.length===GR.defs.NPAR)"))
check('no demo steps',r.ev("GR.proj.patterns.every(pt=>pt.every(row=>row.every(s=>!s.on)))"))
rt=r.ev("""()=>{const a=JSON.stringify(GR.serialize(GR.proj)),b=JSON.stringify(GR.serialize(GR.revive(JSON.parse(a))));return a===b}""")
check('serialize round trip',rt)
fresh=r.ev("""()=>{const p=GR.defaultProject();return p.patterns.every(pt=>pt.every(row=>row.every(s=>!s.on)))&&p.tracks.length===16}""")
check('default project is silent',fresh)
r.close();done()
