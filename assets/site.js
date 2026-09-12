/* ---------- BOOT SEQUENCE ---------- */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const boot = document.getElementById('boot');
  const host = document.getElementById('bootLines');
  const lines = [
    "<span class='ok'>[ OK ]</span> initialisation des modules noyau",
    "<span class='ok'>[ OK ]</span> montage de /dev/evidence",
    "<span class='ok'>[ OK ]</span> chargement de la boîte à outils forensic",
    "<span class='run'>[ .. ]</span> établissement du canal sécurisé … <span class='ok'>AES-256</span>",
    "<span class='ok'>[ OK ]</span> déchiffrement du profil :: J. FAFCHAMPS",
  ];
  const SEEN='fcb_boot_seen';
  function finish(){ try{sessionStorage.setItem(SEEN,'1');}catch(e){} boot.classList.add('done'); document.body.style.overflow=''; }
  let seen=false; try{ seen=!!sessionStorage.getItem(SEEN); }catch(e){}
  if(reduce || seen){ finish(); return; }
  document.body.style.overflow='hidden';
  lines.forEach((l,i)=>{
    const d=document.createElement('div');
    d.className='boot__line'; d.style.animationDelay=(i*0.26)+'s'; d.innerHTML=l;
    host.appendChild(d);
  });
  const g=document.createElement('div');
  g.className='boot__line grant'; g.style.animationDelay=(lines.length*0.26+0.15)+'s';
  g.textContent='> ACCÈS AUTORISÉ';
  host.appendChild(g);
  const t=setTimeout(finish, lines.length*260 + 1150);
  function skip(){ clearTimeout(t); finish(); }
  boot.addEventListener('click',skip);
  window.addEventListener('wheel',skip,{once:true,passive:true});
  window.addEventListener('touchmove',skip,{once:true,passive:true});
})();

/* ---------- ANNÉE + UPTIME ---------- */
(function(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  const start=new Date('2004-01-01');
  const yrs=((Date.now()-start)/(365.25*24*3600*1000)).toFixed(1);
  const u=document.getElementById('uptime'); if(u) u.textContent=yrs+' ans';
})();

/* ---------- TYPEWRITER ---------- */
(function(){
  const el=document.getElementById('typed');
  const items=['DevOps · SysAdmin · Développeur','Sûreté & salles de contrôle','Administration réseau & sécurité','Passionné de cybersécurité'];
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){ el.textContent=items[0]; return; }
  let i=0,j=0,del=false;
  function loop(){
    const w=items[i];
    el.textContent = del ? w.slice(0,j--) : w.slice(0,j++);
    let s=del?40:75;
    if(!del && j>w.length){ del=true; s=1700; }
    else if(del && j<0){ del=false; i=(i+1)%items.length; j=0; s=380; }
    setTimeout(loop,s);
  }
  setTimeout(loop,1300);
})();

