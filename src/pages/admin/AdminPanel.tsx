import type { ReactNode } from "react";
import {
  ChartBarSquareIcon,
  CubeIcon,
  DocumentArrowUpIcon,
  DocumentChartBarIcon,
  QueueListIcon,
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const navigation = [
  { to: "/admin", labelBg: "Табло", labelEn: "Overview", icon: Squares2X2Icon, end: true },
  { to: "/admin/orders", labelBg: "Поръчки", labelEn: "Orders", icon: QueueListIcon },
  { to: "/admin/products", labelBg: "Продукти", labelEn: "Products", icon: CubeIcon },
  { to: "/admin/invoice-import", labelBg: "Фактури", labelEn: "Invoices", icon: DocumentArrowUpIcon },
  { to: "/admin/categories", labelBg: "Категории", labelEn: "Categories", icon: ChartBarSquareIcon },
  { to: "/admin/brands", labelBg: "Марки", labelEn: "Brands", icon: TagIcon },
  { to: "/admin/users", labelBg: "Клиенти", labelEn: "Customers", icon: UsersIcon },
  { to: "/admin/reports", labelBg: "Справки", labelEn: "Reports", icon: DocumentChartBarIcon },
];

type AdminPanelProps = {
  children?: ReactNode;
};

const AdminPanel = ({ children }: AdminPanelProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  if (user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

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
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_25px_60px_-40px_rgba(255,255,255,0.9)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-none" />
                {isBg ? item.labelBg : item.labelEn}
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
              className={({ isActive }) =>
                `flex min-w-[74px] flex-none flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium leading-tight transition ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 active:bg-white/10 active:text-white"
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-none" />
              <span className="max-w-full text-center">{isBg ? item.labelBg : item.labelEn}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminPanel;
