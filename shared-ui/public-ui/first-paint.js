(()=>{
 const root=document.documentElement;
 let dark=false;
 try {
   const stored=localStorage.getItem('uhz_header_theme');
   dark=stored==='dark'||(!stored&&localStorage.getItem('modo_oscuro_univershzrw')==='1');
 } catch {}
 root.dataset.uhzTheme=dark?'dark':'colorful';
 root.dataset.theme=dark?'dark':'light';
 root.style.colorScheme=dark?'dark':'light';
 root.style.backgroundColor=dark?'#1C1C1C':'#EFF8F5';
})();