(() => {
  "use strict";

  const ORIGINAL_CONFIG_KEY = "dafdaf-plus-config-v1";
  const CORRECTIONS_KEY = "dafdaf-plus-corrections-v1";
  const ISRAEL_TIME_ZONE = "Asia/Jerusalem";

  const CITIES = {
    jerusalem: { name: "ירושלים", latitude: 31.7683, longitude: 35.2137, candleMinutes: 40 },
    telAviv: { name: "תל אביב", latitude: 32.0853, longitude: 34.7818, candleMinutes: 18 },
    haifa: { name: "חיפה", latitude: 32.794, longitude: 34.9896, candleMinutes: 30 },
    beerSheva: { name: "באר שבע", latitude: 31.2529, longitude: 34.7915, candleMinutes: 18 },
    dimona: { name: "דימונה", latitude: 31.0708, longitude: 35.0327, candleMinutes: 18 },
    eilat: { name: "אילת", latitude: 29.5577, longitude: 34.9519, candleMinutes: 18 },
  };

  const correctionState = loadCorrections();
  let previewTimer = null;

  document.addEventListener("DOMContentLoaded", initCorrections);

  function initCorrections() {
    installCorrectionStyles();
    correctExistingAccessibilityStatement();
    observePanelsAndCanvas();
    startIsraelPreviewClock();
    overrideExportAndAudit();
  }

  function loadCorrections() {
    const defaults = { city: "jerusalem", havdalahMinutes: 40 };
    try {
      const stored = JSON.parse(localStorage.getItem(CORRECTIONS_KEY));
      if (!stored || typeof stored !== "object") return defaults;
      return {
        city: CITIES[stored.city] ? stored.city : defaults.city,
        havdalahMinutes: clampNumber(stored.havdalahMinutes, 20, 90, defaults.havdalahMinutes),
      };
    } catch {
      return defaults;
    }
  }

  function saveCorrections() {
    try {
      localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(correctionState));
    } catch {}
  }

  function originalConfig() {
    try {
      const value = JSON.parse(localStorage.getItem(ORIGINAL_CONFIG_KEY));
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function installCorrectionStyles() {
    if (document.getElementById("plus-corrections-style")) return;
    const style = document.createElement("style");
    style.id = "plus-corrections-style";
    style.textContent = `
      .plus-correction-fields{display:grid;gap:8px;margin-top:10px}
      .plus-correction-fields label{display:grid;gap:5px;color:var(--sh-txt2,#aaa);font-size:12px;font-weight:600}
      .plus-correction-fields select,.plus-correction-fields input{width:100%;padding:10px 12px;border:1px solid var(--sh-line,#555);border-radius:10px;background:var(--sh-bg1,#201c28);color:var(--sh-txt,#fff);font:inherit}
      .plus-correction-note{display:block;margin-top:8px;color:var(--sh-txt3,#999);font-size:11px;line-height:1.55}
    `;
    document.head.appendChild(style);
  }

  function observePanelsAndCanvas() {
    const observer = new MutationObserver(() => {
      correctBoosterPanel();
      correctExistingAccessibilityStatement();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function correctBoosterPanel() {
    const panel = document.getElementById("studio-panel");
    if (!panel?.classList.contains("open")) return;

    rewriteBooster(panel, "access", "♿ כלי עזר לנגישות", "הגדלת טקסט, ניגודיות, הדגשת קישורים ועצירת אנימציות. הכלי מסייע למשתמשים, אך אינו אישור לעמידה בתקן או תחליף לבדיקת נגישות מקצועית.");
    rewriteBooster(panel, "shabbat", "🕯️ הודעת שעות שבת", "מחשב זמני כניסה ויציאה לפי תאריך ועיר בישראל ומציג הודעה בזמן החלון שנבחר. הזמנים אסטרונומיים ומומלץ לאמת אותם לפי המנהג המקומי.");
    rewriteBooster(panel, "proof", "💬 מסרים מתחלפים", "בועות מתחלפות עם מסרים שאתם כותבים. אין להציג רכישות, ביקורות או פעילות שלא התרחשו בפועל.");
    rewriteBooster(panel, "countdown", "⏳ טיימר יומי", "ספירה לאחור עד חצות לפי שעון ישראל. הפעילו רק כאשר קיימת הטבה אמיתית שמסתיימת בזמן המוצג.");

    injectShabbatSettings(panel);
    replaceDefaultRotatingMessages(panel);
  }

  function rewriteBooster(panel, id, title, description) {
    const toggle = panel.querySelector(`[data-booster="${id}"]`);
    if (!toggle) return;
    const titleNode = toggle.querySelector("b");
    const descriptionNode = toggle.querySelector("small");
    if (titleNode) titleNode.textContent = title;
    if (descriptionNode) descriptionNode.textContent = description;
  }

  function injectShabbatSettings(panel) {
    const container = panel.querySelector('[data-booster="shabbat"] > span');
    if (!container || container.querySelector(".plus-correction-fields")) return;

    const fields = document.createElement("div");
    fields.className = "plus-correction-fields";
    const options = Object.entries(CITIES)
      .map(([key, city]) => `<option value="${key}" ${key === correctionState.city ? "selected" : ""}>${city.name}</option>`)
      .join("");
    fields.innerHTML = `
      <label>עיר לחישוב הזמנים<select data-correction-city>${options}</select></label>
      <label>צאת שבת, דקות אחרי שקיעה<input data-correction-havdalah type="number" min="20" max="90" value="${correctionState.havdalahMinutes}"></label>
      <span class="plus-correction-note">החישוב מבוסס על שקיעה אסטרונומית. זמני הדלקת הנרות נקבעים לפי ברירת המחדל המקובלת בעיר שנבחרה. יש לאמת זמנים ומנהגים לפני פרסום.</span>`;
    container.appendChild(fields);

    const citySelect = fields.querySelector("[data-correction-city]");
    const havdalahInput = fields.querySelector("[data-correction-havdalah]");
    [citySelect, havdalahInput].forEach((field) => {
      field.addEventListener("click", (event) => event.stopPropagation());
    });
    citySelect.addEventListener("change", () => {
      correctionState.city = citySelect.value;
      saveCorrections();
      updatePreviewTimeElements();
    });
    havdalahInput.addEventListener("input", () => {
      correctionState.havdalahMinutes = clampNumber(havdalahInput.value, 20, 90, 40);
      saveCorrections();
    });
  }

  function replaceDefaultRotatingMessages(panel) {
    const field = panel.querySelector('[data-plus-field="proofText"]');
    if (!field) return;
    const legacyDefault = "💬 מענה מהיר בווטסאפ — בדרך כלל תוך שעה\n⭐ לקוחות ממליצים עלינו — בדקו את ההמלצות בדף\n📞 אפשר גם להתקשר, אנחנו זמינים";
    if (field.value.trim() !== legacyDefault) return;
    field.value = "💬 אפשר לפנות אלינו ב-WhatsApp\n📞 נשמח לענות על שאלות בטלפון\n📍 בדקו בדף את אזורי הפעילות ופרטי השירות";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function correctExistingAccessibilityStatement() {
    document.querySelectorAll(".plus-a11y-statement").forEach((section) => {
      const title = section.querySelector("h2");
      const paragraph = section.querySelector("p");
      if (title) title.textContent = "מידע וכלי עזר לנגישות";
      if (paragraph) {
        paragraph.textContent = "בדף זה זמינים כלי עזר להגדלת טקסט, שינוי ניגודיות, הדגשת קישורים ועצירת אנימציות. כלים אלה נועדו לסייע בשימוש בדף, אך אינם מהווים אישור לעמידה בתקן נגישות או תחליף לבדיקת נגישות מקצועית. נתקלתם בקושי? פנו לבעל העסק באמצעות פרטי הקשר בדף כדי שניתן יהיה לטפל בו.";
      }
    });
  }

  function startIsraelPreviewClock() {
    if (previewTimer) return;
    const tick = () => updatePreviewTimeElements();
    tick();
    previewTimer = window.setInterval(tick, 500);
  }

  function updatePreviewTimeElements() {
    const seconds = secondsUntilIsraelMidnight(new Date());
    document.querySelectorAll(".plus-count-timer").forEach((timer) => {
      timer.textContent = formatDuration(seconds);
    });
    document.querySelectorAll(".plus-shabbat .plus-note").forEach((note) => {
      const city = CITIES[correctionState.city];
      note.textContent = `· בתצוגה המיוצאת יוצג לפי ${city.name} והתאריך בפועל`;
    });
  }

  function secondsUntilIsraelMidnight(date) {
    const parts = israelDateParts(date);
    return Math.max(0, 24 * 3600 - parts.hour * 3600 - parts.minute * 60 - parts.second);
  }

  function formatDuration(totalSeconds) {
    return [totalSeconds / 3600, (totalSeconds % 3600) / 60, totalSeconds % 60]
      .map((part) => String(Math.floor(part)).padStart(2, "0"))
      .join(":");
  }

  function israelDateParts(date) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: ISRAEL_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = {};
    formatter.formatToParts(date).forEach((part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
    });
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      weekday: parts.weekday,
      hour: Number(parts.hour) % 24,
      minute: Number(parts.minute),
      second: Number(parts.second),
    };
  }

  function overrideExportAndAudit() {
    const api = window.dafdafPlus;
    if (!api?.exportAssets) return;
    const originalExport = api.exportAssets.bind(api);

    api.exportAssets = () => {
      const assets = originalExport();
      const config = originalConfig();
      const enabled = config.enabled || {};
      const scripts = [];
      if (enabled.access) scripts.push(accessibilityRuntime());
      if (enabled.shabbat) scripts.push(shabbatRuntime(config.shabbatText || "אנחנו שומרים שבת. השאירו פרטים ונחזור אליכם לאחר השבת."));
      if (enabled.proof) {
        const messages = safeRotatingMessages(config.proofText);
        if (messages.length) scripts.push(rotatingMessagesRuntime(messages));
      }
      if (enabled.countdown) scripts.push(israelCountdownRuntime(config.countdownText || "ההטבה לפונים היום מסתיימת בעוד"));
      return { ...assets, script: scripts.join("\n") };
    };

    api.auditChecks = () => {
      const config = originalConfig();
      const enabled = config.enabled || {};
      const hasImmediateContact = Boolean(
        (enabled.whatsapp && normalizedWhatsapp(document.getElementById("f-whatsapp")?.value)) ||
        (enabled.actions && (document.getElementById("f-whatsapp")?.value || config.phone || config.wazeAddress))
      );
      return [
        { ok: Boolean(enabled.access), text: "נוסף כלי עזר לנגישות והסבר שאינו מחליף בדיקה מקצועית" },
        { ok: hasImmediateContact, text: "קיים ערוץ פנייה מיידי פעיל" },
      ];
    };
  }

  function normalizedWhatsapp(raw) {
    let digits = String(raw || "").replace(/[^0-9+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
    return /^\d{8,15}$/.test(digits) ? digits : "";
  }

  function safeRotatingMessages(raw) {
    const legacyDefault = "💬 מענה מהיר בווטסאפ — בדרך כלל תוך שעה\n⭐ לקוחות ממליצים עלינו — בדקו את ההמלצות בדף\n📞 אפשר גם להתקשר, אנחנו זמינים";
    const value = String(raw || "").trim() === legacyDefault
      ? "💬 אפשר לפנות אלינו ב-WhatsApp\n📞 נשמח לענות על שאלות בטלפון\n📍 בדקו בדף את אזורי הפעילות ופרטי השירות"
      : String(raw || "");
    return value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 6);
  }

  function accessibilityRuntime() {
    return `(function(){var KEY="plus-a11y";var root=document.documentElement;var state={};
try{state=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
var opts=[["font","טקסט מוגדל"],["contrast","ניגודיות גבוהה"],["links","הדגשת קישורים"],["motion","עצירת אנימציות"]];
function apply(){opts.forEach(function(o){root.classList.toggle("plus-a11y-"+o[0],!!state[o[0]])})}
var btn=document.createElement("button");btn.className="plus-a11y-btn";btn.type="button";btn.setAttribute("aria-label","פתיחת כלי עזר לנגישות");btn.setAttribute("aria-expanded","false");btn.textContent="♿";
var menu=document.createElement("div");menu.className="plus-a11y-menu";menu.setAttribute("role","dialog");menu.setAttribute("aria-label","כלי עזר לנגישות");
menu.innerHTML='<p style="font-size:12px;line-height:1.45">כלי עזר אלה אינם אישור לעמידה בתקן.</p>'+opts.map(function(o){return '<button type="button" data-k="'+o[0]+'">'+o[1]+"</button>"}).join("")+'<button type="button" data-k="reset">איפוס</button>';
function mark(){[].forEach.call(menu.querySelectorAll("[data-k]"),function(b){var k=b.getAttribute("data-k");b.classList.toggle("on",!!state[k]);if(k!=="reset")b.setAttribute("aria-pressed",state[k]?"true":"false")})}
function close(){menu.classList.remove("open");btn.setAttribute("aria-expanded","false")}
btn.addEventListener("click",function(){var open=menu.classList.toggle("open");btn.setAttribute("aria-expanded",open?"true":"false");if(open){var first=menu.querySelector("button");if(first)first.focus()}});
menu.addEventListener("click",function(e){var k=e.target.getAttribute&&e.target.getAttribute("data-k");if(!k)return;if(k==="reset"){state={}}else{state[k]=!state[k]}try{localStorage.setItem(KEY,JSON.stringify(state))}catch(err){}apply();mark()});
document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});apply();mark();document.body.appendChild(btn);document.body.appendChild(menu);})();`;
  }

  function israelCountdownRuntime(text) {
    return `(function(){var text=${JSON.stringify(String(text))};var bar=document.createElement("div");bar.className="plus-countdown";bar.textContent=text+" ";var label=document.createElement("b");label.textContent="--:--:--";bar.appendChild(label);document.body.insertBefore(bar,document.body.firstChild);
function parts(){var out={};new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jerusalem",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).forEach(function(p){if(p.type!=="literal")out[p.type]=p.value});return out}
function tick(){var p=parts(),total=Math.max(0,86400-(Number(p.hour)%24)*3600-Number(p.minute)*60-Number(p.second));label.textContent=[total/3600,total%3600/60,total%60].map(function(v){return String(Math.floor(v)).padStart(2,"0")}).join(":")}
tick();setInterval(tick,1000)})();`;
  }

  function rotatingMessagesRuntime(messages) {
    return `(function(){var msgs=${JSON.stringify(messages)},index=0;if(!msgs.length)return;function show(){var bubble=document.createElement("div");bubble.className="plus-proof";bubble.textContent=msgs[index%msgs.length];index+=1;document.body.appendChild(bubble);requestAnimationFrame(function(){bubble.classList.add("on")});setTimeout(function(){bubble.classList.remove("on");setTimeout(function(){bubble.remove()},500)},6200)}setTimeout(show,6000);setInterval(show,26000)})();`;
  }

  function shabbatRuntime(text) {
    const city = CITIES[correctionState.city];
    const settings = {
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      candleMinutes: city.candleMinutes,
      havdalahMinutes: correctionState.havdalahMinutes,
    };
    return `(function(){var text=${JSON.stringify(String(text))},settings=${JSON.stringify(settings)},banner=null;
function rad(v){return v*Math.PI/180}function deg(v){return v*180/Math.PI}function norm(v,m){return((v%m)+m)%m}
function dayOfYear(y,m,d){return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/86400000)}
function sunset(y,m,d){var n=dayOfYear(y,m,d),lh=settings.longitude/15,t=n+(18-lh)/24,M=.9856*t-3.289,L=norm(M+1.916*Math.sin(rad(M))+.02*Math.sin(rad(2*M))+282.634,360),RA=norm(deg(Math.atan(.91764*Math.tan(rad(L)))),360),Lq=Math.floor(L/90)*90,RAq=Math.floor(RA/90)*90;RA=(RA+Lq-RAq)/15;var sinDec=.39782*Math.sin(rad(L)),cosDec=Math.cos(Math.asin(sinDec)),cosH=(Math.cos(rad(90.833))-sinDec*Math.sin(rad(settings.latitude)))/(cosDec*Math.cos(rad(settings.latitude)));if(cosH>1||cosH< -1)return null;var H=deg(Math.acos(cosH))/15,T=H+RA-.06571*t-6.622,UT=norm(T-lh,24);return Date.UTC(y,m-1,d)+UT*3600000}
function israel(){var out={};new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jerusalem",year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"}).formatToParts(new Date()).forEach(function(p){if(p.type!=="literal")out[p.type]=p.value});return{year:Number(out.year),month:Number(out.month),day:Number(out.day),weekday:out.weekday}}
function addDay(p,delta){var x=new Date(Date.UTC(p.year,p.month-1,p.day+delta));return{year:x.getUTCFullYear(),month:x.getUTCMonth()+1,day:x.getUTCDate()}}
function active(){var p=israel(),fri;if(p.weekday==="Fri")fri=p;else if(p.weekday==="Sat")fri=addDay(p,-1);else return false;var sat=addDay(fri,1),entry=sunset(fri.year,fri.month,fri.day),exit=sunset(sat.year,sat.month,sat.day);if(entry===null||exit===null)return false;entry-=settings.candleMinutes*60000;exit+=settings.havdalahMinutes*60000;var now=Date.now();return now>=entry&&now<exit}
function update(){var show=active();if(show&&!banner){banner=document.createElement("div");banner.className="plus-shabbat";banner.textContent="🕯️ "+text;document.body.insertBefore(banner,document.body.firstChild)}else if(!show&&banner){banner.remove();banner=null}}
update();setInterval(update,60000)})();`;
  }
})();
