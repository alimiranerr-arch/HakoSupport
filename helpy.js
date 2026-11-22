import { getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const askHelpy = httpsCallable(getFunctions(app), "askHelpy", { timeout: 65000 });
const OWNER_EMAIL = "alimiranerr@gmail.com";
const ROOT = "https://raw.githubusercontent.com/alimiranerr-arch/MalzemeSevkiyatDeposuHAKO/main/";

const poses = {
  idle: { file: "09_keyifli.gif", alt: "Helpy keyifli" },
  asking: { file: "02_soru_soran.gif", alt: "Helpy soru soruyor" },
  thinking: { file: "04_fikir_bulan.gif", alt: "Helpy fikir buluyor" },
  confused: { file: "03_kafasi_karisik.gif", alt: "Helpy düşünüyor" },
  noting: { file: "05_not_alan.gif", alt: "Helpy not alıyor" },
  bored: { file: "06_sikilan.gif", alt: "Helpy bekliyor" },
  surprised: { file: "07_sasiran.gif", alt: "Helpy şaşırdı" },
  happy: { file: "08_mutlu.gif", alt: "Helpy mutlu" },
  dreaming: { file: "01_hayal_kuran.gif", alt: "Helpy hayal kuruyor" }
};

let history = [];
let ready = false;
let busy = false;

function addStyles() {
  if (document.getElementById("helpyStyles")) return;
  const style = document.createElement("style");
  style.id = "helpyStyles";
  style.textContent = `
    #helpyLauncher{position:fixed;right:22px;bottom:22px;z-index:1000;border:0;border-radius:999px;background:#263e78;color:#fff;padding:10px 17px 10px 10px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 32px #17264b38;cursor:pointer;font:700 14px system-ui}
    #helpyLauncher img{width:46px;height:46px;object-fit:contain;border-radius:50%;background:#fff}
    #helpyPanel{position:fixed;right:22px;bottom:92px;z-index:1001;width:min(380px,calc(100vw - 28px));height:min(570px,calc(100vh - 125px));background:#fff;border:1px solid #dfe5f1;border-radius:22px;box-shadow:0 18px 60px #14234735;display:flex;flex-direction:column;overflow:hidden;color:#17213b}
    #helpyPanel[hidden],#helpyLauncher[hidden]{display:none}
    .helpy-head{background:linear-gradient(120deg,#17264b,#314d89);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px}
    .helpy-head img{width:62px;height:62px;object-fit:contain;background:#fff;border-radius:15px}
    .helpy-head strong{display:block;font-size:16px}.helpy-head small{color:#d6def2}
    #helpyClose{margin-left:auto;border:0;background:#ffffff20;color:#fff;border-radius:9px;padding:7px 10px;cursor:pointer}
    #helpyMessages{flex:1;overflow:auto;padding:14px;background:#f7f8fc}
    .helpy-msg{max-width:88%;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 12px;margin:8px 0;border-radius:14px;font:13px/1.5 system-ui}
    .helpy-msg.bot{background:#fff;border:1px solid #e7eaf2}.helpy-msg.user{margin-left:auto;background:#e8efff}
    .helpy-status{padding:7px 14px;color:#71809e;font:11px system-ui;min-height:27px}
    #helpyForm{display:flex;gap:8px;padding:10px;border-top:1px solid #e7eaf2}
    #helpyInput{min-width:0;flex:1;border:1px solid #dfe4ee;border-radius:11px;padding:12px;font:13px system-ui}
    #helpySend{border:0;border-radius:11px;background:#263e78;color:#fff;padding:0 15px;font-weight:800;cursor:pointer}
    #helpySend:disabled{opacity:.55;cursor:wait}
    @media(max-width:480px){#helpyLauncher{right:14px;bottom:14px}#helpyPanel{right:14px;bottom:78px}}
  `;
  document.head.append(style);
}

function buildWidget() {
  if (document.getElementById("helpyPanel")) return;
  addStyles();
  const launcher = document.createElement("button");
  launcher.id = "helpyLauncher";
  launcher.type = "button";
  launcher.hidden = true;
  launcher.innerHTML = `<img src="${ROOT + poses.idle.file}" alt="" loading="lazy"><span>Helpy'ye sor</span>`;
  const panel = document.createElement("section");
  panel.id = "helpyPanel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Helpy teknik destek sohbeti");
  panel.innerHTML = `
    <header class="helpy-head">
      <img id="helpyMascot" src="${ROOT + poses.idle.file}" alt="Helpy">
      <div><strong>Helpy</strong><small>Matematik Macerası teknik destek</small></div>
      <button id="helpyClose" type="button" aria-label="Kapat">✕</button>
    </header>
    <div id="helpyMessages" aria-live="polite"></div>
    <div id="helpyStatus" class="helpy-status">Yalnızca teknik destek için buradayım.</div>
    <form id="helpyForm"><input id="helpyInput" maxlength="1200" autocomplete="off" placeholder="Hatanı veya sorununu yaz..." required><button id="helpySend" type="submit">Gönder</button></form>`;
  document.body.append(launcher, panel);
  const mascot = document.getElementById("helpyMascot");
  const setMood = (mood) => {
    const pose = poses[mood] || poses.idle;
    mascot.src = ROOT + pose.file;
    mascot.alt = pose.alt;
    const launcherImg = launcher.querySelector("img");
    if (launcherImg) launcherImg.src = ROOT + pose.file;
  };
  const addMessage = (role, text) => {
    const el = document.createElement("div");
    el.className = "helpy-msg " + (role === "user" ? "user" : "bot");
    el.textContent = text;
    document.getElementById("helpyMessages").append(el);
    document.getElementById("helpyMessages").scrollTop = document.getElementById("helpyMessages").scrollHeight;
  };
  launcher.addEventListener("click", () => {
    panel.hidden = false; launcher.hidden = true; setMood("happy");
    if (!document.getElementById("helpyMessages").children.length) {
      addMessage("assistant", "Merhaba! Ben Helpy. Matematik Macerası ve HakoSupport ile ilgili teknik sorunlarında yardımcı olabilirim. Hata kodunu yazabilir veya yaşadığın sorunu anlatabilirsin. 😊");
    }
    document.getElementById("helpyInput").focus();
  });
  document.getElementById("helpyClose").addEventListener("click", () => {
    panel.hidden = true; launcher.hidden = false; setMood("idle");
  });
  document.getElementById("helpyInput").addEventListener("input", () => setMood("asking"));
  document.getElementById("helpyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("helpyInput");
    const text = input.value.trim();
    if (!text || busy || !ready) return;
    busy = true;
    document.getElementById("helpySend").disabled = true;
    input.value = "";
    addMessage("user", text);
    history.push({ role: "user", content: text });
    setMood("thinking");
    document.getElementById("helpyStatus").textContent = "Helpy çözüm arıyor…";
    try {
      const result = await askHelpy({ messages: history.slice(-10) });
      const reply = String(result.data?.reply || "Şu anda yanıt oluşturamadım.");
      history.push({ role: "assistant", content: reply });
      addMessage("assistant", reply);
      setMood("happy");
      document.getElementById("helpyStatus").textContent = "Başka bir teknik sorun varsa yazabilirsin.";
    } catch (error) {
      const message = error?.message || "Helpy şu anda yanıt veremiyor.";
      addMessage("assistant", message + " İstersen destek talebi oluşturabilirsin.");
      setMood("confused");
      document.getElementById("helpyStatus").textContent = "Bağlantı sorunu";
    } finally {
      busy = false;
      document.getElementById("helpySend").disabled = false;
      input.focus();
    }
  });
  window.__helpySetMood = setMood;
}

buildWidget();
onAuthStateChanged(auth, async (user) => {
  ready = false;
  const launcher = document.getElementById("helpyLauncher");
  if (!user) { launcher.hidden = true; return; }
  try {
    const admin = (user.email || "").toLowerCase() === OWNER_EMAIL && user.emailVerified;
    const snap = admin ? null : await getDoc(doc(db, "users", user.uid));
    ready = admin || (snap?.exists() && snap.data().status === "approved");
    launcher.hidden = !ready;
  } catch {
    launcher.hidden = true;
    ready = false;
  }
});
