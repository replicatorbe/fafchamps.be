/* Filtres de l'index : catégorie / année / mois / tag + sens du tri.
   Tout est fait sur le DOM déjà rendu — aucune requête, aucun rechargement.
   L'état est recopié dans l'URL (?cat=&annee=&mois=&tag=&tri=) pour être
   partageable, et relu au chargement. */
(function(){
  var bar=document.getElementById("filterbar"), list=document.getElementById("postlist");
  if(!bar||!list) return;
  var rows=[].slice.call(list.querySelectorAll("li"));        // ordre d'origine : décroissant
  var selCat=document.getElementById("fCat"), selY=document.getElementById("fYear"),
      selM=document.getElementById("fMonth"), selT=document.getElementById("fTag"),
      cnt=document.getElementById("fCount"), none=document.getElementById("noresult"),
      bDesc=document.getElementById("fDesc"), bAsc=document.getElementById("fAsc"),
      reset=document.getElementById("fReset");
  var MOIS=["janvier","février","mars","avril","mai","juin",
            "juillet","août","septembre","octobre","novembre","décembre"];
  var order="desc";

  /* Le sélecteur de mois ne propose que les mois réellement présents dans
     l'année choisie — sinon on offre des filtres qui ne renvoient rien. */
  function refreshMonths(){
    var y=selY.value, garde=selM.value, vus={};
    rows.forEach(function(li){ if(!y||li.dataset.y===y) vus[li.dataset.m]=1; });
    var ms=Object.keys(vus).sort();
    selM.innerHTML="";
    var o=document.createElement("option"); o.value=""; o.textContent="tous les mois";
    selM.appendChild(o);
    ms.forEach(function(m){
      var op=document.createElement("option");
      op.value=m; op.textContent=MOIS[parseInt(m,10)-1]||m;
      selM.appendChild(op);
    });
    selM.value = ms.indexOf(garde)>-1 ? garde : "";
    selM.disabled = ms.length<2;
  }

  function apply(){
    var c=selCat.value, y=selY.value, m=selM.value, t=selT?selT.value:"", n=0;
    rows.forEach(function(li){
      var ok=(!c||li.dataset.cat===c) && (!y||li.dataset.y===y) && (!m||li.dataset.m===m)
          && (!t||(" "+li.dataset.tags+" ").indexOf(" "+t+" ")>-1);
      li.hidden=!ok; if(ok) n++;
    });
    if(cnt) cnt.textContent=n+(n>1?" articles":" article");
    if(none) none.hidden=n>0;
    bDesc.classList.toggle("on",order==="desc");
    bAsc.classList.toggle("on",order==="asc");
    var u=new URL(location.href);
    [["cat",c],["annee",y],["mois",m],["tag",t],["tri",order==="asc"?"asc":""]]
      .forEach(function(kv){ if(kv[1]) u.searchParams.set(kv[0],kv[1]); else u.searchParams.delete(kv[0]); });
    history.replaceState(null,"",u);
  }

  function trier(o){
    order=o;
    (order==="asc"?rows.slice().reverse():rows).forEach(function(li){ list.appendChild(li); });
    apply();
  }

  [selCat,selY,selT].forEach(function(sel){
    if(sel) sel.addEventListener("change",function(){ refreshMonths(); apply(); });
  });
  selM.addEventListener("change",apply);
  bDesc.addEventListener("click",function(){ trier("desc"); });
  bAsc.addEventListener("click",function(){ trier("asc"); });
  reset.addEventListener("click",function(){
    selCat.value=""; selY.value=""; if(selT) selT.value="";
    refreshMonths(); trier("desc");
  });

  var q=new URLSearchParams(location.search);
  function poser(sel,val){
    if(!sel||!val) return;
    for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===val){ sel.value=val; return; } }
  }
  poser(selCat,(q.get("cat")||"").toLowerCase());
  poser(selY,q.get("annee"));
  poser(selT,(q.get("tag")||"").toLowerCase());
  refreshMonths();
  poser(selM,q.get("mois"));
  if(q.get("tri")==="asc") trier("asc"); else apply();
})();
