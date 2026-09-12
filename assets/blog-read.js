/* Bascule « mode lecture » — thème clair, effets désactivés.
   Le choix est relu dans le <head> par le script anti-clignotement. */
(function(){
  var b=document.getElementById("readToggle"); if(!b) return;
  var r=document.documentElement;
  function sync(){ b.setAttribute("aria-pressed", r.getAttribute("data-read")==="on" ? "true":"false"); }
  sync();
  b.addEventListener("click",function(){
    var on = r.getAttribute("data-read")==="on";
    if(on){ r.removeAttribute("data-read"); } else { r.setAttribute("data-read","on"); }
    try{ localStorage.setItem("fcb_read", on ? "0" : "1"); }catch(e){}
    sync();
  });
})();
