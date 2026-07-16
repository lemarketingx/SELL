(() => {
  "use strict";

  const exportStyles = document.createElement("link");
  exportStyles.rel = "stylesheet";
  exportStyles.href = "css/studio-design-v2-export.css";
  document.head.appendChild(exportStyles);

  const exportRuntime = document.createElement("script");
  exportRuntime.src = "js/design-engine-v2-export.js";
  exportRuntime.defer = true;
  document.head.appendChild(exportRuntime);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const canvas = $("#result-canvas");
  if (!canvas) return;

  let timer = null;
  let applying = false;

  const ARCHETYPES = [
    {
      name: "authority",
      pattern: /עורכ|משפט|פיננס|משכנת|ייעוץ|רופא|קלינ|פיזיותר|חשבונ|ביטוח|נדל|הנדס|אדריכ/i,
      layout: "split",
      order: ["hero", "testimonials", "features", "process", "cta"],
    },
    {
      name: "showcase",
      pattern: /מסעד|קפה|אוכל|שף|צילום|אופנה|תכשיט|יופי|קוסמט|שיער|עיצוב|אמנות|פרחים/i,
      layout: "collage",
      order: ["hero", "features", "testimonials", "process", "cta"],
    },
    {
      name: "personal",
      pattern: /טיפול|מאמנ|יוגה|פילאטיס|חינוך|ילד|סדנה|מורה|מטפל|פסיכ|זוגי|ליווי/i,
      layout: "editorial",
      order: ["hero", "testimonials", "process", "features", "cta"],
    },
    {
      name: "commerce",
      pattern: /חנות|מוצר|קורס|אירוע|כנס|מכירה|סחר|איקומרס|ecommerce|הרשמה/i,
      layout: "split",
      order: ["hero", "features", "process", "testimonials", "cta"],
    },
    {
      name: "technology",
      pattern: /טכנולוג|תוכנה|אפליק|דיגיטל|אוטומצי|סטארט|saas|מערכת|פלטפורמה/i,
      layout: "split",
      order: ["hero", "features", "process", "testimonials", "cta"],
    },
  ];

  function fieldValue(id) {
    return String(document.getElementById(id)?.value || "").trim();
  }

  function selectedValue(selector, key) {
    return $(selector)?.dataset[key] || "";
  }

  function stableHash(value) {
    let hash = 0;
    for (const char of value) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }

  function inferPlan() {
    const industry = fieldValue("f-industry");
    const description = fieldValue("f-description");
    const offer = fieldValue("f-offer");
    const audience = fieldValue("f-audience");
    const proof = fieldValue("f-proof");
    const business = fieldValue("f-name");
    const source = `${industry} ${offer} ${audience} ${description} ${proof}`;
    const rule = ARCHETYPES.find((item) => item.pattern.test(source)) || {
      name: "modern",
      layout: "centered",
      order: ["hero", "features", "process", "testimonials", "cta"],
    };
    const variant = canvas.dataset.studioVariant || "classic";
    const hasHeroImage = Boolean($(".studio-hero-media img", canvas));
    const seed = stableHash(`${business}|${industry}`);
    let layout = rule.layout;
    let archetype = rule.name;
    let order = [...rule.order];

    if (!hasHeroImage && ["split", "collage", "immersive"].includes(layout)) {
      layout = seed % 2 ? "editorial" : "centered";
    }

    if (variant === "bold") {
      archetype = "commerce";
      layout = hasHeroImage ? "immersive" : "editorial";
      order = ["hero", "features", "testimonials", "process", "cta"];
    }

    if (variant === "editorial") {
      archetype = rule.name === "technology" ? "authority" : rule.name;
      layout = hasHeroImage ? "split" : "editorial";
      order = ["hero", "testimonials", "process", "features", "cta"];
    }

    const vibe = selectedValue(".vibe-card.selected", "value");
    const goal = selectedValue("#goal-chips .chip.selected", "value");
    if (vibe === "luxury" && variant === "classic") layout = hasHeroImage ? "collage" : "editorial";
    if (goal === "sales" && variant === "classic") order = ["hero", "features", "process", "testimonials", "cta"];

    return { archetype, layout, order, variant, hasHeroImage };
  }

  function directChildren(element) {
    return [...element.children];
  }

  function markHero(hero) {
    hero.classList.add("design-hero");
    const title = $(".pg-h1", hero);
    const copy = $(".pg-sub", hero);
    const badge = $(".pg-badge", hero);
    const action = $(".pg-ctas", hero);
    const trust = $(".pg-points", hero);
    const logo = $(".studio-logo", hero);

    title?.classList.add("design-hero-title");
    copy?.classList.add("design-hero-copy");
    badge?.classList.add("design-hero-badge");
    action?.classList.add("design-hero-actions");
    trust?.classList.add("design-hero-trust");
    logo?.classList.add("design-hero-logo");
  }

  function markStandardSection(section, type) {
    section.classList.add(`design-${type}`);
    const outer = $(".pg-wrap", section);
    if (!outer) return;
    const head = $(".pg-head", outer);
    const grid = $(".pg-cards,.pg-steps,.pg-quotes", outer);
    head?.classList.add("design-section-head");
    head?.querySelector("h2")?.classList.add("design-section-title");
    head?.querySelector("p")?.classList.add("design-section-copy");
    if (grid) {
      grid.classList.add("design-card-grid");
      directChildren(grid).forEach((card) => card.classList.add("design-card"));
    }
  }

  function markCta(section) {
    section.classList.add("design-cta");
    section.querySelector("h2")?.classList.add("design-section-title");
    section.querySelector("p")?.classList.add("design-section-copy");
  }

  function markSections() {
    $$(".ai-block", canvas).forEach((section) => {
      const type = section.dataset.block;
      section.classList.remove("design-hero", "design-features", "design-process", "design-testimonials", "design-cta");
      if (type === "hero") markHero(section);
      else if (type === "cta") markCta(section);
      else if (["features", "process", "testimonials"].includes(type)) markStandardSection(section, type);
    });
  }

  function reorderSections(order) {
    const current = $$(".block-slot[data-block]", canvas).map((slot) => slot.dataset.block);
    if (current.join("|") === order.join("|")) return;
    const footer = directChildren(canvas).find((item) => !item.classList.contains("block-slot") && !item.classList.contains("design-proof-rail") && item.querySelector("footer"));
    const anchor = footer || null;
    for (const type of order) {
      const slot = $(`.block-slot[data-block="${type}"]`, canvas);
      if (slot) canvas.insertBefore(slot, anchor);
    }
  }

  function proofItems() {
    const items = [];
    $$(".design-hero-trust > *", canvas).forEach((item) => {
      const text = item.textContent.replace(/^✓\s*/, "").trim();
      if (text) items.push(text);
    });
    $$(".design-features .design-card h3", canvas).forEach((item) => {
      const text = item.textContent.trim();
      if (text && !items.includes(text)) items.push(text);
    });
    return items.slice(0, 4);
  }

  function ensureProofRail() {
    const heroSlot = $(".block-slot[data-block='hero']", canvas);
    if (!heroSlot) return;
    const items = proofItems();
    let rail = $(".design-proof-rail", canvas);
    if (items.length < 2) {
      rail?.remove();
      return;
    }
    if (!rail) {
      rail = document.createElement("section");
      rail.className = "design-proof-rail studio-added-section";
      rail.dataset.designGenerated = "proof";
    }
    const signature = items.join("|");
    if (rail.dataset.signature !== signature) {
      rail.dataset.signature = signature;
      rail.innerHTML = `<div class="design-proof-rail-inner">${items.map((text) => `<div class="design-proof-item">${escapeHtml(text)}</div>`).join("")}</div>`;
    }
    if (heroSlot.nextElementSibling !== rail) heroSlot.after(rail);
  }

  function markGallery() {
    const gallery = $(".studio-gallery", canvas);
    if (gallery) gallery.classList.add("design-gallery");
  }

  function applyDesign() {
    if (applying || !$(".ai-block[data-block='hero']", canvas)) return;
    applying = true;
    try {
      const plan = inferPlan();
      canvas.dataset.designArchetype = plan.archetype;
      canvas.dataset.heroLayout = plan.layout;
      markSections();
      reorderSections(plan.order);
      ensureProofRail();
      markGallery();
      canvas.dataset.designEngine = "v2";
    } finally {
      applying = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(applyDesign, 80);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[char]);
  }

  new MutationObserver(schedule).observe(canvas, { childList: true, subtree: true });
  $$('[data-studio-variant]').forEach((button) => button.addEventListener("click", schedule));
  ["f-name", "f-industry", "f-description"].forEach((id) => document.getElementById(id)?.addEventListener("change", schedule));
  window.addEventListener("load", schedule);

  window.dafdafDesignEngine = {
    refresh: applyDesign,
    plan: inferPlan,
  };
})();
