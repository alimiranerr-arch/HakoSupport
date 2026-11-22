import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app), functions = getFunctions(app);
const redeemMainHandoff = httpsCallable(functions, "redeemMainSiteHandoff");
const completeMainLink = httpsCallable(functions, "completeMainSiteLink");
const submitBugReportCall = httpsCallable(functions, "submitBugReport");
const publishBugReportCall = httpsCallable(functions, "publishBugReport");
let mode="login", currentUser=null, isAdmin=false, profile=null, activeChatId=null, selectedAdminChatId=null;
let stops=[], mainIdentity=null;
const DEFAULT_SITE={id:"matematiksite",name:"MatematikSİTE"};
const OWNER_EMAIL="alimiranerr@gmail.com";

function stopAll(){stops.forEach(fn=>{try{fn()}catch{}});stops=[];}
function setMsg(id,text,error=false){$(id).textContent=text;$(id).classList.toggle("error",error)}
function authError(e){const m={"auth/email-already-in-use":"Bu e-posta zaten kayıtlı.","auth/invalid-credential":"E-posta veya şifre hatalı.","auth/weak-password":"Şifre en az 6 karakter olmalı.","auth/invalid-email":"E-posta adresi geçersiz.","auth/too-many-requests":"Çok fazla deneme yapıldı. Biraz sonra tekrar dene."};return m[e.code]||e.message}
function siteOptions(){
  const sel=$("siteSelect"); if(!sel)return;
  const q=query(collection(db,"sites"),where("active","==",true),orderBy("name"));
  const unsub=onSnapshot(q,snap=>{
    const sites=[DEFAULT_SITE,...snap.docs.map(d=>({id:d.id,name:d.data().name})).filter(s=>s.id!==DEFAULT_SITE.id)];
    const previous=sel.value;sel.innerHTML="";
    sites.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;sel.append(o)});
    if(sites.some(s=>s.id===previous))sel.value=previous;
  },()=>{sel.innerHTML=`<option value="${DEFAULT_SITE.id}">${DEFAULT_SITE.name}</option>`;});
  stops.push(unsub);
}
siteOptions();

async function acceptMainHandoff(){
  const params=new URLSearchParams(location.hash.slice(1));
  const ticket=params.get("handoff");
  if(!ticket)return;
  history.replaceState(null,"",location.pathname+location.search);
  try{
    const result=await redeemMainHandoff({ticket});
    mainIdentity=result.data;
    $("email").value=mainIdentity.email;
    $("email").readOnly=true;
    document.querySelector('.tab[data-tab="signup"]')?.click();
    setMsg("authMessage","Ana Matematik Macerası hesabın doğrulandı. Şimdi HakoSupport için ayrı bir şifre belirle.");
    if(currentUser){await completeMainLink({linkId:mainIdentity.linkId});mainIdentity=null;location.reload();}
  }catch(error){
    setMsg("authMessage","Ana hesap bağlantısı doğrulanamadı: "+(error.message||"Bilinmeyen hata"),true);
  }
}
acceptMainHandoff();


document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
  mode=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
  $("authSubmit").textContent=mode==="login"?"Giriş yap":"Onay için başvur";
  $("siteField").classList.toggle("hidden",mode==="login");
  $("password").autocomplete=mode==="login"?"current-password":"new-password";setMsg("authMessage","");
}));

$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();setMsg("authMessage","İşlem yapılıyor...");
  try{
    const email=$("email").value.trim(),password=$("password").value;
    if(mode==="signup"){
      if(!mainIdentity)throw new Error("Önce Matematik Macerası ana hesabında oturum açıp Hako Destek düğmesine tıklamalısın.");
      if(email.toLowerCase()!==mainIdentity.email.toLowerCase())throw new Error("Destek hesabı e-postası ana site hesabınla aynı olmalı.");
      const siteId=$("siteSelect").value;
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email:cred.user.email,siteId,status:"pending",createdAt:serverTimestamp()});
      await completeMainLink({linkId:mainIdentity.linkId});mainIdentity=null;
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setMsg("authMessage","Doğrulama bağlantısını e-postana gönderdik. Önce e-postanı doğrula, ardından giriş yap. Başvurun ayrıca yönetici onayı bekleyecek.");
    }else {
      const cred=await signInWithEmailAndPassword(auth,email,password);
      await cred.user.reload();
      if(mainIdentity){if(email.toLowerCase()!==mainIdentity.email.toLowerCase())throw new Error("Ana site ve destek hesabı e-postaları eşleşmiyor.");await completeMainLink({linkId:mainIdentity.linkId});mainIdentity=null;}
      if(!cred.user.emailVerified){
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setMsg("authMessage","E-posta adresin henüz doğrulanmamış. Yeni doğrulama bağlantısı gönderdik; gelen kutunu kontrol et.",true);
      }
    }
  }catch(err){setMsg("authMessage",authError(err),true)}
});
$("logoutBtn").onclick=()=>signOut(auth);

