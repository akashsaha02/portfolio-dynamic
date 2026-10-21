// "Folio" template (guide §3–§6). Work plan 1.1: tokens, type and primitives (ui/, motion/,
// folio.css). Work plan 1.2: the global shell (shell/). Work plan 1.3: the Home sections
// (sections/). Work plan 1.5: the Work index and case studies (work/, work.css). Work plan 1.6:
// About and Contact (pages-about-contact.css, contact/). Work plan 1.7: page transitions
// (transitions.css, wired in FolioShell) and the 404 page. Phase 6: the project archive (6.1),
// the version archive (6.3), the ⌘K menu (6.2), annotations (6.6) and the page curtain (6.9).
// One file per page under pages/.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import
// lib/content.ts. Each page wraps its content in `<FolioShell {...props} current="…">` (which
// supplies the `tpl-folio` root, top bar, menu and footer) and renders
// `<main id="main" tabIndex={-1}>` inside it for the layout's skip link.

import type { TemplateModule } from "../types";
import About from "./pages/About";
import Archive from "./pages/Archive";
import CaseStudy from "./pages/CaseStudy";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Versions from "./pages/Versions";
import Work from "./pages/Work";

const folio: TemplateModule = { Home, Work, CaseStudy, About, Contact, NotFound, Archive, Versions };

export default folio;
