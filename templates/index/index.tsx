// "Index" template (work plan 6.4, guide §12): two-column, recruiter-first, on ink. Home is one
// scroll with a sticky left column (name, headline, section nav with scrollspy, socials) and the
// sections on the right; every other page is one centred column in the same language.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import lib/content.ts.
// Each page renders inside `IndexRoot` (the `tpl-index` root; shell.tsx) and has one h1 and
// `<main id="main" tabIndex={-1}>` for the layout's skip link.
//
// Budget: both templates' Client Components and CSS ship on every route, so Index keeps to three
// small client leaves (client/: section nav, focus after navigation, contact form) and one small
// scoped stylesheet (index.css); everything else is Server Components and Tailwind utilities.

import type { TemplateModule } from "../types";
import About from "./pages/About";
import Archive from "./pages/Archive";
import CaseStudy from "./pages/CaseStudy";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Lab from "./pages/Lab";
import NotFound from "./pages/NotFound";
import Versions from "./pages/Versions";
import Work from "./pages/Work";

const index: TemplateModule = { Home, Work, CaseStudy, About, Contact, NotFound, Archive, Lab, Versions };

export default index;
