import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowsRightLeftIcon,
  Bars3Icon,
  HeartIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PhoneIcon,
  ShoppingBagIcon,
  SparklesIcon,
  SunIcon,
  TagIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { decodeJWT } from "../../utils/jwtUtils";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const CONTACT_PHONE = "0899564288";
const CONTACT_EMAIL = "iliev132607@gmail.com";

const menuItems = [
  {
    to: "/promotions",
    labelBg: "Промоции",
    labelEn: "Promotions",
    badgeBg: "Акция",
    badgeEn: "Sale",
    icon: TagIcon,
  },
  {
    to: "/new-products",
    labelBg: "Нови стоки",
    labelEn: "New products",
    badgeBg: "Ново",
    badgeEn: "New",
    icon: SparklesIcon,
  },
  {
    to: "/best-sellers",
    labelBg: "Най-продавани",
    labelEn: "Best sellers",
    badgeBg: "ТОП",
    badgeEn: "TOP",
    icon: SparklesIcon,
  },
  {
    to: "/brands",
    labelBg: "По марка",
    labelEn: "By brand",
    badgeBg: null,
    badgeEn: null,
    icon: null,
  },
  {
    to: "/contact",
    labelBg: "Контакти",
    labelEn: "Contact",
    badgeBg: null,
    badgeEn: null,
    icon: PhoneIcon,
  },
];

interface NavCategory {
  id: string;
  name: string;
  nameBg?: string;
  nameEn?: string;
}

