  /* ---- Backup and restore ---- */
  function dlBackup(payload,name){
    try{
      var url=URL.createObjectURL(new Blob([payload],{type:"application/json"})),a=document.createElement("a");
      a.href=url;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(function(){URL.revokeObjectURL(url)},4000);
    }catch(e){alert("Could not save the backup on this device.");}
  }
  $("bkSave").onclick=function(){
    var payload=JSON.stringify({app:"mymoney",version:1,saved:today(),items:data.items,budget:data.budget,goal:data.goal,recur:data.recur,debts:data.debts},null,1),name="mymoney-backup-"+today()+".json";
    try{
      var file=new File([payload],name,{type:"application/json"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:"My Money backup"}).catch(function(err){if(!err||err.name!=="AbortError")dlBackup(payload,name)});
        return;
      }
    }catch(e){}
    dlBackup(payload,name);
  };
  $("bkLoad").onclick=function(){$("bkFile").click()};
  $("bkFile").onchange=function(){
    var f=this.files&&this.files[0];if(!f)return;this.value="";
    var r=new FileReader();
    r.onload=function(){
      var list=[];
      try{var d=JSON.parse(r.result);list=(d&&d.items)||(Array.isArray(d)?d:[]);}catch(e){alert("This file is not a valid backup.");return;}
      var ok=[];
      list.forEach(function(i,n){
        var amt=parseFloat(i&&i.amt);
        if(i&&(i.type==="in"||i.type==="out")&&amt>0&&/^\d{4}-\d{2}-\d{2}$/.test(i.date))ok.push({id:typeof i.id==="number"?i.id:Date.now()+n,type:i.type,amt:amt,note:String(i.note||"").slice(0,60),date:i.date});
      });
      if(!ok.length){alert("No entries found in this file.");return;}
      if(confirm("Restore "+ok.length+" entries? This replaces your current "+data.items.length+" entries.")){
        data.items=ok;if(d&&!Array.isArray(d)){data.budget=+d.budget||0;data.goal=+d.goal||0;data.recur=Array.isArray(d.recur)?d.recur:[];data.debts=Array.isArray(d.debts)?d.debts:[];}save();render();sheet(false);alert("Restored "+ok.length+" entries.");
      }
    };
    r.readAsText(f);
  };

  /* ---- Edit, summary, goals, recurring, PIN ---- */
  function startEdit(id){
    var i=data.items.filter(function(x){return String(x.id)===String(id)})[0];if(!i)return;
    setType(i.type);pick=i.note;$("amt").value=i.amt;$("date").value=i.date;chips();editId=i.id;$("add").textContent="Save Changes";view("main");
  }
  $("q").oninput=render;
  function histTab(t){
    $("histPane").hidden=t!=="h";$("sumPane").hidden=t!=="s";
    $("tabH").className=t==="h"?"on":"";$("tabS").className=t==="s"?"on":"";
    if(t==="s")renderSum();
  }
  $("tabH").onclick=function(){histTab("h")};
  $("tabS").onclick=function(){histTab("s")};
  var histOpen=$("histBtn").onclick;
  $("histBtn").onclick=function(){histTab("h");histOpen()};
  $("sm").onchange=renderSum;
  function monthLabel(m){var p=m.split("-");return new Date(+p[0],+p[1]-1,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}
  function renderSum(){
    var has={},cur=today().slice(0,7),sel=$("sm"),m=sel.value;
    data.items.forEach(function(i){has[i.date.slice(0,7)]=1});
    var all={};Object.keys(has).forEach(function(k){all[k]=1});all[cur]=1;
    var list=Object.keys(all).sort().reverse();
    if(!m||!all[m]){var hk=Object.keys(has).sort().reverse();m=has[cur]?cur:(hk[0]||cur);}
    sel.innerHTML=list.map(function(k){return '<option value="'+k+'">'+monthLabel(k)+'</option>'}).join("");sel.value=m;
    var tot={},sp=0,inn=0,n=0;
    data.items.forEach(function(i){if(i.date.slice(0,7)!==m)return;n++;if(i.type==="in")inn+=i.amt;else{tot[i.note]=(tot[i.note]||0)+i.amt;sp+=i.amt}});
    var ks=Object.keys(tot).sort(function(a,b){return tot[b]-tot[a]}),mx=ks.length?tot[ks[0]]:1;
    var h='<div class="srow"><span>Money In</span><b>'+fmt(inn)+'</b></div><div class="srow"><span>Spent</span><b>'+fmt(sp)+'</b></div><div class="srow"><span>Net</span><b>'+fmt(inn-sp)+'</b></div>';
    ks.forEach(function(k){h+='<div class="sbar"><div class="sl"><span>'+emoji("out",k)+esc(k)+'</span><b>'+fmt(tot[k])+" ("+Math.round(tot[k]/sp*100)+'%)</b></div><div class="gbar"><i style="width:'+(tot[k]/mx*100)+'%"></i></div></div>'});
    if(!n)h+='<div class="hint">No entries in '+monthLabel(m)+'. Pick another month above.</div>';
    else if(!ks.length)h+='<div class="hint">No spending in '+monthLabel(m)+'.</div>';
    $("sumBody").innerHTML=h;
  }
  $("gSave").onclick=function(){data.budget=Math.max(0,parseFloat($("gBud").value)||0);data.goal=Math.max(0,parseFloat($("gGoal").value)||0);save();render();sheet(false)};
  function pad(n){return n<10?"0"+n:""+n}
  function addD(s,n){var p=s.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]+n);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
  function addM(s,dom){var p=s.split("-"),y=+p[0],m=+p[1],ny=m===12?y+1:y,nm=m===12?1:m+1,dim=new Date(ny,nm,0).getDate();return ny+"-"+pad(nm)+"-"+pad(Math.min(dom,dim))}
  function processRecur(){
    var t=today(),ch=false,k=0;
    data.recur.forEach(function(r){var g=0;while(r.next<=t&&g++<400){data.items.push({id:Date.now()+(k++),type:r.type,amt:r.amt,note:r.note,date:r.next});r.next=r.every==="w"?addD(r.next,7):addM(r.next,r.dom);ch=true}});
    if(ch){save();render()}
  }
  function recHtml(){
    var h="";data.recur.forEach(function(r){h+='<div class="rrow"><span>'+emoji(r.type,r.note)+esc(r.note)+" "+fmt(r.amt)+" "+(r.every==="w"?"weekly":"monthly")+'</span><button type="button" class="mini" data-r="'+r.id+'">Remove</button></div>'});
    $("recList").innerHTML=h||'<div class="hint">None yet. Use "Repeat" when adding an entry.</div>';
  }
  $("recList").onclick=function(e){var id=e.target.getAttribute&&e.target.getAttribute("data-r");if(!id)return;data.recur=data.recur.filter(function(r){return String(r.id)!==id});save();recHtml()};
  function hsh(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return String(h)}
  function pinSet(){return !!lsGet("mymoney.pin")}
  function pinLabel(){$("pinBtn").textContent=pinSet()?"Remove PIN Lock":"Set PIN Lock"}
  $("pinBtn").onclick=function(){
    if(pinSet()){var p=prompt("Enter your PIN to remove it:");if(p!==null){if(hsh(p)===lsGet("mymoney.pin")){try{localStorage.removeItem("mymoney.pin")}catch(e){}}else alert("Wrong PIN.");}}
    else{var n=prompt("Choose a 4-digit PIN:");if(n!==null){if(/^\d{4}$/.test(n))lsSet("mymoney.pin",hsh(n));else alert("The PIN must be 4 digits.");}}
    pinLabel();
  };
  function initLock(){if(pinSet())$("lock").hidden=false}
  function unlock(){if(hsh($("lockIn").value)===lsGet("mymoney.pin")){$("lock").hidden=true;$("lockIn").value="";$("lockErr").textContent=""}else $("lockErr").textContent="Wrong PIN"}
  $("lockBtn").onclick=unlock;
  $("lockIn").onkeydown=function(e){if(e.key==="Enter")unlock()};
  var hiddenAt=0;
  document.addEventListener("visibilitychange",function(){if(document.hidden)hiddenAt=Date.now();else if(pinSet()&&hiddenAt&&Date.now()-hiddenAt>60000)$("lock").hidden=false});

  function setSize(s,save){
    var m={s:.88,m:1,l:1.15};document.documentElement.style.setProperty("--bs",m[s]||1);
    Array.prototype.forEach.call($("sizes").children,function(b){b.className="sz"+(b.getAttribute("data-s")===s?" on":"")});
    if(save)lsSet("mymoney.size",s);
  }
  $("sizes").onclick=function(e){var s=e.target.getAttribute&&e.target.getAttribute("data-s");if(s)setSize(s,true)};
  setSize(lsGet("mymoney.size")||"m",false);
  var photoH=0,vfit=lsGet("mymoney.vfit")||"fill";
  function fitVid(){
    var v=$("vid");if(v.hidden||!v.videoWidth||!photoH)return;
    var W=window.innerWidth,sc=vfit==="fit"?Math.min(W/v.videoWidth,photoH/v.videoHeight):Math.max(W/v.videoWidth,photoH/v.videoHeight);
    v.style.width=(v.videoWidth*sc)+"px";v.style.height=(v.videoHeight*sc)+"px";v.style.top=(photoH/2)+"px";$("photo").style.backgroundColor=vfit==="fit"?"#000":"";
  }
  $("vid").onloadedmetadata=fitVid;
  function setFit(f,save){
    vfit=f;Array.prototype.forEach.call($("vfit").children,function(b){b.className="sz"+(b.getAttribute("data-f")===f?" on":"")});
    if(save)lsSet("mymoney.vfit",f);fitVid();
  }
  $("vfit").onclick=function(e){var f=e.target.getAttribute&&e.target.getAttribute("data-f");if(f)setFit(f,true)};
  setFit(vfit,false);
  function fixPhoto(){var h=window.innerHeight,p=$("photo");if(h>photoH){photoH=h;p.style.height=h+"px";}fitVid();}
  fixPhoto();window.addEventListener("resize",fixPhoto);
  load();processRecur();initLock();applyBg();getVid(function(b){if(b)showVid(b)});$("date").value=today();chips();render();

