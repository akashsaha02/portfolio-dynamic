// Admin branding (work plan 2.6): replaces Payload's logo on the login page and the nav icon.
// Server Components with no client JS; colours come from Payload's theme variables so light and
// dark admin themes both work.

export function AdminLogo() {
  return (
    <span className="ak-logo">
      Akash <span aria-hidden="true">·</span> Admin
    </span>
  );
}

export function AdminIcon() {
  return (
    <span className="ak-icon" role="img" aria-label="Akash · Admin">
      A
    </span>
  );
}