const normalizeCategories = (data: unknown): NavCategory[] => {
  const items = Array.isArray(data)
    ? data
    : data &&
        typeof data === "object" &&
        "items" in data &&
        Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : [];

  return items
    .map((item) => {
      const value = item as Record<string, unknown>;
      const id = String(value.id ?? "");
      const name = String(value.name ?? value.title ?? "");
      const nameBg = value.nameBg ? String(value.nameBg) : undefined;
      const nameEn = value.nameEn ? String(value.nameEn) : undefined;

      return { id, name, nameBg, nameEn };
    })
    .filter((category) => category.id && category.name);
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { isAuthenticated, token, user } = useSelector(
    (state: RootState) => state.auth
  );

  const wishlistCount = useSelector(
    (state: RootState) => state.user.wishlist?.length ?? 0
  );

  const cartCount = useSelector((state: RootState) =>
    state.cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

  const {
    language,
    theme,
    t,
    toggleLanguage,
    toggleTheme,
  } = useLanguageTheme();

  const [categories, setCategories] = useState<NavCategory[]>([]);

  const compareCount = 0;
  const isBg = language === "bg";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Categories`
        );

        if (!response.ok) {
          setCategories([]);
          return;
        }

        const data = await response.json();
        setCategories(normalizeCategories(data));
      } catch {
        setCategories([]);
      }
    };

    void fetchCategories();
  }, []);

  const isAdmin = useMemo(() => {
    const decodedToken = decodeJWT(token);

    return (
      decodedToken?.[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] === "Admin"
    );
  }, [token]);

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Auth/logout`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      dispatch(logout());
      navigate("/");
    }
  };

  const handleSearchSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedQuery = searchQuery.trim();

    const params = trimmedQuery
      ? `?search=${encodeURIComponent(trimmedQuery)}`
      : "";

    navigate(`/products${params}`);
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm transition-colors dark:bg-black">
      <div className="bg-white transition-colors dark:bg-black">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              setIsMenuOpen((previous) => !previous)
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-[#d6dde3] text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          <Link to="/" className="flex shrink-0 items-center">
            <img
              src="/higiqlogo.png"
              alt="HygiaTrade"
              className="h-14 w-auto object-contain"
            />
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden flex-1 md:block"
          >
            <div className="relative mx-auto max-w-2xl">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder={t("nav.searchPlaceholder")}
                className="h-12 w-full rounded-none border border-[#e1e5e8] bg-[#f3f3f3] px-4 pr-14 text-sm text-black outline-none transition placeholder:text-[#8a98a4] focus:border-[#18b99f] focus:bg-white dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/50"
              />

              <button
                type="submit"
                className="absolute right-0 top-0 flex h-12 w-14 items-center justify-center rounded-none bg-[#18b99f] text-white transition hover:bg-[#14a990]"
                aria-label={isBg ? "Търси" : "Search"}
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            </div>
          </form>

          <div className="hidden items-center gap-3 lg:flex">
            <PhoneIcon className="h-8 w-8 text-[#70808d] dark:text-white" />

            <div>
              <p className="text-sm font-bold text-[#7a8791] dark:text-white">
                {CONTACT_PHONE}
              </p>

              <p className="text-xs font-bold uppercase tracking-wide text-[#263b4d] dark:text-white/80">
                {isBg ? "Свържете се с нас" : "Contact us"}
              </p>

              <p className="text-[11px] text-[#7a8791] dark:text-white/70">
                {CONTACT_EMAIL}
              </p>
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-[#d6dde3] px-3 py-2 text-sm font-medium text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
              title="Change language"
            >
              {isBg ? "EN" : "BG"}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#d6dde3] px-3 text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
              title="Change theme"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d6dde3] text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
              title={isBg ? "Сравни" : "Compare"}
            >
              <ArrowsRightLeftIcon className="h-6 w-6" />

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7b8187] px-1 text-xs font-bold text-white">
                {compareCount}
              </span>
            </button>

            <Link
              to="/wishlist"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d6dde3] text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
              title={isBg ? "Любими" : "Wishlist"}
            >
              <HeartIcon className="h-6 w-6" />

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7b8187] px-1 text-xs font-bold text-white">
                {wishlistCount}
              </span>
            </Link>

            <Link
              to="/cart"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d6dde3] text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
              title={t("nav.cart")}
            >
              <ShoppingBagIcon className="h-7 w-7" />

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7b8187] px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d6dde3] text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
                  title={t("nav.account")}
                >
                  <UserCircleIcon className="h-7 w-7" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-none bg-[#263b4d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#18b99f]"
                >
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d6dde3] text-[#70808d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20 dark:text-white"
                title={t("nav.signIn")}
              >
                <UserCircleIcon className="h-7 w-7" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#263b4d] text-white dark:bg-black">
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="group relative">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="flex h-12 items-center gap-3 bg-[#18b99f] px-5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#14a990]"
            >
              <Bars3Icon className="h-6 w-6" />
              {isBg ? "Категории" : "Categories"}
            </button>

            <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 border border-[#d6dde3] bg-white p-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/20 dark:bg-black">
              {categories.map((category) => {
                const categoryName = isBg
                  ? category.nameBg ?? category.name
                  : category.nameEn ?? category.name;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/products?category=${encodeURIComponent(
                          category.id
                        )}`
                      )
                    }
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#263b4d] transition hover:bg-[#edf2f5] hover:text-[#18b99f] dark:text-white dark:hover:bg-white/10"
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center md:flex">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const label = isBg
                ? item.labelBg
                : item.labelEn;
              const badge = isBg
                ? item.badgeBg
                : item.badgeEn;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex h-12 items-center gap-2 border-r border-[#385066] px-5 text-sm font-semibold transition hover:bg-[#1f3446] ${
                      isActive
                        ? "bg-[#1f3446] text-white"
                        : "text-white"
                    }`
                  }
                >
                  {Icon && <Icon className="h-5 w-5" />}

                  <span>{label}</span>

                  {badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        badge === "ТОП" || badge === "TOP"
                          ? "bg-[#3bd300] text-white"
                          : badge === "Ново" ||
                              badge === "New"
                            ? "bg-[#fff200] text-black"
                            : "bg-[#ff0000] text-white"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex h-12 items-center border-r border-[#385066] px-5 text-sm font-semibold transition hover:bg-[#1f3446] ${
                  location.pathname.startsWith("/admin")
                    ? "bg-[#1f3446]"
                    : ""
                }`}
              >
                {t("nav.admin")}
              </Link>
            )}
          </nav>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-[#d6dde3] bg-white px-4 py-4 transition-colors dark:border-white/20 dark:bg-black sm:px-6 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="mb-4"
          >
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder={t("nav.searchProducts")}
                className="h-12 w-full rounded-none border border-[#d6dde3] bg-[#f3f3f3] pl-4 pr-12 text-sm text-black outline-none transition focus:border-[#18b99f] focus:bg-white dark:border-white/20 dark:bg-black dark:text-white"
              />

              <MagnifyingGlassIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#70808d]" />
            </div>
          </form>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                navigate("/products");
                closeMenu();
              }}
              className="block w-full rounded-none bg-[#18b99f] px-4 py-3 text-left text-sm font-bold uppercase text-white"
            >
              {isBg ? "Категории" : "Categories"}
            </button>

            <div className="grid gap-1 border border-[#d6dde3] p-2 dark:border-white/20">
              {categories.map((category) => {
                const categoryName = isBg
                  ? category.nameBg ?? category.name
                  : category.nameEn ?? category.name;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      navigate(
                        `/products?category=${encodeURIComponent(
                          category.id
                        )}`
                      );

                      closeMenu();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-[#263b4d] transition hover:bg-[#edf2f5] hover:text-[#18b99f] dark:text-white dark:hover:bg-white/10"
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>

            {menuItems.map((item) => {
              const label = isBg
                ? item.labelBg
                : item.labelEn;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-none px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#edf2f5] text-[#263b4d] dark:bg-white/10 dark:text-white"
                        : "text-[#263b4d] hover:bg-[#edf2f5] hover:text-[#18b99f] dark:text-white dark:hover:bg-white/10"
                    }`
                  }
                >
                  {label}
                </NavLink>
              );
            })}

            <Link
              to="/wishlist"
              onClick={closeMenu}
              className="block rounded-none px-4 py-3 text-sm font-medium text-[#263b4d] dark:text-white"
            >
              {isBg ? "Любими" : "Wishlist"} ({wishlistCount})
            </Link>

            <Link
              to="/cart"
              onClick={closeMenu}
              className="block rounded-none px-4 py-3 text-sm font-medium text-[#263b4d] dark:text-white"
            >
              {t("nav.cart")} ({cartCount})
            </Link>

            <button
              type="button"
              onClick={toggleLanguage}
              className="block w-full rounded-none px-4 py-3 text-left text-sm font-medium text-[#263b4d] dark:text-white"
            >
              {isBg ? "EN" : "BG"}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 rounded-none px-4 py-3 text-left text-sm font-medium text-[#263b4d] dark:text-white"
            >
              {theme === "dark" ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}

              {theme === "dark"
                ? t("nav.themeLight")
                : t("nav.themeDark")}
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="block rounded-none border border-[#18b99f] bg-[#e6fbf7] px-4 py-3 text-sm font-medium text-[#087966] dark:bg-white/10 dark:text-white"
              >
                {t("nav.openAdmin")}
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="block rounded-none border border-[#d6dde3] px-4 py-3 text-sm font-medium text-[#263b4d] dark:border-white/20 dark:text-white"
                >
                  {user?.name ?? t("nav.account")}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-none bg-[#263b4d] px-4 py-3 text-left text-sm font-medium text-white"
                >
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="block rounded-none border border-[#d6dde3] px-4 py-3 text-sm font-medium text-[#263b4d] dark:border-white/20 dark:text-white"
              >
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;