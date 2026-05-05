import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/sections/Hero';
import Services from '../components/sections/Services';
import Stylists from '../components/sections/Stylists';
import Gallery from '../components/sections/Gallery';
import Testimonials from '../components/sections/Testimonials';
import WhyUs from '../components/sections/WhyUs';
import Contact from '../components/sections/Contact';
import CTA from '../components/sections/CTA';
import { site } from '../config/site';

export default function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = `${site.name} ${site.seo.titleSuffix}`;
  }, []);

  // Scroll to hash target after navigation. Retries because most sections
  // render async (data is fetched from the repo), so the target element may
  // not exist on first paint.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let cancelled = false;
    let attempts = 0;
    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempts++ < 30) setTimeout(tryScroll, 100);
    };
    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [hash]);

  return (
    <div className="min-h-full pb-14 lg:pb-0">
      <Header />
      <main>
        {site.sections.hero && <Hero />}
        {site.sections.whyUs && <WhyUs />}
        {site.sections.services && <Services />}
        {site.sections.stylists && <Stylists />}
        {site.sections.gallery && <Gallery />}
        {site.sections.reviews && <Testimonials />}
        {site.sections.cta && <CTA />}
        {site.sections.contact && <Contact />}
      </main>
      <Footer />
    </div>
  );
}
