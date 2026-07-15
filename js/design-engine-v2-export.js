(() => {
  "use strict";

  const canvas = document.getElementById("result-canvas");
  if (!canvas) return;

  let timer = null;
  const prefixes = ["de-archetype-", "de-variant-"];

  function syncClasses(element, archetype, variant) {
    const expected = [`de-archetype-${archetype}`, `de-variant-${variant || "classic"}`];
    const current = [...element.classList].filter((name) => prefixes.some((prefix) => name.startsWith(prefix)));
    if (current.length === expected.length && expected.every((name) => current.includes(name))) return;
    current.forEach((name) => element.classList.remove(name));
    element.classList.add(...expected);
  }

  function markDirectProcess() {
    const process = canvas.querySelector('.ai-block[data-block="process"]');
    if (!process) return;
    const direct = [...process.children].filter((item) => !item.classList.contains("block-toolbar"));
    const head = direct.find((item) => item.querySelector?.("h2"));
    const grid = direct.find((item) => item !== head && item.children?.length >= 2);
    head?.classList.add("design-section-head");
    head?.querySelector("h2")?.classList.add("design-section-title");
    if (grid) {
      grid.classList.add("design-card-grid");
      [...grid.children].forEach((card) => card.classList.add("design-card"));
    }
  }

  function syncExportMarkers() {
    const archetype = canvas.dataset.designArchetype;
    const layout = canvas.dataset.heroLayout;
    const variant = canvas.dataset.studioVariant;
    if (!archetype || !layout) return;

    markDirectProcess();
    canvas.querySelectorAll(".ai-block,.studio-added-section").forEach((section) => {
      syncClasses(section, archetype, variant);
    });

    const hero = canvas.querySelector('.ai-block[data-block="hero"]');
    if (hero && hero.dataset.heroLayout !== layout) hero.dataset.heroLayout = layout;
    const rail = canvas.querySelector(".design-proof-rail");
    if (rail && rail.dataset.heroLayout !== layout) rail.dataset.heroLayout = layout;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(syncExportMarkers, 100);
  }

  new MutationObserver(schedule).observe(canvas, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-studio-variant", "data-design-archetype", "data-hero-layout"],
  });
  document.querySelectorAll("[data-studio-variant]").forEach((button) => button.addEventListener("click", schedule));
  window.addEventListener("load", schedule);
})();