// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

const isDev = process.argv.includes("dev");

// https://astro.build/config
export default defineConfig({
  site: "https://mikatrolp.com",
  output: "static",
  // Pages live at /en/ and /de/. The adapter's CSP header routes match the exact path,
  // so the slash form must be the only one that is served.
  trailingSlash: "always",

  // The adapter is here for the contact endpoint (step 5) and cookieless analytics.
  // staticHeaders makes Astro send the CSP as a real header, which frame-ancestors needs.
  adapter: vercel({
    webAnalytics: { enabled: true },
    staticHeaders: true,
  }),

  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },

  // Fetched at build time and served from our own origin (CLAUDE.md §7: no third-party CDNs).
  fonts: [
    {
      name: "Newsreader",
      cssVariable: "--font-newsreader",
      provider: fontProviders.fontsource(),
      weights: [400],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      name: "Hanken Grotesk",
      cssVariable: "--font-hanken-grotesk",
      provider: fontProviders.fontsource(),
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],

  security: {
    // Astro adds script-src and style-src with hashes itself.
    // Off in dev: the dev server sends the policy without hashes, which blocks Vite's own styles.
    csp: !isDev && {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
      ],
    },
  },

  // No Markdown code blocks on this site; Shiki's inline styles would break the CSP.
  markdown: { syntaxHighlight: false },

  vite: {
    plugins: [tailwindcss()],
  },
});