/* ---------- TERMINAL INTERACTIF ---------- */
(function(){
  const out=document.getElementById('termOut');
  const inp=document.getElementById('termInput');
  const term=document.getElementById('term');
  const pathEl=document.getElementById('termPath');
  if(!out||!inp||!term) return;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function print(html,cls){ const d=document.createElement('div'); d.className='ln '+(cls||'res'); d.innerHTML=html; out.appendChild(d); out.scrollTop=out.scrollHeight; }

  /* --- mini système de fichiers virtuel --- */
  const FS={type:'dir',children:{
    'about.txt':{type:'file',content:[
      'Jérôme Fafchamps — alias sMug@replicatorbe','',
      "20+ ans d'informatique. DevOps, sysadmin et développeur.",
      'Bâtisseur de communautés en ligne, bidouilleur, passionné',
      'de cybersécurité et de réseau. Basé en Belgique.',
      'Membre du hackerspace Wolfplex (Charleroi).'].join('\n')},
    'parcours.txt':{type:'file',content:[
      '2002   IRC, ActionScript, Red5 ..... Chat.fr, 700+ connectes',
      '2004   PHP, Linux, LAMP ............ fafchamps.be, debut sysadmin',
      '2006   PHP a l\'echelle, infra ...... Adosbox, de bout en bout',
      '2007   Flex, AS3, streaming ........ Espace-IRC',
      '2008   Xen, VMware, Proxmox ........ fin du serveur physique unique',
      '2009   Java, Spring, Hibernate ..... developpement objet structure',
      '2015   Docker, Compose ............. la VM et le conteneur, les deux',
      '2015 → Vera, puis Jeedom ........... domotique auto-hebergee',
      '2016   C#, PHP/JS, API, surete ..... le code pilote du materiel',
      '2018   ESP32, Shelly, Zigbee ....... fabriquer, pas juste configurer',
      '2020   Flutter/Dart, mobile ........ Baboon iOS + Android',
      '2023   LLM, moderation assistee .... le changement le plus rapide',
      '2025   Home Assistant, ESPHome .... migration depuis Jeedom',
      '2026   PHP CLI, statique ........... ce site',
      '',
      'Du serveur physique au conteneur, de l\'IRC au LLM.',
      'Aucune annee sans ecrire de code.'].join('\n')},
    'skills.txt':{type:'file',content:[
      'Développement .......... 96%','Réseau ................. 90%',
      'DevOps & automatisation  90%','Administration système . 84%',
      'Forensic & investigation  en montée'].join('\n')},
    'contact.txt':{type:'file',content:[
      'E-mail   : jerome@fafchamps.be','GitHub   : github.com/replicatorbe',
      'Wolfplex : wolfplex.be'].join('\n')},
    'projets':{type:'dir',children:{
      'adosbox.md':{type:'file',content:'# Adosbox (2006-2010)\nCommunauté & chat pour ados. PHP, modération, infra complète.\narchive : web.archive.org/web/*/adosbox.com'},
      'chat.fr.md':{type:'file',content:'# Chat.fr (2002-2007)\nDev & gestion d\'un gros chat FR (700+ connectés). AS3, Red5 webcam.\nPlateforme tierce, revendue par son propriétaire en 2007.\narchive : web.archive.org/web/*/chat.fr'},
      'baboon.md':{type:'file',content:'# Baboon.fr (2008 → 2026)\nChat IRC remis au goût du jour : appli Flutter/Dart (iOS/Android), KiwiIRC modifié, visio Jitsi Meet, modération IA.\nDernier gros projet perso, fermé en 2026.'},
      'espace-irc.md':{type:'file',content:'# Espace-IRC (2007)\nChat IRC en Flash/Flex/AS3 + Red5 (webcam), bots & sécurité du chan.\nObsolète avec la fin de Flash Player ; relève moderne = Baboon.fr.\narchive : web.archive.org/web/*/espace-irc.org'},
      'domotique.md':{type:'file',content:'# Domotique maison (2015 -> maintenant)\nAuto-hébergée sous Home Assistant. Modules Shelly, ESP32 (lecteur de badge, capteurs température), automatisations maison.'},
      'mastermind.md':{type:'file',content:'# MasterMind GUI (2009)\nJeu Java — Swing, Hibernate, Spring MVC.'},
      'fafchamps.be.md':{type:'file',content:'# fafchamps.be (2004 -> maintenant)\nMon espace perso depuis 2004, refondu au fil des ans. Refonte 2026 façon terminal.\narchive : web.archive.org/web/*/fafchamps.be'}
    }},
    'realisations':{type:'dir',children:{
      'soc.md':{type:'file',content:'# SOC nouvelle génération\nCentre d\'opérations de sûreté + site de repli. Ergonomie, continuité d\'activité, tests avec les agents.'},
      'control-rooms.md':{type:'file',content:'# Control Rooms techniques\nSupervision unifiée (CCTV, intrusion, incendie, contrôle d\'accès) sur postes opérateurs.'},
      'commandcar.md':{type:'file',content:'# CommandCar — PC mobile\nPoste de commandement mobile, lien temps réel au SOC. 4G/802.1x/Radius, 72h d\'autonomie, pilotage à distance.'},
      'flotte-mobile.md':{type:'file',content:'# Flotte surveillance mobile\n21 unités autonomes sur remorque. Appli PHP/JS de pilotage de tout le parc via API.'},
      'flotte-v2.md':{type:'file',content:'# Surveillance mobile — gen. 2\n4K zoom 32x, batterie lithium-ion, GPS, 3G/4G. CSC de transformation. Exit l\'analogique.'},
      'hypervisor.md':{type:'file',content:'# Hypervisor\nSupervision unifiée des alarmes (intrusion, incendie, ascenseurs, tunnels...). ~50 logiciels -> 1 interface.'},
      'cctv-rames.md':{type:'file',content:'# CCTV embarquée\nCaméras dans les nouvelles rames + logiciel de récupération d\'images à distance (cellulaire/WiFi).'},
      'valise-14j.md':{type:'file',content:'# Valise de surveillance\nAutonomie 14 jours sans secteur (vs 3-5 j du marché). Optimisation conso de chaque composant.'},
      'anti-vol.md':{type:'file',content:'# Traçage anti-vol de câbles\nTests labo + conditions réelles, formation des opérateurs Control Rooms.'}
    }},
    'stack':{type:'dir',children:{
      'langages.txt':{type:'file',content:'PHP, Java, C#, JavaScript, Flutter/Dart, SQL, Bash'},
      'systemes.txt':{type:'file',content:'Linux (Debian), Docker, Nginx/Apache, MySQL/MariaDB, VLAN, VPN'},
      'securite.txt':{type:'file',content:'Wireshark, Nmap, hardening, OSINT, analyse réseau & logs'}
    }},
    '.secret':{type:'dir',children:{
      'flag.txt':{type:'file',content:'Bien joué, fouineur. 🕵\nIndice : le code Konami -> haut haut bas bas gauche droite gauche droite B A'}
    }}
  }};
  let cwd=[];
  function pathStr(){ return '~'+(cwd.length?'/'+cwd.join('/'):''); }
  function updatePrompt(){ if(pathEl) pathEl.textContent=pathStr(); }
  function nodeAt(parts){ let n=FS; for(const p of parts){ if(n.type!=='dir'||!n.children[p]) return null; n=n.children[p]; } return n; }
  function resolve(arg){
    arg=(arg||'').trim();
    let parts=(arg===''||arg==='~'||arg[0]==='/'||arg[0]==='~') ? [] : cwd.slice();
    const segs=arg.replace(/^~/,'').replace(/^\/+/,'').split('/').filter(Boolean);
    for(const s of segs){ if(s==='.') continue; if(s==='..'){ parts.pop(); continue; } parts.push(s); }
    return parts;
  }
  function echo(c){ print('<span class="pr">visitor@fafchamps:'+pathStr()+'$</span> '+esc(c),'cmd'); }

  const C={
    help:()=>['Commandes disponibles :',
      '  <span class="cyan">ls [-a]</span>    lister le dossier courant',
      '  <span class="cyan">cd</span> &lt;dir&gt;     entrer (.. pour remonter, ~ racine)',
      '  <span class="cyan">cat</span> &lt;file&gt;  afficher un fichier',
      '  <span class="cyan">pwd</span>        chemin courant',
      '  <span class="cyan">whoami · skills · stack · work · projects · github · blog</span>',
      '  <span class="cyan">social · contact · date · matrix · clear · sudo</span>',
      'astuce : <span class="green">Tab</span> complète · <span class="green">ls</span> · <span class="green">cat about.txt</span> · <span class="green">cd projets</span>'].join('\n'),
    whoami:()=>['<b>Jérôme Fafchamps</b> · alias <span class="cyan">sMug@replicatorbe</span>',
      'DevOps · SysAdmin · Développeur — <span class="amber">20+ ans</span> d\'informatique',
      'Belgique · focus : cybersécurité & réseau'].join('\n'),
    skills:()=>['Développement .......... <span class="amber">96%</span>',
      'Réseau ................. <span class="amber">90%</span>',
      'DevOps & automatisation  <span class="amber">90%</span>',
      'Administration système . <span class="amber">84%</span>',
      'Forensic & investigation <span class="cyan">en montée ↗</span>'].join('\n'),
    stack:()=>['<b>Langages</b> : PHP, Java, C#, JavaScript, Flutter/Dart, SQL, Bash',
      '<b>Systèmes</b> : Linux (Debian), Docker, Nginx/Apache, MySQL',
      '<b>DevOps</b>   : CI/CD, Git, monitoring, reverse proxy',
      '<b>Sécurité</b> : Wireshark, Nmap, hardening, OSINT'].join('\n'),
    projects:()=>['<span class="amber">[2002-2007]</span> Chat.fr       dev & gestion (700+ connectés)',
      '<span class="amber">[2006-2010]</span> Adosbox       communauté & chat (PHP)',
      '<span class="amber">[2008-2026]</span> Baboon.fr     chat IRC modernisé (Flutter/IA/Jitsi)',
      '<span class="amber">[2007]     </span> Espace-IRC    chat IRC Flash/AS3/Red5 (pré-Baboon)',
      '<span class="amber">[2015-∞]   </span> Domotique     Home Assistant / Shelly / ESP32',
      '<span class="amber">[2009]     </span> MasterMind    Java / Spring / Hibernate',
      '<span class="amber">[2004-∞]   </span> fafchamps.be  ce site (historique sur archive.org)',
      '-> détails : <span class="cyan">cd projets</span> puis <span class="cyan">ls</span>'].join('\n'),
    work:()=>['<span class="amber">[ DOSSIERS PRO ]</span> opérateur ferroviaire (BE) — <span class="green">anonymisé</span>',
      'SOC nouvelle gen .... centre d\'opérations de sûreté + repli',
      'Control Rooms ....... supervision unifiée CCTV/intrusion/incendie',
      'CommandCar .......... PC mobile · 4G/802.1x · 72h autonomie',
      'Flotte mobile ....... 21 unités · appli <span class="cyan">PHP/JS</span> via API',
      'Hypervisor .......... ~50 logiciels -> 1 interface (toutes alarmes)',
      'Valise 14 j ......... surveillance autonome sans secteur',
      '+ CCTV rames, anti-vol câbles, Product Owner mobile…',
      '-> détails : <span class="cyan">cd realisations</span> puis <span class="cyan">ls</span>'].join('\n'),
    social:()=>['GitHub   : <a href="https://github.com/replicatorbe" target="_blank" rel="noopener">github.com/replicatorbe</a>',
      'Wolfplex : <a href="https://www.wolfplex.be/" target="_blank" rel="noopener">wolfplex.be</a>'].join('\n'),
    github:()=>{
      const g=window.fcbGitHub;
      if(!g||!g.contributions){ return ['github : flux en cours de chargement… réessaie dans un instant.',
        'profil : <a href="https://github.com/replicatorbe" target="_blank" rel="noopener">github.com/replicatorbe</a>'].join('\n'); }
      const t=(g.contributions.total!=null)?Number(g.contributions.total).toLocaleString('fr-FR'):'?';
      const out=['<b>@'+esc(g.login)+'</b> — activité GitHub',
        '<span class="green">'+t+'</span> contributions sur les 12 derniers mois',
        (g.repos_count||0)+' dépôts publics récents :'];
      (g.repos||[]).slice(0,8).forEach(r=>{
        out.push('  <span class="amber">*</span> <b>'+esc(r.name)+'</b>'
          +(r.lang?' <span class="cyan">['+esc(r.lang)+']</span>':'')
          +' <span class="res">'+esc(r.updated)+'</span>');
      });
      out.push('profil : <a href="'+esc(g.profile_url)+'" target="_blank" rel="noopener">'+esc(g.profile_url.replace(/^https?:\/\//,''))+'</a>');
      return out.join('\n');
    },
    blog:()=>{
      const b=window.fcbBlog;
      if(!b||!Array.isArray(b.posts)) return 'blog : flux en cours de chargement… réessaie dans un instant.\n-> <a href="/blog/">fafchamps.be/blog/</a>';
      if(!b.posts.length) return 'blog : aucune publication pour l\'instant.\n-> <a href="/blog/">fafchamps.be/blog/</a>';
      const out=['<b>Publications</b> — '+(b.count||b.posts.length)+' article(s) publié(s)',''];
      b.posts.forEach(p=>{
        out.push('  <span class="amber">'+esc(p.date)+'</span>  <a href="'+esc(p.url)+'">'+esc(p.title)+'</a>'
          +(p.category?' <span class="amber">['+esc(p.category)+']</span>':'')
          +((p.tags&&p.tags.length)?' <span class="cyan">'+esc(p.tags.join(' '))+'</span>':''));
      });
      if(Array.isArray(b.categories)&&b.categories.length){
        out.push('','<b>par catégorie</b> : '+b.categories.map(c=>
          '<a href="'+esc(c.url)+'">'+esc(c.label)+'</a> <span class="res">('+c.count+')</span>').join(' · '));
      }
      if(Array.isArray(b.years)&&b.years.length){
        out.push('<b>par année</b>     : '+b.years.map(y=>
          '<a href="'+esc(y.url)+'">'+esc(y.year)+'</a> <span class="res">('+y.count+')</span>').join(' · '));
      }
      out.push('','-> index complet : <a href="/blog/">fafchamps.be/blog/</a> · flux <a href="/blog/feed.xml">RSS</a>');
      return out.join('\n');
    },
    contact:()=>'E-mail : <a href="mailto:jerome@fafchamps.be">jerome@fafchamps.be</a>',
    date:()=>{try{return new Date().toLocaleString('fr-BE',{timeZone:'Europe/Brussels'});}catch(e){return new Date().toString();}},
    pwd:()=>'/home/visitor'+(cwd.length?'/'+cwd.join('/'):''),
    ls:(arg)=>{
      let showAll=false, target='';
      (arg||'').split(/\s+/).filter(Boolean).forEach(t=>{ if(t==='-a'||t==='-la'||t==='-al') showAll=true; else target=t; });
      const node=nodeAt(resolve(target));
      if(!node) return 'ls: '+esc(target)+' : aucun fichier ou dossier de ce type';
      if(node.type==='file') return esc(target);
      let names=Object.keys(node.children);
      if(!showAll) names=names.filter(n=>n[0]!=='.');
      if(!names.length) return '(vide)';
      return names.map(n=> node.children[n].type==='dir' ? '<span class="cyan">'+esc(n)+'/</span>' : esc(n)).join('   ');
    },
    cd:(arg)=>{
      arg=(arg||'').trim();
      if(arg===''){ cwd=[]; updatePrompt(); return; }
      const parts=resolve(arg), node=nodeAt(parts);
      if(!node) return 'cd: '+esc(arg)+' : aucun dossier de ce type';
      if(node.type!=='dir') return 'cd: '+esc(arg)+' : n\'est pas un dossier';
      cwd=parts; updatePrompt(); return;
    },
    cat:(arg)=>{
      arg=(arg||'').trim();
      if(!arg) return 'cat : indiquer un fichier — ex. <span class="cyan">cat about.txt</span>';
      const node=nodeAt(resolve(arg));
      if(!node) return 'cat: '+esc(arg)+' : fichier introuvable';
      if(node.type==='dir') return 'cat: '+esc(arg)+' : est un dossier';
      return esc(node.content);
    },
    matrix:()=>{ if(window.fcbUnlock){ window.fcbUnlock(); return '<span class="green">décryptage…</span> 🔓  (Échap pour fermer)'; } return 'effet indisponible.'; },
    sudo:()=>'<span class="red">[sudo]</span> mot de passe pour visitor : ****\n<span class="red">Désolé</span>, visitor n\'est pas dans le fichier sudoers. Cet incident sera rapporté. 🙂'
  };
  const alias={projets:'projects','compétences':'skills',competences:'skills',cls:'clear',aide:'help','?':'help',man:'help',dir:'ls',konami:'matrix',hack:'matrix',rain:'matrix',realisations:'work','réalisations':'work',pro:'work',career:'work',boulot:'work',activity:'github',gh:'github',git:'github',contributions:'github','activité':'github',articles:'blog',posts:'blog',publications:'blog',rss:'blog','écrits':'blog',ecrits:'blog'};
  const hist=[]; let hi=-1;
  function run(raw){
    const cmd=(raw||'').trim(); echo(cmd);
    if(!cmd) return;
    hist.unshift(cmd); hi=-1;
    const p=cmd.split(/\s+/), base=p[0].toLowerCase(), arg=p.slice(1).join(' ');
    const name=alias[base]||base;
    if(name==='clear'){ out.innerHTML=''; return; }
    const fn=C[name];
    if(fn){ const r=fn(arg); if(r!=null && r!=='') print(r); }
    else print('bash : '+esc(base)+' : commande introuvable — tape <span class="cyan">help</span>','res');
  }
  const CMDNAMES=Object.keys(C).concat('clear');
  function commonPrefix(a){ if(!a.length) return ''; let p=a[0]; for(const s of a){ while(s.indexOf(p)!==0) p=p.slice(0,-1); if(!p) break; } return p; }
  function complete(){
    const raw=inp.value, trailing=/\s$/.test(raw), toks=raw.split(/\s+/).filter(Boolean);
    if(toks.length===0 || (toks.length===1 && !trailing)){
      const frag=(toks[0]||'').toLowerCase();
      const cands=CMDNAMES.filter(n=>n.indexOf(frag)===0).sort();
      if(cands.length===1) inp.value=cands[0]+' ';
      else if(cands.length>1){ const cp=commonPrefix(cands); if(cp.length>frag.length) inp.value=cp; else { echo(raw); print(cands.join('   ')); } }
      return;
    }
    const cmd=alias[toks[0].toLowerCase()]||toks[0].toLowerCase();
    if(['cd','cat','ls'].indexOf(cmd)<0) return;
    const last= trailing ? '' : toks[toks.length-1];
    const sl=last.lastIndexOf('/'), dirPart= sl>=0?last.slice(0,sl+1):'', frag= sl>=0?last.slice(sl+1):last;
    const node=nodeAt(resolve(dirPart));
    if(!node||node.type!=='dir') return;
    let names=Object.keys(node.children);
    if(frag[0]!=='.') names=names.filter(n=>n[0]!=='.');
    const cands=names.filter(n=>n.indexOf(frag)===0).sort();
    if(!cands.length) return;
    const head=toks.slice(0, trailing?toks.length:toks.length-1).join(' ');
    const tok=name=>dirPart+name+(node.children[name].type==='dir'?'/':'');
    if(cands.length===1){ inp.value=head+' '+tok(cands[0]); }
    else { const cp=commonPrefix(cands); if(cp.length>frag.length) inp.value=head+' '+dirPart+cp;
      else { echo(raw); print(cands.map(n=>node.children[n].type==='dir'?'<span class="cyan">'+esc(n)+'/</span>':esc(n)).join('   ')); } }
  }
  inp.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){ run(inp.value); inp.value=''; }
    else if(e.key==='Tab'){ e.preventDefault(); complete(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(hist.length){ hi=Math.min(hi+1,hist.length-1); inp.value=hist[hi]; } }
    else if(e.key==='ArrowDown'){ e.preventDefault(); if(hi>0){ hi--; inp.value=hist[hi]; } else { hi=-1; inp.value=''; } }
    else if(e.ctrlKey && (e.key==='l'||e.key==='L')){ e.preventDefault(); out.innerHTML=''; }
  });
  term.addEventListener('click',(e)=>{ if(e.target.tagName!=='A') inp.focus(); });
  updatePrompt();
  print('<span class="cyan">fafchamps.be</span> — terminal interactif <span class="amber">v1.1</span>','res');
  echo('whoami'); print(C.whoami());
  print('Tape <span class="cyan">help</span>, ou explore : <span class="cyan">ls</span> · <span class="cyan">cd</span> · <span class="cyan">cat</span>.','res');
})();

/* ---------- KONAMI ---------- */
(function(){
  const seq=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  let pos=0,running=false,raf,ctx,cols,drops;
  const el=document.getElementById('konami'), cv=document.getElementById('konamiCanvas');
  if(!el||!cv) return;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fs=16, chars='アカサタナハマヤラ0123456789ABCDEF#$%&@/<>'.split('');
  function resize(){ cv.width=innerWidth; cv.height=innerHeight; cols=Math.ceil(cv.width/fs); drops=Array(cols).fill(0).map(()=>Math.random()*-40); }
  function draw(){
    ctx.fillStyle='rgba(8,10,13,0.10)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.font=fs+'px monospace';
    for(let i=0;i<cols;i++){
      const x=i*fs, y=drops[i]*fs, r=Math.random();
      ctx.fillStyle = r>0.93?'#ffb13d' : (r>0.5?'#48d6cf':'#62e08a');
      ctx.fillText(chars[Math.floor(Math.random()*chars.length)],x,y);
      if(y>cv.height && Math.random()>0.97) drops[i]=0;
      drops[i]++;
    }
    raf=requestAnimationFrame(draw);
  }
  function open(){
    if(running) return; running=true;
    el.classList.add('on'); el.setAttribute('aria-hidden','false');
    if(!reduce){ ctx=cv.getContext('2d'); resize(); addEventListener('resize',resize); draw(); }
    clearTimeout(open._t); open._t=setTimeout(close,8000);
  }
  function close(){
    if(!running) return; running=false;
    el.classList.remove('on'); el.setAttribute('aria-hidden','true');
    cancelAnimationFrame(raf); removeEventListener('resize',resize);
  }
  el.addEventListener('click',close);
  window.fcbUnlock=open;
  addEventListener('keydown',(e)=>{
    if(running && e.key==='Escape'){ close(); return; }
    const k=(e.key||'').toLowerCase();
    pos = (k===seq[pos]) ? pos+1 : (k===seq[0]?1:0);
    if(pos===seq.length){ pos=0; open(); }
  });
})();

/* ---------- SCROLL PROGRESS ---------- */
(function(){
  const sp=document.getElementById('scrollprog'); if(!sp) return;
  const d=document.documentElement;
  function upd(){ const max=d.scrollHeight-d.clientHeight; sp.style.width=(max>0?(d.scrollTop/max*100):0)+'%'; }
  addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd,{passive:true}); upd();
})();

