export function SectionHeading({ id, title, lead, maxLead = 560 }: { id: string; title: string; lead?: string; maxLead?: number }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h2 id={id} className="m-0 text-h2 font-extrabold tracking-[-0.5px] text-ink">
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
