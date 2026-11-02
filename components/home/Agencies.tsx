import { Check } from "lucide-react";

const POINTS = [
  "טבלה אחת לכל האתרים, עם ציון ומספר בעיות",
  "דוח ממותג בשם המשרד שלכם",
  "סריקה חוזרת והתראה כשמשהו באתר משתנה",
];

// שורות לדוגמה בלבד (מוקאפ), כמו בקובץ העיצוב.
const ROWS = [
  { site: "client-one.co.il", score: 48, status: "דורש טיפול", tone: "text-sev-high" },
  { site: "client-two.co.il", score: 71, status: "בטיפול", tone: "text-sev-mid" },
  { site: "client-three.co.il", score: 93, status: "ללא ממצא חמור", tone: "text-sev-low" },
];

export function Agencies() {
  return (
    <section id="agencies" aria-labelledby="agencies-title" className="scroll-mt-4 bg-ink px-6 py-section text-white">
      <div className="mx-auto flex max-w-site flex-wrap items-center gap-14">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <span className="self-start rounded-pill bg-white/10 px-3.5 py-1.5 text-small font-semibold text-on-dark-accent">
            למשרדי דיגיטל ובוני אתרים
          </span>
          <h2 id="agencies-title" className="m-0 text-h2 font-extrabold leading-[1.2] tracking-[-0.5px]">
            סורקים את כל האתרים של הלקוחות מלוח אחד, עם דוח ממותג
          </h2>
          <p className="m-0 text-lead text-on-dark-muted">
            במקום לבדוק כל אתר בנפרד, רואים במקום אחד איפה יש בעיות ושולחים ללקוח דוח עם הלוגו שלכם.
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-white">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2.5">
                <Check aria-hidden size={22} strokeWidth={2.2} className="mt-[3px] shrink-0 text-on-dark-accent" />
                {p}
              </li>
            ))}
          </ul>
          <p className="m-0 self-start rounded-pill bg-white/10 px-4 py-2 font-semibold text-white">המסלול למשרדים יושק בקרוב</p>
        </div>

        <section
          aria-label="מוקאפ של לוח ניהול"
          className="flex min-w-0 flex-[999_1_520px] flex-col gap-3 rounded-panel bg-bg p-[22px] text-text"
        >
          <div className="flex items-center justify-between gap-3 px-1.5 pb-2.5 pt-1">
            <span className="text-lg font-bold">אתרי לקוחות</span>
            <span aria-hidden className="rounded-[10px] bg-primary px-3.5 py-1.5 text-caption font-semibold text-white">
              + הוסף אתר
            </span>
          </div>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-border text-caption font-semibold text-muted">
                <th scope="col" className="px-3 py-2 text-start font-semibold">
                  אתר
                </th>
                <th scope="col" className="px-3 py-2 text-start font-semibold">
                  ציון
                </th>
                <th scope="col" className="px-3 py-2 text-start font-semibold">
                  סטטוס
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.site} className={i % 2 === 1 ? "bg-surface" : undefined}>
                  <td dir="ltr" className="w-1/2 rounded-s-[10px] px-3 py-2.5 text-right">
                    {r.site}
                  </td>
                  <td className="px-3 py-2.5 font-bold">{r.score}</td>
                  <td className={`rounded-e-[10px] px-3 py-2.5 font-semibold ${r.tone}`}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
