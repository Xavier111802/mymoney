/* ---- Categories: add, select and delete, restore ---- */
var CK="mymoney.cats",HK="mymoney.hid",mine={out:[],"in":[]},hid={out:[],"in":[]},sel={},DEF=JSON.parse(JSON.stringify(CATS));
function rebuildCats(){["out","in"].forEach(function(t){CATS[t]=DEF[t].filter(function(c){return hid[t].indexOf(c[1])<0}).concat(mine[t])})}
function loadCats(){
  try{var c=JSON.parse(localStorage.getItem(CK)||"null");if(c){mine.out=c.out||[];mine["in"]=c["in"]||[]}}catch(e){}
  try{var h=JSON.parse(localStorage.getItem(HK)||"null");if(h){hid.out=h.out||[];hid["in"]=h["in"]||[]}}catch(e){}
  rebuildCats();
}
function saveCats(){lsSet(CK,JSON.stringify(mine));lsSet(HK,JSON.stringify(hid))}
function catHtml(){
  var h="",n=0;
  ["out","in"].forEach(function(t){
    h+='<div style="margin-top:12px;font-size:13px;font-weight:700;color:#cfc8f3">'+(t==="out"?"Expense":"Money In")+'</div>';
    CATS[t].forEach(function(c,i){
      var on=!!sel[t+"|"+c[1]];if(on)n++;
      h+='<div data-t="'+t+'" data-i="'+i+'" style="display:flex;align-items:center;gap:12px;padding:9px 6px;margin-top:2px;border-radius:10px;cursor:pointer;'+(on?'background:rgba(255,255,255,.12);':'')+'"><span style="width:24px;height:24px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex:none;'+(on?'background:var(--g1);':'')+'">'+(on?"&#10003;":"")+'</span><span>'+esc(c[0])+" "+esc(c[1])+'</span></div>';
    });
  });
  $("cList").innerHTML=h;
  $("catDelSel").textContent="Delete Selected"+(n?" ("+n+")":"");$("catDelSel").style.opacity=n?1:.5;
}
function addCat(t){
  var n=$("cName").value.trim().slice(0,20),e=$("cEmo").value.trim()||"\uD83C\uDFF7\uFE0F";if(!n)return;
  if(CATS[t].some(function(c){return c[1].toLowerCase()===n.toLowerCase()})){alert("That category already exists.");return}
  mine[t].push([e,n]);saveCats();rebuildCats();$("cName").value="";$("cEmo").value="";catHtml();chips();
}
$("cAddOut").onclick=function(){addCat("out")};
$("cAddIn").onclick=function(){addCat("in")};
$("cList").onclick=function(e){
  var r=e.target.closest&&e.target.closest("[data-t]");if(!r)return;
  var t=r.getAttribute("data-t"),c=CATS[t][+r.getAttribute("data-i")];if(!c)return;
  var k=t+"|"+c[1];if(sel[k])delete sel[k];else sel[k]=[t,c[1]];catHtml();
};
$("catDelSel").onclick=function(){
  var ks=Object.keys(sel);if(!ks.length){toast("Tap the categories you want to delete first","OK");return}
  if(!confirm("Delete "+ks.length+" selected "+(ks.length===1?"category":"categories")+"? Old entries keep their name."))return;
  ks.forEach(function(k){var t=sel[k][0],n=sel[k][1],ix=mine[t].map(function(c){return c[1]}).indexOf(n);if(ix>=0)mine[t].splice(ix,1);else if(hid[t].indexOf(n)<0)hid[t].push(n);if(pick===n)pick=""});
  sel={};saveCats();rebuildCats();chips();catHtml();
};
$("catRestore").onclick=function(){hid={out:[],"in":[]};sel={};saveCats();rebuildCats();chips();catHtml();toast("Default categories restored","OK")};
$("catDelOpen").onclick=function(){sel={};catHtml();$("delSheet").hidden=false};
$("delClose").onclick=function(){$("delSheet").hidden=true};
$("delSheet").onclick=function(e){if(e.target===this)this.hidden=true};
var chipsBase=chips;
chips=function(){chipsBase();if(!CATS[type].length)$("catList").innerHTML='<div class="hint">No categories. Add one in Settings, under My Categories.</div>'};

/* ---- Toast + undo ---- */
var toastFn=null,toastT=0;
function toast(msg,label,fn,ms){
  $("toastTxt").textContent=msg;$("toastBtn").textContent=label||"OK";toastFn=fn||null;$("toast").hidden=false;
  clearTimeout(toastT);toastT=setTimeout(function(){$("toast").hidden=true},ms||6000);
}
$("toastBtn").onclick=function(){$("toast").hidden=true;if(toastFn){var f=toastFn;toastFn=null;f()}};
function showUndo(it){if(!it)return;toast("Entry deleted","Undo",function(){data.items.push(it);save();render()},7000)}

