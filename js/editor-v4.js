(() => {
  "use strict";

  const STORAGE_KEY = "dafdaf-editor-v4";
  const MAX_IMAGE_BYTES = 2_000_000;
  const STYLE_KITS = {
    clean: { name: "נקי", accent: "#235f4a", ink: "#16201c", paper: "#fbfaf6", soft: "#eef3ed", radius: "22px", font: '"Rubik", "Heebo", sans-serif' },
    midnight: { name: "לילה", accent: "#b8f34a", ink: "#f4f7f5", paper: "#101513", soft: "#1a211e", radius: "18px", font: '"Rubik", "Heebo", sans-serif' },
    sand: { name: "חול חם", accent: "#b84f35", ink: "#38261f", paper: "#f7efe3", soft: "#ead9c6", radius: "28px", font: '"Heebo", sans-serif' },
    electric: { name: "חשמלי", accent: "#4355ff", ink: "#11162d", paper: "#f4f5ff", soft: "#e4e7ff", radius: "16px", font: '"Rubik", "Heebo", sans-serif' },
    coral: { name: "קורל", accent: "#ef5b49", ink: "#30201e", paper: "#fff7f3", soft: "#ffe1d8", radius: "34px", font: '"Rubik", "Heebo", sans-serif' },
    luxe: { name: "יוקרה", accent: "#b69352", ink: "#f6f0e5", paper: "#171512", soft: "#25211b", radius: "2px", font: '"Rubik", "Heebo", sans-serif' },
    lilac: { name: "סטודיו", accent: "#7657d6", ink: "#251d38", paper: "#faf7ff", soft: "#ebe2ff", radius: "24px", font: '"Rubik", "Heebo", sans-serif' },
    olive: { name: "טבעי", accent: "#64743d", ink: "#252a1e", paper: "#f4f1e5", soft: "#e2e4cf", radius: "12px", font: '"Heebo", sans-serif' },
  };

  const state = loadState();
  let canvas = null;
  let panel = null;
  let backdrop = null;
  let selectedId = "";
  let insertAfterId = "";
  let nodeIndex = 0;
  let refreshTimer = null;
  let enhancing = false;

  document.addEventListener("DOMContentLoaded", init);

  function defaultState() {
    return {
      theme: "clean",
      colors: {},
      testimonials: [],
      testimonialLayout: "cards",
      domain: "",
    };
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...defaultState(), ...(stored && typeof stored === "object" ? stored : {}) };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function init() {
    canvas = document.getElementById("result-canvas");
    panel = document.getElementById("studio-panel");
    backdrop = document.getElementById("studio-backdrop");
    if (!canvas || !panel || !backdrop) return;

    bindStaticTools();
    new MutationObserver(scheduleEnhance).observe(canvas, { childList: true, subtree: true });
    window.addEventListener("dafdaf:page-created", () => {
      state.testimonials = [];
      selectedId = "";
      insertAfterId = "";
      delete canvas.dataset.userOrder;
      saveState();
      scheduleEnhance();
    });
    scheduleEnhance();
  }

  function bindStaticTools() {
    document.getElementById("studio-style-kits")?.addEventListener("click", openStylePanel);
    document.getElementById("studio-colors")?.addEventListener("click", openColorPanel);
    document.getElementById("studio-domain-hosting")?.addEventListener("click", openDomainPanel);
    document.getElementById("studio-add-section")?.addEventListener("click", () => openLibrary());
    document.querySelectorAll("[data-studio-tool]").forEach((button) => {
      button.addEventListener("click", () => openTool(button.dataset.studioTool));
    });
    document.querySelectorAll("[data-studio-zone-jump]").forEach((button) => {
      button.addEventListener("click", () => jumpToZone(button.dataset.studioZoneJump));
    });
    document.getElementById("studio-tools-toggle")?.addEventListener("click", toggleMobileTools);
    document.getElementById("studio-tools-backdrop")?.addEventListener("click", closeMobileTools);
    backdrop.addEventListener("click", closePanel);
    canvas.addEventListener("click", handleCanvasClick, true);
  }

  function scheduleEnhance() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(enhanceCanvas, 90);
  }

  function enhanceCanvas() {
    if (enhancing || !canvas.querySelector(".ai-block")) return;
    enhancing = true;
    try {
      applyTheme(state.theme, false);
      ensurePageChrome();
      assignNodeIds();
      refreshInsertHandles();
      refreshElementToolbars();
      refreshShareLinks();
      if (!selectedId) selectDefaultNode();
      window.dispatchEvent(new CustomEvent("dafdaf:editor-ready"));
    } finally {
      enhancing = false;
    }
  }

  function ensurePageChrome() {
    const business = document.getElementById("f-name")?.value.trim() || "העסק שלכם";
    const industry = document.getElementById("f-industry")?.value.trim() || "שירות שמותאם ללקוחות שלכם";
    const logo = window.dafdafStudio?.state?.logo || "";
    const brandMark = logo ? `<img src="${escapeHtml(logo)}" alt="לוגו ${escapeHtml(business)}">` : `<span>${escapeHtml(initials(business))}</span>`;
    const firstBlock = canvas.querySelector(".block-slot[data-block='hero']");
    let header = canvas.querySelector(".studio-site-header");
    if (!header && firstBlock) {
      header = document.createElement("header");
      header.className = "studio-site-header studio-added-section";
      header.dataset.studioZone = "header";
      header.innerHTML = `<div class="studio-site-header-inner"><a class="studio-site-brand" href="#top" aria-label="${escapeHtml(business)}">${brandMark}<b contenteditable="true">${escapeHtml(business)}</b></a><nav aria-label="ניווט בדף"><a href="#studio-offer">ההצעה</a><a href="#studio-proof">הוכחות</a><a href="#lead-action">יצירת קשר</a></nav><a class="studio-header-cta" href="#lead-action" contenteditable="true">בואו נדבר</a></div>`;
      canvas.insertBefore(header, firstBlock);
    }

    const hero = canvas.querySelector(".block-slot[data-block='hero']");
    const features = canvas.querySelector(".block-slot[data-block='features']");
    const proof = canvas.querySelector(".block-slot[data-block='testimonials']");
    if (hero) { hero.id = "top"; hero.dataset.studioZone = "main"; }
    if (features) features.id = "studio-offer";
    if (proof) proof.id = "studio-proof";
    canvas.querySelectorAll(".block-slot[data-block]").forEach((slot) => { slot.dataset.studioZone = "main"; });

    let footer = canvas.querySelector(".studio-site-footer");
    if (!footer) {
      const oldFooter = [...canvas.children].find((child) => child.matches("footer") || child.querySelector("footer"));
      if (oldFooter) {
        oldFooter.className = "studio-site-footer studio-added-section";
        oldFooter.dataset.studioZone = "footer";
        oldFooter.innerHTML = `<footer><div class="studio-footer-grid"><div><div class="studio-footer-brand">${brandMark}<b contenteditable="true">${escapeHtml(business)}</b></div><p contenteditable="true">${escapeHtml(industry)}. כאן אפשר להוסיף משפט קצר שמסכם את העסק ואת ההבטחה שלו.</p></div><div><strong>קישורים</strong><a href="#studio-offer">מה מקבלים</a><a href="#studio-proof">הוכחות והמלצות</a><a href="#lead-action">יצירת קשר</a></div><div><strong>מוכנים לדבר?</strong><p contenteditable="true">השאירו פרטים או פנו אלינו ישירות.</p><a class="studio-footer-cta" href="#lead-action">יצירת קשר</a></div></div><div class="studio-footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHtml(business)}</span><span contenteditable="true">כל הזכויות שמורות</span></div></footer>`;
        footer = oldFooter;
      }
    }
  }

  function assignNodeIds() {
    editableNodes().forEach((node) => {
      if (!node.dataset.studioNodeId) {
        nodeIndex += 1;
        node.dataset.studioNodeId = `studio-node-${Date.now().toString(36)}-${nodeIndex}`;
      }
    });
  }

  function editableNodes() {
    return [...canvas.children].filter((node) =>
      !node.classList.contains("studio-insert-handle") &&
      !node.classList.contains("design-proof-rail") &&
      !node.classList.contains("plus-el") &&
      !node.classList.contains("studio-wa-float")
    );
  }

  function refreshInsertHandles() {
    const validIds = new Set();
    editableNodes().forEach((node) => {
      if (node.classList.contains("studio-site-footer")) return;
      const id = node.dataset.studioNodeId;
      if (!id) return;
      validIds.add(id);
      let handle = canvas.querySelector(`.studio-insert-handle[data-for-node="${id}"]`);
      if (!handle) {
        handle = document.createElement("button");
        handle.type = "button";
        handle.className = "studio-insert-handle no-export";
        handle.dataset.forNode = id;
        handle.innerHTML = `<span>＋</span><b>הוספה כאן</b>`;
        handle.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          insertAfterId = id;
          selectNode(node);
          openLibrary(id);
        });
      }
      const proofRail = node.nextElementSibling?.classList.contains("design-proof-rail") ? node.nextElementSibling : null;
      const anchor = proofRail || node;
      if (anchor.nextElementSibling !== handle) anchor.after(handle);
    });
    canvas.querySelectorAll(".studio-insert-handle").forEach((handle) => {
      if (!validIds.has(handle.dataset.forNode)) handle.remove();
    });
  }

  function refreshElementToolbars() {
    canvas.querySelectorAll(".studio-v4-section,.studio-testimonials-section").forEach((section) => {
      if (section.querySelector(":scope > .studio-element-toolbar")) return;
      const toolbar = document.createElement("div");
      toolbar.className = "studio-element-toolbar no-export";
      toolbar.innerHTML = `<button type="button" data-v4-action="up" title="הזזה למעלה">↑</button><button type="button" data-v4-action="down" title="הזזה למטה">↓</button><button type="button" data-v4-action="duplicate" title="שכפול">⧉</button><button type="button" data-v4-action="delete" title="מחיקה">×</button>`;
      section.prepend(toolbar);
    });
  }

  function handleCanvasClick(event) {
    const action = event.target.closest("[data-v4-action]");
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      handleElementAction(action);
      return;
    }
    const share = event.target.closest('[data-share-network="copy"]');
    if (share) {
      event.preventDefault();
      navigator.clipboard?.writeText(window.location.href).then(() => { share.textContent = "הקישור הועתק ✓"; }).catch(() => showToast("לא ניתן להעתיק אוטומטית"));
    }
    const target = event.target.closest("[data-studio-node-id]");
    if (target && !event.target.closest(".block-toolbar,.studio-insert-handle")) selectNode(target);
  }

  function handleElementAction(button) {
    const section = button.closest("[data-studio-node-id]");
    if (!section) return;
    const action = button.dataset.v4Action;
    const siblings = editableNodes();
    const index = siblings.indexOf(section);
    canvas.dataset.userOrder = "true";
    if (action === "up" && index > 0 && !section.classList.contains("studio-site-header")) {
      siblings[index - 1].before(section);
    }
    if (action === "down" && index >= 0 && index < siblings.length - 1 && !section.classList.contains("studio-site-footer")) {
      siblings[index + 1].after(section);
    }
    if (action === "duplicate" && !section.classList.contains("studio-site-header") && !section.classList.contains("studio-site-footer")) {
      const copy = section.cloneNode(true);
      delete copy.dataset.studioNodeId;
      copy.querySelectorAll(".studio-element-toolbar,.studio-insert-handle").forEach((item) => item.remove());
      section.after(copy);
      showToast("המקטע שוכפל");
    }
    if (action === "delete" && !section.classList.contains("studio-site-header") && !section.classList.contains("studio-site-footer")) {
      section.remove();
      selectedId = "";
      showToast("המקטע הוסר");
    }
    scheduleEnhance();
  }

  function selectDefaultNode() {
    const node = canvas.querySelector(".block-slot[data-block='hero']") || editableNodes()[0];
    if (node) selectNode(node);
  }

  function selectNode(node) {
    canvas.querySelectorAll(".studio-selected").forEach((item) => item.classList.remove("studio-selected"));
    node.classList.add("studio-selected");
    selectedId = node.dataset.studioNodeId || "";
    // A sidebar tool should always use the section the user most recently
    // selected. Insert handles call selectNode as well, so they keep their
    // explicit placement without leaving a stale anchor behind.
    insertAfterId = selectedId;
    const label = document.getElementById("studio-selection-label");
    if (label) label.textContent = `נבחר: ${nodeLabel(node)} · הוספות ייכנסו ליד המקטע הזה`;
  }

  function nodeLabel(node) {
    if (node.classList.contains("studio-site-header")) return "Header";
    if (node.classList.contains("studio-site-footer")) return "Footer";
    if (node.classList.contains("studio-testimonials-section")) return "המלצות";
    if (node.classList.contains("studio-image-section")) return "תמונה";
    if (node.classList.contains("studio-banner")) return "באנר";
    return ({ hero: "פתיחה", features: "ההצעה", process: "התהליך", testimonials: "הוכחות", cta: "פעולה" })[node.dataset.block] || "מקטע";
  }

  function jumpToZone(zone) {
    const target = zone === "header"
      ? canvas.querySelector(".studio-site-header")
      : zone === "footer"
        ? canvas.querySelector(".studio-site-footer")
        : canvas.querySelector(".block-slot[data-block='hero']");
    if (!target) return;
    document.querySelectorAll("[data-studio-zone-jump]").forEach((button) => button.classList.toggle("active", button.dataset.studioZoneJump === zone));
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    selectNode(target);
    closeMobileTools();
  }

  function toggleMobileTools() {
    const workspace = document.getElementById("result");
    const button = document.getElementById("studio-tools-toggle");
    const open = !workspace?.classList.contains("tools-open");
    workspace?.classList.toggle("tools-open", open);
    document.getElementById("studio-tools-backdrop")?.classList.toggle("open", open);
    button?.setAttribute("aria-expanded", String(open));
  }

  function closeMobileTools() {
    document.getElementById("result")?.classList.remove("tools-open");
    document.getElementById("studio-tools-backdrop")?.classList.remove("open");
    document.getElementById("studio-tools-toggle")?.setAttribute("aria-expanded", "false");
  }

  function openPanel(title, description, body) {
    panel.innerHTML = `<div class="studio-panel-head"><div><span>DAFDAF STUDIO</span><h3>${title}</h3></div><button type="button" class="studio-panel-close" aria-label="סגירה">×</button></div>${description ? `<p class="studio-panel-intro">${description}</p>` : ""}${body}`;
    panel.classList.add("open");
    backdrop.classList.add("open");
    panel.querySelector(".studio-panel-close")?.addEventListener("click", closePanel);
    closeMobileTools();
    return panel;
  }

  function closePanel() {
    panel?.classList.remove("open");
    backdrop?.classList.remove("open");
  }

  function openLibrary(targetId = selectedId) {
    if (!canvas.querySelector(".ai-block")) return showToast("קודם צרו דף, ואז תוכלו להוסיף לו מקטעים");
    insertAfterId = targetId || selectedId;
    const tools = [
      ["testimonials", "★", "המלצות לקוחות", "כרטיסים, דירוג ותמונה"],
      ["image", "▧", "תמונה", "העלאה ומיקום בכל נקודה"],
      ["gallery", "▦", "גלריה", "כמה תמונות בפריסה חכמה"],
      ["button", "↗", "כפתור פעולה", "קישור, שיחה או הרשמה"],
      ["banner", "▰", "באנר", "הודעה, מבצע או עדכון"],
      ["whatsapp", "◉", "WhatsApp", "כפתור רגיל או צף"],
      ["share", "⌁", "כפתורי שיתוף", "WhatsApp, Facebook ו-LinkedIn"],
      ["shape", "◆", "צורה דקורטיבית", "עיגול, כתם או רשת"],
      ["faq", "?", "שאלות נפוצות", "הסרת חששות לפני הפעולה"],
      ["about", "א", "אודות", "סיפור קצר על העסק"],
      ["stats", "#", "מספרים", "רק נתונים אמיתיים"],
      ["trust", "✓", "פס אמון", "יתרונות קצרים וברורים"],
    ].map(([id, icon, name, desc]) => `<button type="button" class="studio-library-card" data-library-tool="${id}"><span>${icon}</span><b>${name}</b><small>${desc}</small></button>`).join("");
    const current = canvas.querySelector(`[data-studio-node-id="${insertAfterId}"]`);
    const opened = openPanel("מה מוסיפים לדף?", `המקטע יתווסף אחרי <strong>${escapeHtml(current ? nodeLabel(current) : "המקטע הנבחר")}</strong>. אפשר להזיז או למחוק אותו אחר כך.`, `<div class="studio-library-grid">${tools}</div>`);
    opened.querySelectorAll("[data-library-tool]").forEach((button) => button.addEventListener("click", () => openTool(button.dataset.libraryTool)));
  }

  function openTool(tool) {
    if (!canvas.querySelector(".ai-block")) return showToast("קודם צרו דף");
    if (!insertAfterId) insertAfterId = selectedId;
    ({
      testimonials: openTestimonialsPanel,
      image: openImagePanel,
      gallery: openGalleryPanel,
      button: openButtonPanel,
      banner: openBannerPanel,
      whatsapp: openWhatsappPanel,
      share: openSharePanel,
      shape: openShapePanel,
      faq: () => addTemplateSection("faq"),
      about: () => addTemplateSection("about"),
      stats: () => addTemplateSection("stats"),
      trust: () => addTemplateSection("trust"),
    })[tool]?.();
  }

  function insertSection(section) {
    section.classList.add("studio-v4-section", "studio-added-section");
    section.dataset.studioPositioned = "true";
    const reference = canvas.querySelector(`[data-studio-node-id="${insertAfterId || selectedId}"]`);
    const footer = canvas.querySelector(".studio-site-footer");
    canvas.dataset.userOrder = "true";
    if (!reference || reference === footer) canvas.insertBefore(section, footer || null);
    else {
      const proofRail = reference.nextElementSibling?.classList.contains("design-proof-rail") ? reference.nextElementSibling : null;
      (proofRail || reference).after(section);
    }
    delete section.dataset.studioNodeId;
    closePanel();
    scheduleEnhance();
    setTimeout(() => selectNode(section), 140);
  }

  function addTemplateSection(type) {
    const templates = {
      faq: `<div class="studio-custom-inner"><div class="studio-section-kicker">לפני שמתחילים</div><h2 contenteditable="true">שאלות נפוצות</h2><details open><summary contenteditable="true">מה חשוב לדעת לפני שמתחילים?</summary><p contenteditable="true">כתבו תשובה קצרה שמסירה את החשש המרכזי.</p></details><details><summary contenteditable="true">כמה זמן התהליך לוקח?</summary><p contenteditable="true">עדכנו את התשובה לפי השירות שלכם.</p></details></div>`,
      about: `<div class="studio-custom-inner studio-about-inner"><div class="studio-section-kicker">מאחורי העסק</div><h2 contenteditable="true">נעים להכיר</h2><p contenteditable="true">ספרו מי אתם, למה הקמתם את העסק ומה הלקוחות מקבלים דווקא מכם.</p></div>`,
      stats: `<div class="studio-custom-inner"><div class="studio-section-kicker">הוכחה במספרים</div><h2 contenteditable="true">המספרים שלכם</h2><p class="no-export studio-editor-note">החליפו כל שדה בנתון אמיתי שאפשר לאמת.</p><div class="studio-stats"><div class="studio-stat"><b contenteditable="true">הוסיפו נתון</b><span contenteditable="true">מה הוא מוכיח?</span></div><div class="studio-stat"><b contenteditable="true">הוסיפו נתון</b><span contenteditable="true">מה הוא מוכיח?</span></div><div class="studio-stat"><b contenteditable="true">הוסיפו נתון</b><span contenteditable="true">מה הוא מוכיח?</span></div></div></div>`,
      trust: `<div class="studio-trust-inner"><span contenteditable="true">✓ שירות ברור</span><span contenteditable="true">✓ תהליך שקוף</span><span contenteditable="true">✓ מענה אנושי</span></div>`,
    };
    const section = document.createElement("section");
    section.className = `studio-custom studio-template-${type}`;
    section.innerHTML = templates[type];
    insertSection(section);
  }

  function openStylePanel() {
    const cards = Object.entries(STYLE_KITS).map(([id, kit]) => `<button type="button" class="studio-style-card ${state.theme === id ? "active" : ""}" data-style-kit="${id}" style="--kit-accent:${kit.accent};--kit-paper:${kit.paper};--kit-ink:${kit.ink}"><i><span></span><b></b><em></em></i><strong>${kit.name}</strong><small>${id === "midnight" || id === "luxe" ? "כהה ודרמטי" : "בהיר ומאוזן"}</small></button>`).join("");
    const opened = openPanel("ערכות סגנון", "שמונה שפות חזותיות שמשנות צבע, טיפוגרפיה, רדיוסים והאווירה של כל הדף.", `<div class="studio-style-grid">${cards}</div>`);
    opened.querySelectorAll("[data-style-kit]").forEach((button) => button.addEventListener("click", () => {
      state.colors = {};
      applyTheme(button.dataset.styleKit, true);
      openStylePanel();
    }));
  }

  function applyTheme(theme, persist = true) {
    const kit = STYLE_KITS[theme] || STYLE_KITS.clean;
    state.theme = STYLE_KITS[theme] ? theme : "clean";
    canvas.dataset.studioTheme = state.theme;
    const colors = { accent: kit.accent, ink: kit.ink, paper: kit.paper, soft: kit.soft, ...state.colors };
    setCanvasColors(colors, kit);
    const name = document.getElementById("studio-style-name");
    const dot = document.getElementById("studio-color-dot");
    if (name) name.textContent = kit.name;
    if (dot) dot.style.background = colors.accent;
    if (persist) saveState();
  }

  function setCanvasColors(colors, kit = STYLE_KITS[state.theme] || STYLE_KITS.clean) {
    canvas.style.setProperty("--accent", colors.accent);
    canvas.style.setProperty("--accent-dark", `color-mix(in srgb, ${colors.accent} 68%, ${isDark(colors.paper) ? "white" : "black"})`);
    canvas.style.setProperty("--accent-tint", `color-mix(in srgb, ${colors.accent} 14%, ${colors.paper})`);
    canvas.style.setProperty("--v3p-ink", colors.ink);
    canvas.style.setProperty("--v3p-muted", `color-mix(in srgb, ${colors.ink} 62%, transparent)`);
    canvas.style.setProperty("--v3p-paper", colors.paper);
    canvas.style.setProperty("--v3p-soft", colors.soft);
    canvas.style.setProperty("--v3p-radius", kit.radius);
    canvas.style.setProperty("--v3p-display", kit.font);
    canvas.style.setProperty("--de-ink", colors.ink);
    canvas.style.setProperty("--de-muted", `color-mix(in srgb, ${colors.ink} 62%, transparent)`);
    canvas.style.setProperty("--de-paper", colors.paper);
    canvas.style.setProperty("--de-soft", colors.soft);
    canvas.style.setProperty("--de-radius", kit.radius);
  }

  function openColorPanel() {
    const kit = STYLE_KITS[state.theme] || STYLE_KITS.clean;
    const colors = { accent: kit.accent, ink: kit.ink, paper: kit.paper, soft: kit.soft, ...state.colors };
    const opened = openPanel("צבעים ופלטה", "שנו את צבע המותג, הרקע, הטקסט והמשטחים. השינוי מוחל מיד על כל הדף.", `<div class="studio-color-fields"><label><span>צבע מותג</span><input type="color" data-editor-color="accent" value="${colors.accent}"><b>${colors.accent}</b></label><label><span>טקסט</span><input type="color" data-editor-color="ink" value="${colors.ink}"><b>${colors.ink}</b></label><label><span>רקע</span><input type="color" data-editor-color="paper" value="${colors.paper}"><b>${colors.paper}</b></label><label><span>משטחים</span><input type="color" data-editor-color="soft" value="${colors.soft}"><b>${colors.soft}</b></label></div><div class="studio-panel-actions"><button type="button" class="studio-secondary-action" id="studio-color-reset">חזרה לצבעי הערכה</button><button type="button" class="studio-primary-action" id="studio-color-save">שמירת הפלטה</button></div>`);
    opened.querySelectorAll("[data-editor-color]").forEach((input) => input.addEventListener("input", () => {
      state.colors[input.dataset.editorColor] = input.value;
      input.nextElementSibling.textContent = input.value;
      applyTheme(state.theme, false);
    }));
    opened.querySelector("#studio-color-reset")?.addEventListener("click", () => { state.colors = {}; applyTheme(state.theme, true); openColorPanel(); });
    opened.querySelector("#studio-color-save")?.addEventListener("click", () => { saveState(); closePanel(); showToast("הפלטה נשמרה"); });
  }

  function openImagePanel() {
    const opened = openPanel("הוספת תמונה", "העלו תמונה או השתמשו בכתובת HTTPS. היא תיכנס בדיוק אחרי המקטע שבחרתם.", `<div class="studio-form"><label>קובץ תמונה<input id="studio-v4-image-file" type="file" accept="image/*"></label><div class="studio-or"><span>או</span></div><label>כתובת תמונה<input id="studio-v4-image-url" type="url" placeholder="https://..."></label><label>טקסט חלופי<input id="studio-v4-image-alt" type="text" maxlength="140" placeholder="מה רואים בתמונה?"></label><label>פריסה<select id="studio-v4-image-layout"><option value="wide">רחבה</option><option value="split">תמונה לצד טקסט</option><option value="card">כרטיס תמונה</option></select></label><button type="button" class="studio-primary-action" id="studio-v4-image-add">הוספת התמונה</button></div>`);
    opened.querySelector("#studio-v4-image-add")?.addEventListener("click", async () => {
      try {
        const file = opened.querySelector("#studio-v4-image-file").files[0];
        const rawUrl = opened.querySelector("#studio-v4-image-url").value.trim();
        const src = file ? await readImageFile(file) : safeImageUrl(rawUrl);
        if (!src) return showToast("בחרו קובץ תמונה או כתובת HTTPS תקינה");
        const alt = opened.querySelector("#studio-v4-image-alt").value.trim() || "תמונה מהעסק";
        const layout = opened.querySelector("#studio-v4-image-layout").value;
        const section = document.createElement("section");
        section.className = `studio-image-section studio-image-${layout}`;
        section.innerHTML = `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy"><figcaption contenteditable="true">${escapeHtml(alt)}</figcaption></figure>${layout === "split" ? `<div><span class="studio-section-kicker">תמונה מהעסק</span><h2 contenteditable="true">הוסיפו כאן כותרת שמחברת את התמונה להצעה</h2><p contenteditable="true">כתבו משפט קצר שמסביר למה התמונה חשובה ללקוח.</p></div>` : ""}`;
        insertSection(section);
      } catch (error) {
        showToast(error.message || "לא ניתן לעבד את התמונה");
      }
    });
  }

  function openGalleryPanel() {
    const opened = openPanel("גלריית תמונות", "בחרו עד שמונה תמונות. הפריסה תסתדר אוטומטית גם במובייל.", `<div class="studio-form"><label class="studio-drop-field">בחירת תמונות<input id="studio-v4-gallery-files" type="file" accept="image/*" multiple><span>PNG, JPG או WebP · עד 8 תמונות</span></label><label>כותרת הגלריה<input id="studio-v4-gallery-title" type="text" maxlength="90" value="תמונות שמספרות את הסיפור"></label><button type="button" class="studio-primary-action" id="studio-v4-gallery-add">הוספת הגלריה</button></div>`);
    opened.querySelector("#studio-v4-gallery-add")?.addEventListener("click", async () => {
      try {
        const files = [...opened.querySelector("#studio-v4-gallery-files").files].slice(0, 8);
        if (!files.length) return showToast("בחרו לפחות תמונה אחת");
        const images = [];
        for (const file of files) images.push(await readImageFile(file));
        const title = opened.querySelector("#studio-v4-gallery-title").value.trim() || "הגלריה שלנו";
        const section = document.createElement("section");
        section.className = "studio-v4-gallery";
        section.innerHTML = `<div class="studio-custom-inner"><div class="studio-section-kicker">מבט מקרוב</div><h2 contenteditable="true">${escapeHtml(title)}</h2><div class="studio-v4-gallery-grid">${images.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(`${title} ${index + 1}`)}" loading="lazy">`).join("")}</div></div>`;
        insertSection(section);
      } catch (error) {
        showToast(error.message || "לא ניתן לעבד את התמונות");
      }
    });
  }

  function openButtonPanel() {
    const opened = openPanel("כפתור פעולה", "אפשר להוסיף כפתור בתוך ה-Hero או כפס פעולה חדש ליד כל מקטע.", `<div class="studio-form"><label>טקסט על הכפתור<input id="studio-v4-button-label" type="text" maxlength="60" value="בואו נדבר"></label><label>קישור<input id="studio-v4-button-url" type="text" maxlength="500" placeholder="https://... או #lead-action" value="#lead-action"></label><label>סגנון<select id="studio-v4-button-style"><option value="primary">מלא ובולט</option><option value="outline">מסגרת</option><option value="text">טקסט עם חץ</option></select></label><button type="button" class="studio-primary-action" id="studio-v4-button-add">הוספת הכפתור</button></div>`);
    opened.querySelector("#studio-v4-button-add")?.addEventListener("click", () => {
      const label = opened.querySelector("#studio-v4-button-label").value.trim() || "לפרטים נוספים";
      const href = safeActionUrl(opened.querySelector("#studio-v4-button-url").value.trim());
      if (!href) return showToast("הקישור אינו תקין");
      const style = opened.querySelector("#studio-v4-button-style").value;
      const reference = canvas.querySelector(`[data-studio-node-id="${insertAfterId || selectedId}"]`);
      const heroActions = reference?.querySelector(".pg-ctas");
      if (heroActions) {
        heroActions.insertAdjacentHTML("beforeend", `<a class="pg-btn studio-added-button studio-button-${style}" href="${escapeHtml(href)}" contenteditable="true">${escapeHtml(label)}</a>`);
        closePanel();
        showToast("הכפתור נוסף ל-Hero");
        return;
      }
      const section = document.createElement("section");
      section.className = "studio-button-section";
      section.innerHTML = `<div><a class="studio-action-button studio-button-${style}" href="${escapeHtml(href)}" contenteditable="true">${escapeHtml(label)} <span>↗</span></a></div>`;
      insertSection(section);
    });
  }

  function openBannerPanel() {
    const opened = openPanel("באנר", "מתאים להודעה חשובה, הטבה אמיתית, אירוע או עדכון זמני.", `<div class="studio-form"><label>טקסט הבאנר<input id="studio-v4-banner-text" type="text" maxlength="130" placeholder="לדוגמה: ההרשמה למחזור הבא נפתחה"></label><label>טקסט קישור<input id="studio-v4-banner-link-label" type="text" maxlength="40" value="לפרטים"></label><label>קישור<input id="studio-v4-banner-url" type="text" maxlength="500" value="#lead-action"></label><label>סגנון<select id="studio-v4-banner-tone"><option value="accent">צבע מותג</option><option value="dark">כהה</option><option value="soft">רך</option></select></label><button type="button" class="studio-primary-action" id="studio-v4-banner-add">הוספת הבאנר</button></div>`);
    opened.querySelector("#studio-v4-banner-add")?.addEventListener("click", () => {
      const text = opened.querySelector("#studio-v4-banner-text").value.trim();
      const href = safeActionUrl(opened.querySelector("#studio-v4-banner-url").value.trim());
      if (!text) return showToast("כתבו את הודעת הבאנר");
      if (!href) return showToast("הקישור אינו תקין");
      const label = opened.querySelector("#studio-v4-banner-link-label").value.trim() || "לפרטים";
      const tone = opened.querySelector("#studio-v4-banner-tone").value;
      const section = document.createElement("aside");
      section.className = `studio-banner studio-banner-${tone}`;
      section.innerHTML = `<div><p contenteditable="true">${escapeHtml(text)}</p><a href="${escapeHtml(href)}" contenteditable="true">${escapeHtml(label)} <span>←</span></a></div>`;
      insertSection(section);
    });
  }

  function openWhatsappPanel() {
    const settings = window.dafdafExportSettings?.() || {};
    const opened = openPanel("כפתור WhatsApp", "הוסיפו כפתור בתוך הדף או כפתור צף. המספר נשמר גם באזור לידים ומדידה.", `<div class="studio-form"><label>מספר WhatsApp<input id="studio-v4-wa-phone" type="tel" maxlength="30" placeholder="050-1234567" value="${escapeHtml(settings.whatsapp || "")}"></label><label>הודעת פתיחה<textarea id="studio-v4-wa-message" maxlength="220">שלום, הגעתי מדף הנחיתה ואשמח לקבל פרטים</textarea></label><label>טקסט על הכפתור<input id="studio-v4-wa-label" type="text" maxlength="60" value="שלחו לנו WhatsApp"></label><label class="studio-check-row"><input id="studio-v4-wa-floating" type="checkbox"> כפתור צף בצד המסך</label><button type="button" class="studio-primary-action" id="studio-v4-wa-add">הוספת WhatsApp</button></div>`);
    opened.querySelector("#studio-v4-wa-add")?.addEventListener("click", () => {
      const raw = opened.querySelector("#studio-v4-wa-phone").value;
      const phone = normalizedWhatsapp(raw);
      if (!phone) return showToast("הזינו מספר WhatsApp תקין");
      const message = opened.querySelector("#studio-v4-wa-message").value.trim();
      const label = opened.querySelector("#studio-v4-wa-label").value.trim() || "WhatsApp";
      const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.dafdafApplyExportSettings?.({ ...settings, whatsapp: raw });
      if (opened.querySelector("#studio-v4-wa-floating").checked) {
        canvas.querySelector(".studio-wa-float")?.remove();
        canvas.insertAdjacentHTML("beforeend", `<a class="studio-wa-float" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}"><span>◉</span><b>${escapeHtml(label)}</b></a>`);
        closePanel();
        showToast("כפתור WhatsApp צף נוסף");
        return;
      }
      const section = document.createElement("section");
      section.className = "studio-whatsapp-section";
      section.innerHTML = `<div><span>WhatsApp</span><p contenteditable="true">יש שאלה לפני שמתחילים?</p><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" contenteditable="true">${escapeHtml(label)} <b>◉</b></a></div>`;
      insertSection(section);
    });
  }

  function openSharePanel() {
    const title = canvas.querySelector("h1")?.textContent.trim() || document.getElementById("f-name")?.value || "הדף שלנו";
    const opened = openPanel("כפתורי שיתוף", "בחרו היכן המבקרים יוכלו לשתף את הדף. הקישורים מתעדכנים לכתובת האמיתית לאחר הפרסום.", `<div class="studio-share-choices"><label><input type="checkbox" value="whatsapp" checked><span>WhatsApp</span></label><label><input type="checkbox" value="facebook" checked><span>Facebook</span></label><label><input type="checkbox" value="linkedin" checked><span>LinkedIn</span></label><label><input type="checkbox" value="copy" checked><span>העתקת קישור</span></label></div><button type="button" class="studio-primary-action" id="studio-v4-share-add">הוספת כפתורי שיתוף</button>`);
    opened.querySelector("#studio-v4-share-add")?.addEventListener("click", () => {
      const networks = [...opened.querySelectorAll("input:checked")].map((input) => input.value);
      if (!networks.length) return showToast("בחרו לפחות אפשרות שיתוף אחת");
      const labels = { whatsapp: "WhatsApp", facebook: "Facebook", linkedin: "LinkedIn", copy: "העתקת קישור" };
      const section = document.createElement("section");
      section.className = "studio-share-section";
      section.dataset.shareTitle = title;
      section.innerHTML = `<div><p contenteditable="true">מכירים מישהו שזה יכול לעזור לו?</p><nav aria-label="שיתוף הדף">${networks.map((network) => `<a href="#" data-share-network="${network}">${labels[network]}</a>`).join("")}</nav></div>`;
      insertSection(section);
      setTimeout(refreshShareLinks, 150);
    });
  }

  function refreshShareLinks() {
    const url = window.location.href;
    canvas.querySelectorAll("[data-share-network]").forEach((link) => {
      const section = link.closest(".studio-share-section");
      const title = section?.dataset.shareTitle || document.title;
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(title);
      const href = {
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        copy: "#",
      }[link.dataset.shareNetwork];
      link.href = href || "#";
      if (link.dataset.shareNetwork !== "copy") {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });
  }

  function openShapePanel() {
    const opened = openPanel("צורות דקורטיביות", "בחרו צורה שתתווסף למקטע המסומן. היא דקורטיבית בלבד ואינה פוגעת בנגישות.", `<div class="studio-shape-grid"><button type="button" data-shape="blob"><i class="shape-blob"></i><b>כתם</b></button><button type="button" data-shape="circle"><i class="shape-circle"></i><b>עיגול</b></button><button type="button" data-shape="grid"><i class="shape-grid"></i><b>רשת</b></button><button type="button" data-shape="line"><i class="shape-line"></i><b>קו</b></button></div><button type="button" class="studio-secondary-action studio-full-action" id="studio-v4-shapes-clear">ניקוי הצורות מהמקטע</button>`);
    opened.querySelectorAll("[data-shape]").forEach((button) => button.addEventListener("click", () => {
      const target = canvas.querySelector(`[data-studio-node-id="${selectedId}"]`);
      if (!target) return showToast("בחרו קודם מקטע בדף");
      const host = target.querySelector(".ai-block") || target;
      const shape = document.createElement("span");
      shape.className = `studio-shape studio-shape-${button.dataset.shape}`;
      shape.setAttribute("aria-hidden", "true");
      host.appendChild(shape);
      closePanel();
      showToast("הצורה נוספה למקטע");
    }));
    opened.querySelector("#studio-v4-shapes-clear")?.addEventListener("click", () => {
      const target = canvas.querySelector(`[data-studio-node-id="${selectedId}"]`);
      target?.querySelectorAll(".studio-shape").forEach((shape) => shape.remove());
      closePanel();
      showToast("הצורות הוסרו");
    });
  }

  function openTestimonialsPanel() {
    syncTestimonialsFromCanvas();
    if (!state.testimonials.length) state.testimonials.push(blankTestimonial());
    const rows = state.testimonials.map((item, index) => `<article class="studio-testimonial-editor" data-testimonial-index="${index}"><div class="studio-testimonial-editor-head"><b>המלצה ${index + 1}</b><span><button type="button" data-testimonial-action="up" aria-label="הזזה למעלה">↑</button><button type="button" data-testimonial-action="down" aria-label="הזזה למטה">↓</button><button type="button" data-testimonial-action="delete" aria-label="מחיקה">×</button></span></div><label>ההמלצה<textarea data-testimonial-field="quote" maxlength="500" placeholder="הדביקו כאן המלצה אמיתית">${escapeHtml(item.quote)}</textarea></label><div class="studio-two-fields"><label>שם הלקוח<input data-testimonial-field="name" type="text" maxlength="80" value="${escapeHtml(item.name)}"></label><label>תפקיד / עסק<input data-testimonial-field="role" type="text" maxlength="100" value="${escapeHtml(item.role)}"></label></div><div class="studio-two-fields"><label>דירוג<select data-testimonial-field="rating">${[5,4,3].map((rating) => `<option value="${rating}" ${Number(item.rating) === rating ? "selected" : ""}>${rating} כוכבים</option>`).join("")}</select></label><label>תמונת לקוח<input data-testimonial-avatar type="file" accept="image/*"></label></div>${item.avatar ? `<img class="studio-testimonial-avatar-preview" src="${escapeHtml(item.avatar)}" alt="">` : ""}</article>`).join("");
    const opened = openPanel("המלצות לקוחות", "זה מקטע ההוכחה החשוב ביותר. הוסיפו רק המלצות אמיתיות שקיבלתם, ובחרו פריסה שמתאימה לכמות.", `<div class="studio-layout-switch"><button type="button" data-testimonial-layout="cards" class="${state.testimonialLayout === "cards" ? "active" : ""}">כרטיסים</button><button type="button" data-testimonial-layout="spotlight" class="${state.testimonialLayout === "spotlight" ? "active" : ""}">המלצה מובילה</button><button type="button" data-testimonial-layout="compact" class="${state.testimonialLayout === "compact" ? "active" : ""}">קומפקטי</button></div><div class="studio-testimonial-list">${rows}</div><button type="button" class="studio-secondary-action studio-full-action" id="studio-testimonial-add">＋ הוספת המלצה</button><button type="button" class="studio-primary-action studio-full-action" id="studio-testimonial-save">שמירה והצגה בדף</button>`);
    bindTestimonialEditor(opened);
  }

  function bindTestimonialEditor(root) {
    root.querySelectorAll("[data-testimonial-layout]").forEach((button) => button.addEventListener("click", () => { state.testimonialLayout = button.dataset.testimonialLayout; saveState(); openTestimonialsPanel(); }));
    root.querySelectorAll("[data-testimonial-field]").forEach((field) => field.addEventListener("input", () => {
      const index = Number(field.closest("[data-testimonial-index]").dataset.testimonialIndex);
      state.testimonials[index][field.dataset.testimonialField] = field.value;
    }));
    root.querySelectorAll("[data-testimonial-action]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.closest("[data-testimonial-index]").dataset.testimonialIndex);
      const action = button.dataset.testimonialAction;
      if (action === "delete") state.testimonials.splice(index, 1);
      if (action === "up" && index > 0) [state.testimonials[index - 1], state.testimonials[index]] = [state.testimonials[index], state.testimonials[index - 1]];
      if (action === "down" && index < state.testimonials.length - 1) [state.testimonials[index + 1], state.testimonials[index]] = [state.testimonials[index], state.testimonials[index + 1]];
      openTestimonialsPanel();
    }));
    root.querySelectorAll("[data-testimonial-avatar]").forEach((input) => input.addEventListener("change", async () => {
      try {
        const index = Number(input.closest("[data-testimonial-index]").dataset.testimonialIndex);
        if (input.files[0]) state.testimonials[index].avatar = await readImageFile(input.files[0]);
        openTestimonialsPanel();
      } catch (error) {
        showToast(error.message || "לא ניתן לעבד את תמונת הלקוח");
      }
    }));
    root.querySelector("#studio-testimonial-add")?.addEventListener("click", () => { state.testimonials.push(blankTestimonial()); openTestimonialsPanel(); });
    root.querySelector("#studio-testimonial-save")?.addEventListener("click", () => {
      state.testimonials = state.testimonials.filter((item) => item.quote.trim() && item.name.trim()).slice(0, 12);
      if (!state.testimonials.length) return showToast("הוסיפו לפחות המלצה אחת עם טקסט ושם");
      saveState();
      renderTestimonialsSection();
    });
  }

  function blankTestimonial() {
    return { quote: "", name: "", role: "", rating: 5, avatar: "" };
  }

  function syncTestimonialsFromCanvas() {
    const section = canvas.querySelector(".studio-testimonials-section");
    if (!section) return;
    const items = [...section.querySelectorAll(".studio-real-testimonial")].map((card) => ({
      quote: card.querySelector("blockquote")?.textContent.trim() || "",
      name: card.querySelector("[data-testimonial-name]")?.textContent.trim() || "",
      role: card.querySelector("[data-testimonial-role]")?.textContent.trim() || "",
      rating: Number(card.dataset.rating || 5),
      avatar: card.querySelector("img")?.getAttribute("src") || "",
    })).filter((item) => item.quote && item.name);
    if (items.length) state.testimonials = items;
    state.testimonialLayout = section.dataset.testimonialLayout || state.testimonialLayout;
  }

  function renderTestimonialsSection() {
    let section = canvas.querySelector(".studio-testimonials-section");
    const cards = state.testimonials.map((item) => `<article class="studio-real-testimonial" data-rating="${Number(item.rating) || 5}"><div class="studio-stars" aria-label="דירוג ${Number(item.rating) || 5} מתוך 5">${"★".repeat(Number(item.rating) || 5)}</div><blockquote contenteditable="true">${escapeHtml(item.quote)}</blockquote><footer>${item.avatar ? `<img src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.name)}">` : `<span>${escapeHtml(initials(item.name))}</span>`}<div><b data-testimonial-name contenteditable="true">${escapeHtml(item.name)}</b><small data-testimonial-role contenteditable="true">${escapeHtml(item.role)}</small></div></footer></article>`).join("");
    if (!section) {
      section = document.createElement("section");
      section.className = "studio-testimonials-section";
      insertSection(section);
    }
    section.dataset.testimonialLayout = state.testimonialLayout;
    section.innerHTML = `<div class="studio-custom-inner"><div class="studio-section-kicker">לקוחות מספרים</div><h2 contenteditable="true">המלצות אמיתיות מהלקוחות שלנו</h2><p class="studio-testimonials-lead" contenteditable="true">הדרך הטובה ביותר להבין את החוויה היא לשמוע ממי שכבר עבר אותה.</p><div class="studio-real-testimonials-grid">${cards}</div></div>`;
    closePanel();
    scheduleEnhance();
    showToast(`${state.testimonials.length} המלצות נוספו לדף`);
  }

  function openDomainPanel() {
    const domain = state.domain || "";
    const opened = openPanel("דומיין ואחסון", "הדף כבר מותאם לאחסון ב-Vercel. רכישה וחיבור דומיין מתבצעים בחשבון המאובטח של בעל האתר.", `<div class="studio-hosting-status"><span>✓</span><div><b>מוכן לפרסום ב-Vercel</b><small>HTTPS, CDN וכתובת vercel.app כלולים בהתאם לתוכנית.</small></div></div><div class="studio-form"><label>הדומיין הרצוי<input id="studio-v4-domain" type="text" inputmode="url" maxlength="253" placeholder="mybusiness.co.il" value="${escapeHtml(domain)}"></label><p class="studio-domain-result" id="studio-domain-result">הקלידו שם כדי להכין אותו לחיפוש או לחיבור.</p><button type="button" class="studio-primary-action" id="studio-domain-remember">שמירת שם הדומיין</button></div><div class="studio-domain-actions"><a href="https://vercel.com/domains" target="_blank" rel="noopener noreferrer"><span>01</span><b>חיפוש וקניית דומיין</b><small>תשלום מאובטח ישירות ב-Vercel</small></a><a href="https://vercel.com/docs/domains/working-with-domains/add-a-domain" target="_blank" rel="noopener noreferrer"><span>02</span><b>חיבור דומיין קיים</b><small>DNS, אימות ותעודת HTTPS</small></a><a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer"><span>03</span><b>פתיחת שירות אחסון</b><small>יצירת פרויקט Vercel חדש</small></a></div><p class="studio-editor-note">רכישה בתוך דפדף עצמה דורשת חשבון משתמש, סליקה, פרטי בעל הדומיין ואישור מחיר בזמן אמת. החיבור הנוכחי מעביר את התשלום והזיהוי למסך המאובטח של Vercel.</p>`);
    const input = opened.querySelector("#studio-v4-domain");
    const result = opened.querySelector("#studio-domain-result");
    input.addEventListener("input", () => {
      const value = normalizeDomain(input.value);
      result.textContent = value ? `השם שיוכן לחיבור: ${value}` : "שם הדומיין עדיין אינו תקין";
      result.classList.toggle("valid", Boolean(value));
    });
    opened.querySelector("#studio-domain-remember")?.addEventListener("click", () => {
      const value = normalizeDomain(input.value);
      if (!value) return showToast("הזינו שם דומיין תקין");
      state.domain = value;
      saveState();
      result.textContent = `${value} נשמר לפרויקט`;
      result.classList.add("valid");
      showToast("שם הדומיין נשמר");
    });
  }

  async function readImageFile(file) {
    if (!file?.type.startsWith("image/")) throw new Error("נדרש קובץ תמונה");
    if (file.size > 12_000_000) throw new Error("התמונה גדולה מדי");
    const source = await fileToDataUrl(file);
    if (source.length <= MAX_IMAGE_BYTES * 1.35) return source;
    const image = await loadImage(source);
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const bitmap = document.createElement("canvas");
    bitmap.width = Math.max(1, Math.round(image.width * scale));
    bitmap.height = Math.max(1, Math.round(image.height * scale));
    bitmap.getContext("2d").drawImage(image, 0, 0, bitmap.width, bitmap.height);
    return bitmap.toDataURL("image/webp", 0.78);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function safeImageUrl(value) {
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value)) return value;
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.toString() : "";
    } catch { return ""; }
  }

  function safeActionUrl(value) {
    if (/^#[A-Za-z][\w:-]*$/.test(value)) return value;
    if (/^(?:tel:|mailto:)/i.test(value)) return value.replace(/["'<>\s]/g, "");
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch { return ""; }
  }

  function normalizedWhatsapp(raw) {
    let digits = String(raw || "").replace(/[^0-9+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
    return /^\d{8,15}$/.test(digits) ? digits : "";
  }

  function normalizeDomain(raw) {
    const value = String(raw || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    if (value.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) return "";
    return value;
  }

  function isDark(hex) {
    const value = String(hex).replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(value)) return false;
    const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((part) => parseInt(part, 16));
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }

  function initials(value) {
    return String(value || "ד").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "ד";
  }

  function showToast(message) {
    window.dafdafStudio?.toast?.(message);
    if (window.dafdafStudio?.toast) return;
    const toast = document.createElement("div");
    toast.className = "studio-v4-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  }

  function editorExportRuntime() {
    return `(function(){var q=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};function links(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);q('[data-share-network]').forEach(function(a){var n=a.getAttribute('data-share-network'),h=n==='whatsapp'?'https://wa.me/?text='+t+'%20'+u:n==='facebook'?'https://www.facebook.com/sharer/sharer.php?u='+u:n==='linkedin'?'https://www.linkedin.com/sharing/share-offsite/?url='+u:'#';a.setAttribute('href',h);if(n!=='copy'){a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer')}})}document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-share-network="copy"]');if(!a)return;e.preventDefault();if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(function(){a.textContent='הקישור הועתק ✓'}).catch(function(){})}});links()})();`;
  }

  window.dafdafEditor = {
    refresh: scheduleEnhance,
    state: () => ({ ...state }),
    exportRuntime: editorExportRuntime,
    openTool,
  };
})();