$("bugReportForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!currentUser||(!isAdmin&&profile?.status!=="approved"))return;
  const button=$("bugReportForm").querySelector("button[type=submit]");
  if(button)button.disabled=true;
  setMsg("bugReportMessage","Bildirimin gönderiliyor...");
  try{
    const result=await submitBugReportCall({title:$("bugTitle").value.trim(),description:$("bugDescription").value.trim(),errorCode:$("bugErrorCode").value.trim()});
    $("bugReportForm").reset();setMsg("bugReportMessage","Bildirimin alındı! HakoSupport yöneticisi inceleyecek. Bildirim no: "+result.data.reportId);
  }catch(err){setMsg("bugReportMessage","Bildirim gönderilemedi: "+(err.message||"Bilinmeyen hata"),true);}
  finally{if(button)button.disabled=false;}
});
$("ticketForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!currentUser||(!isAdmin&&profile?.status!=="approved"))return;
  const file=$("ticketAttachment")?.files?.[0];
  if(file&&(file.size>5*1024*1024||!["image/png","image/jpeg","image/gif","image/webp"].includes(file.type))){setMsg("ticketMessage","Yalnızca PNG/JPEG/GIF/WebP ve en fazla 5 MB görsel ekleyebilirsin.",true);return;}
  try{
    const ticketRef=await addDoc(collection(db,"tickets"),{uid:currentUser.uid,email:currentUser.email,siteId:isAdmin?($("adminSiteFilter")?.value||DEFAULT_SITE.id):profile.siteId,category:$("category").value,subject:$("subject").value.trim(),description:$("description").value.trim(),status:"open",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    if(file){
      const worker=String(window.MMStorageWorkerUrl||"").replace(/\\/+$/,"");
      if(!worker)throw Error("Görsel sunucusu henüz yapılandırılmadı; talebin kaydedildi ancak görsel eklenemedi.");
      const token=await currentUser.getIdToken();
      const response=await fetch(worker+"/v1/support-upload?ticketId="+encodeURIComponent(ticketRef.id),{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":file.type},body:file});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.path)throw Error(result.message||result.error||"Görsel yüklenemedi.");
      await updateDoc(ticketRef,{attachmentPath:result.path,attachmentType:file.type,updatedAt:serverTimestamp()});
    }
    $("ticketForm").reset();setMsg("ticketMessage",file?"Talebin ve görselin gönderildi!":"Talebin alındı!");
  }catch(err){setMsg("ticketMessage","Talep/görsel işlemi: "+err.message,true);}
});
  e.preventDefault();if(!currentUser||(!isAdmin&&profile?.status!=="approved"))return;
  try{await addDoc(collection(db,"tickets"),{uid:currentUser.uid,email:currentUser.email,siteId:isAdmin?($("adminSiteFilter").value||DEFAULT_SITE.id):profile.siteId,category:$("category").value,subject:$("subject").value.trim(),description:$("description").value.trim(),status:"open",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});$("ticketForm").reset();setMsg("ticketMessage","Talebin alındı!")}
  catch(err){setMsg("ticketMessage","Talep gönderilemedi: "+err.message,true)}
});
$("startChatBtn").onclick=async()=>{
  try{if(!activeChatId){const siteId=isAdmin?DEFAULT_SITE.id:profile.siteId;const ref=await addDoc(collection(db,"chats"),{uid:currentUser.uid,email:currentUser.email,siteId,status:"open",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});activeChatId=ref.id;watchUserMessages()}
    $("chatBox").classList.remove("hidden");$("startChatBtn").classList.add("hidden");
  }catch(err){setMsg("chatMessage","Sohbet başlatılamadı: "+err.message,true)}
};
$("chatForm").addEventListener("submit",async e=>{e.preventDefault();const body=$("chatInput").value.trim();if(!body||!activeChatId)return;try{await addDoc(collection(db,"chats",activeChatId,"messages"),{uid:currentUser.uid,email:currentUser.email,text:body,createdAt:serverTimestamp()});$("chatInput").value="";await updateDoc(doc(db,"chats",activeChatId),{updatedAt:serverTimestamp()})}catch(err){setMsg("chatMessage","Mesaj gönderilemedi: "+err.message,true)}});
$("adminChatForm").addEventListener("submit",async e=>{e.preventDefault();const body=$("adminChatInput").value.trim();if(!body||!selectedAdminChatId)return;try{await addDoc(collection(db,"chats",selectedAdminChatId,"messages"),{uid:currentUser.uid,email:currentUser.email,text:body,createdAt:serverTimestamp()});$("adminChatInput").value="";await updateDoc(doc(db,"chats",selectedAdminChatId),{updatedAt:serverTimestamp()})}catch(err){alert("Yanıt gönderilemedi: "+err.message)}});
$("createSiteForm").addEventListener("submit",async e=>{e.preventDefault();try{const name=$("newSiteName").value.trim();if(!name)return;await addDoc(collection(db,"sites"),{name,active:true,createdAt:serverTimestamp()});$("newSiteName").value="";setMsg("siteMessage","Yeni site eklendi.")}catch(err){setMsg("siteMessage","Site eklenemedi: "+err.message,true)}});

$("errorCodeForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin)return;
  const code=$("errorCodeId").value.trim().toUpperCase();
  const title=$("errorCodeTitle").value.trim();
  const description=$("errorCodeDescription").value.trim();
  const solution=$("errorCodeSolution").value.trim();
  if(!/^[A-Z0-9:_-]{3,40}$/.test(code)){setMsg("errorCodeMessage","Kod 3-40 karakter olmalı ve yalnızca A-Z, 0-9, :, _ veya - içermeli.",true);return;}
  try{
    await setDoc(doc(db,"errorCodes",code),{title,description,solution,active:true,updatedAt:serverTimestamp(),updatedBy:currentUser.uid},{merge:true});
    $("errorCodeForm").reset();setMsg("errorCodeMessage",code+" kaydedildi.");
  }catch(err){setMsg("errorCodeMessage","Hata kodu kaydedilemedi: "+err.message,true);}
});

