import { useEffect, useMemo, useState } from "react";
import { BellAlertIcon, CubeTransparentIcon, ShoppingBagIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { OrderStatus } from "../../enums/OrderStatus";
import { formatCurrency } from "../../utils/currency";

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

const getOrderStatusTextBg = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Created:
      return "Създадена";
    case OrderStatus.PendingVerification:
      return "Чака потвърждение";
    case OrderStatus.Verified:
      return "Потвърдена";
    case OrderStatus.Processing:
      return "Обработва се";
    case OrderStatus.Shipped:
      return "Изпратена";
    case OrderStatus.Delivered:
      return "Доставена";
    case OrderStatus.Cancelled:
      return "Отказана";
    default:
      return "Неизвестен статус";
  }
};

const AdminOverview = () => {
  const token = useSelector((state: RootState) => state.auth.token);
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
        console.error("Грешка при зареждане на администраторското табло:", error);
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

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">Преглед на продажбите</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">Оперативен преглед</h2>
            <p className="mt-2 text-sm text-slate-600">
              Днешните поръчки, текущите наличности и последното клиентско търсене в каталога.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {lowStockProducts.length} продукта се нуждаят от зареждане
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Поръчки днес",
            value: ordersToday.length,
            detail: `${orders.filter((order) => order.status === OrderStatus.PendingVerification).length} чакат преглед`,
            icon: ShoppingBagIcon,
          },
          {
            label: "Оборот тази седмица",
            value: formatCurrency(weeklyRevenue),
            detail: "Последните 7 дни без отказаните поръчки",
            icon: BellAlertIcon,
          },
          {
            label: "Ниски наличности",
            value: lowStockProducts.length,
            detail: `Под ${LOW_STOCK_THRESHOLD} броя`,
            icon: CubeTransparentIcon,
          },
          {
            label: "Активни клиенти",
            value: activeCustomers,
            detail: `${users.length} акаунта, ${categories.length} категории`,
            icon: UserGroupIcon,
          },
        ].map((item) => (
          <article key={item.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <item.icon className="h-8 w-8 rounded-2xl bg-primary-50 p-2 text-primary-600" />
            </div>
            <p className="mt-8 font-display text-4xl font-bold tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Поръчки</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">Разпределение по статус</h3>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {orderStatusGroups.map(([status, count]) => {
              const percentage = orders.length === 0 ? 0 : (count / orders.length) * 100;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{getOrderStatusTextBg(status)}</span>
                    <span className="text-slate-500">{count} поръчки</span>
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

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Наличности</p>
          <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">Продукти за зареждане</h3>
          <div className="mt-6 space-y-3">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product.title}</p>
                    <p className="text-xs text-slate-500">{product.categoryName ?? "Без категория"}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                    Остават {product.quantity}
                  </span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && <p className="text-sm text-slate-500">Всички следени продукти са над прага за ниска наличност.</p>}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Последна активност</p>
            <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">Последни поръчки</h3>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <div className="table-scroll">
            <table className="min-w-[36rem] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Клиент</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Артикули</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Статус</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Общо</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-4 text-slate-900">{order.names ?? "Клиент"}</td>
                    <td className="px-4 py-4 text-slate-600">{order.items.length} {order.items.length === 1 ? "артикул" : "артикула"}</td>
                    <td className="px-4 py-4 text-slate-600">{getOrderStatusTextBg(order.status)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">{formatCurrency(order.orderTotalPrice)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      Все още няма скорошни поръчки.
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
