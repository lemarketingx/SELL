export function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      dir="ltr"
      className="m-0 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-ink px-5 py-[18px] text-left font-mono text-[15px] leading-[1.7] text-white"
    >
      <code>{code}</code>
    </pre>
  );
}
