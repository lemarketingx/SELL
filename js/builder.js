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

  const state = {
    step: 1,
    totalSteps: 4,
    data: { businessName: "", industry: "", description: "", vibe: "", goal: "" },
    page: null,
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.wizard = document.getElementById("wizard");
    els.loading = document.getElementById("loading");
    els.loadingStatus = document.getElementById("loading-status");
    els.result = document.getElementById("result");
    els.canvas = document.getElementById("result-canvas");
    els.btnNext = document.getElementById("btn-next");
    els.btnBack = document.getElementById("btn-back");
    els.btnRestart = document.getElementById("btn-restart");
    els.btnDownload = document.getElementById("btn-download");

    document.getElementById("f-name").addEventListener("input", updateNextState);
    document.getElementById("f-industry").addEventListener("input", updateNextState);
    document.getElementById("f-description").addEventListener("input", updateNextState);

    document.getElementById("industry-chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document.getElementById("f-industry").value = chip.dataset.value;
      selectSingleChip(e.currentTarget, chip);
      updateNextState();
    });

    document.getElementById("goal-chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      selectSingleChip(e.currentTarget, chip);
      state.data.goal = chip.dataset.value;
      updateNextState();
    });

    document.getElementById("vibe-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".vibe-card");
      if (!card) return;
      selectSingleChip(e.currentTarget, card, "vibe-card");
      state.data.vibe = card.dataset.value;
      applyVibe(card.dataset.value);
      updateNextState();
    });

    els.btnNext.addEventListener("click", onNext);
    els.btnBack.addEventListener("click", onBack);
    els.btnRestart.addEventListener("click", restart);
    els.btnDownload.addEventListener("click", downloadHtml);

    els.canvas.addEventListener("click", onCanvasClick);
    els.canvas.addEventListener(
      "focusout",
      (e) => {
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;
        if (el.getAttribute("contenteditable") !== "true") return;
        const path = el.dataset.path;
        if (!path) return;
        setByPath(state.page, path, el.textContent.trim());
      },
      true
    );
    els.canvas.addEventListener("submit", (e) => {
      if (e.target.matches(".lead-form")) {
        e.preventDefault();
        toast("✓ הפרטים נשמרו (זו הדגמה — חברו את הטופס לשירות שלכם)");
      }
    });

    updateProgress();
    updateNextState();
  }

  function selectSingleChip(container, selected, cls) {
    const selector = "." + (cls || "chip");
    container.querySelectorAll(selector).forEach((el) => el.classList.remove("selected"));
    selected.classList.add("selected");
  }

  function applyVibe(vibe) {
    document.body.className = "vibe-" + (vibe || "trust");
  }

  function currentStepValid() {
    switch (state.step) {
      case 1:
        return (
          document.getElementById("f-name").value.trim().length > 0 &&
          document.getElementById("f-industry").value.trim().length > 0
        );
      case 2:
        return document.getElementById("f-description").value.trim().length > 10;
      case 3:
        return Boolean(state.data.vibe);
      case 4:
        return Boolean(state.data.goal);
      default:
        return false;
    }
  }

  function updateNextState() {
    els.btnNext.disabled = !currentStepValid();
    els.btnNext.textContent = state.step === state.totalSteps ? "בנו לי דף נחיתה עם AI ✨" : "המשך";
    els.btnBack.style.visibility = state.step === 1 ? "hidden" : "visible";
  }

  function updateProgress() {
    document.querySelectorAll(".wizard-progress span").forEach((dot) => {
      dot.classList.toggle("done", Number(dot.dataset.step) <= state.step);
    });
    document.querySelectorAll(".wizard-step").forEach((section) => {
      section.classList.toggle("active", Number(section.dataset.step) === state.step);
    });
  }

  function onNext() {
    if (!currentStepValid()) return;
    if (state.step < state.totalSteps) {
      state.step += 1;
      updateProgress();
      updateNextState();
      return;
    }
    state.data.businessName = document.getElementById("f-name").value.trim();
    state.data.industry = document.getElementById("f-industry").value.trim();
    state.data.description = document.getElementById("f-description").value.trim();
    submitToAI();
  }

  function onBack() {
    if (state.step === 1) return;
    state.step -= 1;
    updateProgress();
    updateNextState();
  }

  function restart() {
    state.step = 1;
    state.page = null;
    state.data = { businessName: "", industry: "", description: "", vibe: "", goal: "" };
    document.getElementById("f-name").value = "";
    document.getElementById("f-industry").value = "";
    document.getElementById("f-description").value = "";
    document.querySelectorAll(".chip.selected, .vibe-card.selected").forEach((el) =>
      el.classList.remove("selected")
    );
    applyVibe("trust");
    els.result.style.display = "none";
    els.loading.style.display = "none";
    els.wizard.style.display = "block";
    updateProgress();
    updateNextState();
  }

  async function submitToAI() {
    els.wizard.style.display = "none";
    els.loading.style.display = "block";
    let msgIndex = 0;
    els.loadingStatus.textContent = LOADING_MESSAGES[0];
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      els.loadingStatus.textContent = LOADING_MESSAGES[msgIndex];
    }, 1600);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `שגיאת שרת (${res.status})`);
      }
      const page = await res.json();
      clearInterval(interval);
      els.loading.style.display = "none";
      els.result.style.display = "block";
      buildPage(page);
    } catch (err) {
      clearInterval(interval);
      els.loadingStatus.textContent = "משהו השתבש: " + err.message;
      const retry = document.createElement("button");
      retry.className = "btn btn-primary";
      retry.style.marginTop = "20px";
      retry.textContent = "נסו שוב";
      retry.onclick = () => {
        els.loading.style.display = "none";
        els.wizard.style.display = "block";
      };
      els.loading.appendChild(retry);
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

    BLOCK_ORDER.forEach((type, idx) => {
      setTimeout(() => revealBlock(type, page[type]), idx * 450);
    });
  }

  function revealBlock(type, data) {
    const slot = els.canvas.querySelector(`.block-slot[data-block="${type}"]`);
    if (!slot) return;
    slot.innerHTML = renderBlockHtml(type, data);
    const blockEl = slot.querySelector(".ai-block");
    blockEl.classList.add("revealing");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        blockEl.classList.remove("revealing");
        blockEl.classList.add("revealed");
      });
    });
  }

  async function onCanvasClick(e) {
    const btn = e.target.closest(".block-toolbar button");
    if (!btn) return;
    const blockEl = btn.closest(".ai-block");
    const blockType = blockEl.dataset.block;
    const action = btn.dataset.action;
    const toolbar = blockEl.querySelector(".block-toolbar");
    toolbar.querySelectorAll("button").forEach((b) => (b.disabled = true));
    blockEl.style.opacity = "0.5";

    try {
      const res = await fetch("/api/regenerate-block", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockType,
          current: state.page[blockType],
          instruction: action,
          context: state.data,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `שגיאת שרת (${res.status})`);
      }
      const updated = await res.json();
      state.page[blockType] = updated;
      const slot = els.canvas.querySelector(`.block-slot[data-block="${blockType}"]`);
      slot.innerHTML = renderBlockHtml(blockType, updated);
    } catch (err) {
      blockEl.style.opacity = "1";
      toolbar.querySelectorAll("button").forEach((b) => (b.disabled = false));
      toast("שגיאה: " + err.message);
    }
  }

  function skeletonHtml() {
    return `<div class="skeleton-block">
      <div class="skeleton-line" style="width:30%;height:14px;"></div>
      <div class="skeleton-line" style="width:60%;height:32px;margin-top:10px;"></div>
      <div class="skeleton-line" style="width:45%;"></div>
    </div>`;
  }

  function toolbarHtml() {
    return `<div class="block-toolbar no-export">
      <button type="button" data-action="rewrite">🔄 נסח מחדש</button>
      <button type="button" data-action="shorten">✂ קצר</button>
      <button type="button" data-action="sales">🔥 מכירתי יותר</button>
    </div>`;
  }

  function renderBlockHtml(type, data) {
    const renderers = {
      hero: heroTemplate,
      features: featuresTemplate,
      process: processTemplate,
      testimonials: testimonialsTemplate,
      cta: ctaTemplate,
    };
    return renderers[type](data);
  }

  function ed(path, value) {
    return `contenteditable="true" data-path="${path}">${escapeHtml(value ?? "")}`;
  }

  function heroTemplate(d) {
    const points = (d.trustPoints || [])
      .map(
        (p, i) => `<div style="display:flex; align-items:center; gap:6px;">
          <span style="color: var(--accent);">✓</span>
          <span ${ed(`hero.trustPoints.${i}`, p)}</span>
        </div>`
      )
      .join("");
    return `<section class="ai-block" data-block="hero" style="position:relative; padding: 96px 64px 64px; max-width:1200px; margin:0 auto; text-align:center;">
      <div style="display:inline-flex; align-items:center; gap:8px; background:var(--accent-tint); color:var(--accent-dark); padding:7px 14px; border-radius:999px; font-size:14px; font-weight:600; margin-bottom:24px;">
        <span ${ed("hero.badge", d.badge)}</span>
      </div>
      <h1 style="font-size: 48px; font-weight: 800; line-height: 1.15; margin: 0 0 20px; letter-spacing: -0.5px;">
        <span ${ed("hero.headline", d.headline)}</span><br/>
        <span style="background: linear-gradient(135deg, var(--accent), oklch(0.65 0.16 calc(var(--hue) + 50))); -webkit-background-clip: text; background-clip: text; color: transparent;" ${ed(
          "hero.highlight",
          d.highlight
        )}</span>
      </h1>
      <p style="font-size: 18px; color: oklch(0.42 0.01 80); max-width: 620px; margin: 0 auto 32px;" ${ed(
        "hero.subheadline",
        d.subheadline
      )}</p>
      <div style="display: flex; gap: 14px; justify-content:center; flex-wrap:wrap; margin-bottom: 28px;">
        <span style="display:inline-block; background: var(--ink); color: white; padding: 16px 30px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor:text;" ${ed(
          "hero.ctaPrimary",
          d.ctaPrimary
        )}</span>
        <span style="display:inline-block; background: white; color: var(--ink); padding: 16px 30px; border-radius: 12px; font-weight: 700; font-size: 16px; border: 1px solid oklch(0.88 0.01 80); cursor:text;" ${ed(
          "hero.ctaSecondary",
          d.ctaSecondary
        )}</span>
      </div>
      <div style="display: flex; gap: 24px; justify-content:center; font-size: 14px; color: oklch(0.48 0.01 80); flex-wrap: wrap;">
        ${points}
      </div>
      ${toolbarHtml()}
    </section>`;
  }

  function featuresTemplate(d) {
    const items = (d.items || [])
      .map(
        (item, i) => `<div style="padding: 28px; border: 1px solid oklch(0.92 0.01 80); border-radius: 16px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--accent-tint); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px;" ${ed(
            `features.items.${i}.icon`,
            item.icon
          )}</div>
          <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;" ${ed(
            `features.items.${i}.title`,
            item.title
          )}</h3>
          <p style="font-size: 14px; color: oklch(0.48 0.01 80); margin: 0;" ${ed(
            `features.items.${i}.text`,
            item.text
          )}</p>
        </div>`
      )
      .join("");
    return `<section class="ai-block" data-block="features" style="position:relative; padding: 72px 64px; background: white; border-top: 1px solid oklch(0.92 0.01 80); border-bottom: 1px solid oklch(0.92 0.01 80);">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; max-width: 640px; margin: 0 auto 48px;">
          <div style="font-size: 14px; font-weight: 700; color: var(--accent-dark); margin-bottom: 12px;" ${ed(
            "features.eyebrow",
            d.eyebrow
          )}</div>
          <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 14px;" ${ed("features.title", d.title)}</h2>
          <p style="font-size: 16px; color: oklch(0.45 0.01 80); margin: 0;" ${ed(
            "features.subtitle",
            d.subtitle
          )}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px;">
          ${items}
        </div>
      </div>
      ${toolbarHtml()}
    </section>`;
  }

  function processTemplate(d) {
    const steps = (d.steps || [])
      .map(
        (step, i) => `<div style="padding: 26px; border-radius: 16px; background: oklch(0.97 0.005 80); border: 1px solid oklch(0.9 0.01 80);">
          <div style="width: 32px; height: 32px; border-radius: 999px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 16px;">${
            i + 1
          }</div>
          <h3 style="font-size: 17px; font-weight: 700; margin: 0 0 8px;" ${ed(
            `process.steps.${i}.title`,
            step.title
          )}</h3>
          <p style="font-size: 14px; color: oklch(0.48 0.01 80); margin: 0;" ${ed(
            `process.steps.${i}.text`,
            step.text
          )}</p>
        </div>`
      )
      .join("");
    return `<section class="ai-block" data-block="process" style="position:relative; padding: 72px 64px; max-width: 1200px; margin: 0 auto;">
      <div style="text-align: center; max-width: 640px; margin: 0 auto 40px;">
        <div style="font-size: 14px; font-weight: 700; color: var(--accent-dark); margin-bottom: 12px;" ${ed(
          "process.eyebrow",
          d.eyebrow
        )}</div>
        <h2 style="font-size: 32px; font-weight: 800; margin: 0;" ${ed("process.title", d.title)}</h2>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
        ${steps}
      </div>
      ${toolbarHtml()}
    </section>`;
  }

  function testimonialsTemplate(d) {
    const items = (d.items || [])
      .map(
        (item, i) => `<div style="background: oklch(0.27 0.01 80); border-radius: 16px; padding: 24px;">
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 18px; color: oklch(0.9 0.005 80);" ${ed(
            `testimonials.items.${i}.quote`,
            item.quote
          )}</p>
          <div style="font-weight: 700; font-size: 14px;" ${ed(
            `testimonials.items.${i}.name`,
            item.name
          )}</div>
          <div style="font-size: 12px; color: oklch(0.65 0.01 80);" ${ed(
            `testimonials.items.${i}.role`,
            item.role
          )}</div>
        </div>`
      )
      .join("");
    return `<section class="ai-block" data-block="testimonials" style="position:relative; padding: 72px 64px; background: var(--ink); color: white;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; max-width: 600px; margin: 0 auto 40px;">
          <div style="font-size: 14px; font-weight: 700; color: oklch(0.75 0.13 var(--hue)); margin-bottom: 12px;" ${ed(
            "testimonials.eyebrow",
            d.eyebrow
          )}</div>
          <h2 style="font-size: 30px; font-weight: 800; margin: 0;" ${ed("testimonials.title", d.title)}</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
          ${items}
        </div>
      </div>
      ${toolbarHtml()}
    </section>`;
  }

  function ctaTemplate(d) {
    return `<section class="ai-block" data-block="cta" style="position:relative; padding: 80px 64px; max-width: 900px; margin: 0 auto; text-align: center;">
      <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 16px;" ${ed("cta.title", d.title)}</h2>
      <p style="font-size: 16px; color: oklch(0.45 0.01 80); margin: 0 0 28px;" ${ed(
        "cta.subtitle",
        d.subtitle
      )}</p>
      <form class="lead-form" style="max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;">
        <div style="font-weight: 700; font-size: 15px;" ${ed("cta.formTitle", d.formTitle)}</div>
        <input type="text" placeholder="שם מלא" required style="padding: 14px 16px; border-radius: 10px; border: 1.5px solid oklch(0.88 0.01 80); font-family: inherit; font-size: 15px;">
        <input type="tel" placeholder="טלפון" required style="padding: 14px 16px; border-radius: 10px; border: 1.5px solid oklch(0.88 0.01 80); font-family: inherit; font-size: 15px;">
        <button type="submit" class="lead-submit" style="background: var(--accent); color: white; padding: 14px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; font-family: inherit;">
          <span ${ed("cta.buttonText", d.buttonText)}</span>
        </button>
      </form>
      ${toolbarHtml()}
    </section>`;
  }

  function footerHtml(businessName) {
    return `<footer style="padding: 40px 64px; border-top: 1px solid oklch(0.92 0.01 80); text-align: center; font-size: 13px; color: oklch(0.55 0.01 80);">
      נבנה עבור <strong>${escapeHtml(businessName)}</strong> · דף זה נוצר עם דפדף AI
    </footer>`;
  }

  function downloadHtml() {
    const clone = els.canvas.cloneNode(true);
    clone.querySelectorAll(".no-export").forEach((el) => el.remove());
    clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute("contenteditable"));
    clone.querySelectorAll(".skeleton-block").forEach((el) => el.remove());

    const hue = VIBE_HUES[state.data.vibe] || 290;
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(state.data.businessName || "דף נחיתה")}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Heebo', sans-serif; line-height: 1.5; overflow-x: hidden; }
  :root {
    --hue: ${hue};
    --accent: oklch(0.6 0.16 var(--hue));
    --accent-dark: oklch(0.42 0.14 var(--hue));
    --accent-tint: oklch(0.94 0.03 var(--hue));
    --ink: oklch(0.22 0.01 80);
    --paper: oklch(0.985 0.006 80);
  }
  body { background: var(--paper); color: var(--ink); }
</style>
</head>
<body>
${clone.innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = slugify(state.data.businessName || "landing-page") + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText =
      "position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--ink); color:white; padding:12px 22px; border-radius:999px; font-size:14px; font-weight:600; z-index:999; box-shadow:0 10px 30px -8px oklch(0.2 0.02 80 / 0.5);";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }

  function setByPath(obj, path, value) {
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i += 1) {
      cur = cur[keys[i]];
      if (cur == null) return;
    }
    cur[keys[keys.length - 1]] = value;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function slugify(str) {
    return (
      String(str)
        .trim()
        .toLowerCase()
        .replace(/[^\w֐-׿]+/g, "-")
        .replace(/^-+|-+$/g, "") || "landing-page"
    );
  }
})();
