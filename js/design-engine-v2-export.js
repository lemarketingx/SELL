(() => {
  "use strict";

  const canvas = document.getElementById("result-canvas");
  if (!canvas) return;

  let timer = null;
  const prefixes = ["de-archetype-", "de-variant-"];

  function clearPrefixedClasses(element) {
    [...element.classList].forEach((name) => {
      if (prefixes.some((prefix) => name.startsWith(prefix))) element.classList.remove(name);
    });
  }

  function syncExportMarkers() {
    const archetype = canvas.dataset.designArchetype;
    const layout = canvas.dataset.heroLayout;
    const variant = canvas.dataset.studioVariant;
    if (!archetype || !layout) return;

    canvas.querySelectorAll(".ai-block,.studio-added-section").forEach((section) => {
      clearPrefixedClasses(section);
      section.classList.add(`de-archetype-${archetype}`, `de-variant-${variant || "classic"}`);
    });

    const hero = canvas.querySelector('.ai-block[data-block="hero"]');
    if (hero) hero.dataset.heroLayout = layout;
    const rail = canvas.querySelector(".design-proof-rail");
    if (rail) rail.dataset.heroLayout = layout;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(syncExportMarkers, 100);
  }

  new MutationObserver(schedule).observe(canvas, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-studio-variant", "data-design-archetype", "data-hero-layout"] });
  document.querySelectorAll("[data-studio-variant]").forEach((button) => button.addEventListener("click", schedule));
  window.addEventListener("load", schedule);
})();