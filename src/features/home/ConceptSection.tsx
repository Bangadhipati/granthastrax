export function ConceptSection() {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-6">
      <div className="hairline-grid rounded-3xl border border-border p-8 sm:p-14">
        <div className="grid gap-10 sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-gold">The idea</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Word-simple on the surface. LaTeX-exact underneath.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Most researchers think in prose and formatting, not in markup. GrantAstraX lets you
              write in a familiar rich-text preview while clean, submission-ready LaTeX is
              generated beside you — then exports to PDF, DOCX or TeX in a click.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-6">
            {[
              ["4", "Focused desks"],
              ["12+", "Export formats"],
              ["1-click", "LaTeX generation"],
              ["3D", "Book preview"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-3xl text-gold">{value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
