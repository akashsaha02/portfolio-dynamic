// "Folio" template (guide §3–§6). Work plan 1.1: tokens, type and primitives (ui/, motion/,
// folio.css), shown on pages/Home.tsx. One file per page under pages/.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import
// lib/content.ts; each page renders `<main id="main" tabIndex={-1}>` for the layout's skip link.
// Every page's root carries `tpl-folio` so Folio's scoped CSS (folio.css) applies.

import type { TemplateModule } from "../types";
import Home from "./pages/Home";

const folio: TemplateModule = { Home };

export default folio;
