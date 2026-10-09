// Legacy "Editorial" template (tag v1-editorial). Wraps the original components exactly as they
// were. It predates the template contract, so it ignores its props and its components still read
// lib/content.ts directly. Kept for the version archive (work plan 6.3); don't build on it.

import { Mrs_Saint_Delafield } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/hero/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Experience } from "@/components/sections/Experience";
import { Research, Toolkit } from "@/components/sections/Research";
import { Contact } from "@/components/sections/Contact";
import type { TemplateModule } from "../types";

// Only used for the signature in the hero. Exposed as --font-signature (font-script utility).
const signature = Mrs_Saint_Delafield({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

function Home() {
  return (
    <div id="top" className={`${signature.variable} w-full max-w-full overflow-x-clip`}>
      <SmoothScroll />
      <Nav />
      <Hero />
      <main id="main" tabIndex={-1} className="outline-none">
        <Marquee />
        <About />
        <Work />
        <Experience />
        <Research />
        <Toolkit />
      </main>
      <Contact />
    </div>
  );
}

const editorial: TemplateModule = { Home };

export default editorial;
