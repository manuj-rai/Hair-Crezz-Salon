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
    <div className="min-h-full">
      <Header />
      <main>
        <Hero />
        <WhyUs />
        <Services />
        <Stylists />
        <Gallery />
        <Testimonials />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
