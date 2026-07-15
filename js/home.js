(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav scroll state ---------- */
  const nav = $("#nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", scrollY > 10);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  /* ---------- hero demo: a landing page that builds itself ---------- */
  const DEMOS = [
    {
      slug: "cafe-shaharit",
      hue: 70,
      prompt: "בית קפה שכונתי בפלורנטין. אפייה במקום, קפה ממקור ישיר, חצר שקטה.",
      badge: "בוקר טוב, פלורנטין",
      headline: "קפה שנטחן הבוקר, מאפה שיצא עכשיו מהתנור",
      sub: "קפה שחרית — בית קפה שכונתי עם אפייה במקום, קפה ממקור ישיר ופינה שקטה לעבוד בה.",
      chips: ["אפייה במקום", "קפה ממקור ישיר", "ישיבה בחצר"],
      cta: "הזמינו שולחן",
    },
    {
      slug: "adv-edri",
      hue: 245,
      prompt: 'עו"ד מקרקעין בחיפה. ליווי עסקאות נדל"ן מהחוזה ועד המפתח.',
      badge: "ליווי משפטי אישי",
      headline: "עסקת הנדל״ן שלכם, בידיים בטוחות",
      sub: "עו״ד מיכל אדרי — ליווי מלא בעסקאות מקרקעין, מהחוזה ועד המפתח, בשקיפות ובגובה העיניים.",
      chips: ["ליווי מלא בעסקה", "שקיפות בשכר הטרחה", "זמינות אישית"],
      cta: "לתיאום שיחת ייעוץ",
    },
    {
      slug: "studio-flow",
      hue: 330,
      prompt: "סטודיו יוגה ופילאטיס בקבוצות קטנות של עד 8 משתתפות.",
      badge: "נשימה. תנועה. שקט.",
      headline: "שעה אחת ביום שהיא רק שלך",
      sub: "סטודיו פלואו — יוגה ופילאטיס בקבוצות קטנות של עד 8, עם ליווי אישי לכל תלמידה.",
      chips: ["עד 8 בקבוצה", "מתאים למתחילות", "שיעור ניסיון חינם"],
      cta: "לשיעור ניסיון",
    },
  ];

  const el = {
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

  if (el.frame) {
    startDemo().catch(() => {
      /* the demo is decorative — never let it break the page */
    });
  }

  async function startDemo() {
    for (;;) {
      for (const d of DEMOS) {
        await playDemo(d);
        await sleep(2800);
      }
    }
  }

  async function typeText(node, text, speed) {
    node.textContent = "";
    for (const ch of text) {
      node.textContent += ch;
      await sleep(speed);
    }
  }

  function makeChip(text) {
    const s = document.createElement("span");
    s.className = "dp-chip";
    s.textContent = "✓ " + text;
    return s;
  }

  function resetDemo() {
    [el.badge, el.sub, el.media, el.cta, el.toast].forEach((n) =>
      n.classList.remove("on")
    );
    el.chips.innerHTML = "";
    el.headline.textContent = "";
    el.slug.textContent = "";
    el.prompt.textContent = "";
    el.badge.textContent = "";
    el.sub.textContent = "";
    el.cta.textContent = "";
  }

  async function playDemo(d) {
    el.frame.style.setProperty("--demo-hue", d.hue);
    resetDemo();

    if (reduced) {
      el.prompt.textContent = d.prompt;
      el.slug.textContent = d.slug;
      el.badge.textContent = d.badge;
      el.headline.textContent = d.headline;
      el.sub.textContent = d.sub;
      d.chips.forEach((c) => {
        const n = makeChip(c);
        n.classList.add("on");
        el.chips.appendChild(n);
      });
      el.cta.textContent = d.cta;
      [el.badge, el.sub, el.media, el.cta].forEach((n) => n.classList.add("on"));
      await sleep(5200);
      return;
    }

    await typeText(el.prompt, d.prompt, 17);
    await sleep(480);

    await typeText(el.slug, d.slug, 26);
    await sleep(320);

    el.badge.textContent = d.badge;
    el.badge.classList.add("on");
    await sleep(340);

    el.caret.classList.add("on");
    await typeText(el.headline, d.headline, 27);
    el.caret.classList.remove("on");
    await sleep(180);

    el.sub.textContent = d.sub;
    el.sub.classList.add("on");
    await sleep(380);

    for (const c of d.chips) {
      const n = makeChip(c);
      el.chips.appendChild(n);
      void n.offsetWidth;
      n.classList.add("on");
      await sleep(160);
    }
    await sleep(200);

    el.media.classList.add("on");
    await sleep(420);

    el.cta.textContent = d.cta;
    el.cta.classList.add("on");
    await sleep(420);

    el.toast.classList.add("on");
    await sleep(1500);
    el.toast.classList.remove("on");
  }
})();
