export function SectionHeading({ id, eyebrow, title, lead, maxLead = 600 }: { id: string; eyebrow?: string; title: string; lead?: string; maxLead?: number }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {eyebrow && <span className="text-caption font-bold tracking-wide text-primary">{eyebrow}</span>}
      <h2 id={id} className="m-0 text-h2 font-extrabold leading-tight tracking-[-0.5px] text-ink">
        {title}
      </h2>
      {lead && (
        <p className="m-0 text-lead text-muted" style={{ maxWidth: maxLead }}>
          {lead}
        </p>
      )}
    </div>
  );
}
