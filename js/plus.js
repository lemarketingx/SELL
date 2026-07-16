(() => {
  "use strict";

  /* דפדף פלוס — הבוסטרים הישראליים וערכת הקמפיין.
     שכבה עצמאית מעל ה-builder וה-studio: תצוגה מקדימה בקנבס,
     והזרקת runtime עצמאי לקובץ ה-HTML המיוצא דרך window.dafdafPlus. */

  const CONFIG_KEY = "dafdaf-plus-config-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const BOOSTERS = [
    {
      id: "whatsapp",
      icon: "💬",
      name: "כפתור WhatsApp צף",
      desc: "כפתור ירוק קבוע שפותח שיחה עם הודעה מוכנה. משתמש במספר משלב 4.",
    },
    {
      id: "actions",
      icon: "📱",
      name: "סרגל פעולות למובייל",
      desc: "חיוג, WhatsApp וניווט ב-Waze בלחיצה אחת, מוצמד לתחתית המסך בנייד.",
    },
    {
      id: "access",
      icon: "♿",
      name: "תפריט נגישות + הצהרה",
      desc: "הגדלת טקסט, ניגודיות, הדגשת קישורים ועצירת אנימציות — בהתאם לתקנות הנגישות הישראליות.",
    },
    {
      id: "shabbat",
      icon: "🕯️",
      name: "מצב שבת",
      desc: "הדף מזהה לבד שבת לפי שעון ישראל ומציג הודעה מכבדת. במוצאי שבת הכול חוזר אוטומטית.",
    },
    {
      id: "proof",
      icon: "👀",
      name: "הוכחה חברתית חיה",
      desc: "בועות קטנות שמופיעות מדי כמה שניות עם מסרים מהעסק. כתבו רק דברים נכונים.",
    },
    {
      id: "countdown",
      icon: "⏳",
      name: "טיימר דחיפות יומי",
      desc: "פס עליון עם ספירה לאחור עד חצות (שעון ישראל) שמתאפס כל יום מחדש.",
    },
  ];

  const plus = {
    enabled: { whatsapp: false, actions: false, access: false, shabbat: false, proof: false, countdown: false },
    phone: "",
    wazeAddress: "",
    proofText: "💬 מענה מהיר בווטסאפ — בדרך כלל תוך שעה\n⭐ לקוחות ממליצים עלינו — בדקו את ההמלצות בדף\n📞 אפשר גם להתקשר, אנחנו זמינים",
    countdownText: "ההטבה לפונים היום מסתיימת בעוד",
    shabbatText: "אנחנו שומרים שבת 🕯️ השאירו פרטים ונחזור אליכם מיד במוצאי שבת",
  };

  let applyingPreview = false;
  let countdownInterval = null;

  document.addEventListener("DOMContentLoaded", initPlus);

  function initPlus() {
    restoreConfig();
    $("#plus-boosters")?.addEventListener("click", openBoostersPanel);
    $("#plus-campaign")?.addEventListener("click", openCampaignPanel);
    $("#studio-backdrop")?.addEventListener("click", closePanel);
    observeCanvas();
    startCountdownTicker();
  }

  /* ---------- config ---------- */

  function saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(plus));
    } catch {}
  }

  function restoreConfig() {
    try {
      const stored = JSON.parse(localStorage.getItem(CONFIG_KEY));
      if (!stored || typeof stored !== "object") return;
      Object.assign(plus.enabled, stored.enabled || {});
      ["phone", "wazeAddress", "proofText", "countdownText", "shabbatText"].forEach((key) => {
        if (typeof stored[key] === "string") plus[key] = stored[key];
      });
    } catch {}
  }

  /* ---------- shared data helpers ---------- */

  function businessName() {
    return $("#f-name")?.value.trim() || "העסק שלכם";
  }

  function normalizedWhatsapp(raw) {
    let digits = String(raw || "").replace(/[^0-9+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
    return /^\d{8,15}$/.test(digits) ? digits : "";
  }

  function waNumber() {
    return normalizedWhatsapp($("#f-whatsapp")?.value);
  }

  function waLink() {
    const number = waNumber();
    if (!number) return "";
    const message = encodeURIComponent(`שלום, הגעתי מדף הנחיתה של ${businessName()}`);
    return `https://wa.me/${number}?text=${message}`;
  }

  function telLink() {
    const digits = String(plus.phone || $("#f-whatsapp")?.value || "").replace(/[^\d+]/g, "");
    return digits.length >= 8 ? `tel:${digits}` : "";
  }

  function wazeLink() {
    const address = plus.wazeAddress.trim();
    if (!address) return "";
    return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  }

  function safeExternalUrl(raw) {
    if (!raw) return "";
    try {
      const url = new URL(raw);
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch {
      return "";
    }
  }

  function destinationLink() {
    return safeExternalUrl($("#f-cta-url")?.value.trim()) || waLink() || "";
  }

  function proofMessages() {
    return plus.proofText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  /* ---------- panel infrastructure (משתמש באותו panel של הסטודיו) ---------- */

  function openPanel(html) {
    const panel = $("#studio-panel");
    const backdrop = $("#studio-backdrop");
    if (!panel || !backdrop) return null;
    panel.innerHTML = `<button type="button" class="btn btn-ghost btn-sm" id="plus-close" style="float:left">סגירה</button>${html}`;
    panel.classList.add("open");
    backdrop.classList.add("open");
    $("#plus-close")?.addEventListener("click", closePanel);
    return panel;
  }

  function closePanel() {
    $("#studio-panel")?.classList.remove("open");
    $("#studio-backdrop")?.classList.remove("open");
  }

  /* ---------- boosters panel ---------- */

  function openBoostersPanel() {
    const toggles = BOOSTERS.map((booster) => `
      <label class="plus-toggle ${plus.enabled[booster.id] ? "on" : ""}" data-booster="${booster.id}">
        <input type="checkbox" ${plus.enabled[booster.id] ? "checked" : ""}>
        <span><b>${booster.icon} ${booster.name}</b><small>${booster.desc}</small>${boosterExtraField(booster.id)}</span>
      </label>`).join("");

    const panel = openPanel(`
      <h3>⚡ הבוסטרים של דפדף</h3>
      <p>תוספים ישראליים שנכנסים לתצוגה המקדימה ולקובץ המיוצא. הכול בלחיצה, בלי קוד.</p>
      <div class="plus-toggle-list">${toggles}</div>`);
    if (!panel) return;

    $$(".plus-toggle input[type=checkbox]", panel).forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const id = checkbox.closest(".plus-toggle").dataset.booster;
        plus.enabled[id] = checkbox.checked;
        checkbox.closest(".plus-toggle").classList.toggle("on", checkbox.checked);
        if (id === "whatsapp" && checkbox.checked && !waNumber()) {
          showToast("הוסיפו מספר WhatsApp בשלב 4 כדי שהכפתור יעבוד");
        }
        saveConfig();
        applyPreview();
      });
    });

    $$("[data-plus-field]", panel).forEach((field) => {
      field.addEventListener("input", () => {
        plus[field.dataset.plusField] = field.value;
        saveConfig();
        applyPreview();
      });
      field.addEventListener("click", (event) => event.preventDefault());
    });
  }

  function boosterExtraField(id) {
    const stop = `onclick="event.preventDefault()"`;
    if (id === "actions") {
      return `<input class="plus-field" data-plus-field="phone" ${stop} type="tel" maxlength="30" placeholder="טלפון לחיוג (אם שונה מהווטסאפ)" value="${escapeHtml(plus.phone)}">
        <input class="plus-field" data-plus-field="wazeAddress" ${stop} type="text" maxlength="120" placeholder="כתובת לניווט ב-Waze, לדוגמה: הרצל 12 תל אביב" value="${escapeHtml(plus.wazeAddress)}">`;
    }
    if (id === "proof") {
      return `<textarea class="plus-field" data-plus-field="proofText" ${stop} maxlength="600" placeholder="הודעה בכל שורה">${escapeHtml(plus.proofText)}</textarea>`;
    }
    if (id === "countdown") {
      return `<input class="plus-field" data-plus-field="countdownText" ${stop} type="text" maxlength="90" value="${escapeHtml(plus.countdownText)}">`;
    }
    if (id === "shabbat") {
      return `<input class="plus-field" data-plus-field="shabbatText" ${stop} type="text" maxlength="160" value="${escapeHtml(plus.shabbatText)}">`;
    }
    return "";
  }

  /* ---------- live preview inside the canvas ---------- */

  function observeCanvas() {
    const canvas = $("#result-canvas");
    if (!canvas) return;
    new MutationObserver(() => {
      if (applyingPreview) return;
      if (canvas.querySelector(".ai-block") && !canvas.querySelector(".plus-el")) applyPreview();
    }).observe(canvas, { childList: true, subtree: true });
  }

  function applyPreview() {
    const canvas = $("#result-canvas");
    if (!canvas || !canvas.querySelector(".ai-block")) return;
    applyingPreview = true;

    $$(".plus-el", canvas).forEach((element) => element.remove());

    if (plus.enabled.countdown) {
      canvas.insertAdjacentHTML("afterbegin",
        `<div class="plus-el no-export plus-countdown">${escapeHtml(plus.countdownText)} <b class="plus-count-timer">--:--:--</b></div>`);
    }
    if (plus.enabled.shabbat) {
      canvas.insertAdjacentHTML("afterbegin",
        `<div class="plus-el no-export plus-shabbat">🕯️ ${escapeHtml(plus.shabbatText)} <span class="plus-note">· יוצג ללקוחות רק בשבת</span></div>`);
    }
    if (plus.enabled.whatsapp && waNumber()) {
      canvas.insertAdjacentHTML("beforeend",
        `<span class="plus-el no-export plus-wa ${plus.enabled.actions ? "raised" : ""}" title="WhatsApp">💬</span>`);
    }
    if (plus.enabled.access) {
      canvas.insertAdjacentHTML("beforeend",
        `<span class="plus-el no-export plus-a11y-btn" title="תפריט נגישות">♿</span>`);
    }
    if (plus.enabled.proof && proofMessages().length) {
      canvas.insertAdjacentHTML("beforeend",
        `<div class="plus-el no-export plus-proof on">${escapeHtml(proofMessages()[0])}</div>`);
    }
    if (plus.enabled.actions) {
      const items = actionBarItems();
      if (items) canvas.insertAdjacentHTML("beforeend", `<nav class="plus-el no-export plus-actions">${items}</nav>`);
    }

    syncStatementSection(canvas);
    applyingPreview = false;
  }

  function actionBarItems() {
    const items = [];
    if (telLink()) items.push(`<a href="${escapeHtml(telLink())}">📞 חיוג</a>`);
    if (waLink()) items.push(`<a href="${escapeHtml(waLink())}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>`);
    if (wazeLink()) items.push(`<a href="${escapeHtml(wazeLink())}" target="_blank" rel="noopener noreferrer">🚗 Waze</a>`);
    return items.join("");
  }

  /* הצהרת נגישות היא תוכן אמיתי בדף (מיוצא), לכן היא לא .plus-el ולא נמחקת בכל רענון */
  function syncStatementSection(canvas) {
    const existing = canvas.querySelector(".plus-a11y-statement");
    if (!plus.enabled.access) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const section = document.createElement("section");
    section.className = "plus-a11y-statement";
    section.innerHTML = `<div class="inner"><h2 contenteditable="true">הצהרת נגישות</h2>
      <p contenteditable="true">אנו ב${escapeHtml(businessName())} רואים חשיבות רבה בהנגשת השירות לכלל הלקוחות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות ותקנותיו. בדף זה פועל תפריט נגישות המאפשר הגדלת טקסט, שינוי ניגודיות, הדגשת קישורים ועצירת אנימציות. נתקלתם בקושי? נשמח שתפנו אלינו ונטפל בכך בהקדם.</p></div>`;
    const footer = canvas.querySelector("footer");
    canvas.insertBefore(section, footer ? footer.parentElement === canvas ? footer : footer.closest("div") : null);
  }

  function startCountdownTicker() {
    if (countdownInterval) return;
    countdownInterval = setInterval(() => {
      const timers = $$(".plus-count-timer");
      if (!timers.length) return;
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const total = Math.max(0, Math.floor((end - now) / 1000));
      const label = [total / 3600, (total % 3600) / 60, total % 60]
        .map((part) => String(Math.floor(part)).padStart(2, "0"))
        .join(":");
      timers.forEach((timer) => { timer.textContent = label; });
    }, 1000);
  }

  /* ---------- campaign kit ---------- */

  function collectPageContent() {
    const canvas = $("#result-canvas");
    if (!canvas?.querySelector(".ai-block")) return null;
    const text = (selector) => canvas.querySelector(selector)?.textContent.replace(/\s+/g, " ").trim() || "";
    return {
      business: businessName(),
      industry: $("#f-industry")?.value.trim() || "",
      headline: text('[data-block="hero"] h1'),
      sub: text('[data-block="hero"] [data-path="hero.subheadline"]') || text('[data-block="hero"] p'),
      cta: text('[data-path="hero.ctaPrimary"]') || "דברו איתנו",
      features: $$('[data-block="features"] h3', canvas).map((node) => node.textContent.trim()).filter(Boolean).slice(0, 4),
      link: destinationLink() || "(הוסיפו קישור או WhatsApp בשלב 4)",
    };
  }

  function truncate(value, max) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 12 ? lastSpace : max - 1)}…`;
  }

  function buildCampaignKit(content) {
    const bullets = content.features.map((feature) => `✅ ${feature}`).join("\n");
    return [
      {
        title: "📘 מודעת פייסבוק / אינסטגרם",
        body: `${content.headline}\n\n${content.sub}\n\n${bullets}\n\n👈 ${content.cta}: ${content.link}`,
      },
      {
        title: "🔎 מודעת Google Ads",
        body: `כותרות (עד 30 תווים):\n1. ${truncate(content.business, 30)}\n2. ${truncate(content.headline, 30)}\n3. ${truncate(content.cta, 30)}\n\nתיאורים (עד 90 תווים):\n1. ${truncate(content.sub, 90)}\n2. ${truncate(content.features.join(" · "), 90)}`,
      },
      {
        title: "💬 הודעת תפוצה ל-WhatsApp",
        body: `היי 👋\n${content.sub}\n${content.features.length ? `מה מחכה לכם אצלנו: ${content.features.join(", ")}.` : ""}\n${content.cta}: ${content.link}`,
      },
      {
        title: "📲 SMS קצר",
        body: `${truncate(`${content.business}: ${content.headline}`, 55)}\n${content.link}`,
      },
      {
        title: "📸 ביו לאינסטגרם",
        body: `${content.business}${content.industry ? ` | ${truncate(content.industry, 40)}` : ""}\n${truncate(content.sub, 80)}\n👇 ${content.cta}\n${content.link}`,
      },
    ];
  }

  function openCampaignPanel() {
    const content = collectPageContent();
    if (!content) {
      showToast("קודם צרו דף — ואז נכין לכם את הקמפיין");
      return;
    }
    const cards = buildCampaignKit(content).map((card) => `
      <div class="plus-kit-card">
        <h4>${card.title} <button type="button" class="plus-copy">העתקה</button></h4>
        <pre>${escapeHtml(card.body)}</pre>
      </div>`).join("");

    const panel = openPanel(`
      <h3>🎯 ערכת קמפיין מוכנה</h3>
      <p>נכתב אוטומטית מהתוכן של הדף שלכם — כולל העריכות שעשיתם. ערכו בדף, פתחו שוב, וקבלו גרסה מעודכנת.</p>
      ${cards}`);
    if (!panel) return;

    $$(".plus-copy", panel).forEach((button) => {
      button.addEventListener("click", async () => {
        const body = button.closest(".plus-kit-card")?.querySelector("pre")?.textContent || "";
        try {
          await navigator.clipboard.writeText(body);
          button.textContent = "הועתק ✓";
          setTimeout(() => { button.textContent = "העתקה"; }, 1600);
        } catch {
          showToast("ההעתקה נחסמה — סמנו את הטקסט והעתיקו ידנית");
        }
      });
    });
  }

  /* ---------- export integration (נצרך על ידי studio.js) ---------- */

  function exportMeta() {
    const content = collectPageContent();
    if (!content) return "";
    const description = truncate(content.sub || content.headline, 155);
    const logo = $('[data-preview-for="studio-logo"] img')?.getAttribute("src") || "";
    return [
      `<meta name="description" content="${escapeHtml(description)}">`,
      `<meta property="og:title" content="${escapeHtml(content.headline || content.business)}">`,
      `<meta property="og:description" content="${escapeHtml(description)}">`,
      `<meta property="og:type" content="website">`,
      logo ? `<link rel="icon" href="${escapeHtml(logo)}">` : "",
    ].filter(Boolean).join("\n");
  }

  function exportBodyHtml() {
    const parts = [];
    if (plus.enabled.whatsapp && waLink()) {
      parts.push(`<a class="plus-wa ${plus.enabled.actions ? "raised" : ""}" href="${escapeHtml(waLink())}" target="_blank" rel="noopener noreferrer" aria-label="שיחת WhatsApp">💬</a>`);
    }
    if (plus.enabled.actions) {
      const items = actionBarItems();
      if (items) parts.push(`<nav class="plus-actions" aria-label="יצירת קשר מהירה">${items}</nav>`);
    }
    return parts.join("\n");
  }

  function exportRuntimeScript() {
    const snippets = [revealRuntime()];
    if (plus.enabled.access) snippets.push(a11yRuntime());
    if (plus.enabled.shabbat) snippets.push(shabbatRuntime());
    if (plus.enabled.proof && proofMessages().length) snippets.push(proofRuntime());
    if (plus.enabled.countdown) snippets.push(countdownRuntime());
    return snippets.join("\n");
  }

  /* אנימציית כניסה למקטעים בדף המיוצא — מדלגת כשאין תמיכה או כשמבקשים פחות תנועה */
  function revealRuntime() {
    return `(function(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var blocks=document.querySelectorAll(".ai-block,.studio-added-section");
if(!blocks.length||!("IntersectionObserver" in window))return;
document.documentElement.classList.add("pg-animate");
var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("pg-in");io.unobserve(entry.target)}})},{threshold:.12});
blocks.forEach(function(block){io.observe(block)});})();`;
  }

  function a11yRuntime() {
    return `(function(){var KEY="plus-a11y";var root=document.documentElement;var state={};
try{state=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
var opts=[["font","טקסט מוגדל"],["contrast","ניגודיות גבוהה"],["links","הדגשת קישורים"],["motion","עצירת אנימציות"]];
function apply(){opts.forEach(function(o){root.classList.toggle("plus-a11y-"+o[0],!!state[o[0]])})}
var btn=document.createElement("button");btn.className="plus-a11y-btn";btn.type="button";btn.setAttribute("aria-label","פתיחת תפריט נגישות");btn.setAttribute("aria-expanded","false");btn.textContent="♿";
var menu=document.createElement("div");menu.className="plus-a11y-menu";menu.setAttribute("role","menu");
menu.innerHTML=opts.map(function(o){return '<button type="button" data-k="'+o[0]+'">'+o[1]+"</button>"}).join("")+'<button type="button" data-k="reset">איפוס נגישות</button>';
function mark(){[].forEach.call(menu.querySelectorAll("[data-k]"),function(b){b.classList.toggle("on",!!state[b.getAttribute("data-k")])})}
btn.addEventListener("click",function(){var open=menu.classList.toggle("open");btn.setAttribute("aria-expanded",open?"true":"false")});
menu.addEventListener("click",function(e){var k=e.target.getAttribute&&e.target.getAttribute("data-k");if(!k)return;if(k==="reset"){state={}}else{state[k]=!state[k]}
try{localStorage.setItem(KEY,JSON.stringify(state))}catch(err){}apply();mark()});
apply();mark();document.body.appendChild(btn);document.body.appendChild(menu);})();`;
  }

  function shabbatRuntime() {
    return `(function(){var text=${JSON.stringify(plus.shabbatText)};
var parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",weekday:"short",hour:"numeric",hour12:false}).formatToParts(new Date());
var map={};parts.forEach(function(p){map[p.type]=p.value});
var day=map.weekday,hour=parseInt(map.hour,10)%24;
if((day==="Fri"&&hour>=15)||(day==="Sat"&&hour<20)){
var banner=document.createElement("div");banner.className="plus-shabbat";banner.textContent="🕯️ "+text;
document.body.insertBefore(banner,document.body.firstChild);}})();`;
  }

  function proofRuntime() {
    return `(function(){var msgs=${JSON.stringify(proofMessages())};var index=0;
function show(){var bubble=document.createElement("div");bubble.className="plus-proof";bubble.textContent=msgs[index%msgs.length];index+=1;
document.body.appendChild(bubble);requestAnimationFrame(function(){bubble.classList.add("on")});
setTimeout(function(){bubble.classList.remove("on");setTimeout(function(){bubble.remove()},500)},6200);}
setTimeout(show,6000);setInterval(show,26000);})();`;
  }

  function countdownRuntime() {
    return `(function(){var bar=document.createElement("div");bar.className="plus-countdown";
bar.innerHTML=${JSON.stringify(escapeHtml(plus.countdownText))}+' <b>--:--:--</b>';
document.body.insertBefore(bar,document.body.firstChild);var label=bar.querySelector("b");
function tick(){var now=new Date();var end=new Date(now);end.setHours(23,59,59,999);
var total=Math.max(0,Math.floor((end-now)/1000));
label.textContent=[total/3600,total%3600/60,total%60].map(function(part){return String(Math.floor(part)).padStart(2,"0")}).join(":");}
tick();setInterval(tick,1000);})();`;
  }

  function auditChecks() {
    return [
      { ok: plus.enabled.access, text: "תפריט נגישות והצהרת נגישות (מומלץ לפי חוק)" },
      { ok: Boolean((plus.enabled.whatsapp && waNumber()) || (plus.enabled.actions && actionBarItems())), text: "ערוץ פנייה מיידי (WhatsApp / חיוג / Waze)" },
    ];
  }

  window.dafdafPlus = {
    exportAssets() {
      return { meta: exportMeta(), html: exportBodyHtml(), script: exportRuntimeScript() };
    },
    auditChecks,
  };

  /* ---------- misc ---------- */

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2000;background:#1c1917;color:white;padding:12px 20px;border-radius:999px;font:600 14px Heebo,sans-serif;box-shadow:0 12px 35px #0004";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[character]);
  }
})();
