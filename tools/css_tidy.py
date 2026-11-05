"""Drops declarations that a later rule with the exact same selector (in the same @media scope) overrides.
Cascade-safe: the later declaration always wins on the same elements. Usage: python3 tools/css_tidy.py src/style.css [--write]"""
import re,sys
def split_top(s,ch):
    out=[];d=0;q=None;cur='';i=0
    while i<len(s):
        c=s[i]
        if q:
            cur+=c
            if c=='\\':cur+=s[i+1];i+=1
            elif c==q:q=None
        elif c in '"\'':q=c;cur+=c
        elif c=='(':d+=1;cur+=c
        elif c==')':d-=1;cur+=c
        elif c==ch and d==0:out.append(cur);cur=''
        else:cur+=c
        i+=1
    if cur.strip():out.append(cur)
    return out
def parse(s):
    nodes=[];i=0;n=len(s)
    while i<n:
        if s[i].isspace():i+=1;continue
        if s.startswith('/*',i):
            j=s.index('*/',i)+2;nodes.append(('c',s[i:j]));i=j;continue
        # prelude up to { or ;
        j=i;d=0;q=None
        while j<n:
            c=s[j]
            if q:
                if c=='\\':j+=1
                elif c==q:q=None
            elif c in '"\'':q=c
            elif c=='(':d+=1
            elif c==')':d-=1
            elif d==0 and c in '{;':break
            j+=1
        pre=s[i:j].strip()
        if j>=n or s[j]==';':nodes.append(('raw',pre+';'));i=j+1;continue
        k=j+1;d=1;q=None
        while k<n and d:
            c=s[k]
            if q:
                if c=='\\':k+=1
                elif c==q:q=None
            elif c in '"\'':q=c
            elif s.startswith('/*',k):k=s.index('*/',k)+1
            elif c=='{':d+=1
            elif c=='}':d-=1
            k+=1
        body=s[j+1:k-1];i=k
        if pre.startswith('@media') or pre.startswith('@supports'):nodes.append(('at',pre,parse(body)))
        elif pre.startswith('@'):nodes.append(('raw',pre+'{'+body+'}'))
        else:
            decls=[]
            for dcl in split_top(re.sub(r'/\*.*?\*/','',body,flags=re.S),';'):
                if ':' in dcl:
                    p,v=dcl.split(':',1);decls.append([p.strip(),v.strip()])
            nodes.append(('r',re.sub(r'\s+',' ',pre),decls))
    return nodes
def tidy(nodes):
    last={}
    for n in nodes:
        if n[0]=='r':
            for p,v in n[2]:last[(n[1],p)]=(v.endswith('!important'))
    # a property is dropped from an earlier rule if a later same-selector rule sets it and the earlier is not more important
    seen={}
    removed=0
    for n in reversed(nodes):
        if n[0]=='r':
            keep=[]
            for p,v in reversed(n[2]):
                key=(n[1],p)
                if key in seen and not (v.endswith('!important') and not seen[key]):removed+=1;continue
                keep.append([p,v]);seen[key]=seen.get(key,False) or v.endswith('!important')
            n[2][:]=list(reversed(keep))
        elif n[0]=='at':removed+=tidy(n[2])
    return removed
def emit(nodes,ind=''):
    out=[]
    for n in nodes:
        if n[0]=='c':
            t=re.sub(r'^/\*\s*v\d+[a-z]?:\s*','/* ',n[1]);out.append(ind+t)
        elif n[0]=='raw':out.append(ind+n[1])
        elif n[0]=='at':out.append(ind+n[1]+'{\n'+emit(n[2],ind+'  ')+'\n'+ind+'}')
        elif n[2]:out.append(ind+n[1]+'{'+';'.join(p+':'+v for p,v in n[2])+'}')
    return '\n'.join(out)
if __name__=='__main__':
    src=open(sys.argv[1]).read();nodes=parse(src);r=tidy(nodes);o=emit(nodes)+'\n'
    print('declarations dropped',r,'bytes',len(src),'->',len(o))
    if '--write' in sys.argv:open(sys.argv[1],'w').write(o)

def dead_selectors(css_path,js_paths):
    """selector parts naming a class or id that never appears in the JS / HTML sources (substring check, so dynamic names stay)"""
    src=''.join(open(p).read() for p in js_paths)
    nodes=parse(open(css_path).read());dead=[]
    def walk(ns):
        for n in ns:
            if n[0]=='at':walk(n[2])
            elif n[0]=='r':
                for part in split_top(n[1],','):
                    toks=re.findall(r'[.#]([A-Za-z_][\w-]*)',part)
                    miss=[t for t in toks if t not in src]
                    if miss:dead.append((part.strip(),miss))
    walk(nodes);return dead
