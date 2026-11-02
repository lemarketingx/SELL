(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  const nav = $("#nav");
  if (nav) {
    const updateNav = () => nav.classList.toggle("scrolled", window.scrollY > 12);
    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("in"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => observer.observe(item));
  }

  const demos = [
    {
      slug: "clinic-maya",
      hue: 252,
      prompt: "קליניקה לפיזיותרפיה בבאר שבע. טיפול אישי, חזרה לתנועה וליווי בגובה העיניים.",
      badge: "פיזיותרפיה אישית בבאר שבע",
      headline: "לחזור לתנועה בלי לנחש מה הגוף צריך",
      sub: "אבחון מסודר, תוכנית טיפול אישית וליווי שמסביר מה עושים ולמה.",
      chips: ["אבחון אישי", "תוכנית ברורה", "ליווי לאורך הדרך"],
      cta: "לתיאום שיחה",
    },
    {
      slug: "cafe-noga",
      hue: 24,
      prompt: "בית קפה שכונתי עם מאפים במקום, חצר שקטה ואפשרות להזמין שולחן ב-WhatsApp.",
      badge: "בוקר טוב מהשכונה",
      headline: "קפה טרי, מאפה חם ופינה שרוצים להישאר בה",
      sub: "בית קפה מקומי עם אפייה במקום, חצר נעימה והזמנה מהירה דרך WhatsApp.",
      chips: ["אפייה במקום", "חצר נעימה", "הזמנה מהירה"],
      cta: "להזמנת שולחן",
    },
    {
      slug: "nadav-consulting",
      hue: 170,
      prompt: "יועץ עסקי לעסקים קטנים. עוזר לבנות תמחור, סדר פיננסי ותוכנית פעולה פשוטה.",
      badge: "פחות רעש. יותר החלטות.",
      headline: "להפוך את המספרים של העסק לתוכנית שאפשר לבצע",
      sub: "מחדדים תמחור, מבינים את התזרים ובונים צעדים שמקדמים את העסק בפועל.",
      chips: ["תמחור", "תזרים", "תוכנית פעולה"],
      cta: "לשיחת היכרות",
    },
  ];

  const demo = {
    frame: $("#demo"),
    prompt: $("#demo-prompt-text"),
    slug: $("#demo-slug"),
    badge: $("#dp-badge"),
    headline: $("#dp-headline"),
    caret: $("#dp-caret"),
    sub: $("#dp-sub"),
    chips: $("#dp-chips"),
    media: $("#dp-media"),
    cta: $("#dp-cta"),
    toast: $("#demo-toast"),
  };

  if (demo.frame && Object.values(demo).every(Boolean)) {
    runDemo().catch(() => showDemoImmediately(demos[0]));
  }

  async function runDemo() {
    for (;;) {
      for (const item of demos) {
        if (reducedMotion) {
          showDemoImmediately(item);
          await sleep(5200);
        } else {
          await animateDemo(item);
          await sleep(2300);
        }
      }
    }
  }

  function resetDemo() {
    demo.badge.classList.remove("on");
    demo.sub.classList.remove("on");
    demo.media.classList.remove("on");
    demo.cta.classList.remove("on");
    demo.toast.classList.remove("on");
    demo.caret.classList.remove("on");
    demo.prompt.textContent = "";
    demo.slug.textContent = "";
    demo.badge.textContent = "";
    demo.headline.textContent = "";
    demo.sub.textContent = "";
    demo.chips.innerHTML = "";
    demo.cta.textContent = "";
  }

  async function typeText(element, value, speed) {
    element.textContent = "";
    for (const character of value) {
      element.textContent += character;
      await sleep(speed);
    }
  }

  function addChip(text, visible = true) {
    const chip = document.createElement("span");
    chip.className = "dp-chip";
    chip.textContent = `✓ ${text}`;
    demo.chips.appendChild(chip);
    if (visible) requestAnimationFrame(() => chip.classList.add("on"));
    return chip;
  }

  async function animateDemo(item) {
    resetDemo();
    demo.frame.style.setProperty("--demo-hue", item.hue);
    await typeText(demo.prompt, item.prompt, 13);
    await sleep(260);
    await typeText(demo.slug, item.slug, 20);
    await sleep(180);
    demo.badge.textContent = item.badge;
    demo.badge.classList.add("on");
    await sleep(220);
    demo.caret.classList.add("on");
    await typeText(demo.headline, item.headline, 20);
    demo.caret.classList.remove("on");
    await sleep(160);
    demo.sub.textContent = item.sub;
    demo.sub.classList.add("on");
    await sleep(240);
    for (const chipText of item.chips) {
      addChip(chipText);
      await sleep(120);
    }
    demo.media.classList.add("on");
    await sleep(260);
    demo.cta.textContent = item.cta;
    demo.cta.classList.add("on");
    await sleep(280);
    demo.toast.classList.add("on");
    await sleep(1300);
    demo.toast.classList.remove("on");
  }

  function showDemoImmediately(item) {
    resetDemo();
    demo.frame.style.setProperty("--demo-hue", item.hue);
    demo.prompt.textContent = item.prompt;
    demo.slug.textContent = item.slug;
    demo.badge.textContent = item.badge;
    demo.headline.textContent = item.headline;
    demo.sub.textContent = item.sub;
    item.chips.forEach((chipText) => addChip(chipText, true));
    demo.cta.textContent = item.cta;
    demo.badge.classList.add("on");
    demo.sub.classList.add("on");
    demo.media.classList.add("on");
    demo.cta.classList.add("on");
  }
})();
