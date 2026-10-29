// "Brutal" template (templates v2, docs/decisions/templates-v2.md): neo-brutalism on the brand
// colours. Paper, ink and lime as flat blocks, thick ink borders, hard offset shadows, the name as
// a huge uppercase h1, a visible grid and sticker labels; static, with snappy press offsets only
// for a fine pointer without reduced motion.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import lib/content.ts.
// Each page renders inside `BrutalPage` (the `tpl-brutal` root; shell.tsx) and has one h1 and
// `<main id="main" tabIndex={-1}>` for the layout's skip link.
//
// Budget: every template's Client Components and CSS ship on every route, so Brutal has one
// client leaf of its own (client/ContactForm.tsx), reuses Index's FocusMain and the shared leaves
// (command menu, clock, copy button, realtime), and keeps its styles in one scoped stylesheet
// (brutal.css). Everything else is Server Components and Tailwind utilities.

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

const brutal: TemplateModule = { Home, Work, CaseStudy, About, Contact, NotFound, Archive, Lab, Versions };

export default brutal;
