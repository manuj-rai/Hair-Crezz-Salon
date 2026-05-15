const items = [
  { tag: 'Craft', title: 'Senior stylists only', body: 'Every chair is staffed by a stylist with 5+ years of professional experience.' },
  { tag: 'Products', title: 'Premium house only', body: "Wella, L'Oréal Professional, Olaplex and Dermalogica — never compromised." },
  { tag: 'Hygiene', title: 'Fresh for every guest', body: 'Single-use sheets, sterilised tools and a freshly cleaned chair for every client.' },
  { tag: 'Service', title: 'Bespoke consultations', body: 'Free 10-min consultation before any colour, chemical or bridal service.' },
];

export default function WhyUs() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="eyebrow">The house philosophy</p>
          <h2 className="h-display mt-4">
            A salon held to a <span className="italic text-accent">higher</span> standard.
          </h2>
        </div>

        <div className="rule mb-0" />
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-ink/10 border-b border-ink/10">
          {items.map((it, i) => (
            <li key={it.title} className="relative py-7 sm:py-9 md:px-7 lg:px-8 first:md:pl-0 last:md:pr-0">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="num-marker leading-none">0{i + 1}</span>
                <span className="eyebrow-ink">{it.tag}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-[26px] leading-tight tracking-tight">
                {it.title}
              </h3>
              <p className="mt-3 text-sm sm:text-[15px] text-muted leading-relaxed max-w-[34ch]">
                {it.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
