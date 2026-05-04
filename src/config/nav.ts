import { site } from './site';

export const primaryNav = [
  { label: 'Services', href: '#services', enabled: site.sections.services },
  { label: 'Stylists', href: '#stylists', enabled: site.sections.stylists },
  { label: 'Gallery', href: '#gallery', enabled: site.sections.gallery },
  { label: 'Reviews', href: '#reviews', enabled: site.sections.reviews },
  { label: 'Contact', href: '#contact', enabled: site.sections.contact },
].filter((item) => item.enabled);
