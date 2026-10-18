  var KEY="mymoney.v1", data={items:[],budget:0,goal:0,recur:[],debts:[]}, type="out", pick="", editId=null;
  var CATS={
    out:[["🍚","Food"],["🚌","Transport"],["📱","Load"],["🧾","Bills"],["🛍️","Shopping"],["📚","School"],["🎮","Games"],["💖","Honey Palangga"]],
    "in":[["💵","Allowance"],["💼","Salary"],["🎁","Gift"],["💖","Honey Palangga"]]
  };
  function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&d.items){data={items:d.items,budget:+d.budget||0,goal:+d.goal||0,recur:Array.isArray(d.recur)?d.recur:[],debts:Array.isArray(d.debts)?d.debts:[]};data.items.forEach(function(i){if(i.note==="Other")i.note="Honey Palangga"});}}}catch(e){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}}
  function $(id){return document.getElementById(id)}
  function today(){var d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
  function fmt(n){return "₱"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
  function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML}
  function emoji(t,name){var l=CATS[t]||[];for(var i=0;i<l.length;i++)if(l[i][1]===name)return l[i][0]+" ";return ""}
  function dayLabel(s){
    if(s===today())return "Today";
    var y=new Date();y.setDate(y.getDate()-1);y.setMinutes(y.getMinutes()-y.getTimezoneOffset());
    if(s===y.toISOString().slice(0,10))return "Yesterday";
    var p=s.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);
    return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"});
  }
  function chips(){
    var h="";CATS[type].forEach(function(c){
      h+='<button type="button" class="ci'+(pick===c[1]?" on":"")+'" data-c="'+c[1]+'">'+c[0]+" "+c[1]+'</button>';
    });
    $("catList").innerHTML=h;
    $("catBtn").className="catbtn";
    $("catBtn").innerHTML="<span>"+(pick?emoji(type,pick)+pick:"Pick one")+"</span><span>&#9662;</span>";
  }
  function match(i){var q=$("q").value.trim().toLowerCase();return !q||(i.note+" "+i.amt+" "+i.date).toLowerCase().indexOf(q)>-1}
  function render(){
    var tin=0,tout=0,td=0,t=today(),groups={};
    data.items.forEach(function(i){
      if(i.type==="in")tin+=i.amt;else{tout+=i.amt;if(i.date===t)td+=i.amt;}
      if(match(i))(groups[i.date]=groups[i.date]||[]).push(i);
    });
    var left=tin-tout;
    var el=$("left");el.textContent=(left<0?"-":"")+fmt(Math.abs(left));el.className="big"+(left<0?" neg":"");
    $("tin").textContent=fmt(tin);$("tout").textContent=fmt(tout);$("today").textContent=fmt(td);
    var bd=data.budget||0,bw=$("bwarn");
    if(bd>0){var lf=bd-td;bw.hidden=false;bw.className="gline "+(lf<0?"bad":td>=bd*.8?"warn":"ok");bw.textContent=lf<0?"Over today's budget by "+fmt(-lf):(td>=bd*.8?"Almost at today's budget: ":"Today's budget left: ")+fmt(lf);}else bw.hidden=true;
    var gl=data.goal||0;
    if(gl>0){var pc=Math.max(0,Math.min(100,left/gl*100));$("goalw").hidden=false;$("gfill").style.width=pc+"%";$("gtxt").textContent="Savings Goal "+fmt(gl)+": "+Math.round(pc)+"%";}else $("goalw").hidden=true;
    var dates=Object.keys(groups).sort().reverse(),h="";
    if(!dates.length)h='<div class="empty">Nothing yet. Add your starting money first, then log what you spend.</div>';
    dates.forEach(function(d){
      var spent=0;groups[d].forEach(function(i){if(i.type==="out")spent+=i.amt});
      h+='<div class="day">'+dayLabel(d)+'<span>Spent '+fmt(spent)+'</span></div>';
      groups[d].slice().sort(function(a,b){return b.id-a.id}).forEach(function(i){
        h+='<div class="item" data-e="'+i.id+'"><div class="n">'+emoji(i.type,i.note)+(esc(i.note)||(i.type==="in"?"Money In":"Expense"))+'</div>'+
           '<div class="a '+i.type+'">'+(i.type==="in"?"+":"-")+fmt(i.amt)+'</div>'+
           '<button type="button" data-id="'+i.id+'" aria-label="Delete">&times;</button></div>';
      });
    });
    $("list").innerHTML=h;$("histBtn").textContent=data.items.length?"History ("+data.items.length+")":"History";
  }
  function setType(t){
    type=t;pick="";editId=null;$("rep").value="";$("bOut").className=t==="out"?"on":"";$("bIn").className=t==="in"?"on":"";
    $("add").textContent=t==="out"?"Add Expense":"Add Money";
    $("catLabel").className="";chips();
  }
  $("bOut").onclick=function(){setType("out")};
  $("bIn").onclick=function(){setType("in")};
  $("catBtn").onclick=function(){$("catSheet").hidden=false};
  $("catClose").onclick=function(){$("catSheet").hidden=true};
  $("catSheet").onclick=function(e){if(e.target===this)this.hidden=true};
  $("catList").onclick=function(e){
    var c=e.target.getAttribute&&e.target.getAttribute("data-c");
    if(!c)return;pick=c;$("catLabel").className="";chips();$("catSheet").hidden=true;
  };
  $("add").onclick=function(){
    var a=parseFloat($("amt").value);
    if(!(a>0)){if(typeof toast==="function")toast("Enter an amount first","OK");return;}
    if(!pick){$("catLabel").className="err";$("catBtn").className="catbtn err";return;}
    var dt=$("date").value||today(),rp=$("rep").value;
    if(editId){var it=data.items.filter(function(x){return x.id===editId})[0];if(it){it.type=type;it.amt=a;it.note=pick;it.date=dt;}editId=null;}
    else{data.items.push({id:Date.now(),type:type,amt:a,note:pick,date:dt});
      if(rp){var dm=+dt.slice(8);data.recur.push({id:Date.now()+1,type:type,amt:a,note:pick,every:rp,dom:dm,next:rp==="w"?addD(dt,7):addM(dt,dm)});}}
    save();$("amt").value="";setType(type);render();
  };
  $("list").onclick=function(e){
    var id=e.target.getAttribute&&e.target.getAttribute("data-id");
    if(!id){var it=e.target.closest&&e.target.closest(".item");if(it)startEdit(it.getAttribute("data-e"));return;}
    var gone=data.items.filter(function(i){return String(i.id)===id})[0];data.items=data.items.filter(function(i){return String(i.id)!==id});save();render();showUndo(gone);
  };
  $("clear").onclick=function(){
    if(confirm("Erase ALL entries? This cannot be undone.")){data.items=[];save();render();}sheet(false);
  };
  function idb(cb){try{var r=indexedDB.open("mymoney",1);r.onupgradeneeded=function(){r.result.createObjectStore("f")};r.onsuccess=function(){cb(r.result)};r.onerror=function(){cb(null)};}catch(e){cb(null)}}
  function putVid(b,done){idb(function(db){if(!db){done(false);return;}var t=db.transaction("f","readwrite");t.objectStore("f").put(b,"vid");t.oncomplete=function(){done(true)};t.onerror=function(){done(false)};})}
  function getVid(cb){idb(function(db){if(!db){cb(null);return;}var q=db.transaction("f").objectStore("f").get("vid");q.onsuccess=function(){cb(q.result||null)};q.onerror=function(){cb(null)};})}
  function delVid(){idb(function(db){if(db)db.transaction("f","readwrite").objectStore("f").delete("vid")})}
  function showVid(b){
    var v=$("vid");if(v.dataset.u)URL.revokeObjectURL(v.dataset.u);
    var u=URL.createObjectURL(b);v.dataset.u=u;v.src=u;v.hidden=false;v.muted=true;
    try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
    $("photo").style.backgroundImage="none";document.body.className="wp";
  }
  function hideVid(){var v=$("vid");try{v.pause()}catch(e){}v.removeAttribute("src");v.hidden=true;}
  document.addEventListener("visibilitychange",function(){var v=$("vid");if(!v.hidden&&!document.hidden){try{v.play()}catch(e){}}});
  var BG="mymoney.bg";
  function applyBg(){try{var u=localStorage.getItem(BG);$("photo").style.backgroundImage=u?'url("'+u+'")':"none";document.body.className=u?"wp":"";}catch(e){}}
  function sheet(on){$("sheet").hidden=!on}
  $("gear").onclick=function(){$("gBud").value=data.budget||"";$("gGoal").value=data.goal||"";recHtml();pinLabel();sheet(true)};
  $("closeSheet").onclick=function(){sheet(false)};
  $("sheet").onclick=function(e){if(e.target===this)sheet(false)};
  $("bgBtn").onclick=function(){sheet(false);$("bgFile").click()};
  $("bgFile").onchange=function(){
    var f=this.files&&this.files[0];if(!f)return;this.value="";
    if(f.type.indexOf("video/")===0){
      if(f.size>60*1024*1024){alert("This video is too big. Pick one under 60 MB.");return;}
      putVid(f,function(ok){
        if(!ok){alert("Could not save this video.");return;}
        try{localStorage.removeItem(BG)}catch(e){}
        showVid(f);
      });
      return;
    }
    var r=new FileReader();
    r.onload=function(){
      var img=new Image();
      img.onload=function(){
        var sc=Math.min(1,1080/Math.max(img.width,img.height)),cv=document.createElement("canvas");
        cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);
        cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
        try{localStorage.setItem(BG,cv.toDataURL("image/jpeg",0.8));}catch(e){alert("Could not save this image. Try a smaller one.");return;}
        hideVid();delVid();applyBg();
      };
      img.src=r.result;
    };
    r.readAsDataURL(f);
  };
  function view(n){document.querySelector("main").hidden=n!=="main";$("hist").hidden=n!=="hist";$("debt").hidden=n!=="debt";window.scrollTo(0,0)}
  $("histBtn").onclick=function(){view("hist")};
  $("histBack").onclick=function(){view("main")};
  var lastDay=today();
  function tick(){var t=today();if(t!==lastDay){if($("date").value===lastDay)$("date").value=t;lastDay=t;processRecur();render();}}
  setInterval(tick,30000);window.addEventListener("focus",tick);document.addEventListener("visibilitychange",tick);
  function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function putK(k,b,done){idb(function(db){if(!db){done(false);return;}var t=db.transaction("f","readwrite");t.objectStore("f").put(b,k);t.oncomplete=function(){done(true)};t.onerror=function(){done(false)};})}
  function getK(k,cb){idb(function(db){if(!db){cb(null);return;}var q=db.transaction("f").objectStore("f").get(k);q.onsuccess=function(){cb(q.result||null)};q.onerror=function(){cb(null)};})}
  function delK(k){idb(function(db){if(db)db.transaction("f","readwrite").objectStore("f").delete(k)})}


