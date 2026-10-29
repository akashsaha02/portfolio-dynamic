// Admin branding (work plan 2.6): the wordmark on the login page and at the top of the nav, the
// "A" mark in the app header, and a way back to the site under the login form. Server Components
// with no client JS; colours come from the admin tokens in app/(payload)/custom.scss, so the light
// and dark admin themes both work. The lime dot is the one accent: decorative, never text.

export function AdminLogo() {
  return (
    <span className="ak-logo">
      Akash
      <span className="ak-logo__dot" aria-hidden="true" />
      {/* Read as "Akash · Admin": the dot is drawn, the separator is spoken. */}
      <span className="ak-sr-only"> · </span>
      <span className="ak-logo__role">Admin</span>
    </span>
  );
}

export function AdminIcon() {
  return (
    <span className="ak-icon" role="img" aria-label="Akash · Admin">
      <span aria-hidden="true">A</span>
    </span>
  );
}

/** Top of the nav drawer (`admin.components.beforeNavLinks`): who this admin belongs to. */
export function NavBrand() {
  return (
    <div className="ak-nav-brand">
      <AdminLogo />
    </div>
  );
}

/** Under the login form (`admin.components.afterLogin`): a plain way back to the public site. */
export function LoginFooter() {
  return (
    <p className="ak-login-foot">
      <a href="/">← Back to the site</a>
    </p>
  );
}
