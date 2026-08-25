import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, GlobeAltIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type SeoIssue = {
  entityType: string;
  entityId: string;
  entityName: string;
  severity: "error" | "warning";
  code: string;
  message: string;
};

type SeoAudit = {
  generatedAt: string;
  lastCatalogChangeUtc?: string | null;
  summary: {
    activeProducts: number;
    categories: number;
    brands: number;
    estimatedIndexableUrls: number;
    errors: number;
    warnings: number;
  };
  regeneration: {
    isConfigured: boolean;
    lastRequestedAt?: string | null;
    lastTriggeredAt?: string | null;
    lastReason?: string | null;
    lastError?: string | null;
    delaySeconds: number;
  };
  feeds: Record<string, string>;
  issues: SeoIssue[];
};

type SeoManifest = {
  generatedAt?: string;
  products?: number;
  categories?: number;
  brands?: number;
  generatedRoutes?: number;
  productFeedItems?: number;
  images?: number;
};

const formatDate = (value?: string | null, language = "bg") => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(language === "bg" ? "bg-BG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const SeoDashboard = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [manifest, setManifest] = useState<SeoManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "error" | "warning">("all");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [auditResponse, manifestResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Seo/audit`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/seo-manifest.json?ts=${Date.now()}`, { cache: "no-store" }),
      ]);

      if (!auditResponse.ok) throw new Error(isBg ? "SEO одитът не можа да бъде зареден." : "SEO audit could not be loaded.");
      setAudit(await auditResponse.json());
      setManifest(manifestResponse.ok ? await manifestResponse.json() : null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isBg ? "Грешка при SEO одита." : "SEO audit failed.");
    } finally {
      setLoading(false);
    }
  }, [isBg, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const regenerate = async () => {
    if (!token) return;
    try {
      setRegenerating(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Seo/regenerate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || (isBg ? "SEO регенерацията не можа да бъде стартирана." : "SEO regeneration could not be started."));
      toast.success(isBg ? "SEO build-ът е задействан." : "SEO build was triggered.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isBg ? "Грешка при SEO регенерацията." : "SEO regeneration failed.");
    } finally {
      setRegenerating(false);
    }
  };

  const visibleIssues = useMemo(
    () => audit?.issues.filter((issue) => filter === "all" || issue.severity === filter) ?? [],
    [audit, filter]
  );

  if (loading && !audit) {
    return <div className="flex min-h-72 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /></div>;
  }

  if (!audit) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{isBg ? "SEO одитът не е наличен." : "SEO audit is unavailable."}</div>;
  }

  const cards = [
    [isBg ? "Активни продукти" : "Active products", audit.summary.activeProducts],
    [isBg ? "Категории" : "Categories", audit.summary.categories],
    [isBg ? "Марки" : "Brands", audit.summary.brands],
    [isBg ? "Индексируеми URL-и" : "Indexable URLs", audit.summary.estimatedIndexableUrls],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-[#148f7c]"><GlobeAltIcon className="h-6 w-6" /><span className="text-xs font-black uppercase tracking-[0.2em]">SEO</span></div>
          <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{isBg ? "SEO и AI видимост" : "SEO & AI visibility"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{isBg ? "Автоматичен одит на каталога, sitemap, product feeds, изображения и build-базираното SEO." : "Automatic catalogue audit for sitemap, product feeds, images and build-generated SEO."}</p>
        </div>
        <button type="button" onClick={regenerate} disabled={regenerating || !audit.regeneration.isConfigured} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
          <ArrowPathIcon className={`h-5 w-5 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? (isBg ? "Стартиране..." : "Starting...") : (isBg ? "Регенерирай SEO" : "Regenerate SEO")}
        </button>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="text-2xl font-black text-slate-950 sm:text-3xl">{value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">{isBg ? "Автоматична регенерация" : "Automatic regeneration"}</h2>
          <div className="mt-4 flex items-start gap-3">
            {audit.regeneration.isConfigured ? <CheckCircleIcon className="h-6 w-6 flex-none text-emerald-600" /> : <XCircleIcon className="h-6 w-6 flex-none text-rose-600" />}
            <div>
              <div className="font-bold text-slate-900">{audit.regeneration.isConfigured ? (isBg ? "Активна" : "Enabled") : (isBg ? "Не е конфигурирана" : "Not configured")}</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{audit.regeneration.isConfigured ? (isBg ? `Промените по продукт, категория или марка се групират за ${audit.regeneration.delaySeconds} сек. и стартират нов SEO build.` : `Product, category and brand changes are debounced for ${audit.regeneration.delaySeconds}s and trigger a new SEO build.`) : (isBg ? "Добави Render Deploy Hook URL в Seo__DeployHookUrl на server service." : "Set the Render Deploy Hook URL in Seo__DeployHookUrl on the server service.")}</p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">{isBg ? "Последна промяна" : "Last catalogue change"}</dt><dd className="mt-1 font-semibold text-slate-900">{formatDate(audit.lastCatalogChangeUtc, language)}</dd></div>
            <div><dt className="text-slate-500">{isBg ? "Последен SEO build" : "Last SEO build"}</dt><dd className="mt-1 font-semibold text-slate-900">{formatDate(manifest?.generatedAt, language)}</dd></div>
            <div><dt className="text-slate-500">{isBg ? "Последно задействане" : "Last trigger"}</dt><dd className="mt-1 font-semibold text-slate-900">{formatDate(audit.regeneration.lastTriggeredAt, language)}</dd></div>
            <div><dt className="text-slate-500">{isBg ? "Причина" : "Reason"}</dt><dd className="mt-1 font-semibold text-slate-900">{audit.regeneration.lastReason || "—"}</dd></div>
          </dl>
          {audit.regeneration.lastError ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{audit.regeneration.lastError}</div> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">{isBg ? "SEO файлове и feeds" : "SEO files & feeds"}</h2>
          <div className="mt-4 grid gap-2">
            {Object.entries(audit.feeds).map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#148f7c] hover:bg-slate-50">
                <span>{name}</span><span className="truncate text-xs font-normal text-slate-400">{url.replace("https://higiatrade.com/", "")}</span>
              </a>
            ))}
          </div>
          {manifest ? <p className="mt-4 text-xs text-slate-500">{isBg ? `Последният build съдържа ${manifest.generatedRoutes ?? "—"} маршрута, ${manifest.productFeedItems ?? manifest.products ?? "—"} feed продукта и ${manifest.images ?? "—"} изображения.` : `Latest build contains ${manifest.generatedRoutes ?? "—"} routes, ${manifest.productFeedItems ?? manifest.products ?? "—"} feed products and ${manifest.images ?? "—"} images.`}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">{isBg ? "SEO проблеми" : "SEO issues"}</h2>
            <p className="mt-1 text-sm text-slate-500">{audit.summary.errors} {isBg ? "грешки" : "errors"} · {audit.summary.warnings} {isBg ? "предупреждения" : "warnings"}</p>
          </div>
          <div className="flex gap-2">
            {(["all", "error", "warning"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>
                {value === "all" ? (isBg ? "Всички" : "All") : value === "error" ? (isBg ? "Грешки" : "Errors") : (isBg ? "Предупреждения" : "Warnings")}
              </button>
            ))}
          </div>
        </div>

        {visibleIssues.length === 0 ? (
          <div className="flex items-center gap-3 p-6 text-sm text-emerald-700"><CheckCircleIcon className="h-6 w-6" />{isBg ? "Няма проблеми в този филтър." : "No issues in this filter."}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleIssues.map((issue, index) => (
              <div key={`${issue.entityType}-${issue.entityId}-${issue.code}-${index}`} className="grid gap-2 p-4 sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                {issue.severity === "error" ? <XCircleIcon className="h-5 w-5 text-rose-600" /> : <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />}
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{issue.entityName}</div>
                  <div className="mt-1 text-sm text-slate-600">{issue.message}</div>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{issue.entityType}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SeoDashboard;
