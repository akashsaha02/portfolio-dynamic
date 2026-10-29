// "Terminal" template (docs/decisions/templates-v2.md): a developer's command line. Monospace on
// ink, prompt lines above real headings (`akash@portfolio:~$ cat about.md`, aria-hidden), the
// pages as commands (`cd work`, `cat about`, `./contact`), projects as `ls -l` rows, the version
// archive as `git log`, and a framed window from md that collapses to the full width on phone.
// Every word is real text from the first paint: nothing is typed out, the caret is the only
// motion and only blinks without prefers-reduced-motion.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import lib/content.ts.
// Each page renders inside `TerminalPage` (the `tpl-terminal` root; shell.tsx) and has one h1 and
// `<main id="main" tabIndex={-1}>` for the layout's skip link.
//
// Budget: every template's Client Components and CSS ship on every route, so Terminal has one
// client leaf of its own (client/ContactForm.tsx, "use no memo"), reuses Index's FocusMain and
// the shared CommandMenu, clock and realtime leaves, and one small scoped stylesheet
// (terminal.css). Everything else is Server Components and Tailwind utilities.

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

const terminal: TemplateModule = { Home, Work, CaseStudy, About, Contact, NotFound, Archive, Lab, Versions };

export default terminal;
