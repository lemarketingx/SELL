"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") api.mount(document, root);
})(typeof window !== "undefined" ? window : globalThis, function () {
  const LIMIT = 10;
  const KEY = "yarit_orders_v1";
  const FREE_SHIP = 250;
  const SHIP = 25;
  const WA = "https://wa.me/972500000000";

  const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=70&auto=format&fit=crop`;
  const PRODUCTS = [
    { id: "puff", cat: "boxes", name: "מארז 9 פחזניות", price: 90, img: IMG("1786918467116-045c0f772b1f"), serves: "9 יחידות · מארז מתנה", badge: "הכי נמכר", desc: "פחזניות אווריריות במילוי קרם וניל, שוקולד וקרמל מלוח." },
    { id: "milfa", cat: "cakes", name: "עוגת מילפיי", price: 60, img: IMG("1602903489862-1fe54b1f5ff2"), serves: "8–10 מנות", desc: "שכבות בצק עלים פריך, קרם פטיסייר עשיר ואבקת סוכר מעל." },
    { id: "cheese", cat: "cakes", name: "עוגת גבינה", price: 60, img: IMG("1588195538326-c5b1e9f80a1b"), serves: "10–12 מנות", badge: "אהובת שבת", desc: "עוגת גבינה אפויה וקרמית על בסיס פירורים חמאתי." },
    { id: "choco", cat: "cakes", name: "עוגת שוקולד פאדג׳", price: 70, img: IMG("1606890737304-57a1ca8a5b62"), serves: "10–12 מנות", desc: "שלוש שכבות שוקולד לחות עם גנאש מריר וקראנץ׳ פרלין." },
    { id: "lemon", cat: "cakes", name: "טארט לימון מרנג", price: 75, img: IMG("1583338917451-face2751d8d5"), serves: "8 מנות", desc: "קלתית חמאה, קרם לימון חמצמץ ומרנג איטלקי שרוף בעדינות." },
    { id: "cookies", cat: "boxes", name: "מארז 12 עוגיות", price: 45, img: IMG("1499636136210-6f4ee915583e"), serves: "12 יחידות", desc: "עוגיות חמאה עם שוקולד צ׳יפס ואגוזי לוז קלויים. רכות בפנים." },
    { id: "petit", cat: "trays", name: "מגש פטיפורים", price: 180, img: IMG("1558326567-98ae2405596b"), serves: "24 יחידות · לאירוח", badge: "לאירועים", desc: "מבחר מיני טארטים, מקרונים וקוביות עוגה בהרכבה משתנה." },
    { id: "minipuff", cat: "trays", name: "מגש מיני פחזניות", price: 150, img: IMG("1786918466787-9b2b740ee6d9"), serves: "30 יחידות · לאירוח", desc: "מיני פחזניות בשלושה מילויים, מסודרות על מגש הגשה." }
  ];
  const TABS = [["all", "הכל"], ["cakes", "עוגות"], ["boxes", "מארזים"], ["trays", "מגשי אירוח"]];
  const PACKAGES = [
    { id: "s", name: "שולחן אינטימי", guests: "עד 20 אורחים", price: "החל מ־450 ₪", desc: "עוגה מרכזית, מגש פטיפורים ומגש מיני פחזניות." },
    { id: "m", name: "שולחן חגיגי", guests: "20–50 אורחים", price: "החל מ־950 ₪", desc: "שתי עוגות, 4 מגשי אירוח ועיטור בצבעי האירוע." },
    { id: "l", name: "שולחן אירוע", guests: "50+ אורחים", price: "בהצעת מחיר", desc: "עיצוב שולחן מלא, מגוון רחב ותיאום מול האולם." }
  ];
  const FAQS = [
    ["כמה זמן מראש צריך להזמין?", "לעוגות ומארזים — בדרך כלל יום-יומיים מראש, לפי המקום בלוח. לשולחן מתוקים לאירוע מומלץ שבועיים לפחות."],
    ["למה יש הגבלה של 10 פריטים ביום?", "אני אופה לבד ובעבודת יד. ההגבלה מבטיחה שכל פריט יוצא טרי ומדויק. אם יום מסוים מלא, הלוח יציע את התאריכים הפנויים הקרובים."],
    ["האם יש התאמה לאלרגיות?", "כל המוצרים חלביים ועשויים במטבח שבו יש אגוזים וגלוטן. אפשר לבקש התאמות מסוימות בהערות להזמנה ואחזור אליכם לאישור."],
    ["איך עובדים המשלוחים?", `משלוחים באזור המרכז בימים א׳–ו׳ בעלות ${SHIP} ₪, וחינם בהזמנה מעל ${FREE_SHIP} ₪. אפשר גם לאסוף עצמאית בין 09:00 ל־14:00.`],
    ["איך משלמים?", "אחרי שאני מאשרת את ההזמנה טלפונית, נשלחת בקשת תשלום ב־Bit או ב־PayBox לפי הבחירה שלכם."]
  ];

  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fromIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmt = (s) => fromIso(s).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  const startOfDay = (d) => { const t = new Date(d); t.setHours(0, 0, 0, 0); return t; };
  const isClosed = (s) => fromIso(s).getDay() === 6;
  const emptyCart = () => Object.fromEntries(PRODUCTS.map((p) => [p.id, 0]));
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch]);

  function seedOrders(today) {
    const orders = {};
    [[0, 8], [1, 10], [2, 6], [4, 10], [5, 9]].forEach(([n, c]) => {
      const d = addDays(today, n);
      if (d.getDay() !== 6) orders[iso(d)] = c;
    });
    return orders;
  }

  function remaining(orders, day) { return LIMIT - (orders[day] || 0); }
  function countItems(cart) { return Object.values(cart).reduce((a, b) => a + b, 0); }

  function freeDates(orders, today, need, max, horizon) {
    const out = [];
    for (let i = 0; i < horizon && out.length < max; i++) {
      const d = iso(addDays(today, i));
      if (!isClosed(d) && remaining(orders, d) >= need) out.push(d);
    }
    return out;
  }

  function pricing(cart, delivery) {
    const lines = PRODUCTS.filter((p) => cart[p.id] > 0).map((p) => ({ id: p.id, name: p.name, qty: cart[p.id], total: p.price * cart[p.id] }));
    const subtotal = lines.reduce((a, l) => a + l.total, 0);
    const fee = delivery && lines.length ? (subtotal >= FREE_SHIP ? 0 : SHIP) : 0;
    return { lines, subtotal, fee, total: subtotal + fee };
  }

  // Month grid cells for the availability calendar. `strict` is the modal
  // variant: days that cannot fit the current order are disabled.
  function calendarCells({ orders, today, monthOff, need, selected, target, strict }) {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOff, 1);
    const cells = [];
    for (let i = 0; i < base.getDay(); i++) cells.push({ empty: true });
    const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
      const date = new Date(base.getFullYear(), base.getMonth(), i);
      const s = iso(date);
      const past = date < today;
      const closed = date.getDay() === 6;
      const rem = remaining(orders, s);
      const full = rem <= 0;
      const cell = { day: i, iso: s, sub: "", state: "open", disabled: false, selected: s === selected, target: strict && s === target };
      if (past || closed) Object.assign(cell, { state: "off", disabled: true, sub: closed && !past ? "סגור" : "" });
      else if (full || (strict && rem < need)) Object.assign(cell, { state: "full", disabled: strict, sub: full ? "מלא" : `נותרו ${rem}` });
      else cell.sub = `נותרו ${rem}`;
      cells.push(cell);
    }
    return cells;
  }

  function validateOrder(state, today) {
    const n = countItems(state.cart);
    if (!n) return "יש להוסיף לפחות פריט אחד לסל";
    if (!state.date) return "יש לבחור תאריך";
    if (isClosed(state.date) || fromIso(state.date) < today) return "התאריך שנבחר אינו פנוי להזמנות, יש לבחור תאריך אחר";
    if (!state.name.trim() || state.phone.replace(/\D/g, "").length < 9) return "יש למלא שם וטלפון תקין";
    if (state.delivery && !state.address.trim()) return "יש למלא כתובת למשלוח";
    return "";
  }

  function mount(doc, win) {
    const storage = (() => { try { return win.localStorage; } catch (e) { return null; } })();
    const today = () => startOfDay(new Date());
    const save = (orders) => { try { if (storage) storage.setItem(KEY, JSON.stringify(orders)); } catch (e) { /* storage unavailable */ } };
    const load = () => {
      try { const v = JSON.parse(storage && storage.getItem(KEY)); if (v) return v; } catch (e) { /* fall through to seed */ }
      const seeded = seedOrders(today());
      save(seeded);
      return seeded;
    };

    // Default to the first bookable day, so a Saturday or full day is never preselected.
    const firstOpen = (orders) => freeDates(orders, today(), 1, 1, 90)[0] || null;
    const orders = load();
    const state = {
      cart: emptyCart(), date: firstOpen(orders), orders, monthOff: 0, modal: null, limitDate: null,
      name: "", phone: "", address: "", notes: "", delivery: false, payment: "bit", error: "", success: "",
      tab: "all", faq: 0, pkg: "m", evName: "", evPhone: "", evDate: "", evGuests: "", toast: ""
    };
    let toastTimer = null;

    const $ = (id) => doc.getElementById(id);
    const bind = (key, value) => doc.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => { el.textContent = value; });
    const need = () => Math.max(1, countItems(state.cart));

    function set(patch) { Object.assign(state, patch); render(); }

    function showToast(msg) {
      clearTimeout(toastTimer);
      set({ toast: msg });
      toastTimer = setTimeout(() => set({ toast: "" }), 1800);
    }

    function changeQty(id, delta) {
      const cart = { ...state.cart, [id]: Math.max(0, state.cart[id] + delta) };
      const d = state.date;
      if (delta > 0 && d && countItems(cart) > remaining(state.orders, d)) {
        set({ cart, modal: "limit", limitDate: d, date: null, error: "" });
      } else {
        set({ cart, error: "" });
        if (delta > 0) showToast(`${PRODUCTS.find((p) => p.id === id).name} נוסף לסל`);
      }
    }

    function pickDate(d, fromModal) {
      if (need() > remaining(state.orders, d)) { set({ modal: "limit", limitDate: d, date: null }); return; }
      set({ date: d, error: "", modal: fromModal ? null : state.modal });
    }

    function submit() {
      const err = validateOrder(state, today());
      if (err) { set({ error: err }); return; }
      const n = countItems(state.cart);
      if (n > remaining(state.orders, state.date)) { set({ modal: "limit", limitDate: state.date, date: null }); return; }
      const orders = { ...state.orders, [state.date]: (state.orders[state.date] || 0) + n };
      save(orders);
      const pay = state.payment === "bit" ? "Bit" : "PayBox";
      set({
        orders, modal: "success", cart: emptyCart(), notes: "", error: "",
        success: `תודה ${state.name.trim()}! ${n} פריטים שמורים עבורך ל${fmt(state.date)}. לאחר אישור טלפוני נשלח בקשת תשלום ב־${pay}.`
      });
      $("notes").value = "";
    }

    function renderCalendar(el, strict) {
      const t = today();
      const month = new Date(t.getFullYear(), t.getMonth() + state.monthOff, 1);
      const cells = calendarCells({ orders: state.orders, today: t, monthOff: state.monthOff, need: need(), selected: state.date, target: state.limitDate, strict });
      const dow = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"].map((d) => `<div>${d}</div>`).join("");
      const days = cells.map((c) => {
        if (c.empty) return "<span class=\"cal-day is-empty\" aria-hidden=\"true\"></span>";
        const cls = ["cal-day"];
        if (c.state === "off") cls.push("is-off");
        if (c.state === "full") cls.push("is-full");
        if (c.state === "full" && strict) cls.push("is-blocked");
        if (c.selected) cls.push("is-sel");
        if (c.target) cls.push("is-target");
        const label = `${fmt(c.iso)}${c.sub ? ` · ${c.sub}` : ""}`;
        return `<button type="button" class="${cls.join(" ")}" data-date="${c.iso}"${c.disabled ? " disabled" : ""}${c.selected ? " aria-pressed=\"true\"" : ""} aria-label="${escapeHtml(label)}"><span class="d">${c.day}</span><span class="s">${escapeHtml(c.sub)}</span></button>`;
      }).join("");
      const legend = strict ? "" : `<div class="cal-legend"><span><span class="swatch" style="background:#F4EADF"></span>פנוי (מספר = פריטים שנותרו)</span><span><span class="swatch" style="background:#F6D9D7"></span>מלא</span><span>שבת — סגור</span></div>`;
      el.innerHTML = `
        <div class="cal-head">
          <button type="button" class="cal-nav" data-month="-1" aria-label="החודש הקודם"${state.monthOff > 0 ? "" : " disabled"}>›</button>
          <div class="cal-month">${escapeHtml(month.toLocaleDateString("he-IL", { month: "long", year: "numeric" }))}</div>
          <button type="button" class="cal-nav" data-month="1" aria-label="החודש הבא"${state.monthOff < 3 ? "" : " disabled"}>‹</button>
        </div>
        <div class="cal-dow" aria-hidden="true">${dow}</div>
        <div class="cal-grid">${days}</div>${legend}`;
      el.dataset.strict = strict ? "1" : "";
    }

    function render() {
      const n = countItems(state.cart);
      const price = pricing(state.cart, state.delivery);
      const t = today();

      bind("cartCount", n);
      const first = freeDates(state.orders, t, 1, 1, 90)[0];
      bind("nextFree", first ? fmt(first) : "אין תאריכים פנויים");

      $("tabs").innerHTML = TABS.map(([id, label]) => `<button type="button" class="tab${state.tab === id ? " is-on" : ""}" data-tab="${id}" aria-pressed="${state.tab === id}">${label}</button>`).join("");
      $("products").innerHTML = PRODUCTS.filter((p) => state.tab === "all" || p.cat === state.tab).map((p) => {
        const qty = state.cart[p.id];
        const action = qty > 0
          ? `<div class="qty"><button type="button" data-inc="${p.id}" aria-label="הוספת ${escapeHtml(p.name)}">+</button><span>${qty} בסל</span><button type="button" data-dec="${p.id}" aria-label="הסרת ${escapeHtml(p.name)}">−</button></div>`
          : `<button type="button" class="btn btn--dark add-btn" data-inc="${p.id}">הוספה להזמנה</button>`;
        return `<article class="product">
          <div class="product-media"><img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy">${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ""}</div>
          <div class="product-body">
            <div class="product-title"><h3>${escapeHtml(p.name)}</h3><div class="product-price">${p.price} ₪</div></div>
            <div class="product-serves">${escapeHtml(p.serves)}</div>
            <p class="product-desc">${escapeHtml(p.desc)}</p>
            ${action}
          </div>
        </article>`;
      }).join("");

      const pkg = PACKAGES.find((p) => p.id === state.pkg);
      $("packages").innerHTML = PACKAGES.map((p) => `<button type="button" class="package${p.id === state.pkg ? " is-on" : ""}" data-pkg="${p.id}" aria-pressed="${p.id === state.pkg}">
          <span class="package-guests">${escapeHtml(p.guests)}</span>
          <span class="package-name">${escapeHtml(p.name)}</span>
          <span class="package-desc">${escapeHtml(p.desc)}</span>
          <span class="package-price">${escapeHtml(p.price)}</span>
        </button>`).join("");
      bind("pkgName", pkg.name);
      const evText = `היי יערית, אשמח להצעת מחיר ל${pkg.name}.\nשם: ${state.evName}\nטלפון: ${state.evPhone}\nתאריך: ${state.evDate}\nאורחים: ${state.evGuests}`;
      $("evSend").href = `${WA}?text=${encodeURIComponent(evText)}`;

      renderCalendar($("mainCal"), false);

      doc.querySelectorAll("[data-delivery]").forEach((b) => {
        const on = String(state.delivery) === b.dataset.delivery;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on);
      });
      doc.querySelectorAll("[data-payment]").forEach((b) => {
        const on = state.payment === b.dataset.payment;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on);
      });
      $("addressWrap").hidden = !state.delivery;
      bind("deliveryHint", price.subtotal >= FREE_SHIP
        ? `ההזמנה מעל ${FREE_SHIP} ₪ — המשלוח חינם`
        : `משלוח ${SHIP} ₪ · חינם מעל ${FREE_SHIP} ₪ (חסרים ${FREE_SHIP - price.subtotal} ₪)`);

      $("summaryEmpty").hidden = n > 0;
      const lines = price.lines.map((l) => `<div class="summary-line"><span>${escapeHtml(l.name)} × ${l.qty}</span><b>${l.total} ₪</b></div>`);
      if (state.delivery) lines.push(`<div class="summary-line"><span>משלוח</span><b>${price.fee === 0 ? "חינם" : `${price.fee} ₪`}</b></div>`);
      $("summaryLines").innerHTML = lines.join("");
      bind("dateLabel", state.date ? fmt(state.date) : "לא נבחר");
      bind("remainingLabel", state.date ? `${Math.max(0, remaining(state.orders, state.date))} פנויים` : "—");
      bind("total", price.total);
      bind("subtotal", price.subtotal);
      bind("payLabel", state.payment === "bit" ? "Bit" : "PayBox");
      $("error").hidden = !state.error;
      $("error").textContent = state.error;

      $("faqList").innerHTML = FAQS.map(([q, a], i) => {
        const open = state.faq === i;
        return `<div class="faq-item">
          <button type="button" class="faq-q" data-faq="${i}" aria-expanded="${open}"><span>${escapeHtml(q)}</span><span class="faq-sign" aria-hidden="true">${open ? "−" : "+"}</span></button>
          ${open ? `<p class="faq-a">${escapeHtml(a)}</p>` : ""}
        </div>`;
      }).join("");

      $("cartBar").hidden = n === 0;
      $("toast").hidden = !state.toast;
      $("toast").textContent = state.toast;

      const wasOpen = !$("limitModal").hidden || !$("successModal").hidden;
      $("limitModal").hidden = state.modal !== "limit";
      $("successModal").hidden = state.modal !== "success";
      if (state.modal === "limit") {
        const ld = state.limitDate;
        const lr = ld ? Math.max(0, remaining(state.orders, ld)) : 0;
        bind("limitMsg", !ld ? "" : lr === 0
          ? `ל${fmt(ld)} כבר הוזמנו ${LIMIT} פריטים — המכסה היומית המלאה לכלל הלקוחות. בחרו תאריך אחר להזמנה של ${need()} פריטים:`
          : `ל${fmt(ld)} נותרו רק ${lr} פריטים פנויים (מכסה יומית של ${LIMIT} פריטים לכלל הלקוחות), וההזמנה שלכם כוללת ${need()}. בחרו תאריך אחר:`);
        const suggestions = freeDates(state.orders, t, need(), 3, 60);
        $("suggestWrap").hidden = suggestions.length === 0;
        $("suggestions").innerHTML = suggestions.map((d) => `<button type="button" class="suggestion" data-date="${d}">${escapeHtml(fmt(d))}</button>`).join("");
        renderCalendar($("modalCal"), true);
      }
      if (state.modal === "success") bind("successMsg", state.success);
      if (state.modal && !wasOpen) {
        const dialog = doc.querySelector(state.modal === "limit" ? "#limitModal .close-btn" : "#successModal .success-close");
        if (dialog) dialog.focus();
      }
    }

    // Delegated interactions.
    doc.addEventListener("click", (e) => {
      const el = e.target.closest("button, .overlay");
      if (!el) return;
      if (el.matches(".overlay")) { if (e.target === el) set({ modal: null }); return; }
      const d = el.dataset;
      if (d.close !== undefined) set({ modal: null });
      else if (d.tab) set({ tab: d.tab });
      else if (d.inc) changeQty(d.inc, 1);
      else if (d.dec) changeQty(d.dec, -1);
      else if (d.pkg) set({ pkg: d.pkg });
      else if (d.month) set({ monthOff: Math.min(3, Math.max(0, state.monthOff + Number(d.month))) });
      else if (d.date) pickDate(d.date, Boolean(el.closest("#limitModal")));
      else if (d.delivery) set({ delivery: d.delivery === "true" });
      else if (d.payment) set({ payment: d.payment });
      else if (d.faq) { const i = Number(d.faq); set({ faq: state.faq === i ? -1 : i }); }
      else if (el.id === "submit") submit();
      else if (el.id === "resetDemo") {
        const orders = seedOrders(today());
        save(orders);
        set({ orders, date: firstOpen(orders), cart: emptyCart(), modal: null });
      }
    });

    doc.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.modal) set({ modal: null }); });

    ["name", "phone", "address", "notes", "evName", "evPhone", "evDate", "evGuests"].forEach((id) => {
      $(id).addEventListener("input", (e) => {
        state[id] = e.target.value;
        if (id.startsWith("ev")) render();
      });
    });

    render();
    return { state, render };
  }

  return { LIMIT, FREE_SHIP, SHIP, PRODUCTS, iso, addDays, seedOrders, remaining, countItems, freeDates, pricing, calendarCells, validateOrder, escapeHtml, mount };
});
