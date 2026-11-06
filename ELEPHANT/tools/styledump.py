"""Computed-style sweep for CSS refactors. python3 tools/styledump.py OUT.json, then python3 tools/styledump.py --diff A.json B.json"""
import os,sys,json
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
PROPS="display position top left right bottom width height margin padding border-radius border-top-width color background-color background-image box-shadow font-size font-weight letter-spacing line-height opacity transform overflow flex-direction flex-grow flex-shrink gap grid-template-columns align-items justify-content z-index visibility text-align white-space min-width max-width min-height max-height filter".split()
JS="""(P)=>{const o=[];document.querySelectorAll('#app *,body>*').forEach((e,i)=>{if(e.closest('.oled')||(i===0&&!e.className))return;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);if(cs.display==='none'){o.push(i+':'+e.tagName+'.'+e.className+' none');return}
 o.push(i+':'+e.tagName+'.'+(e.className&&e.className.baseVal!==undefined?'':e.className)+' '+[r.x,r.y,r.width,r.height].map(Math.round).join(',')+' '+P.map(p=>cs.getPropertyValue(p)).join('|'))});return o}"""
def run(out):
    from playwright.sync_api import sync_playwright
    res={}
    sizes=[(390,844),(844,390),(667,375),(768,1024),(1024,768),(1440,900)]
    with sync_playwright() as p:
        b=p.chromium.launch()
        for th in ['dark','light']:
            for w,h in sizes:
                c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<900);pg=c.new_page()
                pg.add_init_script("sessionStorage.setItem('elephant-boot','1');localStorage.setItem('elephant-tour','1');localStorage.setItem('elephant-coach','all');localStorage.setItem('elephant-seqv','track');localStorage.setItem('elephant-simple','0');localStorage.setItem('elephant-theme','%s')"%th)
                pg.goto('file://'+D+'index.html');pg.wait_for_timeout(300)
                pg.add_style_tag(content='*,*::before,*::after{transition:none!important;animation:none!important}')
                pg.evaluate("document.documentElement.dataset.theme='%s';GR.loadDemo(GR.proj);GRUI.U.tr=5"%th)
                for kb in [False,True]:
                    for t in ['play','seq','sound','fx','mix','smpl','sys']:
                        if kb and t not in('play','sound'):continue
                        pg.evaluate("GRUI.U.kb=%s;GRUI.go('%s')"%('true' if kb else 'false',t));pg.wait_for_timeout(260)
                        res['%s_%dx%d_%s%s'%(th,w,h,t,'_kb' if kb else '')]=pg.evaluate(JS,PROPS)
                c.close()
    json.dump(res,open(out,'w'))
def diff(a,b):
    A=json.load(open(a));B=json.load(open(b));n=0
    for k in A:
        if A[k]!=B.get(k):
            n+=1;x,y=A[k],B.get(k) or []
            d=[(i,u,v) for i,(u,v) in enumerate(zip(x,y)) if u!=v][:2]
            print('DIFF',k,len(x),len(y),d)
    print('different',n,'of',len(A))
if sys.argv[1]=='--diff':diff(sys.argv[2],sys.argv[3])
else:run(sys.argv[1])
