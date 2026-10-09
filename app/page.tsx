import { Nav } from "@/components/Nav";
import { Hero } from "@/components/hero/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Experience } from "@/components/sections/Experience";
import { Research, Toolkit } from "@/components/sections/Research";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <div id="top" className="w-full max-w-full overflow-x-clip">
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
