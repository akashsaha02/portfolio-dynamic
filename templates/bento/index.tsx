// "Bento" template (templates v2, docs/decisions/templates-v2.md): an asymmetric board of
// rounded cards on a soft page, light and dark from prefers-color-scheme. Home is one board
// (intro, availability, time, socials, the featured projects as the big cards, experience, "now",
// stack, research, contact); every other page is a column of cards in the same language.
//
// Contract: pages receive `{ content, settings }` (TemplateProps) and never import lib/content.ts.
// Each page renders inside `BentoPage` (the `tpl-bento` root; shell.tsx) and has one h1 and
// `<main id="main" tabIndex={-1}>` for the layout's skip link.
//
// Budget: every template's Client Components and CSS ship on every route, so Bento has one
// client leaf of its own (client/ContactForm.tsx, out of the React Compiler) and one small scoped
// stylesheet (bento.css); it reuses the shared leaves (clock, copy, ⌘K, realtime) and Index's
// FocusMain, and everything else is Server Components and Tailwind utilities. No animation library.

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

const bento: TemplateModule = { Home, Work, CaseStudy, About, Contact, NotFound, Archive, Lab, Versions };

export default bento;
