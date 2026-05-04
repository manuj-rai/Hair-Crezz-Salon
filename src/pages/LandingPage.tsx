import { useEffect } from 'react';
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
  useEffect(() => {
    document.title = `${site.name} ${site.seo.titleSuffix}`;
  }, []);

  return (
    <div className="min-h-full pb-24 lg:pb-0">
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
