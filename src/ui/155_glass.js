/* black-and-white glass over the OLED and the sample wave: gradients only, the highlight follows the finger */
(function(){
  function aim(g){
    const mv=e=>{const r=g.getBoundingClientRect();if(!r.width)return;
      g.style.setProperty('--gx',Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)).toFixed(0)+'%');
      g.style.setProperty('--gy',Math.max(-10,Math.min(60,(e.clientY-r.top)/r.height*60-10)).toFixed(0)+'%')};
    g.addEventListener('pointermove',mv,{passive:true});g.addEventListener('pointerdown',mv,{passive:true});
  }
  function scan(){
    document.querySelectorAll('canvas.wave').forEach(c=>{
      if(!c.parentNode||c.parentNode.classList.contains('glass'))return;
      const g=document.createElement('div');g.className='glass';c.parentNode.insertBefore(g,c);g.appendChild(c);aim(g)});
    document.querySelectorAll('.oled:not([data-gl])').forEach(o=>{o.dataset.gl=1;o.classList.add('glass','glass-flat');aim(o)});
  }
  scan();
  if(window.MutationObserver)new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();