/* ---------- REVEAL + SKILLBARS + COUNTERS ---------- */
(function(){
  const io=new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('.bar__fill').forEach(f=>{ f.style.width=f.dataset.w+'%'; });
      e.target.querySelectorAll('.counter').forEach(c=>{
        const goal=+c.dataset.count||+c.parentElement.dataset.count||0;
        if(!goal||c.dataset.done) return; c.dataset.done=1;
        let n=0; const step=Math.max(1,Math.round(goal/34));
        const iv=setInterval(()=>{ n+=step; if(n>=goal){n=goal;clearInterval(iv);} c.textContent=n; },28);
      });
      io.unobserve(e.target);
    });
  },{threshold:.18});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
})();

/* ---------- ACTIVE NAV ---------- */
(function(){
  const links=[...document.querySelectorAll('.topnav a')];
  const map={}; links.forEach(l=>map[l.dataset.sec]=l);
  const io=new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){
      links.forEach(l=>l.classList.remove('active'));
      const id=e.target.id; if(map[id]) map[id].classList.add('active');
    }});
  },{rootMargin:'-45% 0px -50% 0px'});
  ['accueil','parcours','realisations','code','profil','competences','projets','publications','contact'].forEach(id=>{
    const s=document.getElementById(id); if(s) io.observe(s);
  });
})();

