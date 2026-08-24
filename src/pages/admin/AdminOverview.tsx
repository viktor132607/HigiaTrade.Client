import { useEffect, useMemo, useState } from "react";
import { BellAlertIcon, CubeTransparentIcon, ShoppingBagIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { OrderStatus } from "../../enums/OrderStatus";
import { formatCurrency } from "../../utils/currency";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Category {
  id: string;
}

interface Product {
  id: string;
  title: string;
  quantity: number;
  categoryName?: string;
  discountedPrice?: number;
  regularPrice: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  title: string;
}

interface Order {
  id: string;
  createdOn: string;
  orderTotalPrice: number;
  status: OrderStatus;
  names?: string;
  items: OrderItem[];
}

interface User {
  id: string;
}

const LOW_STOCK_THRESHOLD = 10;

const getOrderStatusText = (status: OrderStatus, isBg: boolean) => {
  switch (status) {
    case OrderStatus.Created:
      return isBg ? "Създадена" : "Created";
    case OrderStatus.PendingVerification:
      return isBg ? "Чака потвърждение" : "Pending verification";
    case OrderStatus.Verified:
      return isBg ? "Потвърдена" : "Verified";
    case OrderStatus.Processing:
      return isBg ? "Обработва се" : "Processing";
    case OrderStatus.Shipped:
      return isBg ? "Изпратена" : "Shipped";
    case OrderStatus.Delivered:
      return isBg ? "Доставена" : "Delivered";
    case OrderStatus.Cancelled:
      return isBg ? "Отказана" : "Cancelled";
    default:
      return isBg ? "Неизвестен статус" : "Unknown status";
  }
};

const AdminOverview = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [productsResponse, ordersResponse, categoriesResponse, usersResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageSize=100&PageNumber=1`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?PageSize=100&PageNumber=1`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const productsData = productsResponse.ok ? (await productsResponse.json()) as { items: Product[] } : { items: [] };
        const ordersData = ordersResponse.ok ? (await ordersResponse.json()) as { items: Order[] } : { items: [] };
        const categoriesData = categoriesResponse.ok ? (await categoriesResponse.json()) as Category[] : [];
        const usersData = usersResponse.ok ? (await usersResponse.json()) as User[] : [];

        setProducts(productsData.items ?? []);
        setOrders(ordersData.items ?? []);
        setCategories(categoriesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Admin overview load failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOverviewData();
  }, [token]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.quantity <= LOW_STOCK_THRESHOLD),
    [products]
  );

  const startOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const startOfWeek = useMemo(() => {
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);
    return weekStart;
  }, [startOfToday]);

  const ordersToday = useMemo(
    () => orders.filter((order) => new Date(order.createdOn) >= startOfToday),
    [orders, startOfToday],
  );

  const weeklyRevenue = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            new Date(order.createdOn) >= startOfWeek &&
            order.status !== OrderStatus.Cancelled &&
            order.status !== OrderStatus.Created,
        )
        .reduce((sum, order) => sum + order.orderTotalPrice, 0),
    [orders, startOfWeek],
  );

  const activeCustomers = useMemo(
    () => new Set(orders.map((order) => order.names).filter(Boolean)).size,
    [orders],
  );

  const orderStatusGroups = useMemo(() => {
    const counts = new Map<OrderStatus, number>();
    orders.forEach((order) => {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((left, right) => left[0] - right[0]);
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((left, right) => new Date(right.createdOn).getTime() - new Date(left.createdOn).getTime())
        .slice(0, 5),
    [orders]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  const pendingCount = orders.filter((order) => order.status === OrderStatus.PendingVerification).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">
          {isBg ? "Преглед на продажбите" : "Sales overview"}
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isBg ? "Оперативен преглед" : "Operational overview"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {isBg
                ? "Днешните поръчки, текущите наличности и последното клиентско търсене в каталога."
                : "Today’s orders, current stock levels and the latest customer activity in the catalog."}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {isBg
              ? `${lowStockProducts.length} продукта се нуждаят от зареждане`
              : `${lowStockProducts.length} products need restocking`}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {[
          {
            label: isBg ? "Поръчки днес" : "Orders today",
            value: ordersToday.length,
            detail: isBg ? `${pendingCount} чакат преглед` : `${pendingCount} awaiting review`,
            icon: ShoppingBagIcon,
          },
          {
            label: isBg ? "Оборот тази седмица" : "Revenue this week",
            value: formatCurrency(weeklyRevenue),
            detail: isBg ? "Последните 7 дни без отказаните поръчки" : "Last 7 days excluding cancelled orders",
            icon: BellAlertIcon,
          },
          {
            label: isBg ? "Ниски наличности" : "Low stock",
            value: lowStockProducts.length,
            detail: isBg ? `Под ${LOW_STOCK_THRESHOLD} броя` : `Under ${LOW_STOCK_THRESHOLD} units`,
            icon: CubeTransparentIcon,
          },
          {
            label: isBg ? "Активни клиенти" : "Active customers",
            value: activeCustomers,
            detail: isBg
              ? `${users.length} акаунта, ${categories.length} категории`
              : `${users.length} accounts, ${categories.length} categories`,
            icon: UserGroupIcon,
          },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <item.icon className="h-8 w-8 flex-none rounded-2xl bg-primary-50 p-2 text-primary-600" />
            </div>
            <p className="mt-6 font-display text-3xl font-bold tracking-tight text-slate-950 sm:mt-8 sm:text-4xl">{item.value}</p>
            <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 sm:tracking-[0.24em]">
            {isBg ? "Поръчки" : "Orders"}
          </p>
          <h3 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl">
            {isBg ? "Разпределение по статус" : "Status distribution"}
          </h3>

          <div className="mt-6 space-y-4 sm:mt-8">
            {orderStatusGroups.map(([status, count]) => {
              const percentage = orders.length === 0 ? 0 : (count / orders.length) * 100;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-700">{getOrderStatusText(status, isBg)}</span>
                    <span className="text-slate-500">
                      {isBg ? `${count} поръчки` : `${count} orders`}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 sm:tracking-[0.24em]">
            {isBg ? "Наличности" : "Inventory"}
          </p>
          <h3 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl">
            {isBg ? "Продукти за зареждане" : "Products to restock"}
          </h3>
          <div className="mt-6 space-y-3">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{product.title}</p>
                    <p className="text-xs text-slate-500">{product.categoryName ?? (isBg ? "Без категория" : "Uncategorized")}</p>
                  </div>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                    {isBg ? `Остават ${product.quantity}` : `${product.quantity} left`}
                  </span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="text-sm text-slate-500">
                {isBg
                  ? "Всички следени продукти са над прага за ниска наличност."
                  : "All tracked products are above the low-stock threshold."}
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 sm:tracking-[0.24em]">
          {isBg ? "Последна активност" : "Latest activity"}
        </p>
        <h3 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl">
          {isBg ? "Последни поръчки" : "Recent orders"}
        </h3>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 sm:rounded-[1.5rem]">
          <div className="table-scroll">
            <table className="min-w-[36rem] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{isBg ? "Клиент" : "Customer"}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{isBg ? "Артикули" : "Items"}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{isBg ? "Статус" : "Status"}</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">{isBg ? "Общо" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-4 text-slate-900">{order.names ?? (isBg ? "Клиент" : "Customer")}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {order.items.length} {isBg
                        ? order.items.length === 1 ? "артикул" : "артикула"
                        : order.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{getOrderStatusText(order.status, isBg)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">{formatCurrency(order.orderTotalPrice)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      {isBg ? "Все още няма скорошни поръчки." : "No recent orders yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
