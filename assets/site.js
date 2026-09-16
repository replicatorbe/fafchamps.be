/* ============================================================= *
 *  fafchamps.be — comportements de la page d'accueil
 *
 *  Chaque bloc ci-dessous est une fonction immédiate ENROBÉE d'un
 *  try/catch : sans lui, une seule exception — un flux mal formé, une
 *  API absente — interrompait l'exécution du fichier entier, et le
 *  terminal, le mur GitHub et la liste d'articles tombaient ensemble.
 *  Un bloc qui échoue échoue maintenant seul.
 * ============================================================= */

/* Deux API sont appelées un peu partout ici et peuvent manquer (très vieux
   navigateur, environnement de test, extension qui les retire). On ne les
   touche qu'à travers ces deux points d'entrée, qui répondent quelque chose
   d'exploitable quand l'API n'existe pas. */
function fcbMM(q){
  try{ if(typeof matchMedia==='function'){ var m=matchMedia(q); if(m) return m; } }catch(e){}
  return {matches:false};
}
var fcbHasIO=(function(){ try{ return typeof IntersectionObserver==='function'; }catch(e){ return false; } })();

/* ---------- ANNÉE + UPTIME ---------- */
(function(){ try{
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  /* même point de départ que la frise et que la tuile « ANS » de l'accueil :
     2002, première ligne de code publiée. */
  const start=new Date('2002-01-01');
  const yrs=((Date.now()-start)/(365.25*24*3600*1000)).toFixed(1);
  const u=document.getElementById('uptime'); if(u) u.textContent=yrs+' ans';
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- TYPEWRITER ---------- */
(function(){ try{
  const el=document.getElementById('typed');
  if(!el) return;
  const items=['DevOps · SysAdmin · Développeur','Sûreté & salles de contrôle','Administration réseau & sécurité','Conception & pilotage de projets'];
  if(fcbMM('(prefers-reduced-motion:reduce)').matches){ el.textContent=items[0]; return; }
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
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- TERMINAL INTERACTIF ---------- */
(function(){ try{
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
      "Plus de vingt ans d'informatique. DevOps, sysadmin et développeur.",
      'Bâtisseur de communautés en ligne, bidouilleur. Réseau,',
      'systèmes et sûreté. Basé en Belgique.',
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
      '2025   Windows Server, M365, NIS2 .. retour a l\'exploitation',
      '2026   PHP CLI, statique ........... ce site',
      '',
      'Du serveur physique au conteneur, de l\'IRC au LLM.'].join('\n')},
    'skills.txt':{type:'file',content:[
      'EN SERVICE (cette semaine)',
      '  Windows Server (AD, Entra, GPO, RDS), Microsoft 365 et Defender',
      '  Veeam, NinjaOne, VoIP, applicatifs métier, NIS2',
      '  Linux (Debian), Docker, nginx, PHP, Bash, PowerShell, Git, MySQL',
      '  Réseau : TCP/IP, DNS, VPN, VLAN, pare-feu',
      '  Home Assistant, Jeedom, ESPHome',
      '',
      'TENU EN PRODUCTION (à rallumer, pas à réapprendre)',
      '  Java/Spring/Hibernate 2009 · C# 2016 · Flutter/Dart 2020-2026',
      '  Baboon.fr 2008-2026 — site, IRC, visio, modération',
      '  ActionScript 3/Flex et Red5 2002-2012 · Vera/Luup 2015',
      '',
      'EN COURS',
      '  analyse de capture, forensic système, OSINT, durcissement',
      '',
      "Pas de pourcentage : ce qu'on ne pratique plus s'oublie."].join('\n')},
    'contact.txt':{type:'file',content:[
      'E-mail   : jerome@fafchamps.be','GitHub   : github.com/replicatorbe',
      'Wolfplex : wolfplex.be'].join('\n')},
    'projets':{type:'dir',children:{
      'adosbox.md':{type:'file',content:'# Adosbox (2006-2010)\nPlateforme communautaire francophone. PHP, infra complète.\nModération : charte écrite, modérateurs formés, traitement des signalements.\narchive : web.archive.org/web/*/adosbox.com'},
      'chat.fr.md':{type:'file',content:'# Chat.fr (2002-2007)\nDev & gestion d\'un chat FR (700+ connectés en soirée). AS3, Red5 webcam.\nPlateforme tierce, revendue par son propriétaire en 2007.\narchive : web.archive.org/web/*/chat.fr'},
      'baboon.md':{type:'file',content:'# Baboon.fr (2008 → 2026)\nChat IRC remis au goût du jour : appli Flutter/Dart (iOS/Android), KiwiIRC modifié, visio Jitsi Meet, modération IA.\nDix-huit ans de service, arrêté en 2026.'},
      'espace-irc.md':{type:'file',content:'# Espace-IRC (2007)\nChat IRC en Flash/Flex/AS3 + Red5 (webcam), bots & sécurité du chan.\nObsolète avec la fin de Flash Player ; relève moderne = Baboon.fr.\narchive : web.archive.org/web/*/espace-irc.org'},
      'domotique.md':{type:'file',content:'# Domotique maison (2015 -> maintenant)\nAuto-hébergée sous Home Assistant. Modules Shelly, ESP32 (lecteur de badge, capteurs température), automatisations maison.'},
      'mastermind.md':{type:'file',content:'# MasterMind GUI (2009)\nJeu Java — Swing, Hibernate, Spring MVC.'},
      'fafchamps.be.md':{type:'file',content:'# fafchamps.be (2004 -> maintenant)\nMon espace perso depuis 2004, refondu au fil des ans. Refonte 2026 façon terminal.\narchive : web.archive.org/web/*/fafchamps.be'}
    }},
    'realisations':{type:'dir',children:{
      'soc.md':{type:'file',content:'# SOC nouvelle génération\nCentre d\'opérations de sûreté (SOC physique, pas un centre de cyberdéfense) + site de repli. Ergonomie, continuité d\'activité, tests avec les agents.'},
      'control-rooms.md':{type:'file',content:'# Control Rooms techniques\nSupervision unifiée (CCTV, intrusion, incendie, contrôle d\'accès) sur postes opérateurs.'},
      'commandcar.md':{type:'file',content:'# CommandCar — PC mobile\nPoste de commandement mobile, lien temps réel au centre d\'opérations. 4G/802.1x/Radius, 72 h d\'autonomie visée en conception, pilotage à distance.'},
      'flotte-mobile.md':{type:'file',content:'# Flotte surveillance mobile\n21 unités autonomes sur remorque. Appli PHP/JS de pilotage de tout le parc via API.'},
      'flotte-v2.md':{type:'file',content:'# Surveillance mobile — gen. 2\n4K zoom 32x, batterie lithium-ion, GPS, 3G/4G. CSC de transformation. Exit l\'analogique.'},
      'hypervisor.md':{type:'file',content:'# Hypervisor (PSIM)\nSupervision unifiée des alarmes (intrusion, incendie, ascenseurs, tunnels...). ~50 logiciels -> 1 interface.'},
      'cctv-rames.md':{type:'file',content:'# CCTV embarquée\nCaméras dans les nouvelles rames + logiciel de récupération d\'images à distance (cellulaire/WiFi).'},
      'valise-14j.md':{type:'file',content:'# Valise de surveillance\nDimensionnée pour 14 jours sans secteur (vs 3-5 j du marché). Consommation mesurée composant par composant, puis CSC écrit autour de cette contrainte.'},
      'anti-vol.md':{type:'file',content:'# Traçage anti-vol de câbles\nTests labo + conditions réelles, formation des opérateurs Control Rooms.'}
    }},
    'stack':{type:'dir',children:{
      'langages.txt':{type:'file',content:"Écrits au quotidien : PHP, Bash, PowerShell, SQL, JavaScript.\nTenus en production autrefois : Java, C#, Flutter/Dart, ActionScript 3.\nCe qu'on ne pratique plus s'oublie — et se rallume."},
      'systemes.txt':{type:'file',content:'Linux (Debian), Docker/Compose, nginx, MySQL/MariaDB, VLAN, VPN'},
      'securite.txt':{type:'file',content:'Wireshark, tcpdump, nmap, durcissement, OSINT, analyse réseau & logs'}
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
      '  <span class="cyan">ls</span>         lister le dossier courant',
      '  <span class="cyan">cd</span> &lt;dir&gt;     entrer (.. pour remonter, ~ racine)',
      '  <span class="cyan">cat</span> &lt;file&gt;  afficher un fichier',
      '  <span class="cyan">pwd</span>        chemin courant',
      '  <span class="cyan">whoami · skills · stack · work · projects · github · blog</span>',
      '  <span class="cyan">social · contact · date · clear</span>',
      'astuce : <span class="green">Tab</span> complète · <span class="green">ls</span> · <span class="green">cat about.txt</span> · <span class="green">cd projets</span>'].join('\n'),
    whoami:()=>['<b>Jérôme Fafchamps</b> · alias <span class="cyan">sMug@replicatorbe</span>',
      'DevOps · SysAdmin · Développeur — <span class="amber">plus de vingt ans</span> d\'informatique',
      'Belgique · réseau, systèmes et sûreté'].join('\n'),
    skills:()=>['<span class="green">[ EN SERVICE ]</span> cette semaine',
      '  Windows Server (AD, Entra, GPO, RDS) · Microsoft 365 &amp; Defender · Veeam',
      '  NinjaOne · VoIP · applicatifs métier · NIS2',
      '  Linux (Debian) · Docker · nginx · PHP · Bash · PowerShell · Git · MySQL',
      '  Réseau : TCP/IP, DNS, VPN, VLAN, pare-feu',
      '  Home Assistant · Jeedom · ESPHome',
      '<span class="amber">[ TENU EN PRODUCTION ]</span> à rallumer',
      '  Java/Spring/Hibernate <span class="res">2009</span> · C# <span class="res">2016</span> · Flutter/Dart <span class="res">2020-2026</span>',
      '  Baboon.fr <span class="res">2008-2026</span> — site, IRC, visio, modération',
      '  ActionScript 3/Flex · Red5 <span class="res">2002-2012</span> · Vera/Luup <span class="res">2015</span>',
      '<span class="cyan">[ EN COURS ]</span> maintenant',
      '  analyse de capture · forensic système · OSINT · durcissement',
      '',
      'Pas de pourcentage : ce qu\'on ne pratique plus s\'oublie.'].join('\n'),
    stack:()=>['<b>Systèmes</b> : Linux (Debian), Docker/Compose, nginx, MySQL/MariaDB',
      '<b>Réseau</b>   : TCP/IP, DNS, VPN, VLAN, pare-feu',
      '<b>DevOps</b>   : Git, cron, reverse proxy, supervision, sauvegardes',
      '<b>Sécurité</b> : Wireshark, tcpdump, nmap, durcissement',
      '<b>Écrits ici</b> : PHP et Bash — le reste, voir <span class="cyan">skills</span>'].join('\n'),
    projects:()=>['<span class="amber">[2002-2007]</span> Chat.fr       dev & gestion (700+ connectés)',
      '<span class="amber">[2006-2010]</span> Adosbox       plateforme communautaire (PHP)',
      '<span class="amber">[2008-2026]</span> Baboon.fr     chat IRC modernisé (Flutter/IA/Jitsi)',
      '<span class="amber">[2007]     </span> Espace-IRC    chat IRC Flash/AS3/Red5 (pré-Baboon)',
      '<span class="amber">[2015-∞]   </span> Domotique     Home Assistant / Shelly / ESP32',
      '<span class="amber">[2009]     </span> MasterMind    Java / Spring / Hibernate',
      '<span class="amber">[2004-∞]   </span> fafchamps.be  ce site (historique sur archive.org)',
      '-> détails : <span class="cyan">cd projets</span> puis <span class="cyan">ls</span>'].join('\n'),
    work:()=>['<span class="amber">[ DOSSIERS PRO ]</span> opérateur ferroviaire (BE), 2016-2025 — <span class="green">anonymisé</span>',
      'SOC nouvelle gen .... centre d\'opérations de sûreté + repli',
      'Control Rooms ....... supervision unifiée CCTV/intrusion/incendie',
      'CommandCar .......... PC mobile · 4G/802.1x · 72 h visées',
      'Flotte mobile ....... 21 unités · appli <span class="cyan">PHP/JS</span> via API',
      'Hypervisor (PSIM) ... ~50 logiciels -> 1 interface (toutes alarmes)',
      'Valise 14 j ......... cible de conception, sans secteur',
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
    }
  };
  const alias={projets:'projects','compétences':'skills',competences:'skills',cls:'clear',aide:'help','?':'help',man:'help',dir:'ls',realisations:'work','réalisations':'work',pro:'work',career:'work',boulot:'work',activity:'github',gh:'github',git:'github',contributions:'github','activité':'github',articles:'blog',posts:'blog',publications:'blog',rss:'blog','écrits':'blog',ecrits:'blog'};
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
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- SCROLL PROGRESS ---------- */
(function(){ try{
  const sp=document.getElementById('scrollprog'); if(!sp) return;
  const d=document.documentElement;
  function upd(){ const max=d.scrollHeight-d.clientHeight; sp.style.width=(max>0?(d.scrollTop/max*100):0)+'%'; }
  addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd,{passive:true}); upd();
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- REVEAL + SKILLBARS + COUNTERS ---------- */
(function(){ try{
  const targets=[...document.querySelectorAll('.reveal')];
  if(!targets.length) return;

  /* Les compteurs sont lancés au moment où leur bloc se découvre ; sans
     animation, ils affichent directement leur valeur cible. */
  const noAnim=fcbMM('(prefers-reduced-motion:reduce)').matches;
  function countUp(el){
    el.querySelectorAll('.counter').forEach(c=>{
      const goal=+c.dataset.count||+c.parentElement.dataset.count||0;
      if(!goal||c.dataset.done) return; c.dataset.done=1;
      if(noAnim){ c.textContent=goal; return; }
      let n=0; const step=Math.max(1,Math.round(goal/34));
      const iv=setInterval(()=>{ n+=step; if(n>=goal){n=goal;clearInterval(iv);} c.textContent=n; },28);
    });
  }
  function show(el){ el.classList.add('in'); countUp(el); }

  /* Pas d'observateur d'intersection : on découvre tout d'un coup. L'état
     masqué de .reveal n'a pas d'autre sortie — sans ce repli, une page
     entièrement transparente. */
  if(!fcbHasIO){ targets.forEach(show); return; }

  const io=new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      show(e.target);
      io.unobserve(e.target);
    });
  },{threshold:.18});
  targets.forEach(el=>io.observe(el));
}catch(e){
  /* Dernier filet : ce bloc est le seul à pouvoir lever l'état masqué des
     .reveal. S'il échoue, on retire la classe qui le pose — mieux vaut une
     page sans animation qu'une page invisible. Aucune autre règle de la
     feuille ne dépend de « :root.js ». */
  try{ document.documentElement.classList.remove('js'); }catch(e2){}
  if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e);
} })();

/* ---------- ACTIVE NAV ---------- */
(function(){ try{
  const links=[...document.querySelectorAll('.topnav a')];
  if(!links.length || !fcbHasIO) return;   /* le surlignage est un confort, pas une fonction */
  const map={}; links.forEach(l=>map[l.dataset.sec]=l);
  const io=new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){
      links.forEach(l=>l.classList.remove('active'));
      const id=e.target.id; if(map[id]) map[id].classList.add('active');
    }});
  },{rootMargin:'-45% 0px -50% 0px'});
  ['accueil','realisations','parcours','code','publications','profil','competences','projets','contact'].forEach(id=>{
    const s=document.getElementById(id); if(s) io.observe(s);
  });
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- MOBILE NAV ---------- */
(function(){ try{
  const b=document.getElementById('burger'), m=document.getElementById('mnav');
  if(!b||!m) return;
  const links=[...m.querySelectorAll('a')];
  const large=fcbMM('(min-width:1141px)');   /* au-delà, le burger n'est plus affiché */
  let open=false;

  /* back : ne ramener le focus au bouton que lorsque la fermeture vient du
     clavier ou du bouton. Au clic sur un lien, le focus doit suivre l'ancre ;
     au passage en grand format, le bouton n'est plus affiché. */
  function set(v,back){
    if(v===open) return;
    open=v;
    b.classList.toggle('open',open);
    m.classList.toggle('open',open);
    b.setAttribute('aria-expanded',open?'true':'false');
    /* même verrou de défilement que la séquence de boot */
    document.body.style.overflow=open?'hidden':'';
    if(open){ if(links[0]) links[0].focus(); }
    else if(back) b.focus();
  }

  b.addEventListener('click',()=>set(!open,true));
  /* clic sur le fond (hors lien) : on referme */
  m.addEventListener('click',(e)=>{ if(e.target===m) set(false); });
  links.forEach(a=>a.addEventListener('click',()=>set(false)));
  /* le logo reste au-dessus de l'overlay : un clic dessus referme aussi */
  const brand=document.querySelector('.topbar .brand');
  if(brand) brand.addEventListener('click',()=>set(false));

  addEventListener('keydown',(e)=>{
    if(!open) return;
    if(e.key==='Escape'){ set(false,true); return; }
    if(e.key!=='Tab') return;
    /* piège à focus : la tabulation tourne entre le bouton et les liens,
       elle ne part pas dans la page restée derrière l'overlay. */
    /* la bascule de thème flotte au-dessus de l'overlay : elle fait partie du
       cycle, sinon elle est cliquable à la souris mais pas au clavier */
    const rt=document.getElementById('readToggle');
    const f=(rt?[b,rt]:[b]).concat(links), i=f.indexOf(document.activeElement);
    let n;
    if(i<0) n = e.shiftKey ? f.length-1 : 0;
    else { n = i + (e.shiftKey?-1:1); if(n<0) n=f.length-1; else if(n>=f.length) n=0; }
    e.preventDefault(); f[n].focus();
  });

  /* retour au format large : l'overlay n'a plus de raison d'être ouvert */
  const reset=()=>{ if(large.matches) set(false); };
  if(large.addEventListener) large.addEventListener('change',reset);
  else if(large.addListener) large.addListener(reset);   /* Safari < 14 */
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- PUBLICATIONS (data/blog.json) ---------- */
(function(){ try{
  const host=document.getElementById('pubList');
  if(!host) return;
  const gid=id=>document.getElementById(id);
  /* Ces deux blocs partent en hidden : tant que le JSON n'a pas répondu, ils
     n'ont rien à montrer. Or un élément en display:none ne croise jamais
     l'observateur qui pose .reveal.in — il faut donc l'ajouter nous-mêmes en
     les découvrant, sinon ils resteraient transparents. */
  const show=e=>{ e.hidden=false; e.classList.add('in'); };

  /* Les quatre chiffres du bandeau, la tuile du héros et les pastilles de
     catégories sortent tous du même JSON que la liste : une seule source, donc
     aucun chiffre à retoucher à la main quand un article paraît. */
  function renderSummary(b){
    const cats=Array.isArray(b.categories)?b.categories:[];
    const years=Array.isArray(b.years)?b.years:[];
    const n=b.count||(Array.isArray(b.posts)?b.posts.length:0);

    const hero=gid('stPosts'); if(hero&&n) hero.textContent=String(n);

    const box=gid('pubStats');
    if(box&&n){
      const put=(id,v)=>{ const e=gid(id); if(e&&v) e.textContent=v; };
      put('pubCount',String(n));
      if(years.length){
        const ys=years.map(y=>String(y.year)).sort();
        put('pubSpan', ys[0]===ys[ys.length-1] ? ys[0] : ys[0]+' → '+ys[ys.length-1]);
      }
      put('pubCats', cats.length?String(cats.length):'');
      const m=Number(b.minutes_total||0);
      if(m>0) put('pubMin', m>=60 ? Math.floor(m/60)+' h '+('0'+(m%60)).slice(-2) : m+' min');
      show(box);
    }

    const chips=gid('pubChips');
    if(chips&&cats.length){
      chips.innerHTML='';
      cats.forEach(c=>{
        if(typeof c.url!=='string'||!/^\/[\w\-./]*$/.test(c.url)) return;
        const a=document.createElement('a'); a.href=c.url;
        a.appendChild(document.createTextNode(c.label||c.slug||''));
        const i=document.createElement('i'); i.textContent=String(c.count||0);
        a.appendChild(i); chips.appendChild(a);
      });
      if(chips.children.length) show(chips);
    }
  }

  fetch('data/blog.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(b=>{
    window.fcbBlog=b;
    renderSummary(b);
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
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();

/* ---------- ACTIVITÉ GITHUB (data/github.json) ---------- */
(function(){ try{
  /* Les 5 niveaux du mur de contributions ne sont plus peints ici : chaque case
     reçoit un attribut data-lv="0".."4" et la feuille de style choisit la teinte
     via les jetons --gh-0 … --gh-4. Un style inline l'emporterait sur toute règle
     CSS et figerait le mur en sombre ; l'attribut, lui, suit le thème tout seul,
     y compris si le visiteur bascule après le chargement du flux.
     Référence des valeurs sombres (identiques à l'ancien tableau LV) :
       --gh-0 #161b25 · --gh-1 rgba(98,224,138,.28) · --gh-2 rgba(98,224,138,.48)
       --gh-3 rgba(98,224,138,.72) · --gh-4 #62e08a */
  const MOIS=['jan','fév','mar','avr','mai','jun','jui','aoû','sep','oct','nov','déc'];
  const LANGC={Python:'#3572A5',PHP:'#4F5D95',JavaScript:'#f1e05a',TypeScript:'#3178c6',PowerShell:'#012456',
    Shell:'#89e051',Tcl:'#e4cc98',Dockerfile:'#384d54','C++':'#f34b7d',C:'#555555','C#':'#178600',
    Java:'#b07219',Dart:'#00B4AB',HTML:'#e34c26',CSS:'#563d7c',Go:'#00ADD8',Ruby:'#701516',Rust:'#dea584'};
  const el=id=>document.getElementById(id);
  const reduce=fcbMM('(prefers-reduced-motion:reduce)').matches;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt=n=>Number(n).toLocaleString('fr-FR');

  /* Couleur de repli des pastilles de langage : les 18 teintes officielles de
     LANGC restent en dur (elles tiennent sur fond clair comme sur fond sombre),
     mais le gris neutre utilisé pour un langage inconnu, lui, doit suivre le
     thème. On le lit donc dans --lang-fallback ; si le jeton est absent, on
     retombe sur l'ancienne valeur en dur pour ne rien casser. */
  function langFallback(){
    let v='';
    try{ v=getComputedStyle(document.documentElement).getPropertyValue('--lang-fallback').trim(); }catch(e){}
    return v||'#7e94b2';
  }

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
        else { const L=lvl(d.count); c.setAttribute('data-lv',String(L)); if(L===4) c.classList.add('lv4');
          c.title=d.count+' contribution'+(d.count>1?'s':'')+' · '+d.date; }
        wk.appendChild(c);
      });
      weeks.appendChild(wk);
    });
    cal.innerHTML=''; cal.appendChild(months); cal.appendChild(weeks);

    const leg=el('ghLegend');
    /* même principe pour la légende « Moins … Plus » : 5 puces, 5 niveaux */
    if(leg){ leg.hidden=false; leg.querySelectorAll('i').forEach((i,k)=>i.setAttribute('data-lv',String(k))); }
  }

  /* Trois chiffres que le mur contient déjà mais ne dit pas : combien de jours
     ont vu au moins un commit, la plus longue série sans interruption, et le
     pic. Recalculés à chaque chargement — donc jamais périmés. */
  function renderKpis(days){
    const box=el('ghKpis'); if(!box) return;
    let active=0, best=0, run=0, streak=0;
    days.forEach(d=>{
      const c=Number(d.count)||0;
      if(c>0){ active++; run++; if(run>streak) streak=run; } else { run=0; }
      if(c>best) best=c;
    });
    if(!active) return;
    const put=(id,v)=>{ const e=el(id); if(e) e.textContent=v; };
    put('ghDays',fmt(active)+' j');
    const hero=el('stDays'); if(hero) hero.textContent=fmt(active)+' j';
    put('ghStreak',fmt(streak)+' j');
    put('ghBest',fmt(best));
    box.hidden=false;
  }

  /* Ce que les dépôts contiennent, en langages : compté sur le flux, pas écrit
     à la main — la liste suit donc ce que je publie réellement. */
  function renderLangs(repos){
    const box=el('ghLangs'); if(!box) return;
    const tally={};
    repos.forEach(r=>{ if(r.lang) tally[r.lang]=(tally[r.lang]||0)+1; });
    const rows=Object.keys(tally).sort((a,b)=>tally[b]-tally[a]||a.localeCompare(b));
    if(!rows.length) return;
    const fb=langFallback();
    box.innerHTML='';
    rows.forEach(lang=>{
      const sp=document.createElement('span');
      const dot=document.createElement('i'); dot.style.background=LANGC[lang]||fb;
      const b=document.createElement('b'); b.textContent=lang;
      sp.appendChild(dot); sp.appendChild(b);
      sp.appendChild(document.createTextNode(' '+tally[lang]));
      box.appendChild(sp);
    });
    box.hidden=false;
  }

  function renderRepos(repos){
    const log=el('ghLog'); if(!log) return;
    log.innerHTML='';
    const fb=langFallback();   /* lu une fois par rendu, pas une fois par dépôt */
    repos.forEach(r=>{
      const row=document.createElement('div'); row.className='gh-log__row';
      const hash=document.createElement('span'); hash.className='gh-hash'; hash.textContent=pseudoHash(r.name);
      const main=document.createElement('div'); main.className='gh-log__main';
      const a=document.createElement('a'); a.className='gh-name'; a.href=r.url; a.target='_blank'; a.rel='noopener'; a.textContent=r.name;
      main.appendChild(a);
      if(r.lang){ const lg=document.createElement('span'); lg.className='gh-lang';
        const dot=document.createElement('span'); dot.className='ld'; dot.style.background=LANGC[r.lang]||fb;
        lg.appendChild(dot); lg.appendChild(document.createTextNode(r.lang)); main.appendChild(lg); }
      if(r.stars>0){ const st=document.createElement('span'); st.className='gh-stars'; st.textContent='★ '+r.stars; main.appendChild(st); }
      const date=document.createElement('span'); date.className='gh-date'; date.textContent=r.updated;
      row.appendChild(hash); row.appendChild(main); row.appendChild(date);
      if(r.desc){ const dsc=document.createElement('div'); dsc.className='gh-desc'; dsc.textContent=r.desc; row.appendChild(dsc); }
      log.appendChild(row);
    });
    const cnt=el('ghRepoCount'); if(cnt) cnt.textContent=repos.length+' repos';
    renderLangs(repos);
  }

  fetch('data/github.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(g=>{
    window.fcbGitHub=g;
    const c=g.contributions||{};
    if(c.total!=null){
      const t=el('ghTotal');
      if(t && !fcbHasIO){ t.textContent=fmt(c.total); }
      else if(t){ const obs=new IntersectionObserver((es)=>{
        es.forEach(e=>{ if(e.isIntersecting){ animateCount(t,c.total); obs.disconnect(); } }); },{threshold:.4});
        obs.observe(t); }
      /* la tuile du héros, elle, est déjà passée quand on arrive : pas d'animation */
      const h=el('stGh'); if(h) h.textContent=fmt(c.total);
    }
    if(Array.isArray(c.days)&&c.days.length){ renderCal(c.days); renderKpis(c.days); }
    if(Array.isArray(g.repos)) renderRepos(g.repos);
    if(g.generated_at){ const gen=el('ghGen'); if(gen){
      try{ gen.textContent='MAJ '+new Date(g.generated_at).toLocaleDateString('fr-BE',{day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){} } }
  }).catch(()=>{
    const cal=el('ghCal'); if(cal) cal.innerHTML='<div class="gh-loading">flux indisponible — <a href="https://github.com/replicatorbe" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">voir directement sur GitHub →</a></div>';
    const log=el('ghLog'); if(log) log.innerHTML='<div class="gh-loading"><a href="https://github.com/replicatorbe" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">github.com/replicatorbe →</a></div>';
  });
}catch(e){ if(window.console&&window.console.warn) window.console.warn('fafchamps.be :',e); } })();
