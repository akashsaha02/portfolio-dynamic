import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

// The element under every Folio button: a link when there is somewhere to go, a <button> when
// there is something to do. Internal paths ("/work") use next/link; anything else (mailto:, tel:,
// #hash, https://) is a plain <a>.

type Base = {
  className?: string;
  children: ReactNode;
};

export type ActionLinkProps = Base &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Base | "href"> & {
    href: string;
    /** Opens in a new tab, with rel=noopener and a screen-reader hint. */
    external?: boolean;
  };

export type ActionButtonProps = Base &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Base> & {
    href?: undefined;
    external?: undefined;
  };

export type ActionProps = ActionLinkProps | ActionButtonProps;

function isInternal(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function Action(props: ActionProps) {
  if (props.href !== undefined) {
    const { href, external, children, ...rest } = props;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    if (isInternal(href)) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  const { type = "button", children, ...rest } = props;
  return (
    <button type={type} {...rest}>
      {children}
    </button>
  );
}

/** A label that rolls up on hover (fine pointer, motion allowed). The copy is aria-hidden. */
export function RollLabel({ children }: { children: ReactNode }) {
  return (
    <span className="f-roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
