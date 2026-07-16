(() => {
  "use strict";

  const STORAGE_KEY = "dafdaf-studio-project-v1";
  const MAX_IMAGE_BYTES = 1_600_000;
  const studio = { logo: "", hero: "", heroSource: "none", heroAttribution: null, gallery: [], galleryAttribution: [], gallerySource: "none", palette: [], variant: "classic", enhanced: false, galleryRequested: false };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.addEventListener("DOMContentLoaded", initStudio);

  function initStudio() {
    bindUploads();
    bindResultTools();
    observeGeneratedPage();
    restoreDraftInputs();
    $("#result-canvas")?.addEventListener("click", (event) => {
      if (event.target.closest(".studio-section-actions [data-studio-action]")) handleSectionAction(event);
    });
    window.addEventListener("dafdaf:page-created", (event) => prepareGeneratedPage(event.detail?.variant));
  }

  function prepareGeneratedPage(variant) {
    studio.enhanced = false;
    if (studio.gallerySource === "auto") {
      studio.gallery = [];
      studio.galleryAttribution = [];
      studio.gallerySource = "none";
    }
    if (studio.heroSource === "auto") {
      studio.hero = "";
      studio.heroAttribution = null;
      studio.heroSource = "none";
    }
    studio.galleryRequested = false;
    setVariant(["classic", "bold", "editorial"].includes(variant) ? variant : "classic");
  }

  function bindUploads() {
    bindImageInput("studio-logo", false, (images) => {
      studio.logo = images[0] || "";
      if (studio.logo) analyzeBrand(studio.logo);
      $(".studio-logo", $("#result-canvas"))?.remove();
      if (studio.logo) addBrandAssets();
    });
    bindImageInput("studio-hero", false, (images) => {
      studio.hero = images[0] || "";
      studio.heroSource = studio.hero ? "upload" : "none";
      studio.heroAttribution = null;
      $(".studio-hero-media", $("#result-canvas"))?.remove();
      if (studio.hero) addBrandAssets();
    });
    bindImageInput("studio-gallery", true, (images) => {
      studio.gallery = images.slice(0, 8);
      studio.galleryAttribution = [];
      studio.gallerySource = studio.gallery.length ? "upload" : "none";
      $(".studio-gallery", $("#result-canvas"))?.remove();
      if (studio.gallery.length) addGallerySection();
    });
    $("#studio-analyze")?.addEventListener("click", () => {
      const source = studio.logo || studio.hero;
      if (source) analyzeBrand(source);
      else showToast("העלו לוגו או תמונה ראשית כדי להתאים את העיצוב למותג");
    });
  }

  function bindImageInput(id, multiple, onDone) {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("change", async () => {
      try {
        const files = [...input.files].slice(0, multiple ? 8 : 1);
        const images = [];
        for (const file of files) {
          if (!file.type.startsWith("image/")) continue;
          images.push(await compressImage(file));
        }
        onDone(images);
        renderPreviews(id, images);
        input.closest(".studio-upload")?.classList.toggle("has-file", images.length > 0);
      } catch (error) {
        showToast(error.message || "לא ניתן לעבד את התמונה");
      }
    });
  }

  async function compressImage(file) {
    if (file.size > 12_000_000) throw new Error("התמונה גדולה מדי");
    const source = await fileToDataUrl(file);
    const image = await loadImage(source);
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = 0.84;
    let result = canvas.toDataURL("image/webp", quality);
    while (result.length > MAX_IMAGE_BYTES * 1.35 && quality > 0.5) {
      quality -= 0.08;
      result = canvas.toDataURL("image/webp", quality);
    }
    return result;
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

  function renderPreviews(id, images) {
    const holder = document.querySelector(`[data-preview-for="${id}"]`);
    if (!holder) return;
    holder.innerHTML = images.map((src) => `<img class="studio-thumb" src="${src}" alt="תצוגה מקדימה">`).join("");
  }

  async function analyzeBrand(src) {
    const image = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, 48, 48);
    const pixels = context.getImageData(0, 0, 48, 48).data;
    const buckets = new Map();
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i + 3] < 180) continue;
      const r = Math.round(pixels[i] / 32) * 32;
      const g = Math.round(pixels[i + 1] / 32) * 32;
      const b = Math.round(pixels[i + 2] / 32) * 32;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max > 232 && min > 220) continue;
      if (max < 32) continue;
      const key = `${Math.min(r,255)},${Math.min(g,255)},${Math.min(b,255)}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    studio.palette = [...buckets.entries()].sort((a,b) => b[1]-a[1]).slice(0,4).map(([rgb]) => `rgb(${rgb})`);
    if (!studio.palette.length) studio.palette = ["#6d5dfc", "#ec4899", "#f59e0b"];
    applyPalette();
    renderDna();
  }

  function applyPalette() {
    const canvas = $("#result-canvas");
    const color = studio.palette[0];
    if (!canvas || !color) return;
    canvas.style.setProperty("--accent", color);
    canvas.style.setProperty("--accent-dark", `color-mix(in srgb, ${color} 68%, black)`);
    canvas.style.setProperty("--accent-tint", `color-mix(in srgb, ${color} 12%, white)`);
  }

  function renderDna() {
    const panel = $("#studio-dna");
    if (!panel) return;
    const industry = $("#f-industry")?.value.trim() || "העסק";
    const style = guessStyle(industry);
    panel.classList.add("active");
    panel.innerHTML = `<strong>המיתוג נקלט</strong><div style="margin-top:6px;color:oklch(.45 .01 80)">סגנון מומלץ: ${style}. הצבעים והתמונות ישולבו אוטומטית לאחר יצירת הדף.</div><div class="studio-palette">${studio.palette.map((color) => `<span class="studio-swatch" style="background:${color}" title="${color}"></span>`).join("")}</div>`;
  }

  function guessStyle(industry) {
    if (/עורך|פיננס|ייעוץ|נדל|רופא|קלינ/.test(industry)) return "אמין ומדויק";
    if (/אוכל|מסעד|כושר|אירוע|ילד/.test(industry)) return "נועז ואנרגטי";
    if (/עיצוב|צילום|אדריכ|אופנה|תכשיט/.test(industry)) return "מערכתי ויוקרתי";
    return "נקי וממוקד המרות";
  }

  function bindResultTools() {
    $("#studio-desktop")?.addEventListener("click", () => setPreview(false));
    $("#studio-mobile")?.addEventListener("click", () => setPreview(true));
    $$("button[data-studio-variant]").forEach((button) => button.addEventListener("click", () => setVariant(button.dataset.studioVariant)));
    $("#studio-audit")?.addEventListener("click", runAudit);
    $("#studio-save")?.addEventListener("click", saveProject);
    $("#studio-load")?.addEventListener("click", loadProject);
    if (!window.dafdafEditor) $("#studio-add-section")?.addEventListener("click", openSectionPanel);
    $("#btn-download")?.addEventListener("click", exportEnhancedHtml, true);
  }

  function setPreview(mobile) {
    $(".canvas-frame")?.classList.toggle("mobile-preview", mobile);
    $("#studio-mobile")?.classList.toggle("active", mobile);
    $("#studio-desktop")?.classList.toggle("active", !mobile);
  }

  function setVariant(variant) {
    studio.variant = variant;
    const canvas = $("#result-canvas");
    if (canvas) canvas.dataset.studioVariant = variant;
    $$("button[data-studio-variant]").forEach((button) => button.classList.toggle("active", button.dataset.studioVariant === variant));
  }

  function observeGeneratedPage() {
    const canvas = $("#result-canvas");
    if (!canvas) return;
    new MutationObserver(() => enhanceGeneratedPage()).observe(canvas, { childList: true, subtree: true });
  }

  async function enhanceGeneratedPage() {
    const canvas = $("#result-canvas");
    if (!canvas || !canvas.querySelector(".ai-block")) return;
    applyPalette();
    setVariant(studio.variant);
    await addBrandAssets();
    addSectionActions();
    studio.enhanced = true;
  }

  async function addBrandAssets() {
    const hero = $('.ai-block[data-block="hero"]');
    if (!hero) return;
    if (studio.logo && !hero.querySelector(".studio-logo")) {
      hero.insertAdjacentHTML("afterbegin", `<img class="studio-logo" src="${studio.logo}" alt="לוגו העסק">`);
    }
    if (studio.hero && !hero.querySelector(".studio-hero-media")) {
      const alt = studio.heroAttribution?.alt || "תמונת העסק";
      hero.insertAdjacentHTML("beforeend", `<div class="studio-hero-media"><img src="${studio.hero}" alt="${escapeHtml(alt)}"></div>`);
    }
    if (studio.gallery.length && !$(".studio-gallery", $("#result-canvas"))) {
      addGallerySection();
    } else if (!studio.gallery.length && !studio.galleryRequested && !$(".studio-gallery", $("#result-canvas"))) {
      studio.galleryRequested = true;
      await generateAutoGallery();
    }
  }

  function readAiPhotoQueries() {
    const raw = $("#result-canvas")?.dataset.photoQueries;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch {
      return null;
    }
  }

  async function generateAutoGallery() {
    const industry = document.getElementById("f-industry")?.value || "";
    const description = document.getElementById("f-description")?.value || "";
    const queries = readAiPhotoQueries();
    try {
      const response = await fetch("/api/stock-photos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ industry, description, queries }),
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => null);
      const photos = Array.isArray(data?.photos) ? data.photos : [];
      if (!photos.length) return;
      if (!studio.hero || studio.heroSource === "auto") {
        studio.hero = photos[0].url;
        studio.heroAttribution = photos[0];
        studio.heroSource = "auto";
        const hero = $('.ai-block[data-block="hero"]');
        if (hero && !hero.querySelector(".studio-hero-media")) {
          hero.insertAdjacentHTML("beforeend", `<div class="studio-hero-media"><img src="${escapeHtml(studio.hero)}" alt="${escapeHtml(photos[0].alt || "תמונת העסק")}"></div>`);
        }
      }
      studio.gallery = photos.map((photo) => photo.url);
      studio.galleryAttribution = photos;
      studio.gallerySource = "auto";
      if (!$(".studio-gallery", $("#result-canvas"))) addGallerySection();
    } catch {
      // no auto-gallery available; the user can still upload their own photos
    }
  }

  function buildGalleryCredit() {
    if (!studio.galleryAttribution.length) return "";
    const credits = new Map();
    studio.galleryAttribution.forEach((photo) => {
      if (photo.photographerName && photo.photographerUrl) credits.set(photo.photographerUrl, photo.photographerName);
    });
    if (!credits.size) return "";
    const names = [...credits.entries()]
      .map(([url, name]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`)
      .join(", ");
    const unsplashUrl = escapeHtml(studio.galleryAttribution[0].unsplashUrl || "https://unsplash.com/");
    return `<p class="studio-gallery-credit">תמונות: ${names} דרך <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer">Unsplash</a></p>`;
  }

  function addGallerySection() {
    const canvas = $("#result-canvas");
    const cta = $('.block-slot[data-block="cta"]', canvas);
    const section = document.createElement("section");
    section.className = "studio-gallery studio-added-section";
    const credit = buildGalleryCredit();
    section.innerHTML = `<div class="studio-gallery-inner"><div style="text-align:center;margin-bottom:34px"><div style="font-weight:800;color:var(--accent-dark);margin-bottom:8px">הצצה לעסק</div><h2 style="font-size:32px;margin:0">תמונות שמספרות את הסיפור</h2></div><div class="studio-gallery-grid">${studio.gallery.map((src, index) => `<img src="${src}" alt="${escapeHtml(studio.galleryAttribution[index]?.alt || "גלריית העסק")}" loading="lazy">`).join("")}</div>${credit}</div>`;
    canvas.insertBefore(section, cta || canvas.lastElementChild);
  }

  function addSectionActions() {
    $$(".ai-block .block-toolbar").forEach((toolbar) => {
      if (toolbar.querySelector(".studio-section-actions")) return;
      const controls = document.createElement("span");
      controls.className = "studio-section-actions";
      controls.innerHTML = `<button type="button" data-studio-action="up" title="הזז למעלה">↑</button><button type="button" data-studio-action="down" title="הזז למטה">↓</button><button type="button" data-studio-action="duplicate" title="שכפל">⧉</button><button type="button" data-studio-action="delete" title="מחק">×</button>`;
      toolbar.appendChild(controls);
    });
  }

  function duplicateSection(slot) {
    const copy = slot.cloneNode(true);
    const suffix = `copy-${Date.now().toString(36)}`;
    const nodes = [copy, ...copy.querySelectorAll("*")];
    const idMap = new Map();

    nodes.forEach((item) => {
      item.classList?.remove("studio-selected");
      delete item.dataset?.studioNodeId;
      delete item.dataset?.studioPositioned;
      if (item.id) {
        const nextId = `${item.id}-${suffix}`;
        idMap.set(item.id, nextId);
        item.id = nextId;
      }
    });

    copy.querySelectorAll(".studio-insert-handle,.studio-element-toolbar").forEach((item) => item.remove());
    nodes.forEach((item) => {
      ["for", "aria-controls", "aria-labelledby", "aria-describedby"].forEach((attribute) => {
        const value = item.getAttribute?.(attribute);
        if (!value) return;
        item.setAttribute(attribute, value.split(/\s+/).map((token) => idMap.get(token) || token).join(" "));
      });
      const href = item.getAttribute?.("href");
      if (href?.startsWith("#") && idMap.has(href.slice(1))) item.setAttribute("href", `#${idMap.get(href.slice(1))}`);
    });

    slot.after(copy);
    return copy;
  }

  function handleSectionAction(event) {
    const button = event.target.closest("button");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const slot = button.closest(".block-slot") || button.closest(".ai-block");
    if (!slot) return;
    const canvas = $("#result-canvas");
    if (canvas) canvas.dataset.userOrder = "true";
    const action = button.dataset.studioAction;
    if (action === "up" && slot.previousElementSibling) slot.parentNode.insertBefore(slot, slot.previousElementSibling);
    if (action === "down" && slot.nextElementSibling) slot.parentNode.insertBefore(slot.nextElementSibling, slot);
    if (action === "duplicate") duplicateSection(slot);
    if (action === "delete") slot.remove();
    addSectionActions();
  }

  function openSectionPanel() {
    const panel = $("#studio-panel");
    const backdrop = $("#studio-backdrop");
    panel.innerHTML = `<button type="button" class="btn btn-ghost btn-sm" id="studio-close" style="float:left">סגירה</button><h3>הוספת מקטע</h3><p>בחרו מקטע, ערכו את הטקסט ישירות בדף וסדרו אותו עם החצים.</p><div class="studio-add-menu"><button data-add="faq">❓ שאלות נפוצות</button><button data-add="stats">📊 מספרים והישגים</button><button data-add="about">👋 אודות העסק</button><button data-add="trust">🛡️ פס אמון</button></div>`;
    panel.classList.add("open"); backdrop.classList.add("open");
    $("#studio-close")?.addEventListener("click", closePanel);
    $$("[data-add]", panel).forEach((button) => button.addEventListener("click", () => { addCustomSection(button.dataset.add); closePanel(); }));
  }

  function closePanel() { $("#studio-panel")?.classList.remove("open"); $("#studio-backdrop")?.classList.remove("open"); }

  function addCustomSection(type) {
    const templates = {
      faq: `<section class="studio-custom studio-added-section"><div class="studio-custom-inner"><h2 style="text-align:center;font-size:32px">שאלות נפוצות</h2><details open><summary>מה חשוב לדעת לפני שמתחילים?</summary><p contenteditable="true">כתבו כאן תשובה ברורה וקצרה שמסירה חשש מרכזי.</p></details><details><summary>כמה זמן התהליך לוקח?</summary><p contenteditable="true">עדכנו את התשובה לפי השירות שלכם.</p></details></div></section>`,
      stats: `<section class="studio-custom studio-added-section"><div class="studio-custom-inner"><h2 style="text-align:center;font-size:32px">המספרים שלכם</h2><p class="no-export" style="text-align:center;color:#78716c">החליפו כל שדה בנתון אמיתי שאפשר לאמת לפני הייצוא.</p><div class="studio-stats"><div class="studio-stat"><b contenteditable="true">הוסיפו נתון</b><span contenteditable="true">מה הנתון מוכיח?</span></div><div class="studio-stat"><b contenteditable="true">הוסיפו נתון</b><span contenteditable="true">מה הנתון מוכיח?</span></div><div class="studio-stat"><b contenteditable="true">הוסיפו נתון</b><span contenteditable="true">מה הנתון מוכיח?</span></div></div></div></section>`,
      about: `<section class="studio-custom studio-added-section"><div class="studio-custom-inner" style="max-width:780px;text-align:center"><div style="font-weight:800;color:var(--accent-dark)">מאחורי העסק</div><h2 style="font-size:32px" contenteditable="true">נעים להכיר</h2><p style="font-size:18px;color:#57534e" contenteditable="true">ספרו בקצרה מי אתם, למה הקמתם את העסק ומה הלקוחות מקבלים דווקא מכם.</p></div></section>`,
      trust: `<section class="studio-custom studio-added-section" style="padding-block:28px;background:var(--accent-tint)"><div class="studio-custom-inner" style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;font-weight:800"><span contenteditable="true">✓ שירות אישי</span><span contenteditable="true">✓ שקיפות מלאה</span><span contenteditable="true">✓ מענה מהיר</span></div></section>`
    };
    const canvas = $("#result-canvas");
    const cta = $('.block-slot[data-block="cta"]', canvas);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = templates[type];
    canvas.insertBefore(wrapper.firstElementChild, cta || canvas.lastElementChild);
  }

  function runAudit() {
    const canvas = $("#result-canvas");
    if (!canvas?.querySelector(".ai-block")) return;
    const checks = window.dafdafPlus?.auditChecks?.() || [];
    const headline = $("h1", canvas)?.textContent.trim() || "";
    checks.push({ ok: headline.length >= 20 && headline.length <= 95, text: "כותרת ראשית ממוקדת וברורה" });
    checks.push({ ok: Boolean(canvas.querySelector("#lead-action")), text: "קיים CTA פעיל" });
    checks.push({ ok: Boolean(canvas.querySelector(".studio-hero-media img")), text: "נוספה תמונת Hero אמיתית" });
    checks.push({ ok: canvas.querySelectorAll(".ai-block,.studio-added-section").length >= 5, text: "מבנה הדף עשיר מספיק" });
    checks.push({ ok: Boolean(canvas.querySelector('[data-block="testimonials"],.studio-stats,.studio-real-testimonial')), text: "קיים מקטע הוכחה או המלצות" });
    checks.push({ ok: Boolean(canvas.querySelector(".studio-gallery")), text: "קיימת גלריה חזותית" });
    const score = Math.round(checks.filter((item) => item.ok).length / checks.length * 100);
    $("#studio-score").textContent = `${score}`;
    const panel = $("#studio-panel");
    panel.innerHTML = `<button type="button" class="btn btn-ghost btn-sm" id="studio-close" style="float:left">סגירה</button><h3>מבקר ההמרות</h3><p>ציון הדף: <strong>${score}/100</strong></p><div class="studio-panel-list">${checks.map((item) => `<div class="studio-rec ${item.ok ? "good" : "warn"}">${item.ok ? "✓" : "!"} ${item.text}</div>`).join("")}</div>`;
    panel.classList.add("open"); $("#studio-backdrop").classList.add("open");
    $("#studio-close")?.addEventListener("click", closePanel);
  }

  function saveProject() {
    const payload = {
      savedAt: new Date().toISOString(),
      inputs: Object.fromEntries(["f-name","f-industry","f-offer","f-audience","f-description","f-proof","studio-ad-message"].map((id) => [id, document.getElementById(id)?.value || ""])),
      studio,
      publish: window.dafdafExportSettings?.() || {},
      canvas: $("#result-canvas")?.innerHTML || ""
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); showToast("הפרויקט נשמר בדפדפן הזה"); }
    catch { showToast("לא ניתן לשמור. נסו תמונות קטנות יותר"); }
  }

  function loadProject() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return showToast("עדיין אין פרויקט שמור");
    try {
      const payload = JSON.parse(raw);
      Object.entries(payload.inputs || {}).forEach(([id,value]) => { const input = document.getElementById(id); if (input) input.value = value; });
      Object.assign(studio, payload.studio || {});
      window.dafdafApplyExportSettings?.(payload.publish || {});
      if (payload.canvas) {
        $("#wizard").style.display = "none";
        $("#loading").style.display = "none";
        $("#result").style.display = "block";
        $("#result-canvas").innerHTML = payload.canvas;
        enhanceGeneratedPage();
      }
      renderDna(); showToast("הפרויקט נטען");
    } catch { showToast("קובץ השמירה אינו תקין"); }
  }

  function restoreDraftInputs() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (!payload.canvas) Object.entries(payload.inputs || {}).forEach(([id,value]) => { const input = document.getElementById(id); if (input) input.value = value; });
    } catch {}
  }

  function exportEnhancedHtml(event) {
    const canvas = $("#result-canvas");
    if (!canvas?.querySelector(".ai-block")) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const clone = canvas.cloneNode(true);
    $$(".no-export,.block-toolbar,[data-export-remove='true'],.skeleton-block", clone).forEach((element) => element.remove());
    $$('[contenteditable]', clone).forEach((element) => { element.removeAttribute("contenteditable"); element.removeAttribute("data-path"); });
    clone.classList.remove("studio-selected");
    $$('[data-studio-node-id],[data-studio-positioned]', clone).forEach((element) => {
      element.classList.remove("studio-selected");
      element.removeAttribute("data-studio-node-id");
      element.removeAttribute("data-studio-positioned");
    });
    const css = [...document.styleSheets].filter((sheet) => /\/css\/(?:studio(?:-[\w-]+)?|plus|page(?:-v3)?)\.css/.test(sheet.href || "")).map((sheet) => { try { return [...sheet.cssRules].map((rule) => rule.cssText).join("\n"); } catch { return ""; } }).join("\n");
    const business = $("#f-name")?.value.trim() || "דף נחיתה";
    const plusExport = window.dafdafPlus?.exportAssets?.() || { meta: "", html: "", script: "" };
    const runtimeScripts = [plusExport.script, window.dafdafEditor?.exportRuntime?.()].filter(Boolean).join("\n");
    const exportScript = runtimeScripts ? `<script>${runtimeScripts}</script>` : "";
    const exportSettings = window.dafdafExportSettings?.() || {};
    const gtmId = /^GTM-[A-Z0-9]{4,15}$/.test(exportSettings.gtmId || "") ? exportSettings.gtmId : "";
    const gtmHead = gtmId ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');<\/script>` : "";
    const gtmBody = gtmId ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : "";
    const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(business)}</title>${gtmHead}${plusExport.meta}<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=Rubik:wght@500;600;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;font-family:Heebo,sans-serif;line-height:1.5;background:var(--paper,#fff);color:var(--ink,#222)}a{color:inherit}${css}</style></head><body>${gtmBody}<main class="result-canvas" data-studio-variant="${studio.variant}" data-studio-theme="${escapeHtml(canvas.dataset.studioTheme || "clean")}" data-vibe="${escapeHtml(canvas.dataset.vibe || "trust")}" data-design-archetype="${escapeHtml(canvas.dataset.designArchetype || "modern")}" data-hero-layout="${escapeHtml(canvas.dataset.heroLayout || "centered")}" style="${canvas.getAttribute("style") || ""}">${clone.innerHTML}</main>${plusExport.html}${exportScript}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(business)}.html`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2000;background:#1c1917;color:white;padding:12px 20px;border-radius:999px;font:600 14px Heebo,sans-serif;box-shadow:0 12px 35px #0004";
    document.body.appendChild(toast); setTimeout(() => toast.remove(), 2800);
  }

  function escapeHtml(value) { return String(value || "").replace(/[&<>\"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[char]); }
  function slugify(value) { return String(value).trim().toLowerCase().replace(/[^\w֐-׿]+/g,"-").replace(/^-+|-+$/g,"") || "landing-page"; }

  window.dafdafStudio = {
    state: studio,
    compressImage,
    toast: showToast,
    refresh: enhanceGeneratedPage,
  };
})();
