(() => {
  "use strict";

  const VIBE_HUES = { trust: 230, energetic: 25, luxury: 290 };
  const BLOCK_ORDER = ["hero", "features", "process", "testimonials", "cta"];
  const LOADING_MESSAGES = [
    "מנתח את העסק שלכם...",
    "מנסח כותרת שתמשוך תשומת לב...",
    "בונה טיעוני מכירה...",
    "כותב עדויות לקוחות...",
    "מסדר את הדף לפי הסגנון שבחרתם...",
    "כמעט מוכן...",
  ];

  const emptyData = () => ({
    businessName: "",
    industry: "",
    description: "",
    vibe: "",
    goal: "",
    whatsapp: "",
    leadEmail: "",
    ctaUrl: "",
  });

  const state = { step: 1, totalSteps: 4, data: emptyData(), page: null, submitting: false };
  const els = {};
  let loadingInterval = null;
  let retryButton = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    Object.assign(els, {
      wizard: document.getElementById("wizard"),
      loading: document.getElementById("loading"),
      loadingStatus: document.getElementById("loading-status"),
      result: document.getElementById("result"),
      canvas: document.getElementById("result-canvas"),
      btnNext: document.getElementById("btn-next"),
      btnBack: document.getElementById("btn-back"),
      btnRestart: document.getElementById("btn-restart"),
      btnDownload: document.getElementById("btn-download"),
    });

    ["f-name", "f-industry", "f-description"].forEach((id) => {
      document.getElementById(id).addEventListener("input", updateNextState);
    });

    document.getElementById("industry-chips").addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (!chip) return;
      document.getElementById("f-industry").value = chip.dataset.value;
      selectSingleChip(event.currentTarget, chip);
      updateNextState();
    });

    document.getElementById("goal-chips").addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (!chip) return;
      selectSingleChip(event.currentTarget, chip);
      state.data.goal = chip.dataset.value;
      updateNextState();
    });

    const vibeGrid = document.getElementById("vibe-grid");
    vibeGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".vibe-card");
      if (!card) return;
      selectSingleChip(event.currentTarget, card, "vibe-card");
      state.data.vibe = card.dataset.value;
      applyVibe(card.dataset.value);
      updateNextState();
    });
    vibeGrid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest(".vibe-card");
      if (!card) return;
      event.preventDefault();
      card.click();
    });

    els.btnNext.addEventListener("click", onNext);
    els.btnBack.addEventListener("click", onBack);
    els.btnRestart.addEventListener("click", restart);
    els.btnDownload.addEventListener("click", downloadHtml);
    els.canvas.addEventListener("click", onCanvasClick);
    els.canvas.addEventListener("focusout", persistEditableText, true);
    els.canvas.addEventListener("submit", (event) => {
      if (!event.target.matches(".lead-form")) return;
      event.preventDefault();
      toast("זו תצוגה מקדימה. בקובץ המיוצא הטופס יפתח הודעת אימייל מוכנה.");
    });

    updateProgress();
    updateNextState();
  }

  function persistEditableText(event) {
    const element = event.target;
    if (!(element instanceof HTMLElement) || element.getAttribute("contenteditable") !== "true") return;
    const path = element.dataset.path;
    if (path) setByPath(state.page, path, element.textContent.trim());
  }

  function selectSingleChip(container, selected, className = "chip") {
    container.querySelectorAll(`.${className}`).forEach((element) => element.classList.remove("selected"));
    selected.classList.add("selected");
  }

  function applyVibe(vibe) {
    document.body.className = `vibe-${vibe || "trust"}`;
  }

  function currentStepValid() {
    if (state.step === 1) {
      return document.getElementById("f-name").value.trim().length > 0 &&
        document.getElementById("f-industry").value.trim().length > 0;
    }
    if (state.step === 2) return document.getElementById("f-description").value.trim().length >= 10;
    if (state.step === 3) return Boolean(state.data.vibe);
    if (state.step === 4) return Boolean(state.data.goal);
    return false;
  }

  function updateNextState() {
    els.btnNext.disabled = state.submitting || !currentStepValid();
    els.btnNext.textContent = state.step === state.totalSteps ? "בנו לי דף נחיתה עם AI ✨" : "המשך";
    els.btnBack.style.visibility = state.step === 1 ? "hidden" : "visible";
    els.btnBack.disabled = state.submitting;
  }

  function updateProgress() {
    document.querySelectorAll(".wizard-progress span").forEach((dot) => {
      dot.classList.toggle("done", Number(dot.dataset.step) <= state.step);
    });
    document.querySelectorAll(".wizard-step").forEach((section) => {
      section.classList.toggle("active", Number(section.dataset.step) === state.step);
    });
  }

  function collectData() {
    state.data.businessName = document.getElementById("f-name").value.trim();
    state.data.industry = document.getElementById("f-industry").value.trim();
    state.data.description = document.getElementById("f-description").value.trim();
    state.data.whatsapp = document.getElementById("f-whatsapp").value.trim();
    state.data.leadEmail = document.getElementById("f-email").value.trim();
    state.data.ctaUrl = document.getElementById("f-cta-url").value.trim();
  }

  function onNext() {
    if (state.submitting || !currentStepValid()) return;
    if (state.step < state.totalSteps) {
      state.step += 1;
      updateProgress();
      updateNextState();
      return;
    }
    collectData();
    submitToAI();
  }

  function onBack() {
    if (state.submitting || state.step === 1) return;
    state.step -= 1;
    updateProgress();
    updateNextState();
  }

  function clearLoadingState() {
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = null;
    retryButton?.remove();
    retryButton = null;
  }

  function restart() {
    clearLoadingState();
    state.step = 1;
    state.page = null;
    state.data = emptyData();
    state.submitting = false;
    ["f-name", "f-industry", "f-description", "f-whatsapp", "f-email", "f-cta-url"].forEach((id) => {
      document.getElementById(id).value = "";
    });
    document.querySelectorAll(".chip.selected, .vibe-card.selected").forEach((element) => {
      element.classList.remove("selected");
    });
    applyVibe("trust");
    els.result.style.display = "none";
    els.loading.style.display = "none";
    els.wizard.style.display = "block";
    updateProgress();
    updateNextState();
  }

  function startLoadingMessages() {
    let index = 0;
    els.loadingStatus.textContent = LOADING_MESSAGES[0];
    loadingInterval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      els.loadingStatus.textContent = LOADING_MESSAGES[index];
    }, 1600);
  }

  async function apiError(response) {
    const body = await response.json().catch(() => ({}));
    const retryAfter = Number(response.headers.get("Retry-After") || body.retryAfter || 0);
    const error = new Error(body.error || `שגיאת שרת (${response.status})`);
    error.status = response.status;
    error.retryAfter = retryAfter;
    return error;
  }

  function showRetry(error) {
    let message = "משהו השתבש. נסו שוב.";
    if (error.status === 429) message = error.message;
    else if (error.status === 400) message = `יש לבדוק את הפרטים: ${error.message}`;
    else if (!navigator.onLine) message = "אין חיבור לרשת. בדקו את החיבור ונסו שוב.";
    els.loadingStatus.textContent = message;

    retryButton = document.createElement("button");
    retryButton.className = "btn btn-primary";
    retryButton.style.marginTop = "20px";
    retryButton.textContent = error.retryAfter ? `נסו שוב בעוד ${error.retryAfter} שניות` : "נסו שוב";
    retryButton.disabled = Boolean(error.retryAfter);
    if (error.retryAfter) {
      window.setTimeout(() => {
        if (!retryButton) return;
        retryButton.disabled = false;
        retryButton.textContent = "נסו שוב";
      }, Math.min(error.retryAfter, 3600) * 1000);
    }
    retryButton.addEventListener("click", () => {
      els.loading.style.display = "none";
      els.wizard.style.display = "block";
      retryButton?.remove();
      retryButton = null;
      updateNextState();
    });
    els.loading.appendChild(retryButton);
  }

  async function submitToAI() {
    if (state.submitting) return;
    state.submitting = true;
    updateNextState();
    clearLoadingState();
    els.wizard.style.display = "none";
    els.loading.style.display = "block";
    startLoadingMessages();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state.data),
      });
      if (!response.ok) throw await apiError(response);
      const page = await response.json();
      els.loading.style.display = "none";
      els.result.style.display = "block";
      buildPage(page);
    } catch (error) {
      showRetry(error);
    } finally {
      if (loadingInterval) clearInterval(loadingInterval);
      loadingInterval = null;
      state.submitting = false;
      updateNextState();
    }
  }

  function buildPage(page) {
    state.page = page;
    els.canvas.innerHTML = "";
    BLOCK_ORDER.forEach((type) => {
      const slot = document.createElement("div");
      slot.className = "block-slot";
      slot.dataset.block = type;
      slot.innerHTML = skeletonHtml();
      els.canvas.appendChild(slot);
    });
    const footer = document.createElement("div");
    footer.innerHTML = footerHtml(state.data.businessName);
    els.canvas.appendChild(footer);
    BLOCK_ORDER.forEach((type, index) => {
      setTimeout(() => revealBlock(type, page[type]), index * 450);
    });
  }

  function revealBlock(type, data) {
    const slot = els.canvas.querySelector(`.block-slot[data-block="${type}"]`);
    if (!slot) return;
    slot.innerHTML = renderBlockHtml(type, data);
    const blockElement = slot.querySelector(".ai-block");
    if (!blockElement) return;
    blockElement.classList.add("revealing");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      blockElement.classList.remove("revealing");
      blockElement.classList.add("revealed");
    }));
  }

  async function onCanvasClick(event) {
    const button = event.target.closest(".block-toolbar button");
    if (!button || button.dataset.busy === "true") return;
    const blockElement = button.closest(".ai-block");
    const blockType = blockElement.dataset.block;
    const action = button.dataset.action;
    const toolbar = blockElement.querySelector(".block-toolbar");
    toolbar.querySelectorAll("button").forEach((item) => {
      item.disabled = true;
      item.dataset.busy = "true";
    });
    blockElement.style.opacity = "0.5";

    try {
      const response = await fetch("/api/regenerate-block", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockType,
          current: state.page[blockType],
          instruction: action,
          context: state.data,
        }),
      });
      if (!response.ok) throw await apiError(response);
      const updated = await response.json();
      state.page[blockType] = updated;
      const slot = els.canvas.querySelector(`.block-slot[data-block="${blockType}"]`);
      slot.innerHTML = renderBlockHtml(blockType, updated);
    } catch (error) {
      blockElement.style.opacity = "1";
      toolbar.querySelectorAll("button").forEach((item) => {
        item.disabled = false;
        delete item.dataset.busy;
      });
      toast(error.message || "לא ניתן לשכתב את המקטע כרגע");
    }
  }

  function skeletonHtml() {
    return `<div class="skeleton-block"><div class="skeleton-line" style="width:30%;height:14px;"></div><div class="skeleton-line" style="width:60%;height:32px;margin-top:10px;"></div><div class="skeleton-line" style="width:45%;"></div></div>`;
  }

  function toolbarHtml() {
    return `<div class="block-toolbar no-export"><button type="button" data-action="rewrite">🔄 נסח מחדש</button><button type="button" data-action="shorten">✂ קצר</button><button type="button" data-action="sales">🔥 מכירתי יותר</button></div>`;
  }

  function renderBlockHtml(type, data) {
    return {
      hero: heroTemplate,
      features: featuresTemplate,
      process: processTemplate,
      testimonials: testimonialsTemplate,
      cta: ctaTemplate,
    }[type](data);
  }

  function ed(path, value) {
    return `contenteditable="true" data-path="${path}">${escapeHtml(value ?? "")}`;
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

  function normalizedWhatsapp(raw) {
    let digits = String(raw || "").replace(/[^0-9+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
    return /^\d{8,15}$/.test(digits) ? digits : "";
  }

  function validEmail(raw) {
    const email = String(raw || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
  }

  function contactTarget() {
    const url = safeExternalUrl(state.data.ctaUrl);
    if (url) return { href: url, external: true, type: "url" };
    const phone = normalizedWhatsapp(state.data.whatsapp);
    if (phone) {
      const message = encodeURIComponent(`שלום, הגעתי מדף הנחיתה של ${state.data.businessName}`);
      return { href: `https://wa.me/${phone}?text=${message}`, external: true, type: "whatsapp" };
    }
    const email = validEmail(state.data.leadEmail);
    if (email) return { href: `mailto:${encodeURIComponent(email)}`, external: false, type: "email" };
    return null;
  }

  function linkAttrs(target) {
    return target?.external
      ? `href="${escapeHtml(target.href)}" target="_blank" rel="noopener noreferrer"`
      : `href="${escapeHtml(target?.href || "#")}"`;
  }

  function heroTemplate(data) {
    const points = (data.trustPoints || []).map((point, index) => `<div style="display:flex;align-items:center;gap:6px;"><span style="color:var(--accent);">✓</span><span ${ed(`hero.trustPoints.${index}`, point)}</span></div>`).join("");
    const target = contactTarget();
    const primary = target
      ? `<a ${linkAttrs(target)} style="display:inline-block;background:var(--ink);color:white;padding:16px 30px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;"><span ${ed("hero.ctaPrimary", data.ctaPrimary)}</span></a>`
      : `<span data-export-remove="true" style="display:inline-block;background:var(--ink);color:white;padding:16px 30px;border-radius:12px;font-weight:700;font-size:16px;cursor:text;"><span ${ed("hero.ctaPrimary", data.ctaPrimary)}</span></span>`;
    const secondary = target
      ? `<a href="#lead-action" style="display:inline-block;background:white;color:var(--ink);padding:16px 30px;border-radius:12px;font-weight:700;font-size:16px;border:1px solid oklch(0.88 0.01 80);text-decoration:none;"><span ${ed("hero.ctaSecondary", data.ctaSecondary)}</span></a>`
      : `<span data-export-remove="true" style="display:inline-block;background:white;color:var(--ink);padding:16px 30px;border-radius:12px;font-weight:700;font-size:16px;border:1px solid oklch(0.88 0.01 80);"><span ${ed("hero.ctaSecondary", data.ctaSecondary)}</span></span>`;
    return `<section class="ai-block" data-block="hero" style="position:relative;padding:96px 64px 64px;max-width:1200px;margin:0 auto;text-align:center;"><div style="display:inline-flex;align-items:center;gap:8px;background:var(--accent-tint);color:var(--accent-dark);padding:7px 14px;border-radius:999px;font-size:14px;font-weight:600;margin-bottom:24px;"><span ${ed("hero.badge", data.badge)}</span></div><h1 style="font-size:48px;font-weight:800;line-height:1.15;margin:0 0 20px;letter-spacing:-.5px;"><span ${ed("hero.headline", data.headline)}</span><br><span style="background:linear-gradient(135deg,var(--accent),oklch(0.65 0.16 calc(var(--hue) + 50)));-webkit-background-clip:text;background-clip:text;color:transparent;" ${ed("hero.highlight", data.highlight)}</span></h1><p style="font-size:18px;color:oklch(0.42 0.01 80);max-width:620px;margin:0 auto 32px;" ${ed("hero.subheadline", data.subheadline)}</p><div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:28px;">${primary}${secondary}</div><div style="display:flex;gap:24px;justify-content:center;font-size:14px;color:oklch(0.48 0.01 80);flex-wrap:wrap;">${points}</div>${toolbarHtml()}</section>`;
  }

  function featuresTemplate(data) {
    const items = (data.items || []).map((item, index) => `<div style="padding:28px;border:1px solid oklch(0.92 0.01 80);border-radius:16px;"><div style="width:44px;height:44px;border-radius:12px;background:var(--accent-tint);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px;" ${ed(`features.items.${index}.icon`, item.icon)}</div><h3 style="font-size:18px;font-weight:700;margin:0 0 8px;" ${ed(`features.items.${index}.title`, item.title)}</h3><p style="font-size:14px;color:oklch(0.48 0.01 80);margin:0;" ${ed(`features.items.${index}.text`, item.text)}</p></div>`).join("");
    return `<section class="ai-block" data-block="features" style="position:relative;padding:72px 64px;background:white;border-top:1px solid oklch(0.92 0.01 80);border-bottom:1px solid oklch(0.92 0.01 80);"><div style="max-width:1200px;margin:0 auto;"><div style="text-align:center;max-width:640px;margin:0 auto 48px;"><div style="font-size:14px;font-weight:700;color:var(--accent-dark);margin-bottom:12px;" ${ed("features.eyebrow", data.eyebrow)}</div><h2 style="font-size:32px;font-weight:800;margin:0 0 14px;" ${ed("features.title", data.title)}</h2><p style="font-size:16px;color:oklch(0.45 0.01 80);margin:0;" ${ed("features.subtitle", data.subtitle)}</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;">${items}</div></div>${toolbarHtml()}</section>`;
  }

  function processTemplate(data) {
    const steps = (data.steps || []).map((step, index) => `<div style="padding:26px;border-radius:16px;background:oklch(0.97 0.005 80);border:1px solid oklch(0.9 0.01 80);"><div style="width:32px;height:32px;border-radius:999px;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:16px;">${index + 1}</div><h3 style="font-size:17px;font-weight:700;margin:0 0 8px;" ${ed(`process.steps.${index}.title`, step.title)}</h3><p style="font-size:14px;color:oklch(0.48 0.01 80);margin:0;" ${ed(`process.steps.${index}.text`, step.text)}</p></div>`).join("");
    return `<section class="ai-block" data-block="process" style="position:relative;padding:72px 64px;max-width:1200px;margin:0 auto;"><div style="text-align:center;max-width:640px;margin:0 auto 40px;"><div style="font-size:14px;font-weight:700;color:var(--accent-dark);margin-bottom:12px;" ${ed("process.eyebrow", data.eyebrow)}</div><h2 style="font-size:32px;font-weight:800;margin:0;" ${ed("process.title", data.title)}</h2></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;">${steps}</div>${toolbarHtml()}</section>`;
  }

  function testimonialsTemplate(data) {
    const items = (data.items || []).map((item, index) => `<div style="background:oklch(0.27 0.01 80);border-radius:16px;padding:24px;"><p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:oklch(0.9 0.005 80);" ${ed(`testimonials.items.${index}.quote`, item.quote)}</p><div style="font-weight:700;font-size:14px;" ${ed(`testimonials.items.${index}.name`, item.name)}</div><div style="font-size:12px;color:oklch(0.65 0.01 80);" ${ed(`testimonials.items.${index}.role`, item.role)}</div></div>`).join("");
    return `<section class="ai-block" data-block="testimonials" style="position:relative;padding:72px 64px;background:var(--ink);color:white;"><div style="max-width:1200px;margin:0 auto;"><div style="text-align:center;max-width:600px;margin:0 auto 40px;"><div style="font-size:14px;font-weight:700;color:oklch(0.75 0.13 var(--hue));margin-bottom:12px;" ${ed("testimonials.eyebrow", data.eyebrow)}</div><h2 style="font-size:30px;font-weight:800;margin:0;" ${ed("testimonials.title", data.title)}</h2></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">${items}</div></div>${toolbarHtml()}</section>`;
  }

  function ctaTemplate(data) {
    const target = contactTarget();
    const email = validEmail(state.data.leadEmail);
    let action;
    if (email) {
      action = `<form id="lead-action" class="lead-form" action="mailto:${escapeHtml(email)}" method="post" enctype="text/plain" style="max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:12px;"><div style="font-weight:700;font-size:15px;" ${ed("cta.formTitle", data.formTitle)}</div><input name="name" type="text" placeholder="שם מלא" required style="padding:14px 16px;border-radius:10px;border:1.5px solid oklch(0.88 0.01 80);font-family:inherit;font-size:15px;"><input name="phone" type="tel" placeholder="טלפון" required style="padding:14px 16px;border-radius:10px;border:1.5px solid oklch(0.88 0.01 80);font-family:inherit;font-size:15px;"><button type="submit" style="background:var(--accent);color:white;padding:14px;border-radius:10px;font-weight:700;border:none;cursor:pointer;font-family:inherit;"><span ${ed("cta.buttonText", data.buttonText)}</span></button></form><p class="no-export" style="font-size:12px;color:oklch(0.5 0.01 80);">בייצוא, השליחה תפתח הודעת אימייל דרך תוכנת הדואר של המשתמש.</p>`;
    } else if (target) {
      action = `<div id="lead-action"><a ${linkAttrs(target)} style="display:inline-block;background:var(--accent);color:white;padding:15px 30px;border-radius:10px;font-weight:700;text-decoration:none;"><span ${ed("cta.buttonText", data.buttonText)}</span></a></div>`;
    } else {
      action = `<div data-export-remove="true" class="no-export" style="padding:18px;border:1px dashed oklch(0.75 0.03 80);border-radius:12px;color:oklch(0.45 0.01 80);">לא הוגדר יעד פעיל. הוסיפו WhatsApp, אימייל או קישור לפני הייצוא.</div>`;
    }
    return `<section class="ai-block" data-block="cta" style="position:relative;padding:80px 64px;max-width:900px;margin:0 auto;text-align:center;"><h2 style="font-size:32px;font-weight:800;margin:0 0 16px;" ${ed("cta.title", data.title)}</h2><p style="font-size:16px;color:oklch(0.45 0.01 80);margin:0 0 28px;" ${ed("cta.subtitle", data.subtitle)}</p>${action}${toolbarHtml()}</section>`;
  }

  function footerHtml(businessName) {
    return `<footer style="padding:40px 64px;border-top:1px solid oklch(0.92 0.01 80);text-align:center;font-size:13px;color:oklch(0.55 0.01 80);">נבנה עבור <strong>${escapeHtml(businessName)}</strong> · דף זה נוצר עם דפדף AI</footer>`;
  }

  function downloadHtml() {
    const clone = els.canvas.cloneNode(true);
    clone.querySelectorAll(".no-export, [data-export-remove='true'], .skeleton-block").forEach((element) => {
      element.remove();
    });
    clone.querySelectorAll("[contenteditable]").forEach((element) => {
      element.removeAttribute("contenteditable");
      element.removeAttribute("data-path");
    });
    clone.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/^javascript:/i.test(href)) link.removeAttribute("href");
    });

    const hue = VIBE_HUES[state.data.vibe] || 290;
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(state.data.businessName || "דף נחיתה")}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{margin:0;font-family:'Heebo',sans-serif;line-height:1.5;overflow-x:hidden;background:var(--paper);color:var(--ink)}:root{--hue:${hue};--accent:oklch(0.6 0.16 var(--hue));--accent-dark:oklch(0.42 0.14 var(--hue));--accent-tint:oklch(0.94 0.03 var(--hue));--ink:oklch(0.22 0.01 80);--paper:oklch(0.985 0.006 80)}a{color:inherit}</style>
</head>
<body>${clone.innerHTML}</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(state.data.businessName || "landing-page")}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function toast(message) {
    const element = document.createElement("div");
    element.textContent = message;
    element.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:white;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;z-index:999;box-shadow:0 10px 30px -8px oklch(0.2 0.02 80 / .5);";
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3200);
  }

  function setByPath(object, path, value) {
    const keys = path.split(".");
    let current = object;
    for (let index = 0; index < keys.length - 1; index += 1) {
      current = current?.[keys[index]];
      if (current == null) return;
    }
    current[keys[keys.length - 1]] = value;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^\w֐-׿]+/g, "-")
      .replace(/^-+|-+$/g, "") || "landing-page";
  }
})();
