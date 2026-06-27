import { useEffect, useMemo, useState } from "react";

import { api } from "../../lib/api";

const TYPE_STYLES = {
  club: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-400",
  },
  project: {
    bar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-400",
  },
  workshop: {
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-400",
  },
};

const DEFAULT_TYPE_STYLE = {
  bar: "bg-slate-500",
  badge: "bg-slate-50 text-slate-700 ring-slate-200",
  dot: "bg-slate-400",
};

function formatType(type) {
  if (!type) {
    return "Other";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getTypeStyle(type) {
  return TYPE_STYLES[type] || DEFAULT_TYPE_STYLE;
}

function StatPill({ label, value, hint, accent = "from-blue-600 to-indigo-600" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-sm">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`} />
      <p className="text-sm font-medium text-blue-100">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-blue-100/80">{hint}</p> : null}
    </div>
  );
}

function BreakdownBar({ label, count, maxCount, barClassName }) {
  const width = maxCount > 0 ? Math.max(8, Math.round((count / maxCount) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">{count}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClassName}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-blue-950/5">
      <div className="h-44 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
      <div className="grid gap-4 p-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 border-t border-slate-100 p-6 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </section>
  );
}

export default function AdminAnalyticsWidget({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .getAdminAnalytics(token)
      .then((data) => {
        if (active) {
          setAnalytics(data);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Failed to load analytics");
          setAnalytics(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey, token]);

  const maxTypeCount = useMemo(
    () => Math.max(0, ...(analytics?.registrations_by_type?.map((item) => item.count) || [0])),
    [analytics],
  );

  const maxRegionCount = useMemo(
    () => Math.max(0, ...(analytics?.registrations_by_region?.map((item) => item.count) || [0])),
    [analytics],
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Analytics unavailable</p>
        <p className="mt-2 text-base">{error}</p>
        <button
          type="button"
          className="button button-secondary mt-4"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          Try again
        </button>
      </section>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalByType = analytics.registrations_by_type.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-blue-950/5">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1250ad] via-[#1b66d1] to-[#3b82f6] px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/90">
              Live from /admin/analytics
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Registration analytics
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/90">
              Real-time breakdown of sign-ups by type, region, and top-performing opportunities.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
            <StatPill
              label="Last 7 days"
              value={analytics.registrations_last_7_days}
              hint="Recent momentum"
              accent="from-sky-400 to-blue-500"
            />
            <StatPill
              label="Last 30 days"
              value={analytics.registrations_last_30_days}
              hint="Monthly activity"
              accent="from-indigo-400 to-violet-500"
            />
            <StatPill
              label="Avg per opportunity"
              value={analytics.average_registrations_per_opportunity.toFixed(1)}
              hint="Engagement rate"
              accent="from-cyan-400 to-teal-500"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">By category</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Registrations by type</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {totalByType} total
            </span>
          </div>

          {analytics.registrations_by_type.length > 0 ? (
            <div className="space-y-4">
              {analytics.registrations_by_type.map((item) => {
                const style = getTypeStyle(item.type);

                return (
                  <BreakdownBar
                    key={item.type}
                    label={formatType(item.type)}
                    count={item.count}
                    maxCount={maxTypeCount}
                    barClassName={style.bar}
                  />
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500">
              No registrations recorded yet.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {analytics.registrations_by_type.map((item) => {
              const style = getTypeStyle(item.type);

              return (
                <span
                  key={`badge-${item.type}`}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${style.badge}`}
                >
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  {formatType(item.type)} · {item.count}
                </span>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">By location</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Registrations by region</h3>
          </div>

          {analytics.registrations_by_region.length > 0 ? (
            <div className="space-y-4">
              {analytics.registrations_by_region.map((item) => (
                <BreakdownBar
                  key={item.region_name}
                  label={item.region_name}
                  count={item.count}
                  maxCount={maxRegionCount}
                  barClassName="bg-gradient-to-r from-[#1b66d1] to-[#3b82f6]"
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500">
              Regional data will appear once people start registering.
            </p>
          )}
        </article>
      </div>

      <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leaderboard</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Top opportunities</h3>
          </div>
          <span className="text-xs text-slate-500">Ranked by sign-ups</span>
        </div>

        {analytics.top_opportunities.length > 0 ? (
          <ol className="grid gap-3">
            {analytics.top_opportunities.map((item, index) => {
              const style = getTypeStyle(item.type);
              const rank = index + 1;

              return (
                <li
                  key={item.opportunity_id}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 transition hover:border-blue-200 hover:shadow-md hover:shadow-blue-950/5"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      rank === 1
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                        : rank === 2
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                          : rank === 3
                            ? "bg-gradient-to-br from-orange-300 to-amber-400 text-white"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {rank}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ring-1 ${style.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {formatType(item.type)}
                      </span>
                      <span>{item.region_name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-[#1b66d1]">{item.registrations_count}</p>
                    <p className="text-xs text-slate-500">sign-ups</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Top opportunities will show up here as registrations come in.
          </p>
        )}
      </div>
    </section>
  );
}
