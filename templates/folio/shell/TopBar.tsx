import Link from "next/link";
import { CommandMenuButton, ShortcutHint } from "@/components/shared/CommandMenu";
import { RollLabel } from "../ui/Action";
import { MenuButton } from "./MenuTriggers";
import { ariaCurrent, SHELL_PAGES, type ShellPage } from "./pages";

// Top bar (guide §4.1): "© Code by Akash" left; phone shows only "Menu", md+ shows Work · About ·
// Contact with an ink dot under the current page or section (lime on paper is 1:1, 1.1
// decision). With a fine pointer, a small "⌘K" pill opens the command menu (work plan 6.2). It scrolls away with the page; the fixed burger takes over below the hero. On a
// fine pointer the logo rolls and its © turns, and a hovered link previews the dot (folio.css,
// .f-logo / .f-navlink).

type TopBarProps = {
  firstName: string;
  current?: ShellPage;
  section?: ShellPage;
};

export function TopBar({ firstName, current, section }: TopBarProps) {
  return (
    <header className="f-bar relative z-10 flex items-center justify-between gap-4">
      <Link
        href="/"
        aria-current={ariaCurrent("home", current, section)}
        className="f-logo f-roll-host -ml-2 inline-flex min-h-11 items-center gap-1 px-2 font-medium"
      >
        <span aria-hidden="true" className="f-logo-mark">
          ©
        </span>
        <RollLabel>Code by {firstName}</RollLabel>
        <span className="sr-only">, home</span>
      </Link>

      <div className="-mr-3 flex items-center gap-2">
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-2">
            {SHELL_PAGES.filter((p) => p.id !== "home").map((p) => (
              <li key={p.id}>
                <Link
                  href={p.href}
                  aria-current={ariaCurrent(p.id, current, section)}
                  className="f-navlink relative inline-flex min-h-11 items-center px-3 font-medium"
                >
                  {p.label}
                  <span aria-hidden="true" className="f-dot f-navlink-dot" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ⌘K (work plan 6.2): fine pointer only (folio.css); touch has the menu panel's entry. */}
        <CommandMenuButton aria-label="Open the command menu" className="f-cmdk-trigger">
          <ShortcutHint />
        </CommandMenuButton>

        <MenuButton className="md:hidden" />
      </div>
    </header>
  );
}