/* ---- Export To Excel (CSV) ---- */
function dlFile(text,name,mime){
  try{var u=URL.createObjectURL(new Blob([text],{type:mime})),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u)},4000);}
  catch(e){alert("Could not save the file.")}
}
function shareFile(text,name,mime){
  try{var f=new File([text],name,{type:mime});
    if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(function(e){if(!e||e.name!=="AbortError")dlFile(text,name,mime)});return}
  }catch(e){}
  dlFile(text,name,mime);
}
$("csvBtn").onclick=function(){
  var rows=["Date,Type,Category,Amount"];
  data.items.slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:a.id-b.id}).forEach(function(i){
    rows.push([i.date,i.type==="in"?"Money In":"Expense",'"'+String(i.note).replace(/"/g,'""')+'"',i.amt].join(","));
  });
  shareFile("\ufeff"+rows.join("\r\n"),"mymoney-"+today()+".csv","text/csv");
};

/* ---- Debt tracker ---- */
function debtHtml(){
  var to=0,from=0,h="";
  (data.debts||[]).forEach(function(d){
    if(d.paid)return;if(d.dir==="to")to+=d.amt;else from+=d.amt;
    h+='<div class="item"><div class="n"><b>'+esc(d.who)+'</b><br><small>'+(d.dir==="to"?"owes you":"you owe")+(d.note?" \u00b7 "+esc(d.note):"")+" \u00b7 "+d.date+'</small></div><div class="a '+(d.dir==="to"?"in":"out")+'">'+fmt(d.amt)+'</div><button type="button" class="mini2" data-p="'+d.id+'">Paid</button></div>';
  });
  $("debtTot").innerHTML='<div class="srow"><span>Owed To You</span><b>'+fmt(to)+'</b></div><div class="srow"><span>You Owe</span><b>'+fmt(from)+'</b></div>';
  $("debtList").innerHTML=h||'<div class="empty">No unpaid debt.</div>';
}
$("dAdd").onclick=function(){
  var w=$("dWho").value.trim(),a=parseFloat($("dAmt").value);
  if(!w||!(a>0)){toast("Enter a name and an amount","OK");return}
  data.debts=data.debts||[];
  data.debts.push({id:Date.now(),who:w.slice(0,30),amt:a,dir:$("dDir").value,note:$("dNote").value.trim().slice(0,40),date:today(),paid:false});
  save();$("dWho").value="";$("dAmt").value="";$("dNote").value="";debtHtml();
};
$("debtList").onclick=function(e){
  var id=e.target.getAttribute&&e.target.getAttribute("data-p");if(!id)return;
  var d=(data.debts||[]).filter(function(x){return String(x.id)===id})[0];if(!d)return;
  d.paid=true;save();debtHtml();toast("Marked as paid","Undo",function(){d.paid=false;save();debtHtml()},6000);
};
$("debtBtn").onclick=function(){debtHtml();view("debt")};
$("debtBack").onclick=function(){view("main")};

/* ---- Daily Reminder (shows when the app is open) ---- */
function checkRemind(){
  var t=lsGet("mymoney.rem");if(!t)return;
  var d=new Date(),hm=("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2),td=today();
  if(hm<t||lsGet("mymoney.remDay")===td)return;
  if(data.items.some(function(i){return i.date===td&&i.type==="out"}))return;
  lsSet("mymoney.remDay",td);
  toast("Reminder: you haven't logged any spending today","Add",function(){view("main")},10000);
}
$("remT").onchange=function(){lsSet("mymoney.rem",this.value);lsSet("mymoney.remDay","");checkRemind()};
$("remOff").onclick=function(){lsSet("mymoney.rem","");$("remT").value=""};
var gearOld=$("gear").onclick;
$("gear").onclick=function(){gearOld();closePage();sel={};catHtml();var nm=lsGet("mymoney.name");$("nameIn").value=nm===null?"Xavier":nm;$("remT").value=lsGet("mymoney.rem")||""};
document.addEventListener("visibilitychange",function(){if(!document.hidden)checkRemind()});
setInterval(checkRemind,60000);

/* ---- Delete All History ---- */
$("delAll").onclick=function(){
  var n=data.items.length;if(!n){toast("History is already empty","OK");return}
  if(!confirm("Delete all "+n+" entries in History? You can undo right after."))return;
  var old=data.items;data.items=[];save();render();
  toast("History deleted","Undo",function(){data.items=old;save();render()},10000);
};

/* ---- Settings pages ---- */
function openPage(acc){
  var sb=$("sheet").querySelector(".sbody");sb.classList.add("inpage");acc.classList.add("open");
  acc.querySelector(".abody").hidden=false;$("setTitle").textContent=acc.querySelector(".ahead span").textContent;
  $("setBack").style.display="inline-block";$("closeSheet").style.display="none";sb.scrollTop=0;
}
function closePage(){
  var sb=$("sheet").querySelector(".sbody");sb.classList.remove("inpage");
  Array.prototype.forEach.call(sb.querySelectorAll(".acc.open"),function(a){a.classList.remove("open");a.querySelector(".abody").hidden=true});
  $("setTitle").textContent="Settings";$("setBack").style.display="none";$("closeSheet").style.display="";
}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".ahead");if(b)openPage(b.parentNode)});
$("setBack").onclick=closePage;

