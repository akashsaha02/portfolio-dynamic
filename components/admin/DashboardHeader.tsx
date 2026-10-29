// Above the dashboard widgets (`admin.components.beforeDashboard`): the page's one <h1>, which
// Payload's dashboard doesn't have, and today's date in Dhaka. No data queries: each widget below
// fetches its own. Rendered per request, so the greeting follows Akash's clock, not the server's
// (UTC on Vercel).

const TIME_ZONE = "Asia/Dhaka";
const hourFormat = new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE });
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD

function greeting(hour: number): string {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader() {
  const now = new Date();
  const hour = Number(hourFormat.format(now));

  return (
    <header className="ak-dash-head">
      <h1 className="ak-dash-head__title">{greeting(hour)}, Akash</h1>
      <p className="ak-dash-head__meta">
        <time dateTime={isoDate.format(now)}>{dateFormat.format(now)}</time>
        <span aria-hidden="true"> · </span>
        Dhaka
      </p>
    </header>
  );
}
