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
    formEndpoint: "",
    gtmId: "",
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
      toast("זו תצוגה מקדימה. בקובץ המיוצא הטופס יישלח ליעד שהגדרתם.");
    });

    document.getElementById("dest-target")?.addEventListener("click", openDestinationPanel);
    document.getElementById("studio-backdrop")?.addEventListener("click", closeDestinationPanel);

    updateProgress();
    updateNextState();
  }

  function refreshDestination() {
    if (!state.page) return;
    const heroCtas = els.canvas.querySelector(".pg-hero .pg-ctas");
    if (heroCtas) heroCtas.innerHTML = buildHeroCtas(state.page.hero || {});
    const zone = els.canvas.querySelector("#cta-action-zone");
    if (zone) zone.innerHTML = buildCtaAction(state.page.cta || {});
    updateDestStatus();
  }

  function updateDestStatus() {
    const statusEl = document.getElementById("dest-status");
    if (!statusEl) return;
    const configured = Boolean(contactTarget() || safeFormEndpoint(state.data.formEndpoint));
    statusEl.textContent = configured ? "✓ מוגדר" : "⚠ לא הוגדר";
    statusEl.classList.toggle("ok", configured);
    statusEl.classList.toggle("warn", !configured);
  }

  function openDestinationPanel() {
    const panel = document.getElementById("studio-panel");
    const backdrop = document.getElementById("studio-backdrop");
    if (!panel || !backdrop) return;
    panel.innerHTML = `<button type="button" class="btn btn-ghost btn-sm" id="dest-panel-close" style="float:left">סגירה</button><h3>פרסום ולידים</h3><p>חברו ערוץ פנייה, קליטת טופס ומדידה לפני הורדת הדף.</p><div class="publish-panel-section"><h4>פעולה ראשית</h4><label class="field-label" for="dest-whatsapp">WhatsApp</label><input id="dest-whatsapp" class="field-input" type="tel" maxlength="30" autocomplete="tel" placeholder="050-1234567" value="${escapeHtml(state.data.whatsapp)}"><label class="field-label" for="dest-cta-url">קישור להזמנה או לקביעת תור</label><input id="dest-cta-url" class="field-input" type="url" maxlength="500" inputmode="url" placeholder="https://example.com/order" value="${escapeHtml(state.data.ctaUrl)}"></div><div class="publish-panel-section"><h4>קליטת טופס</h4><label class="field-label" for="dest-form-endpoint">כתובת מאובטחת לקבלת לידים</label><input id="dest-form-endpoint" class="field-input" type="url" maxlength="500" inputmode="url" placeholder="https://formspree.io/f/…" value="${escapeHtml(state.data.formEndpoint)}"><p class="field-help">מתאים ל־Formspree או לשירות טפסים שמקבל POST רגיל. אם אין כתובת כזאת, אפשר להשתמש זמנית באימייל.</p><label class="field-label" for="dest-email">אימייל חלופי</label><input id="dest-email" class="field-input" type="email" maxlength="254" autocomplete="email" placeholder="hello@example.com" value="${escapeHtml(state.data.leadEmail)}"></div><div class="publish-panel-section"><h4>מדידת קמפיין</h4><label class="field-label" for="dest-gtm">Google Tag Manager</label><input id="dest-gtm" class="field-input" type="text" maxlength="20" autocomplete="off" placeholder="GTM-XXXXXXX" value="${escapeHtml(state.data.gtmId)}"><p class="field-help">הקוד יוטמע רק בקובץ המיוצא. אפשר לנהל דרכו GA4, Meta Pixel ותגי פרסום.</p></div><button type="button" class="btn btn-primary btn-sm publish-save" id="dest-save">שמירת הגדרות</button>`;
    panel.classList.add("open");
    backdrop.classList.add("open");
    document.getElementById("dest-panel-close").addEventListener("click", closeDestinationPanel);
    document.getElementById("dest-save").addEventListener("click", () => {
      const next = {
        whatsapp: document.getElementById("dest-whatsapp").value.trim(),
        leadEmail: document.getElementById("dest-email").value.trim(),
        ctaUrl: document.getElementById("dest-cta-url").value.trim(),
        formEndpoint: document.getElementById("dest-form-endpoint").value.trim(),
        gtmId: document.getElementById("dest-gtm").value.trim().toUpperCase(),
      };
      if (next.formEndpoint && !safeFormEndpoint(next.formEndpoint)) {
        toast("כתובת קליטת הלידים חייבת להתחיל ב־https://");
        return;
      }
      if (next.gtmId && !validGtmId(next.gtmId)) {
        toast("מזהה GTM אינו תקין. לדוגמה: GTM-XXXXXXX");
        return;
      }
      Object.assign(state.data, next);
      refreshDestination();
      closeDestinationPanel();
      toast("יעד הפעולה עודכן בדף");
    });
  }

  function closeDestinationPanel() {
    document.getElementById("studio-panel")?.classList.remove("open");
    document.getElementById("studio-backdrop")?.classList.remove("open");
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
    ["f-name", "f-industry", "f-description"].forEach((id) => {
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
    els.canvas.style.setProperty("--hue", VIBE_HUES[state.data.vibe] || 290);
    els.canvas.dataset.vibe = state.data.vibe || "trust";
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
    updateDestStatus();
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

  function safeFormEndpoint(raw) {
    try {
      const url = new URL(String(raw || "").trim());
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function validGtmId(raw) {
    const value = String(raw || "").trim().toUpperCase();
    return /^GTM-[A-Z0-9]{4,15}$/.test(value) ? value : "";
  }

  function trackingTags() {
    const id = validGtmId(state.data.gtmId);
    if (!id) return { head: "", body: "" };
    return {
      head: `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');<\/script>`,
      body: `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    };
  }

  window.dafdafExportSettings = () => ({
    whatsapp: state.data.whatsapp,
    leadEmail: validEmail(state.data.leadEmail),
    ctaUrl: safeExternalUrl(state.data.ctaUrl),
    formEndpoint: safeFormEndpoint(state.data.formEndpoint),
    gtmId: validGtmId(state.data.gtmId),
  });

  window.dafdafApplyExportSettings = (settings = {}) => {
    const next = {
      whatsapp: String(settings.whatsapp || "").trim(),
      leadEmail: validEmail(settings.leadEmail),
      ctaUrl: safeExternalUrl(settings.ctaUrl),
      formEndpoint: safeFormEndpoint(settings.formEndpoint),
      gtmId: validGtmId(settings.gtmId),
    };
    Object.assign(state.data, next);
    refreshDestination();
  };

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

  function buildHeroCtas(data) {
    const target = contactTarget();
    const hasLeadForm = Boolean(safeFormEndpoint(state.data.formEndpoint) || validEmail(state.data.leadEmail));
    const primaryInner = `<span ${ed("hero.ctaPrimary", data.ctaPrimary)}</span>`;
    const primary = target
      ? `<a class="pg-btn pg-btn-primary" ${linkAttrs(target)}>${primaryInner}</a>`
      : hasLeadForm
        ? `<a class="pg-btn pg-btn-primary" href="#lead-action">${primaryInner}</a>`
        : `<span class="pg-btn pg-btn-primary" data-export-remove="true">${primaryInner}</span>`;
    const secondaryInner = `<span ${ed("hero.ctaSecondary", data.ctaSecondary)}</span>`;
    const secondary = target || hasLeadForm
      ? `<a class="pg-btn pg-btn-ghost" href="#lead-action">${secondaryInner}</a>`
      : `<span class="pg-btn pg-btn-ghost" data-export-remove="true">${secondaryInner}</span>`;
    return primary + secondary;
  }

  function heroTemplate(data) {
    const points = (data.trustPoints || []).map((point, index) => `<span class="pg-point"><b>✓</b><span ${ed(`hero.trustPoints.${index}`, point)}</span></span>`).join("");
    return `<section class="ai-block pg-hero" data-block="hero"><div class="pg-hero-bg" aria-hidden="true"><span class="pg-blob pg-blob-1"></span><span class="pg-blob pg-blob-2"></span><span class="pg-hero-grid"></span></div><div class="pg-hero-inner"><div class="pg-badge"><span class="pg-badge-dot" aria-hidden="true"></span><span ${ed("hero.badge", data.badge)}</span></div><h1 class="pg-h1"><span ${ed("hero.headline", data.headline)}</span><br><span class="pg-highlight" ${ed("hero.highlight", data.highlight)}</span></h1><p class="pg-sub" ${ed("hero.subheadline", data.subheadline)}</p><div class="pg-ctas">${buildHeroCtas(data)}</div><div class="pg-points">${points}</div></div>${toolbarHtml()}</section>`;
  }

  function featuresTemplate(data) {
    const items = (data.items || []).map((item, index) => `<div class="pg-card"><div class="pg-card-icon" ${ed(`features.items.${index}.icon`, item.icon)}</div><h3 ${ed(`features.items.${index}.title`, item.title)}</h3><p ${ed(`features.items.${index}.text`, item.text)}</p></div>`).join("");
    return `<section class="ai-block pg-features" data-block="features"><div class="pg-wrap"><div class="pg-head"><div class="pg-eyebrow" ${ed("features.eyebrow", data.eyebrow)}</div><h2 class="pg-h2" ${ed("features.title", data.title)}</h2><p class="pg-head-sub" ${ed("features.subtitle", data.subtitle)}</p></div><div class="pg-cards">${items}</div></div>${toolbarHtml()}</section>`;
  }

  function processTemplate(data) {
    const steps = (data.steps || []).map((step, index) => `<div class="pg-step"><div class="pg-step-num" aria-hidden="true">${index + 1}</div><h3 ${ed(`process.steps.${index}.title`, step.title)}</h3><p ${ed(`process.steps.${index}.text`, step.text)}</p></div>`).join("");
    return `<section class="ai-block pg-process" data-block="process"><div class="pg-wrap"><div class="pg-head"><div class="pg-eyebrow" ${ed("process.eyebrow", data.eyebrow)}</div><h2 class="pg-h2" ${ed("process.title", data.title)}</h2></div><div class="pg-steps">${steps}</div></div>${toolbarHtml()}</section>`;
  }

  function testimonialsTemplate(data) {
    const items = (data.items || []).map((item, index) => {
      const initial = escapeHtml(String(item.name || "•").trim().charAt(0));
      return `<figure class="pg-quote"><div class="pg-stars" aria-hidden="true">★★★★★</div><blockquote ${ed(`testimonials.items.${index}.quote`, item.quote)}</blockquote><figcaption><span class="pg-avatar" aria-hidden="true">${initial}</span><span><b ${ed(`testimonials.items.${index}.name`, item.name)}</b><small ${ed(`testimonials.items.${index}.role`, item.role)}</small></span></figcaption></figure>`;
    }).join("");
    return `<section class="ai-block pg-testimonials" data-block="testimonials"><div class="pg-wrap"><div class="pg-head"><div class="pg-eyebrow" ${ed("testimonials.eyebrow", data.eyebrow)}</div><h2 class="pg-h2" ${ed("testimonials.title", data.title)}</h2></div><div class="pg-quotes">${items}</div></div>${toolbarHtml()}</section>`;
  }

  function buildCtaAction(data) {
    const target = contactTarget();
    const endpoint = safeFormEndpoint(state.data.formEndpoint);
    const email = validEmail(state.data.leadEmail);
    if (endpoint) {
      return `<form id="lead-action" class="lead-form pg-form" action="${escapeHtml(endpoint)}" method="post"><div class="pg-form-title" ${ed("cta.formTitle", data.formTitle)}</div><input type="hidden" name="source" value="דף הנחיתה של ${escapeHtml(state.data.businessName)}"><input class="pg-input" name="name" type="text" autocomplete="name" placeholder="שם מלא" required><input class="pg-input" name="phone" type="tel" autocomplete="tel" placeholder="טלפון" required><input class="pg-input" name="email" type="email" autocomplete="email" placeholder="אימייל, לא חובה"><button class="pg-btn pg-btn-primary" type="submit"><span ${ed("cta.buttonText", data.buttonText)}</span></button></form><p class="no-export" style="font-size:12px;color:oklch(0.5 0.01 80);">הטופס מחובר לכתובת קליטת הלידים שהגדרתם.</p>`;
    }
    if (email) {
      return `<form id="lead-action" class="lead-form pg-form" action="mailto:${escapeHtml(email)}" method="post" enctype="text/plain"><div class="pg-form-title" ${ed("cta.formTitle", data.formTitle)}</div><input class="pg-input" name="name" type="text" placeholder="שם מלא" required><input class="pg-input" name="phone" type="tel" placeholder="טלפון" required><button class="pg-btn pg-btn-primary" type="submit"><span ${ed("cta.buttonText", data.buttonText)}</span></button></form><p class="no-export" style="font-size:12px;color:oklch(0.5 0.01 80);">בייצוא, השליחה תפתח הודעת אימייל דרך תוכנת הדואר של המשתמש.</p>`;
    }
    if (target) {
      return `<div id="lead-action" class="pg-cta-action"><a class="pg-btn pg-btn-primary" ${linkAttrs(target)}><span ${ed("cta.buttonText", data.buttonText)}</span></a></div>`;
    }
    return `<div data-export-remove="true" class="no-export pg-empty">לא הוגדר יעד פעולה עדיין. לחצו על "יעד הפעולה" בסרגל הכלים כדי להוסיף WhatsApp, אימייל או קישור.</div>`;
  }

  function ctaTemplate(data) {
    return `<section class="ai-block pg-cta" data-block="cta"><div class="pg-cta-panel"><span class="pg-cta-glow" aria-hidden="true"></span><h2 class="pg-h2" ${ed("cta.title", data.title)}</h2><p class="pg-cta-sub" ${ed("cta.subtitle", data.subtitle)}</p><div id="cta-action-zone">${buildCtaAction(data)}</div></div>${toolbarHtml()}</section>`;
  }

  function footerHtml(businessName) {
    return `<footer class="pg-footer">נבנה עבור <strong>${escapeHtml(businessName)}</strong> · דף זה נוצר עם דפדף AI</footer>`;
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
    const pageCss = [...document.styleSheets]
      .filter((sheet) => /page\.css/.test(sheet.href || ""))
      .map((sheet) => { try { return [...sheet.cssRules].map((rule) => rule.cssText).join("\n"); } catch { return ""; } })
      .join("\n");
    const tracking = trackingTags();
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(state.data.businessName || "דף נחיתה")}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
${tracking.head}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=Suez+One&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{margin:0;font-family:'Heebo',sans-serif;line-height:1.5;overflow-x:hidden}a{color:inherit}${pageCss}</style>
</head>
<body>${tracking.body}<main class="result-canvas" data-vibe="${escapeHtml(state.data.vibe || "trust")}" style="--hue:${hue}">${clone.innerHTML}</main></body>
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
