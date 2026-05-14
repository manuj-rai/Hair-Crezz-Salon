import { Award, Leaf, ShieldCheck, Sparkles } from 'lucide-react';

const items = [
  { icon: Award, title: 'Senior stylists only', body: 'Every chair is staffed by a stylist with 5+ years of professional experience.' },
  { icon: Leaf, title: 'Premium products', body: 'Wella, L\'Oreal Professional, Olaplex and Dermalogica — never compromised.' },
  { icon: ShieldCheck, title: 'Hygiene-first', body: 'Single-use sheets, sterilised tools and a freshly cleaned chair for every client.' },
  { icon: Sparkles, title: 'Bespoke consults', body: 'Free 10-min consultation before any colour, chemical or bridal service.' },
];

export default function WhyUs() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((it) => (
            <div key={it.title} className="card p-4 sm:p-6 hover:border-accent transition">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3 sm:mb-4">
                <it.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">{it.title}</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