/* ---- Your name ---- */
function showName(){var n=lsGet("mymoney.name");if(n===null)n="Xavier";$("wname").textContent=n;$("welcome").hidden=!n}
$("nameSave").onclick=function(){lsSet("mymoney.name",$("nameIn").value.trim().slice(0,20));showName();toast("Name saved","OK");closePage()};
showName();

/* ---- Backup and CSV as text (works when file downloads do not) ---- */
var txtMode="b";
function backupText(){return JSON.stringify({app:"mymoney",version:1,saved:today(),items:data.items,budget:data.budget,goal:data.goal,recur:data.recur,debts:data.debts})}
function csvText(){
  var rows=["Date,Type,Category,Amount"];
  data.items.slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:a.id-b.id}).forEach(function(i){
    rows.push([i.date,i.type==="in"?"Money In":"Expense",'"'+String(i.note).replace(/"/g,'""')+'"',i.amt].join(","));
  });
  return rows.join("\n");
}
function openTxt(m){
  txtMode=m;
  $("txtTitle").textContent=m==="b"?"Backup Text":"Excel (CSV) Text";
  $("txtHint").textContent=m==="b"?"Tap Copy, then paste it into a note or message to yourself. To restore later: clear this box, paste your saved text, and tap Restore From Text.":"Tap Copy, then paste it into Google Sheets or Excel. If it stays in one column, use Split Text To Columns.";
  $("txtArea").value=m==="b"?backupText():csvText();
  $("txtRestore").style.display=m==="b"?"block":"none";
  $("txtSheet").hidden=false;
}
$("bkTxt").onclick=function(){openTxt("b")};
$("csvTxt").onclick=function(){openTxt("c")};
$("txtClose").onclick=function(){$("txtSheet").hidden=true};
$("txtSheet").onclick=function(e){if(e.target===this)this.hidden=true};
$("txtCopy").onclick=function(){
  var ta=$("txtArea"),ok=false;
  try{ta.readOnly=true;ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);ok=document.execCommand("copy")}catch(e){}
  ta.readOnly=false;ta.blur();
  if(ok)toast("Copied","OK");
  else if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(function(){toast("Copied","OK")},function(){toast("Press and hold the text, then tap Copy","OK",null,8000)});
  else toast("Press and hold the text, then tap Copy","OK",null,8000);
};
$("txtRestore").onclick=function(){
  var d,list=[];
  try{d=JSON.parse($("txtArea").value.trim());list=(d&&d.items)||(Array.isArray(d)?d:[])}catch(e){toast("That text is not a valid backup","OK");return}
  var ok=[];
  list.forEach(function(i,n){
    var amt=parseFloat(i&&i.amt);
    if(i&&(i.type==="in"||i.type==="out")&&amt>0&&/^\d{4}-\d{2}-\d{2}$/.test(i.date))ok.push({id:typeof i.id==="number"?i.id:Date.now()+n,type:i.type,amt:amt,note:String(i.note||"").slice(0,60),date:i.date});
  });
  if(!ok.length){toast("No entries found in that text","OK");return}
  if(!confirm("Restore "+ok.length+" entries? This replaces your current "+data.items.length+" entries."))return;
  data.items=ok;
  if(d&&!Array.isArray(d)){data.budget=+d.budget||0;data.goal=+d.goal||0;data.recur=Array.isArray(d.recur)?d.recur:[];data.debts=Array.isArray(d.debts)?d.debts:[]}
  save();render();$("txtSheet").hidden=true;toast("Restored "+ok.length+" entries","OK");
};

loadCats();chips();checkRemind();
    
