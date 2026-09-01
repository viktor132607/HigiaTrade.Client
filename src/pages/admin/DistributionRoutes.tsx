import { useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  MapPinIcon,
  TrashIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { RootState } from "../../store";
import { formatCurrency } from "../../utils/currency";

interface Depot {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface RouteOrder {
  id: string;
  names: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  createdOn: string;
  status: number;
  orderTotalPrice: number;
}

interface RouteStop {
  orderId: string;
  position: number;
  names: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  createdOn: string;
  orderTotalPrice: number;
  latitude: number;
  longitude: number;
  geocodingPrecision: string;
}

interface DistributionRoute {
  id: string;
  distributorName: string;
  routeDate: string;
  createdOn: string;
  start: Depot;
  end: Depot;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  navigationUrl: string;
  stops: RouteStop[];
}

interface RoutesPageResponse {
  depot: Depot;
  routes: DistributionRoute[];
  unassignedOrders: RouteOrder[];
}

const todayIso = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const DistributionRoutes = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const [data, setData] = useState<RoutesPageResponse | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [distributorName, setDistributorName] = useState("");
  const [routeDate, setRouteDate] = useState(todayIso);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch(`${API_BASE_URL}/distribution-routes`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await readApiJson<RoutesPageResponse>(response);
      setData(payload);

      const available = new Set((payload.unassignedOrders ?? []).map((order) => order.id));
      setSelectedOrderIds((current) => new Set([...current].filter((id) => available.has(id))));
    } catch (error) {
      console.error("Distribution routes load failed:", error);
      if (showLoader) {
        toast.error(isBg ? "Маршрутите не можаха да бъдат заредени." : "Routes could not be loaded.");
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => void load(false), 15_000);
    const onFocus = () => void load(false);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  const unassignedOrders = data?.unassignedOrders ?? [];
  const routes = data?.routes ?? [];
  const allSelected = unassignedOrders.length > 0 && selectedOrderIds.size === unassignedOrders.length;

  const selectedTotal = useMemo(
    () =>
      unassignedOrders
        .filter((order) => selectedOrderIds.has(order.id))
        .reduce((sum, order) => sum + Number(order.orderTotalPrice || 0), 0),
    [selectedOrderIds, unassignedOrders]
  );

  const toggleOrder = (id: string) => {
    setSelectedOrderIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedOrderIds(
      allSelected ? new Set() : new Set(unassignedOrders.slice(0, 20).map((order) => order.id))
    );
  };

  const createRoute = async () => {
    if (!distributorName.trim()) {
      toast.error(isBg ? "Въведи име на дистрибутор." : "Enter a distributor name.");
      return;
    }

    if (selectedOrderIds.size === 0) {
      toast.error(isBg ? "Избери поне една поръчка." : "Select at least one order.");
      return;
    }

    if (selectedOrderIds.size > 20) {
      toast.error(isBg ? "Един маршрут може да съдържа максимум 20 поръчки." : "A route can contain up to 20 orders.");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(`${API_BASE_URL}/distribution-routes/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          distributorName: distributorName.trim(),
          routeDate,
          orderIds: [...selectedOrderIds],
        }),
      });

      await readApiJson<DistributionRoute>(response);
      setSelectedOrderIds(new Set());
      toast.success(isBg ? "Маршрутът е създаден и оптимизиран." : "Route created and optimized.");
      await load(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : isBg ? "Маршрутът не можа да бъде създаден." : "Route could not be created.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const deleteRoute = async (route: DistributionRoute) => {
    const confirmed = window.confirm(
      isBg
        ? `Да изтрия ли маршрута на ${route.distributorName}? Поръчките ще се върнат в чакащи.`
        : `Delete ${route.distributorName}'s route? Its orders will return to the pending list.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(route.id);
      const response = await fetch(`${API_BASE_URL}/distribution-routes/${route.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || (isBg ? "Маршрутът не можа да бъде изтрит." : "Route could not be deleted."));
      }
      toast.success(isBg ? "Маршрутът е изтрит." : "Route deleted.");
      await load(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isBg ? "Грешка при изтриване." : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(isBg ? "bg-BG" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatCreated = (value: string) =>
    new Date(value).toLocaleString(isBg ? "bg-BG" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#18b99f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            {isBg ? "Маршрути за дистрибутори" : "Distributor routes"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isBg
              ? "Новите клиентски поръчки се появяват автоматично тук. Всеки маршрут тръгва от Русе и завършва в Русе."
              : "New customer orders appear here automatically. Every route starts and ends in Ruse."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowPathIcon className="h-5 w-5" />
          {isBg ? "Обнови" : "Refresh"}
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
        <span className="inline-flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          {isBg ? "Фиксирана база: Русе, България → доставки → Русе, България" : "Fixed depot: Ruse, Bulgaria → deliveries → Ruse, Bulgaria"}
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-6 w-6 text-[#18b99f]" />
            <h2 className="text-lg font-bold text-slate-950">{isBg ? "Нов маршрут" : "New route"}</h2>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(220px,1fr)_220px_auto] lg:items-end">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>{isBg ? "Дистрибутор" : "Distributor"}</span>
            <input
              type="text"
              value={distributorName}
              onChange={(event) => setDistributorName(event.target.value)}
              placeholder={isBg ? "Име на дистрибутора" : "Distributor name"}
              className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/15"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>{isBg ? "Дата" : "Date"}</span>
            <input
              type="date"
              value={routeDate}
              onChange={(event) => setRouteDate(event.target.value)}
              className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/15"
            />
          </label>

          <button
            type="button"
            onClick={() => void createRoute()}
            disabled={creating || selectedOrderIds.size === 0}
            className="min-h-11 rounded-xl bg-[#18b99f] px-5 py-2 text-sm font-bold text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? isBg
                ? "Изчисляване на маршрута..."
                : "Calculating route..."
              : isBg
                ? `Създай маршрут (${selectedOrderIds.size})`
                : `Create route (${selectedOrderIds.size})`}
          </button>
        </div>

        <div className="border-t border-slate-200">
          <div className="flex flex-col gap-3 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="font-bold text-slate-900">
                {isBg ? `Чакащи поръчки: ${unassignedOrders.length}` : `Pending orders: ${unassignedOrders.length}`}
              </div>
              {selectedOrderIds.size > 0 && (
                <div className="mt-0.5 text-xs text-slate-500">
                  {isBg ? "Избрани" : "Selected"}: {selectedOrderIds.size} · {formatCurrency(selectedTotal)}
                </div>
              )}
            </div>
            {unassignedOrders.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {allSelected ? (isBg ? "Махни всички" : "Clear all") : (isBg ? "Избери всички" : "Select all")}
              </button>
            )}
          </div>

          {unassignedOrders.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              {isBg ? "Няма чакащи поръчки за маршрут." : "No pending orders for routing."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unassignedOrders.map((order) => {
                const checked = selectedOrderIds.has(order.id);
                return (
                  <label
                    key={order.id}
                    className={`flex cursor-pointer gap-3 px-4 py-4 transition sm:px-6 ${checked ? "bg-emerald-50/60" : "hover:bg-slate-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOrder(order.id)}
                      className="mt-1 h-5 w-5 flex-none rounded border-slate-300 accent-[#18b99f]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-bold text-slate-950">
                            {order.names || (isBg ? "Клиент" : "Customer")} · #{order.id.slice(0, 8)}
                          </div>
                          <div className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
                            <MapPinIcon className="mt-0.5 h-4 w-4 flex-none" />
                            <span>{order.fullAddress || (isBg ? "Липсва адрес" : "Missing address")}</span>
                          </div>
                          {order.phone && <div className="mt-1 text-sm text-slate-500">{order.phone}</div>}
                          <div className="mt-1 text-xs text-slate-400">{formatCreated(order.createdOn)}</div>
                        </div>
                        <div className="mt-2 font-bold text-slate-950 sm:mt-0">{formatCurrency(order.orderTotalPrice)}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">{isBg ? "Създадени маршрути" : "Created routes"}</h2>
          <span className="text-sm text-slate-500">{routes.length}</span>
        </div>

        {routes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            {isBg ? "Все още няма създадени маршрути." : "No routes have been created yet."}
          </div>
        ) : (
          routes.map((route) => (
            <article key={route.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-[#18b99f]" />
                    <h3 className="text-lg font-bold text-slate-950">{route.distributorName}</h3>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatDate(route.routeDate)} · {route.stops.length} {isBg ? "спирки" : "stops"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                    <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                      {route.totalDistanceKm.toFixed(1)} km
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                      ~{Math.floor(route.estimatedDurationMinutes / 60)}h {route.estimatedDurationMinutes % 60}m
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={route.navigationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    {isBg ? "Отвори в Google Maps" : "Open in Google Maps"}
                  </a>
                  <button
                    type="button"
                    onClick={() => void deleteRoute(route)}
                    disabled={deletingId === route.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {isBg ? "Изтрий" : "Delete"}
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
                  <CheckCircleIcon className="h-5 w-5" />
                  {isBg ? "Русе → оптимизиран ред на доставките → Русе" : "Ruse → optimized delivery order → Ruse"}
                </div>

                <ol className="relative ml-3 border-l-2 border-slate-200">
                  <li className="relative pb-5 pl-7">
                    <span className="absolute -left-[9px] top-0 flex h-4 w-4 rounded-full bg-[#18b99f] ring-4 ring-white" />
                    <div className="font-bold text-slate-900">{isBg ? "Старт: Русе" : "Start: Ruse"}</div>
                    <div className="text-sm text-slate-500">{route.start?.address || data?.depot?.address}</div>
                  </li>

                  {route.stops.map((stop) => (
                    <li key={stop.orderId} className="relative pb-5 pl-7">
                      <span className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white ring-4 ring-white">
                        {stop.position}
                      </span>
                      <div className="font-bold text-slate-900">
                        {stop.names || (isBg ? "Клиент" : "Customer")} · #{stop.orderId.slice(0, 8)}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{stop.fullAddress}</div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {stop.phone && <span>{stop.phone}</span>}
                        <span>{formatCurrency(stop.orderTotalPrice)}</span>
                        {stop.geocodingPrecision === "city" && (
                          <span className="font-semibold text-amber-700">
                            {isBg ? "Координати по населено място" : "City-level coordinates"}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}

                  <li className="relative pl-7">
                    <span className="absolute -left-[9px] top-0 flex h-4 w-4 rounded-full bg-[#18b99f] ring-4 ring-white" />
                    <div className="font-bold text-slate-900">{isBg ? "Край: Русе" : "End: Ruse"}</div>
                    <div className="text-sm text-slate-500">{route.end?.address || data?.depot?.address}</div>
                  </li>
                </ol>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default DistributionRoutes;
