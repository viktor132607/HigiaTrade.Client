import { useEffect, useState, type ReactNode } from "react";
import {
  ChartBarSquareIcon,
  CubeIcon,
  DocumentArrowUpIcon,
  DocumentChartBarIcon,
  GlobeAltIcon,
  QueueListIcon,
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { loadPendingInvoiceFiles } from "./invoiceQueueStorage";

const INCOMPLETE_MARKER = "[INVOICE_IMPORT_INCOMPLETE]";

const navigation = [
  { to: "/admin", labelBg: "Табло", labelEn: "Overview", icon: Squares2X2Icon, end: true },
  { to: "/admin/orders", labelBg: "Поръчки", labelEn: "Orders", icon: QueueListIcon },
  { to: "/admin/products", labelBg: "Продукти", labelEn: "Products", icon: CubeIcon, notification: "products" as const },
  { to: "/admin/invoice-import", labelBg: "Фактури", labelEn: "Invoices", icon: DocumentArrowUpIcon, notification: "invoices" as const },
  { to: "/admin/categories", labelBg: "Категории", labelEn: "Categories", icon: ChartBarSquareIcon },
  { to: "/admin/brands", labelBg: "Марки", labelEn: "Brands", icon: TagIcon },
  { to: "/admin/users", labelBg: "Клиенти", labelEn: "Customers", icon: UsersIcon },
  { to: "/admin/reports", labelBg: "Справки", labelEn: "Reports", icon: DocumentChartBarIcon },
  { to: "/admin/seo", labelBg: "SEO", labelEn: "SEO", icon: GlobeAltIcon },
];

type AdminPanelProps = {
  children?: ReactNode;
};

type ProductLike = {
  description?: string | null;
  Description?: string | null;
};

const extractProducts = (value: unknown): ProductLike[] => {
  if (Array.isArray(value)) return value as ProductLike[];
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["items", "Items", "products", "Products", "data", "Data", "result", "Result"]) {
    const found = extractProducts(object[key]);
    if (found.length) return found;
  }
  return [];
};

const AdminPanel = ({ children }: AdminPanelProps) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [incompleteProducts, setIncompleteProducts] = useState(0);

  useEffect(() => {
    if (user?.role !== "Admin") return;
    let cancelled = false;

    const refreshNotifications = async () => {
      try {
        const pending = await loadPendingInvoiceFiles();
        if (!cancelled) setPendingInvoices(pending.length);
      } catch {
        if (!cancelled) setPendingInvoices(0);
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=200&IncludeInactive=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) return;
        const payload = await response.json().catch(() => null);
        const count = extractProducts(payload).filter((product) =>
          String(product.description ?? product.Description ?? "").includes(INCOMPLETE_MARKER)
        ).length;
        if (!cancelled) setIncompleteProducts(count);
      } catch {
        // Notification refresh is best-effort and must not block the admin panel.
      }
    };

    void refreshNotifications();
    const interval = window.setInterval(() => void refreshNotifications(), 10000);
    const onFocus = () => void refreshNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, user?.role]);

  if (user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  const hasNotification = (kind?: "products" | "invoices") =>
    kind === "products" ? incompleteProducts > 0 : kind === "invoices" ? pendingInvoices > 0 : false;

  const notificationTitle = (kind?: "products" | "invoices") => {
    if (kind === "products") return isBg ? `${incompleteProducts} продукта чакат допълване` : `${incompleteProducts} products need completion`;
    if (kind === "invoices") return isBg ? `${pendingInvoices} фактури чакат обработка` : `${pendingInvoices} invoices are pending`;
    return undefined;
  };

  return (
    <div className="admin-shell min-h-[calc(100vh-4rem)] bg-slate-100">
      <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-800 bg-slate-950 px-5 py-6 text-slate-100 lg:block">
          <nav className="sticky top-24 grid gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={notificationTitle(item.notification)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_25px_60px_-40px_rgba(255,255,255,0.9)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-none" />
                <span>{isBg ? item.labelBg : item.labelEn}</span>
                {hasNotification(item.notification) && (
                  <span className="ml-auto h-2.5 w-2.5 flex-none rounded-full bg-red-500 ring-2 ring-slate-950" aria-label={notificationTitle(item.notification)} />
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-3 py-4 pb-24 sm:px-5 sm:py-6 lg:px-8 lg:py-8 lg:pb-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <nav className="admin-mobile-nav fixed inset-x-0 bottom-0 z-[55] border-t border-slate-800 bg-slate-950/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 text-slate-100 shadow-[0_-12px_35px_rgba(15,23,42,0.25)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-full gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={notificationTitle(item.notification)}
              className={({ isActive }) =>
                `relative flex min-w-[74px] flex-none flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium leading-tight transition ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 active:bg-white/10 active:text-white"
                }`
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5 flex-none" />
                {hasNotification(item.notification) && (
                  <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-950" aria-label={notificationTitle(item.notification)} />
                )}
              </div>
              <span className="max-w-full text-center">{isBg ? item.labelBg : item.labelEn}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminPanel;
