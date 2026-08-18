import { ChartBarSquareIcon, CubeIcon, QueueListIcon, Squares2X2Icon, UsersIcon } from "@heroicons/react/24/outline";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const navigation = [
  { to: "/admin", label: "Overview", icon: Squares2X2Icon, end: true },
  { to: "/admin/orders", label: "Orders", icon: QueueListIcon },
  { to: "/admin/products", label: "Products", icon: CubeIcon },
  { to: "/admin/categories", label: "Categories", icon: ChartBarSquareIcon },
  { to: "/admin/users", label: "Customers", icon: UsersIcon },
];

const AdminPanel = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 sm:py-8 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary-300">Admin workspace</p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">HygiaTrade admin</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Manage products, categories, customers, and order activity from one back-office workspace.
            </p>
          </div>

          <nav className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