/* ---------- MOBILE NAV ---------- */
(function(){
  const b=document.getElementById('burger'), m=document.getElementById('mnav');
  b.addEventListener('click',()=>{ b.classList.toggle('open'); m.classList.toggle('open'); });
  m.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ b.classList.remove('open'); m.classList.remove('open'); }));
})();

/* ---------- PUBLICATIONS (data/blog.json) ---------- */
(function(){
  const host=document.getElementById('pubList');
  if(!host) return;
  fetch('data/blog.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(b=>{
    window.fcbBlog=b;
    const posts=Array.isArray(b.posts)?b.posts:[];
    if(!posts.length){ host.innerHTML='<div class="gh-loading">première publication en préparation <span class="bk">_</span></div>'; return; }
    host.innerHTML='';
    posts.forEach(p=>{
      /* textContent partout : le JSON n'injecte jamais de HTML */
      const a=document.createElement('a'); a.className='pub';
      /* on n'accepte qu'un chemin interne : pas de schéma exotique venu du JSON */
      a.href=(typeof p.url==='string'&&/^\/[\w\-./]*$/.test(p.url))?p.url:'/blog/';
      const d=document.createElement('div'); d.className='pub__date'; d.textContent=String(p.date||'').replace(/-/g,'.');
      const t=document.createElement('div'); t.className='pub__title'; t.textContent=p.title||'';
      const rt=document.createElement('div'); rt.className='pub__rt'; rt.textContent=(p.minutes||1)+' min';
      const s=document.createElement('p'); s.className='pub__sum'; s.textContent=p.summary||'';
      a.append(d,t,rt,s);
      const g=document.createElement('div'); g.className='pub__tags';
      if(p.category){ const c=document.createElement('span'); c.className='c'; c.textContent=p.category; g.appendChild(c); }
      if(Array.isArray(p.tags)) p.tags.forEach(x=>{ const sp=document.createElement('span'); sp.textContent=x; g.appendChild(sp); });
      if(g.children.length) a.appendChild(g);
      host.appendChild(a);
    });
  }).catch(()=>{
    host.innerHTML='<div class="gh-loading">flux indisponible — <a href="/blog/" style="color:var(--cyan);text-decoration:underline">ouvrir les publications →</a></div>';
  });
})();

