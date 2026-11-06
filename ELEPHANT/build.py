import re
import os
d=os.path.dirname(os.path.abspath(__file__))+'/'
import base64
def icon(n):return 'data:image/png;base64,'+base64.b64encode(open(d+'icons/icon-light-%d.png'%n,'rb').read()).decode()
def parts(folder):
    fs=sorted(f for f in os.listdir(d+'src/'+folder) if f.endswith('.js'))
    return ''.join(open(d+'src/'+folder+'/'+f).read() for f in fs)
# engine and UI are written as ordered parts (src/engine/NNN_name.js, src/ui/NNN_name.js) that share one scope, so each part is wrapped here
eng="'use strict';\n/* ELEPHANT engine: data model, voices, FX graph, sequencer, offline render, storage */\n(function(){\n"+parts('engine')+"})();\n"
ui="'use strict';\n/* ELEPHANT UI */\n(function(){\n"+parts('ui')+"})();\n"
css=open(d+'src/style.css').read();i18n=open(d+'src/i18n.js').read()
ui=ui.replace('__ICON192__',icon(192)).replace('__ICON512__',icon(512)).replace('__ICON180__',icon(180))
body=f'''<title>ELEPHANT</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600;700&family=DM+Mono:wght@400;500&display=swap">
<style>
{css}
</style>
<div id="app"></div>
<script>
{eng}
{i18n}
{ui}
</script>
'''
idx='<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#2a2c2e">\n<link rel="icon" type="image/png" href="'+icon(32)+'"><link rel="apple-touch-icon" href="'+icon(180)+'">\n'+body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','').replace('<div id="app">','</head><body><div id="app">',1)+'</body></html>\n'
open(d+'index.html','w').write(idx)
open(d+'test/page.html','w').write('<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html{color-scheme:light}body{margin:0}</style></head><body>'+body+'</body></html>')
print(len(body))
