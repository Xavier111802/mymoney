  /* ---- Button colors ---- */
  var THEMES=[["Blue","#2f8bff","#2f8bff"],["Red","#e02424","#e02424"],["Green","#12b87a","#12b87a"],["Yellow","#ffc01a","#ffc01a"],["Purple","#7b4dff","#7b4dff"],["Pink","#e84a9c","#e84a9c"],["Black","#1a1d25","#1a1d25"],["Orange","#ff7a1a","#ff7a1a"],["Cyan","#0bb3d9","#0bb3d9"]],
      OLD=[["#35b4ff","#2f6bff"],["#f03030","#d82020"],["#5ff0b0","#12a36a"],["#ffe45e","#ffb300"],["#b08cff","#6a3dff"],["#ff8ccb","#e0359a"],["#5a606e","#111318"],["#ffbf5a","#ff6a1a"],["#6ef0ff","#0bb3d9"]];
  var pre=[THEMES[0][1],THEMES[0][2]],cus=pre.slice(),custom=false,cusSet=false,which=0,lastL=50;
  function act(){return custom?cus:pre}
  function hexA(h,a){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"}
  function hx(n){n=Math.max(0,Math.min(255,Math.round(n)));return (n<16?"0":"")+n.toString(16)}
  function toHsl(h){
    var n=parseInt(h.slice(1),16),r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn,s=0,hh=0;
    if(d){s=d/(1-Math.abs(2*l-1));if(mx===r)hh=((g-b)/d)%6;else if(mx===g)hh=(b-r)/d+2;else hh=(r-g)/d+4;hh*=60;if(hh<0)hh+=360;}
    return [hh,s,l*100];
  }
  function fromHsl(h,s,l){
    l/=100;var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;
    if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
    return "#"+hx((r+m)*255)+hx((g+m)*255)+hx((b+m)*255);
  }
  function markSw(){var a=act();Array.prototype.forEach.call($("swatches").children,function(el){var t=THEMES[+el.getAttribute("data-i")];el.className="sw"+(t[1]===a[0]&&t[2]===a[1]?" on":"");});}
  function syncSlider(){var v=Math.round(toHsl(cus[which?which-1:0])[2]);v=Math.max(5,Math.min(95,v));$("bright").value=v;lastL=v;}
  function applyTheme(){
    var a=act(),c1=a[0],c2=a[1],s=document.documentElement.style;
    s.setProperty("--g1",c1);s.setProperty("--g2",c2);s.setProperty("--g1a",hexA(c1,.6));s.setProperty("--g2a",hexA(c2,.6));
    markSw();
    $("d1").style.background=cus[0];$("d2").style.background=cus[1];
    $("d1").className="cdot"+(which===1?" on":"");$("d2").className="cdot"+(which===2?" on":"");
    $("customBtn").setAttribute("aria-checked",custom?"true":"false");$("tgTxt").textContent=custom?"ON":"OFF";
    $("customBox").hidden=!custom;
  }
  function saveTheme(){lsSet("mymoney.theme",pre.join(","));lsSet("mymoney.cus",cus.join(","));lsSet("mymoney.custom",custom?"1":"0")}
  var sw="";THEMES.forEach(function(t,i){sw+='<button type="button" class="sw" data-i="'+i+'" aria-label="'+t[0]+'" style="background:linear-gradient(135deg,'+t[1]+','+t[2]+')"></button>'});
  $("swatches").innerHTML=sw;
  $("swatches").onclick=function(e){
    var i=e.target.getAttribute&&e.target.getAttribute("data-i");if(i===null||i===undefined)return;
    var t=THEMES[+i];
    if(custom){
      cusSet=true;
      if(which===1)cus[0]=t[1];else if(which===2)cus[1]=t[2];else cus=[t[1],t[2]];
    }else pre=[t[1],t[2]];
    saveTheme();syncSlider();applyTheme();
  };
  $("customBtn").onclick=function(){
    custom=!custom;which=0;
    if(custom&&!cusSet)cus=pre.slice();
    saveTheme();syncSlider();applyTheme();
  };
  $("d1").onclick=function(){which=which===1?0:1;syncSlider();applyTheme()};
  $("d2").onclick=function(){which=which===2?0:2;syncSlider();applyTheme()};
  $("bright").oninput=function(){
    if(!custom)return;cusSet=true;
    var v=+this.value,d=v-lastL;lastL=v;
    (which?[which-1]:[0,1]).forEach(function(i){var a=toHsl(cus[i]);cus[i]=fromHsl(a[0],a[1],Math.max(3,Math.min(97,a[2]+d)));});
    saveTheme();applyTheme();
  };
  (function(){
    var hexre=/^#[0-9a-f]{6}$/i;
    function parse(k){var t=lsGet(k),p=t?t.split(","):null;return(p&&p.length===2&&hexre.test(p[0])&&hexre.test(p[1]))?p:null}
    function isPre(p){return THEMES.some(function(t){return t[1]===p[0]&&t[2]===p[1]})}
    function mapOld(p){var oi=-1;OLD.forEach(function(o,i){if(o[0]===p[0]&&o[1]===p[1])oi=i});return oi>=0?[THEMES[oi][1],THEMES[oi][2]]:null}
    var t=parse("mymoney.theme"),cs=parse("mymoney.cus"),flag=lsGet("mymoney.custom")==="1";
    if(cs){
      cus=cs;cusSet=true;custom=flag;
      if(t)pre=isPre(t)?t:(mapOld(t)||pre);
    }else if(t){
      if(flag||(!isPre(t)&&!mapOld(t))){cus=t;cusSet=true;custom=true;}
      else pre=isPre(t)?t:mapOld(t);
    }
    syncSlider();applyTheme();
  })();

  /* ---- Music ---- */
  var aud=$("aud");
  function syncPlay(){$("musicPlay").innerHTML=aud.paused?"&#9654; Play":"&#10074;&#10074; Pause"}
  function tryPlay(){try{var p=aud.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
  function setMusic(b,name){
    if(aud.dataset.u)URL.revokeObjectURL(aud.dataset.u);
    var u=URL.createObjectURL(b);aud.dataset.u=u;aud.src=u;
    var v=parseFloat(lsGet("mymoney.vol"));if(isNaN(v))v=0.6;aud.volume=v;$("musicVol").value=v;
    var mb=$("musicBtn");mb.className="musicbtn has";mb.innerHTML='<span class="mn"></span><span class="chg">Change</span>';mb.firstChild.textContent="\uD83C\uDFB5 "+(name||"Music");
    $("musicRow").hidden=false;syncPlay();
  }
  aud.onplay=aud.onpause=syncPlay;
  $("musicBtn").onclick=function(){$("musicFile").click()};
  $("musicFile").onchange=function(){
    var f=this.files&&this.files[0];if(!f)return;this.value="";
    if(f.size>40*1024*1024){alert("This music file is too big. Pick one under 40 MB.");return;}
    putK("mus",f,function(ok){
      if(!ok){alert("Could not save this music.");return;}
      lsSet("mymoney.musicName",f.name);lsSet("mymoney.musicOn","1");
      setMusic(f,f.name);tryPlay();
    });
  };
  $("musicPlay").onclick=function(){
    if(aud.paused){lsSet("mymoney.musicOn","1");tryPlay();}else{lsSet("mymoney.musicOn","0");aud.pause();}
  };
  $("musicVol").oninput=function(){aud.volume=+this.value;lsSet("mymoney.vol",this.value)};
  $("musicDel").onclick=function(){
    aud.pause();aud.removeAttribute("src");try{aud.load()}catch(e){}
    delK("mus");lsSet("mymoney.musicName","");lsSet("mymoney.musicOn","0");$("musicRow").hidden=true;$("musicBtn").className="musicbtn";$("musicBtn").textContent="Choose Music (mp3)";
  };
  document.addEventListener("pointerdown",function(){if(aud.getAttribute("src")&&aud.paused&&lsGet("mymoney.musicOn")==="1")tryPlay();});
  getK("mus",function(b){if(b)setMusic(b,lsGet("mymoney.musicName"))});

                        
