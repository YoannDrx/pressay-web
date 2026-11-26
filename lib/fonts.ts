import { Newsreader, Schibsted_Grotesk } from "next/font/google";

/**
 * Public site typefaces, self-hosted by next/font at build time (no request to
 * Google from the visitor, so the CSP's font-src 'self' holds).
 * Schibsted Grotesk carries the interface and headings; Newsreader is reserved
 * for dictated text, so the voice and what it writes read differently.
 */
export const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const serif = Newsreader({
  subsets: ["latin"],
  // One static weight keeps the file small: it only sets dictated text.
  weight: "400",
  display: "swap",
  variable: "--font-serif",
  preload: false,
});

export const siteFontClasses = `${sans.variable} ${serif.variable}`;
