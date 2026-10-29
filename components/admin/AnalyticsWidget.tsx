import type { WidgetServerProps } from "payload";
import { getAnalytics, type AnalyticsSummary, type Totals } from "@/lib/analytics";

/**
 * Dashboard widget: page views and visitors from Vercel Web Analytics (work plan 6.8). A Server
 * Component: lib/analytics.ts fetches on the server with the token and caches for an hour; only
 * the numbers reach the page. Renders for the signed-in admin only, and never throws.
 */
export async function AnalyticsWidget({ req }: WidgetServerProps) {
  if (req.user?.collection !== "users") return null;
  const result = await getAnalytics();

  return (
    <section className="card ak-widget" aria-labelledby="ak-analytics-title">
      <header className="ak-widget__head">
        <h2 id="ak-analytics-title" className="ak-widget__title">
          Visitors
        </h2>
        <span className="ak-badge">Production</span>
      </header>
      {result.status === "ok" ? (
        <Summary data={result.data} />
      ) : result.status === "not-configured" ? (
        <div className="ak-empty">
          <p className="ak-empty__title">Not set up yet</p>
          <p className="ak-empty__body">
            Add a read-only <code>VERCEL_ANALYTICS_TOKEN</code> in Vercel (docs/ops/vercel-setup.md). Page views and
            visitors then show here, updated hourly.
          </p>
        </div>
      ) : (
        <div className="ak-empty" data-tone="error">
          <p className="ak-empty__title">Analytics unavailable</p>
          <p className="ak-empty__body">{result.message}</p>
        </div>
      )}
    </section>
  );
}

const number = new Intl.NumberFormat("en");
const day = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });

function Stat({ label, totals }: { label: string; totals: Totals }) {
  return (
    <div className="ak-stat">
      <dt className="ak-stat__label">{label}</dt>
      <dd className="ak-stat__value">
        {number.format(totals.pageviews)} <span className="ak-stat__unit">views</span>
      </dd>
      <dd className="ak-stat__sub">{number.format(totals.visitors)} visitors</dd>
    </div>
  );
}

function Summary({ data }: { data: AnalyticsSummary }) {
  const max = Math.max(1, ...data.daily.map((d) => d.pageviews));
  const peak = data.daily.reduce((best, d) => (d.pageviews > best.pageviews ? d : best), data.daily[0]);
  const chartLabel =
    `Daily page views, last 30 days. Peak ${number.format(peak.pageviews)} on ${day.format(new Date(peak.date))}; ` +
    `today ${number.format(data.daily.at(-1)?.pageviews ?? 0)}.`;
  const barWidth = 100 / data.daily.length;

  return (
    <>
      <dl className="ak-stats">
        <Stat label="Last 7 days" totals={data.last7} />
        <Stat label="Last 30 days" totals={data.last30} />
      </dl>

      <svg className="ak-spark" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={chartLabel}>
        {data.daily.map((d, i) => {
          const h = d.pageviews === 0 ? 0.5 : Math.max(1.5, (d.pageviews / max) * 32);
          return (
            <rect key={d.date} x={i * barWidth + barWidth * 0.15} y={32 - h} width={barWidth * 0.7} height={h} rx={0.4}>
              <title>{`${day.format(new Date(d.date))}: ${number.format(d.pageviews)} views, ${number.format(d.visitors)} visitors`}</title>
            </rect>
          );
        })}
      </svg>

      {data.topPages.length > 0 ? (
        <div>
          <h3 className="ak-widget__subtitle">Top pages, 30 days</h3>
          <ol className="ak-top">
            {data.topPages.map((p) => (
              <li key={p.path} className="ak-top__row">
                <span className="ak-top__path">{p.path}</span>
                <span className="ak-top__count">{number.format(p.pageviews)} views</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="ak-widget__empty">No page views in the last 30 days yet.</p>
      )}

      <p className="ak-widget__note">
        Updated hourly · as of <time dateTime={data.fetchedAt}>{time.format(new Date(data.fetchedAt))}</time> (Dhaka)
      </p>
    </>
  );
}
