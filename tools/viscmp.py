import sys,os
from PIL import Image,ImageChops
a,b=sys.argv[1],sys.argv[2];bad=0
for f in sorted(os.listdir(a)):
    x=Image.open(a+'/'+f).convert('RGB');y=Image.open(b+'/'+f).convert('RGB')
    if x.size!=y.size:print('SIZE',f);bad+=1;continue
    d=ImageChops.difference(x,y);bb=d.getbbox()
    if bb:
        px=d.get_flattened_data() if hasattr(d,'get_flattened_data') else d.getdata()
        big=sum(1 for p in px if max(p)>6)
        if big:bad+=1;print('DIFF',f,bb,'pixels>6:',big)
print('files',len(os.listdir(a)),'real differences',bad)