/* ---------- ACTIVITÉ GITHUB (data/github.json) ---------- */
(function(){
  const LV=['#161b25','rgba(98,224,138,.28)','rgba(98,224,138,.48)','rgba(98,224,138,.72)','#62e08a'];
  const MOIS=['jan','fév','mar','avr','mai','jun','jui','aoû','sep','oct','nov','déc'];
  const LANGC={Python:'#3572A5',PHP:'#4F5D95',JavaScript:'#f1e05a',TypeScript:'#3178c6',PowerShell:'#012456',
    Shell:'#89e051',Tcl:'#e4cc98',Dockerfile:'#384d54','C++':'#f34b7d',C:'#555555','C#':'#178600',
    Java:'#b07219',Dart:'#00B4AB',HTML:'#e34c26',CSS:'#563d7c',Go:'#00ADD8',Ruby:'#701516',Rust:'#dea584'};
  const el=id=>document.getElementById(id);
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt=n=>Number(n).toLocaleString('fr-FR');

  function pseudoHash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h*33+s.charCodeAt(i))>>>0; } return ('0000000'+h.toString(16)).slice(-7); }

  function animateCount(node,goal){
    if(reduce||goal<=0){ node.textContent=fmt(goal); return; }
    let n=0; const step=Math.max(1,Math.round(goal/40));
    const iv=setInterval(()=>{ n+=step; if(n>=goal){ n=goal; clearInterval(iv); } node.textContent=fmt(n); },26);
  }

  function levels(days){
    const nz=days.map(d=>d.count).filter(c=>c>0).sort((a,b)=>a-b);
    if(!nz.length) return ()=>0;
    const q=p=>nz[Math.min(nz.length-1,Math.floor(nz.length*p))];
    const q1=q(.25),q2=q(.5),q3=q(.75);
    return c=> c<=0?0 : c<=q1?1 : c<=q2?2 : c<=q3?3 : 4;
  }

  function renderCal(days){
    const cal=el('ghCal'); if(!cal) return;
    const lvl=levels(days);
    // colonnes (semaines), 1ère colonne calée sur le jour de semaine du 1er jour
    const cells=days.slice();
    const first=new Date(cells[0].date+'T00:00:00Z').getUTCDay(); // 0=dim
    for(let i=0;i<first;i++) cells.unshift(null);
    const cols=[]; for(let i=0;i<cells.length;i+=7) cols.push(cells.slice(i,i+7));

    const months=document.createElement('div'); months.className='gh-months';
    const weeks=document.createElement('div'); weeks.className='gh-weeks';
    let lastMonth=-1;
    cols.forEach(col=>{
      const firstReal=col.find(Boolean);
      const ms=document.createElement('span');
      if(firstReal){ const mo=new Date(firstReal.date+'T00:00:00Z').getUTCMonth();
        if(mo!==lastMonth){ ms.textContent=MOIS[mo]; lastMonth=mo; } }
      months.appendChild(ms);
      const wk=document.createElement('div'); wk.className='gh-week';
      col.forEach(d=>{
        const c=document.createElement('div'); c.className='gh-d';
        if(!d){ c.style.visibility='hidden'; }
        else { const L=lvl(d.count); c.style.background=LV[L]; if(L===4) c.classList.add('lv4');
          c.title=d.count+' contribution'+(d.count>1?'s':'')+' · '+d.date; }
        wk.appendChild(c);
      });
      weeks.appendChild(wk);
    });
    cal.innerHTML=''; cal.appendChild(months); cal.appendChild(weeks);

    const leg=el('ghLegend');
    if(leg){ leg.hidden=false; leg.querySelectorAll('i').forEach((i,k)=>i.style.background=LV[k]); }
  }

  function renderRepos(repos){
    const log=el('ghLog'); if(!log) return;
    log.innerHTML='';
    repos.forEach(r=>{
      const row=document.createElement('div'); row.className='gh-log__row';
      const hash=document.createElement('span'); hash.className='gh-hash'; hash.textContent=pseudoHash(r.name);
      const main=document.createElement('div'); main.className='gh-log__main';
      const a=document.createElement('a'); a.className='gh-name'; a.href=r.url; a.target='_blank'; a.rel='noopener'; a.textContent=r.name;
      main.appendChild(a);
      if(r.lang){ const lg=document.createElement('span'); lg.className='gh-lang';
        const dot=document.createElement('span'); dot.className='ld'; dot.style.background=LANGC[r.lang]||'#7e94b2';
        lg.appendChild(dot); lg.appendChild(document.createTextNode(r.lang)); main.appendChild(lg); }
      if(r.stars>0){ const st=document.createElement('span'); st.className='gh-stars'; st.textContent='★ '+r.stars; main.appendChild(st); }
      const date=document.createElement('span'); date.className='gh-date'; date.textContent=r.updated;
      row.appendChild(hash); row.appendChild(main); row.appendChild(date);
      if(r.desc){ const dsc=document.createElement('div'); dsc.className='gh-desc'; dsc.textContent=r.desc; row.appendChild(dsc); }
      log.appendChild(row);
    });
    const cnt=el('ghRepoCount'); if(cnt) cnt.textContent=repos.length+' repos';
  }

  fetch('data/github.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(g=>{
    window.fcbGitHub=g;
    const c=g.contributions||{};
    if(c.total!=null){ const t=el('ghTotal'); if(t){ const obs=new IntersectionObserver((es)=>{
      es.forEach(e=>{ if(e.isIntersecting){ animateCount(t,c.total); obs.disconnect(); } }); },{threshold:.4});
      obs.observe(t); } }
    if(Array.isArray(c.days)&&c.days.length) renderCal(c.days);
    if(Array.isArray(g.repos)) renderRepos(g.repos);
    if(g.generated_at){ const gen=el('ghGen'); if(gen){
      try{ gen.textContent='MAJ '+new Date(g.generated_at).toLocaleDateString('fr-BE',{day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){} } }
  }).catch(()=>{
    const cal=el('ghCal'); if(cal) cal.innerHTML='<div class="gh-loading">flux indisponible — <a href="https://github.com/replicatorbe" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">voir directement sur GitHub →</a></div>';
    const log=el('ghLog'); if(log) log.innerHTML='<div class="gh-loading"><a href="https://github.com/replicatorbe" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">github.com/replicatorbe →</a></div>';
  });
})();
