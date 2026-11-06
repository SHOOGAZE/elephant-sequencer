"""Run the regression scripts in test/. Needs: pip install playwright && playwright install chromium.
Build first: python3 gen_i18n.py && python3 build.py"""
import subprocess,sys,os,glob
T=os.path.dirname(os.path.abspath(__file__));bad=0
for f in sorted(glob.glob(T+'/t*.py')):
    n=os.path.basename(f)
    try:r=subprocess.run([sys.executable,f],capture_output=True,text=True,timeout=240,cwd=T)
    except subprocess.TimeoutExpired:print('TIMEOUT',n);bad+=1;continue
    fail=r.returncode!=0
    print('FAIL' if fail else 'ok  ',n)
    if fail:print((r.stdout+r.stderr)[-900:])
    bad+=fail
sys.exit(1 if bad else 0)
