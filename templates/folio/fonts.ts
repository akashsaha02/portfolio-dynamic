import localFont from "next/font/local";

// The hero marquee's condensed cut (guide §3: wdth 75 uppercase only for the name; work plan 5.2,
// QA F-02). The site's text font (app/(site)/layout.tsx) is Mona Sans at wdth 100 only, a 40 KB
// variable-weight file instead of the 98 KB one that carried the whole wdth axis for this one line.
//
// This file is a static Mona Sans instance (wdth 75, wght 800) from the Google Fonts API, subset
// to what an uppercase name and its separators need: A–Z, digits, space, & ' ’ , - . · – —
// (6.4 KB). The unicode-range sends anything else (an accented capital from the CMS) to the next
// family in .type-marquee's stack, the text font at weight 800, so it degrades to a slightly wider
// glyph rather than a different typeface. No Arial fallback for the same reason.
//
// To rebuild it: GET https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@75,800&text=…
// with the characters above (Chrome user agent) and save the woff2 it links to.

export const monaCondensed = localFont({
  src: "./fonts/mona-sans-condensed-800.woff2",
  weight: "800",
  style: "normal",
  display: "swap",
  variable: "--font-mona-condensed",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+20, U+26-27, U+2C-2E, U+30-39, U+41-5A, U+A0, U+B7, U+2013-2014, U+2019",
    },
  ],
});
