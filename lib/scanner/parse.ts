import * as cheerio from "cheerio";
import type { FormField, FormInfo, PageData } from "./types";

const CONTACT_HINT = /(phone|tel|mobile|cell|mail|טלפון|נייד|פלאפון|מייל|אימייל|דוא"?ל|וואטסאפ|whatsapp)/i;
const MAX_SCRIPT_CHARS = 200_000;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function pageLabel(url: string, title: string, isHome: boolean): string {
  if (isHome) return "דף הבית";
  const t = clean(title).split(/[|\-–—]/)[0]?.trim();
  if (t && t.length <= 40) return `עמוד "${t}"`;
  try {
    return `העמוד ${decodeURIComponent(new URL(url).pathname)}`;
  } catch {
    return "עמוד באתר";
  }
}

/** מפענח דף HTML לנתונים שהחוקים צריכים. פונקציה טהורה — נוח לבדיקות עם fixtures. */
export function parsePage(html: string, url: string, isHome: boolean): PageData {
  const $ = cheerio.load(html);
  const title = $("title").first().text();

  const scriptParts: string[] = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) scriptParts.push(src);
    else scriptParts.push($(el).text().slice(0, 20_000));
  });
  $("noscript").each((_, el) => {
    scriptParts.push($(el).html() ?? "");
  });
  const scripts = scriptParts.join("\n").slice(0, MAX_SCRIPT_CHARS);

  const links: PageData["links"] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    let abs = href;
    try {
      abs = new URL(href, url).toString();
    } catch {
      /* ignore */
    }
    links.push({ href: abs, text: clean($(el).text() || $(el).attr("aria-label") || $(el).attr("title") || "") });
  });

  let imagesWithoutAlt = 0;
  let imageCount = 0;
  $("img").each((_, el) => {
    const $el = $(el);
    if ($el.attr("aria-hidden") === "true" || $el.attr("role") === "presentation") return;
    const w = Number($el.attr("width"));
    const h = Number($el.attr("height"));
    if ((w > 0 && w <= 2) || (h > 0 && h <= 2)) return; // פיקסלי מעקב
    imageCount++;
    if ($el.attr("alt") === undefined) imagesWithoutAlt++;
  });

  const forms: FormInfo[] = [];
  $("form").each((i, formEl) => {
    const $form = $(formEl);
    const fields: FormField[] = [];
    const checkboxes: FormInfo["checkboxes"] = [];

    $form.find("input, textarea, select").each((_, el) => {
      const $el = $(el);
      const tag = el.tagName.toLowerCase();
      const type = (($el.attr("type") ?? (tag === "input" ? "text" : tag)) || "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].includes(type)) return;
      const id = $el.attr("id");
      const labelFor = id ? $(`label[for="${id.replace(/"/g, '\\"')}"]`).first() : null;
      const wrapping = $el.closest("label");
      const labelText = clean((labelFor?.length ? labelFor.text() : "") || (wrapping.length ? wrapping.text() : ""));
      const hasLabel = Boolean(labelText || $el.attr("aria-label") || $el.attr("aria-labelledby") || $el.attr("title"));

      if (type === "checkbox") {
        // הטקסט של תיבת סימון: התווית, או הטקסט של ההורה הקרוב
        const text = labelText || clean($el.parent().text());
        checkboxes.push({ text, checked: $el.attr("checked") !== undefined });
        return;
      }
      if (type === "radio") return;
      const hint = [$el.attr("name"), id, $el.attr("placeholder"), $el.attr("autocomplete"), labelText].filter(Boolean).join(" ");
      fields.push({
        tag,
        type,
        name: clean($el.attr("placeholder") || labelText || $el.attr("name") || type),
        hint,
        hasLabel,
        isContact: type === "email" || type === "tel" || CONTACT_HINT.test(hint),
      });
    });

    const heading = clean($form.find("h1,h2,h3,h4,legend").first().text()) || clean($form.prevAll("h1,h2,h3,h4").first().text());
    const submit = clean($form.find('button, input[type="submit"]').last().text() || $form.find('input[type="submit"]').attr("value") || "");
    const name = heading || submit;
    forms.push({ label: name ? `טופס "${name.slice(0, 40)}"` : `טופס ${i + 1}`, fields, checkboxes });
  });

  $("script, style, noscript, template, svg").remove();
  const text = $("body")
    .text()
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

  return { url, label: pageLabel(url, title, isHome), text, links, forms, imagesWithoutAlt, imageCount, scripts };
}
