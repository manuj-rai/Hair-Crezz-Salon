/**
 * Theme tokens. RGB triplets (no commas, no rgb()) so Tailwind's `<alpha-value>` works.
 * Override per-client by editing this file OR by setting VITE_THEME_* env vars
 * (handy for staging different brand demos from one repo).
 */

type RGB = `${number} ${number} ${number}`;

export type ThemeTokens = {
  bg: RGB;
  surface: RGB;
  border: RGB;
  ink: RGB;
  muted: RGB;
  primary: RGB;
  primaryFg: RGB;
  accent: RGB;
  accentFg: RGB;
  fontSans: string;
  fontDisplay: string;
  googleFontHref?: string;
};

// Default brand: warm cream + ink + soft gold. Luxe-but-modern, gender-neutral.
export const theme: ThemeTokens = {
  bg: (import.meta.env.VITE_THEME_BG as RGB) ?? '250 248 246',
  surface: (import.meta.env.VITE_THEME_SURFACE as RGB) ?? '255 255 255',
  border: (import.meta.env.VITE_THEME_BORDER as RGB) ?? '232 226 220',
  ink: (import.meta.env.VITE_THEME_INK as RGB) ?? '24 24 27',
  muted: (import.meta.env.VITE_THEME_MUTED as RGB) ?? '113 113 122',
  primary: (import.meta.env.VITE_THEME_PRIMARY as RGB) ?? '24 24 27',
  primaryFg: (import.meta.env.VITE_THEME_PRIMARY_FG as RGB) ?? '250 248 246',
  accent: (import.meta.env.VITE_THEME_ACCENT as RGB) ?? '184 134 71',
  accentFg: (import.meta.env.VITE_THEME_ACCENT_FG as RGB) ?? '24 24 27',
  fontSans:
    (import.meta.env.VITE_FONT_SANS as string) ??
    "'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontDisplay:
    (import.meta.env.VITE_FONT_DISPLAY as string) ??
    "'Playfair Display', 'Georgia', serif",
  googleFontHref:
    (import.meta.env.VITE_GOOGLE_FONT_HREF as string) ??
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap',
};

/** Apply theme tokens to :root as CSS custom properties + inject Google Font link. */
export function applyTheme(t: ThemeTokens = theme) {
  const root = document.documentElement;
  root.style.setProperty('--c-bg', t.bg);
  root.style.setProperty('--c-surface', t.surface);
  root.style.setProperty('--c-border', t.border);
  root.style.setProperty('--c-ink', t.ink);
  root.style.setProperty('--c-muted', t.muted);
  root.style.setProperty('--c-primary', t.primary);
  root.style.setProperty('--c-primary-fg', t.primaryFg);
  root.style.setProperty('--c-accent', t.accent);
  root.style.setProperty('--c-accent-fg', t.accentFg);
  root.style.setProperty('--font-sans', t.fontSans);
  root.style.setProperty('--font-display', t.fontDisplay);

  if (t.googleFontHref && !document.getElementById('app-google-font')) {
    const link = document.createElement('link');
    link.id = 'app-google-font';
    link.rel = 'stylesheet';
    link.href = t.googleFontHref;
    document.head.appendChild(link);
  }
}
