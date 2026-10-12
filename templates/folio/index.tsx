// "Folio" template (guide §3–§6). Work plan 1.1: tokens, type and primitives (ui/, motion/,
// folio.css). Work plan 1.2: the global shell (shell/). One file per page under pages/.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import
// lib/content.ts. Each page wraps its content in `<FolioShell {...props} current="…">` (which
// supplies the `tpl-folio` root, top bar, menu and footer) and renders
// `<main id="main" tabIndex={-1}>` inside it for the layout's skip link.

import type { TemplateModule } from "../types";
import Home from "./pages/Home";

const folio: TemplateModule = { Home };

export default folio;