onAuthStateChanged(auth,async user=>{
  stopAll();currentUser=user;profile=null;isAdmin=false;
  $("authView").classList.toggle("hidden",!!user);$("userbar").classList.toggle("hidden",!user);
  $("appView").classList.add("hidden");$("pendingView").classList.add("hidden");$("adminPanel").classList.add("hidden");
  if(!user){$("userEmail").textContent="";activeChatId=null;selectedAdminChatId=null;return}
  $("userEmail").textContent=user.email;
  // Ana yönetici, yalnızca bu e-posta ile oturum açıp e-postasını doğruladığında otomatik tanınır.
  isAdmin=(user.email||"").toLowerCase()===OWNER_EMAIL && user.emailVerified===true;
  if(isAdmin){showApprovedApp();return}
  const unsub=onSnapshot(doc(db,"users",user.uid),snap=>{
    if(!snap.exists()){$("appView").classList.add("hidden");$("pendingView").classList.remove("hidden");$("pendingText").textContent="Hesap kaydın henüz tamamlanmadı. Lütfen yöneticiyle iletişime geç.";return}
    profile=snap.data();
    if(!profile.mainUid){$("appView").classList.add("hidden");$("pendingView").classList.remove("hidden");$("pendingText").textContent="Destek hesabın henüz Matematik Macerası ana hesabına bağlanmamış. Ana siteye giriş yapıp Hako Destek düğmesini kullan.";return;}
    if(profile.status!=="approved"){$("appView").classList.add("hidden");$("pendingView").classList.remove("hidden");$("pendingText").textContent="Başvurun yönetici onayı bekliyor. Onaylandığında bu sayfayı yenilemen yeterli.";return}
    $("pendingView").classList.add("hidden");showApprovedApp();watchUserTickets();watchBugReports(false);
  },err=>{$("pendingView").classList.remove("hidden");$("pendingText").textContent="Hesap bilgisi okunamadı: "+err.message});stops.push(unsub);
});
function showApprovedApp(){$("pendingView").classList.add("hidden");$("appView").classList.remove("hidden");$("adminPanel").classList.toggle("hidden",!isAdmin);if(isAdmin)watchAdminData()}
function watchUserTickets(){const q=query(collection(db,"tickets"),where("uid","==",currentUser.uid),orderBy("createdAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("myTickets");root.innerHTML=s.empty?'<p class="muted">Henüz destek talebin yok.</p>':"";s.forEach(d=>root.append(ticketCard(d.id,d.data(),false)))}));}
function watchAdminData(){watchAdminTickets();watchAdminChats();watchPendingUsers();watchSites();watchErrorCodes();watchBugReports(true);}
function watchAdminTickets(){const q=query(collection(db,"tickets"),orderBy("createdAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("allTickets");root.innerHTML=s.empty?'<p class="muted">Henüz talep yok.</p>':"";s.forEach(d=>root.append(ticketCard(d.id,d.data(),true)))}));}
function ticketCard(id,t,admin){
 const el=document.createElement("article");el.className="ticket";
 const top=document.createElement("div");top.className="ticket-top";
 const title=document.createElement("div"),h=document.createElement("h3");h.textContent=t.subject;title.append(h);
 const meta=document.createElement("div");meta.className="muted";meta.textContent=(t.category||"")+(admin?" · "+(t.email||"")+" · "+(t.siteId||""):"");title.append(meta);
 const status=document.createElement("span");status.className="status"+(t.status==="closed"?" closed":"");status.textContent=t.status==="closed"?"Kapalı":"Açık";top.append(title,status);el.append(top);
 const p=document.createElement("p");p.textContent=t.description;el.append(p);
 if(t.attachmentPath){
  const link=document.createElement("a");link.className="btn secondary";link.textContent="🖼️ Ekli görsel yükleniyor…";link.target="_blank";link.rel="noopener";link.hidden=true;
  const preview=document.createElement("img");preview.alt="Destek talebi eki";preview.loading="lazy";preview.style.cssText="display:block;max-width:220px;max-height:180px;border-radius:10px;margin:8px 0";
  el.append(preview,link);
  (async()=>{try{const worker=String(window.MMStorageWorkerUrl||"").replace(/\\/+$/,"");if(!worker)throw Error("Worker adresi ayarlı değil.");const token=await currentUser.getIdToken();const response=await fetch(worker+"/v1/support-media-url",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({ticketId:id,path:t.attachmentPath})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.url)throw Error(data.error||"Görsel açılamadı.");preview.src=data.url;link.href=data.url;link.textContent="Görseli tam boy aç";link.hidden=false;}catch(err){link.hidden=false;link.textContent="Ek açılamadı: "+err.message;link.removeAttribute("href");}})();
 }
 if(admin){const row=document.createElement("div");row.style.display="flex";row.style.gap="8px";const close=document.createElement("button");close.className="btn secondary";close.textContent=t.status==="closed"?"Yeniden aç":"Talebi kapat";close.onclick=()=>updateDoc(doc(db,"tickets",id),{status:t.status==="closed"?"open":"closed",updatedAt:serverTimestamp()});const mail=document.createElement("button");mail.className="btn primary";mail.textContent="E-posta yanıtı hazırla";mail.onclick=()=>{location.href=`mailto:${encodeURIComponent(t.email||"")}?subject=${encodeURIComponent("HAKO Destek: "+t.subject)}&body=${encodeURIComponent("Merhaba,\\n\\nDestek talebin hakkında:\\n\\n\\nHAKO Destek")}`};row.append(mail,close);el.append(row);}
 return el;
}
function watchBugReports(admin){
 const q=collection(db,"bugReports");
 stops.push(onSnapshot(q,s=>{
  const docs=s.docs.map(d=>({id:d.id,...d.data()}));
  if(admin){
   const root=$("adminBugReports");if(!root)return;root.innerHTML="";
   const pending=docs.filter(x=>x.status==="review").sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
   if(!pending.length)root.innerHTML='<p class="muted">İncelenecek hata bildirimi yok.</p>';
   pending.forEach(x=>{
    const card=document.createElement("article");card.className="ticket";
    const h=document.createElement("h3");h.textContent=x.title;
    const meta=document.createElement("p");meta.className="muted";meta.textContent="Gönderen: "+(x.submitterEmail||"Kullanıcı")+" · "+(x.errorCode||"Kod yok");
    const desc=document.createElement("p");desc.textContent=x.description;
    const level=document.createElement("select");level.innerHTML='<option value="critical">1 · Ciddi açık</option><option value="normal">2 · Normal açık</option><option value="safe">3 · Risksiz açık</option>';
    const reward=document.createElement("input");reward.type="number";reward.min="0";reward.max="100000";reward.step="1";reward.value="0";reward.placeholder="Altın ödülü";
    const summary=document.createElement("textarea");summary.maxLength=500;summary.rows=3;summary.placeholder="Yayınlanacak güvenli özet (istismar adımı veya gizli ayrıntı yazma)";
    const publish=document.createElement("button");publish.className="btn primary";publish.textContent="Ödülü ver ve yayınla";
    publish.onclick=async()=>{const amount=Number(reward.value);if(!Number.isSafeInteger(amount)||amount<0||amount>100000||!summary.value.trim()){alert("Geçerli altın miktarı ve güvenli yayın özeti gir.");return;}publish.disabled=true;try{await publishBugReportCall({reportId:x.id,level:level.value,rewardCoins:amount,publicSummary:summary.value.trim()});}catch(err){alert("Yayınlama başarısız: "+err.message);}finally{publish.disabled=false;}};
    card.append(h,meta,desc,level,reward,summary,publish);root.append(card);
   });
  }else{
   const root=$("publishedBugReports");if(!root)return;root.innerHTML="";
   docs.filter(x=>x.status==="published").sort((a,b)=>(b.publishedAt?.toMillis?.()||0)-(a.publishedAt?.toMillis?.()||0)).forEach(x=>{
    const card=document.createElement("article");card.className="ticket";
    const h=document.createElement("h3");h.textContent=x.title;
    const names={critical:"1 · Ciddi açık",normal:"2 · Normal açık",safe:"3 · Risksiz açık"};
    const meta=document.createElement("p");meta.className="muted";meta.textContent=(names[x.level]||"İncelendi")+" · Ödül: "+(Number(x.rewardCoins)||0)+" altın";
    const p=document.createElement("p");p.textContent=x.publicSummary||"";
    card.append(h,meta,p);root.append(card);
   });
   if(!root.children.length)root.innerHTML='<p class="muted">Henüz yayınlanmış hata bildirimi yok.</p>';
  }
 },err=>{const root=$(admin?"adminBugReports":"publishedBugReports");if(root)root.textContent="Bildirimler yüklenemedi: "+err.message;}));
}
\nfunction watchPendingUsers(){const q=query(collection(db,"users"),where("status","==","pending"));stops.push(onSnapshot(q,s=>{const root=$("pendingUsers");root.innerHTML=s.empty?'<p class="muted">Bekleyen başvuru yok.</p>':"";s.forEach(d=>{const u=d.data(),card=document.createElement("article");card.className="ticket";const h=document.createElement("h3");h.textContent=u.email;const p=document.createElement("p");p.textContent="Site: "+(u.siteId||"Belirtilmedi");const b=document.createElement("button");b.className="btn primary";b.textContent="Başvuruyu onayla";b.onclick=async()=>{try{await updateDoc(doc(db,"users",d.id),{status:"approved",approvedAt:serverTimestamp(),approvedBy:currentUser.uid})}catch(e){alert("Onaylanamadı: "+e.message)}};card.append(h,p,b);root.append(card)})}));}
function watchErrorCodes(){
  const q=query(collection(db,"errorCodes"),orderBy("updatedAt","desc"));
  stops.push(onSnapshot(q,s=>{
    const root=$("errorCodeList");
    root.innerHTML=s.empty?'<p class="muted">Henüz hata kodu eklenmedi.</p>':"";
    s.forEach(d=>{
      const x=d.data(),card=document.createElement("article");card.className="ticket";
      const h=document.createElement("h3");h.textContent=d.id+" · "+(x.title||"Başlıksız");
      const p=document.createElement("p");p.textContent=(x.description||"")+"\\n\\nÇözüm: "+(x.solution||"");
      const row=document.createElement("div");row.style.display="flex";row.style.gap="8px";row.style.flexWrap="wrap";
      const toggle=document.createElement("button");toggle.className="btn secondary";toggle.textContent=x.active===false?"Etkinleştir":"Devre dışı bırak";
      toggle.onclick=()=>updateDoc(doc(db,"errorCodes",d.id),{active:x.active===false,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});
      const edit=document.createElement("button");edit.className="btn secondary";edit.textContent="Düzenle";
      edit.onclick=()=>{
        $("errorCodeId").value=d.id;$("errorCodeTitle").value=x.title||"";
        $("errorCodeDescription").value=x.description||"";$("errorCodeSolution").value=x.solution||"";
        $("errorCodeId").focus();
      };
      const remove=document.createElement("button");remove.className="btn secondary";remove.textContent="Sil";
      remove.onclick=async()=>{
        if(!confirm(d.id+" hata kodunu silmek istiyor musun?"))return;
        try{await deleteDoc(doc(db,"errorCodes",d.id));}
        catch(err){setMsg("errorCodeMessage","Silinemedi: "+err.message,true);}
      };
      row.append(toggle,edit,remove);card.append(h,p,row);root.append(card);
    });
  },err=>setMsg("errorCodeMessage","Hata kodları yüklenemedi: "+err.message,true)));
}
function watchSites(){const q=query(collection(db,"sites"),orderBy("createdAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("siteList");root.innerHTML=`<div class="ticket"><b>${DEFAULT_SITE.name}</b><p>Varsayılan site · Aktif</p></div>`;s.forEach(d=>{const x=d.data(),card=document.createElement("article");card.className="ticket";const h=document.createElement("h3");h.textContent=x.name;const b=document.createElement("button");b.className="btn secondary";b.textContent=x.active===false?"Siteyi etkinleştir":"Siteyi devre dışı bırak";b.onclick=()=>updateDoc(doc(db,"sites",d.id),{active:x.active===false});card.append(h,b);root.append(card)})}));}
function watchAdminChats(){const q=query(collection(db,"chats"),orderBy("updatedAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("allChats");root.innerHTML=s.empty?'<p class="muted">Henüz canlı sohbet yok.</p>':"";s.forEach(d=>{const c=d.data(),b=document.createElement("button");b.className="ticket";b.style.width="100%";b.style.textAlign="left";const h=document.createElement("h3");h.textContent=c.email||"Kullanıcı";const p=document.createElement("p");p.textContent=(c.siteId||"")+" · "+d.id.slice(0,8);b.append(h,p);b.onclick=()=>{selectedAdminChatId=d.id;watchAdminMessages(d.id)};root.append(b)})}));}
function watchAdminMessages(id){if(window.adminMessageStop)window.adminMessageStop();const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","asc"));window.adminMessageStop=onSnapshot(q,s=>{const root=$("adminChatMessages");root.innerHTML="";s.forEach(d=>{const m=d.data(),b=document.createElement("div");b.className="bubble"+(m.uid===currentUser.uid?" mine":"");b.textContent=m.text;root.append(b)});root.scrollTop=root.scrollHeight})}
function watchUserMessages(){if(window.userMessageStop)window.userMessageStop();const q=query(collection(db,"chats",activeChatId,"messages"),orderBy("createdAt","asc"));window.userMessageStop=onSnapshot(q,s=>{const root=$("chatMessages");root.innerHTML="";s.forEach(d=>{const m=d.data(),b=document.createElement("div");b.className="bubble"+(m.uid===currentUser.uid?" mine":"");b.textContent=m.text;root.append(b)});root.scrollTop=root.scrollHeight})}
