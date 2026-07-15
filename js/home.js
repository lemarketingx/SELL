(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  applyAccurateMarketingCopy();

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

  function applyAccurateMarketingCopy() {
    const plusSection = document.querySelector("#plus");
    if (plusSection) {
      setText("#plus .sec-head h2", "כלים שימושיים שנבנו לעסקים בישראל");
      setText("#plus .sec-head p", "שכבת כלים שמוסיפה לדף פעולות קשר, מסרים, התאמות זמן וערכת קמפיין — בלי לטעון שכל עסק חייב להשתמש בכולם.");

      const cards = [...plusSection.querySelectorAll(".plus-home-card")];
      rewriteCard(cards[0], "מותאם לישראל", "מצב שעות שבת", "הדף מחשב זמני כניסה ויציאה לפי תאריך ועיר שנבחרה ומציג הודעה בזמן המתאים. מומלץ לאמת את הזמנים והמנהג המקומי לפני פרסום.");
      rewriteCard(cards[1], "כלי עזר", "כלי עזר לנגישות", "הגדלת טקסט, ניגודיות, הדגשת קישורים ועצירת אנימציות. הכלים מסייעים בשימוש, אך אינם אישור לעמידה בתקן ואינם מחליפים בדיקת נגישות מקצועית.");
      rewriteCard(cards[2], "", "ערכת קמפיין אוטומטית", "מודעת פייסבוק, כותרות לגוגל, הודעת WhatsApp, SMS וביו לאינסטגרם — נוצרים מהתוכן הנוכחי של הדף ומוכנים לבדיקה ולהעתקה.");
      rewriteCard(cards[3], "", "WhatsApp, חיוג ו-Waze", "כפתור WhatsApp צף וסרגל פעולות במובייל מאפשרים ללקוח ליצור קשר או לנווט בלחיצה אחת, כאשר הוגדר יעד אמיתי.");
      rewriteCard(cards[4], "", "מסרים מתחלפים וטיימר", "בועות מסרים שהעסק כותב וטיימר עד חצות לפי שעון ישראל. יש להשתמש רק במסרים ובהטבות אמיתיים.");
      rewriteCard(cards[5], "", "מבקר המרות", "ציון בדיקה לדף לפי כותרת, CTA, הוכחות אמון, כלי עזר וערוץ פנייה. הציון הוא המלצה פנימית, לא הבטחה לתוצאות.");
    }

    const priceCards = [...document.querySelectorAll("#pricing .price-card")];
    rewritePriceCard(priceCards[0], {
      flag: "בטא פתוחה",
      tier: "חינמי כרגע",
      price: "₪0",
      forText: "לבדיקה ובניית דפים בתקופת הבטא",
      button: "התחילו עכשיו",
      features: [
        "יצירת דף עם AI ועריכה ידנית",
        "תמונות, Page DNA ומקטעים נוספים",
        "כלי דפדף פלוס וערכת קמפיין",
        "שמירה מקומית וייצוא HTML",
      ],
    });
    rewritePriceCard(priceCards[1], {
      flag: "בקרוב",
      tier: "מסלול מקצועי",
      price: "טרם נקבע",
      forText: "חשבונות, שמירה בענן ותכונות מסחריות עתידיות",
      button: "נסו את הבטא",
      features: [
        "המסלול עדיין אינו ניתן לרכישה",
        "לא נגבה תשלום בשלב הנוכחי",
        "התמחור ייקבע לאחר בדיקת שימוש וביקוש",
      ],
    });
    rewritePriceCard(priceCards[2], {
      flag: "בהמשך",
      tier: "עסקי וסוכנויות",
      price: "בתכנון",
      forText: "ניהול לקוחות וצוותים לאחר הוכחת ביקוש",
      button: "נסו את הבטא",
      features: [
        "אין עדיין ניהול משתמשים או לקוחות בענן",
        "אין עדיין דומיינים או אנליטיקס מובנים",
        "היכולות יפותחו רק לאחר אימות צורך אמיתי",
      ],
    });

    const faqItems = [...document.querySelectorAll("#faq details")];
    const boostersFaq = faqItems.find((item) => item.querySelector("summary")?.textContent.includes("בוסטרים"));
    if (boostersFaq) {
      const paragraph = boostersFaq.querySelector("p");
      if (paragraph) paragraph.textContent = "כלים אופציונליים שמוסיפים לדף המיוצא פעולות קשר, הודעת שעות שבת, כלי עזר לנגישות, מסרים מתחלפים, טיימר וערכת קמפיין. חלק מהכלים דורשים הגדרה ובדיקה מצד בעל העסק לפני פרסום.";
    }

    replaceTextAcrossDocument([
      ["הבוסטרים שאין באף בונה דפים אחר בעולם", "כלים שימושיים שנבנו לעסקים בישראל"],
      ["ראשון בעולם", "מותאם לישראל"],
      ["דרישת חוק", "כלי עזר"],
      ["אף בונה דפים אחר לא מגיע עם הסט הזה מובנה.", "הסט נבנה סביב הצרכים הנפוצים של עסקים בישראל."],
    ]);
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  function rewriteCard(card, tag, title, paragraph) {
    if (!card) return;
    const tagNode = card.querySelector(".plus-home-tag");
    if (tagNode) {
      tagNode.textContent = tag;
      tagNode.style.display = tag ? "inline-flex" : "none";
    }
    const titleNode = card.querySelector("h3");
    const paragraphNode = card.querySelector("p");
    if (titleNode) titleNode.textContent = title;
    if (paragraphNode) paragraphNode.textContent = paragraph;
  }

  function rewritePriceCard(card, data) {
    if (!card) return;
    const flag = card.querySelector(".price-flag");
    if (flag) flag.textContent = data.flag;
    const tier = card.querySelector(".price-tier");
    const price = card.querySelector(".price-num");
    const forText = card.querySelector(".price-for");
    const button = card.querySelector(".price-btn");
    if (tier) tier.textContent = data.tier;
    if (price) price.textContent = data.price;
    if (forText) forText.textContent = data.forText;
    if (button) button.textContent = data.button;
    const features = card.querySelector(".price-feats");
    if (features) features.innerHTML = data.features.map((feature) => `<span>${escapeHtml(feature)}</span>`).join("");
  }

  function replaceTextAcrossDocument(replacements) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let value = node.nodeValue;
      replacements.forEach(([from, to]) => {
        value = value.replaceAll(from, to);
      });
      node.nodeValue = value;
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[character]);
  }
})();
