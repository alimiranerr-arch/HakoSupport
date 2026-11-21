import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
let mode="login", currentUser=null, isAdmin=false, profile=null, activeChatId=null, selectedAdminChatId=null;
let stops=[];
const DEFAULT_SITE={id:"matematiksite",name:"MatematikSİTE"};

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
      const siteId=$("siteSelect").value;
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email:cred.user.email,siteId,status:"pending",createdAt:serverTimestamp()});
      setMsg("authMessage","Başvurun alındı. Yönetici onayından sonra giriş yapabileceksin.");
    }else await signInWithEmailAndPassword(auth,email,password);
  }catch(err){setMsg("authMessage",authError(err),true)}
});
$("logoutBtn").onclick=()=>signOut(auth);

$("ticketForm").addEventListener("submit",async e=>{
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

onAuthStateChanged(auth,async user=>{
  stopAll();currentUser=user;profile=null;isAdmin=false;
  $("authView").classList.toggle("hidden",!!user);$("userbar").classList.toggle("hidden",!user);
  $("appView").classList.add("hidden");$("pendingView").classList.add("hidden");$("adminPanel").classList.add("hidden");
  if(!user){$("userEmail").textContent="";activeChatId=null;selectedAdminChatId=null;return}
  $("userEmail").textContent=user.email;
  try{const token=await user.getIdTokenResult(true);isAdmin=token.claims.admin===true}catch{}
  if(isAdmin){showApprovedApp();return}
  const unsub=onSnapshot(doc(db,"users",user.uid),snap=>{
    if(!snap.exists()){$("appView").classList.add("hidden");$("pendingView").classList.remove("hidden");$("pendingText").textContent="Hesap kaydın henüz tamamlanmadı. Lütfen yöneticiyle iletişime geç.";return}
    profile=snap.data();
    if(profile.status!=="approved"){$("appView").classList.add("hidden");$("pendingView").classList.remove("hidden");$("pendingText").textContent="Başvurun yönetici onayı bekliyor. Onaylandığında bu sayfayı yenilemen yeterli.";return}
    $("pendingView").classList.add("hidden");showApprovedApp();watchUserTickets();
  },err=>{$("pendingView").classList.remove("hidden");$("pendingText").textContent="Hesap bilgisi okunamadı: "+err.message});stops.push(unsub);
});
function showApprovedApp(){$("pendingView").classList.add("hidden");$("appView").classList.remove("hidden");$("adminPanel").classList.toggle("hidden",!isAdmin);if(isAdmin)watchAdminData()}
function watchUserTickets(){const q=query(collection(db,"tickets"),where("uid","==",currentUser.uid),orderBy("createdAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("myTickets");root.innerHTML=s.empty?'<p class="muted">Henüz destek talebin yok.</p>':"";s.forEach(d=>root.append(ticketCard(d.id,d.data(),false)))}));}
function watchAdminData(){watchAdminTickets();watchAdminChats();watchPendingUsers();watchSites();}
function watchAdminTickets(){const q=query(collection(db,"tickets"),orderBy("createdAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("allTickets");root.innerHTML=s.empty?'<p class="muted">Henüz talep yok.</p>':"";s.forEach(d=>root.append(ticketCard(d.id,d.data(),true)))}));}
function ticketCard(id,t,admin){const el=document.createElement("article");el.className="ticket";const top=document.createElement("div");top.className="ticket-top";const title=document.createElement("div"),h=document.createElement("h3");h.textContent=t.subject;title.append(h);const meta=document.createElement("div");meta.className="muted";meta.textContent=(t.category||"")+(admin?" · "+(t.email||"")+" · "+(t.siteId||""):"");title.append(meta);const status=document.createElement("span");status.className="status"+(t.status==="closed"?" closed":"");status.textContent=t.status==="closed"?"Kapalı":"Açık";top.append(title,status);el.append(top);const p=document.createElement("p");p.textContent=t.description;el.append(p);if(admin){const row=document.createElement("div");row.style.display="flex";row.style.gap="8px";const close=document.createElement("button");close.className="btn secondary";close.textContent=t.status==="closed"?"Yeniden aç":"Talebi kapat";close.onclick=()=>updateDoc(doc(db,"tickets",id),{status:t.status==="closed"?"open":"closed",updatedAt:serverTimestamp()});const mail=document.createElement("button");mail.className="btn primary";mail.textContent="E-posta yanıtı hazırla";mail.onclick=()=>{location.href=`mailto:${encodeURIComponent(t.email||"")}?subject=${encodeURIComponent("HAKO Destek: "+t.subject)}&body=${encodeURIComponent("Merhaba,\n\nDestek talebin hakkında:\n\n\nHAKO Destek")}`};row.append(mail,close);el.append(row)}return el;}
function watchPendingUsers(){const q=query(collection(db,"users"),where("status","==","pending"));stops.push(onSnapshot(q,s=>{const root=$("pendingUsers");root.innerHTML=s.empty?'<p class="muted">Bekleyen başvuru yok.</p>':"";s.forEach(d=>{const u=d.data(),card=document.createElement("article");card.className="ticket";const h=document.createElement("h3");h.textContent=u.email;const p=document.createElement("p");p.textContent="Site: "+(u.siteId||"Belirtilmedi");const b=document.createElement("button");b.className="btn primary";b.textContent="Başvuruyu onayla";b.onclick=async()=>{try{await updateDoc(doc(db,"users",d.id),{status:"approved",approvedAt:serverTimestamp(),approvedBy:currentUser.uid})}catch(e){alert("Onaylanamadı: "+e.message)}};card.append(h,p,b);root.append(card)})}));}
function watchSites(){const q=query(collection(db,"sites"),orderBy("createdAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("siteList");root.innerHTML=`<div class="ticket"><b>${DEFAULT_SITE.name}</b><p>Varsayılan site · Aktif</p></div>`;s.forEach(d=>{const x=d.data(),card=document.createElement("article");card.className="ticket";const h=document.createElement("h3");h.textContent=x.name;const b=document.createElement("button");b.className="btn secondary";b.textContent=x.active===false?"Siteyi etkinleştir":"Siteyi devre dışı bırak";b.onclick=()=>updateDoc(doc(db,"sites",d.id),{active:x.active===false});card.append(h,b);root.append(card)})}));}
function watchAdminChats(){const q=query(collection(db,"chats"),orderBy("updatedAt","desc"));stops.push(onSnapshot(q,s=>{const root=$("allChats");root.innerHTML=s.empty?'<p class="muted">Henüz canlı sohbet yok.</p>':"";s.forEach(d=>{const c=d.data(),b=document.createElement("button");b.className="ticket";b.style.width="100%";b.style.textAlign="left";const h=document.createElement("h3");h.textContent=c.email||"Kullanıcı";const p=document.createElement("p");p.textContent=(c.siteId||"")+" · "+d.id.slice(0,8);b.append(h,p);b.onclick=()=>{selectedAdminChatId=d.id;watchAdminMessages(d.id)};root.append(b)})}));}
function watchAdminMessages(id){if(window.adminMessageStop)window.adminMessageStop();const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","asc"));window.adminMessageStop=onSnapshot(q,s=>{const root=$("adminChatMessages");root.innerHTML="";s.forEach(d=>{const m=d.data(),b=document.createElement("div");b.className="bubble"+(m.uid===currentUser.uid?" mine":"");b.textContent=m.text;root.append(b)});root.scrollTop=root.scrollHeight})}
function watchUserMessages(){if(window.userMessageStop)window.userMessageStop();const q=query(collection(db,"chats",activeChatId,"messages"),orderBy("createdAt","asc"));window.userMessageStop=onSnapshot(q,s=>{const root=$("chatMessages");root.innerHTML="";s.forEach(d=>{const m=d.data(),b=document.createElement("div");b.className="bubble"+(m.uid===currentUser.uid?" mine":"");b.textContent=m.text;root.append(b)});root.scrollTop=root.scrollHeight})}
