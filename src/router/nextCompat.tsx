"use client";

import React, {
  Children,
  ReactElement,
  ReactNode,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type LocationValue = {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
};

type RouterContextValue = {
  location: LocationValue;
  navigate: (to: string | number, options?: NavigateOptions) => void;
};

type RouteCandidate = {
  pattern: string;
  element: ReactNode;
  layouts: ReactNode[];
  params: Record<string, string>;
  wildcard?: boolean;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});
const OutletContext = createContext<ReactNode>(null);

const getCurrentLocation = (): LocationValue => {
  if (typeof window === "undefined") {
    return { pathname: "/", search: "", hash: "", state: undefined };
  }

  return {
    pathname: window.location.pathname || "/",
    search: window.location.search || "",
    hash: window.location.hash || "",
    state: window.history.state?.usr,
  };
};

const normalizePath = (path: string) => {
  if (!path) return "/";
  const [pathname] = path.split(/[?#]/);
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
};

const joinPaths = (base: string, path?: string) => {
  if (!path) return normalizePath(base || "/");
  if (path.startsWith("/")) return normalizePath(path);
  const cleanBase = base === "/" ? "" : base;
  return normalizePath(`${cleanBase}/${path}`);
};

const splitPattern = (pattern: string) =>
  normalizePath(pattern)
    .split("/")
    .filter(Boolean);

const matchPattern = (pattern: string, pathname: string) => {
  const normalizedPattern = normalizePath(pattern);
  const normalizedPathname = normalizePath(pathname);
  const patternParts = splitPattern(normalizedPattern);
  const pathParts = splitPattern(normalizedPathname);
  const params: Record<string, string> = {};

  const wildcardIndex = patternParts.indexOf("*");
  const hasWildcard = wildcardIndex !== -1;
  const compareLength = hasWildcard ? wildcardIndex : patternParts.length;

  if (!hasWildcard && patternParts.length !== pathParts.length) {
    return null;
  }

  if (hasWildcard && pathParts.length < compareLength) {
    return null;
  }

  for (let index = 0; index < compareLength; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart?.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart ?? "");
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
};

const renderWithLayouts = (candidate: RouteCandidate) => {
  let rendered = candidate.element;

  for (let index = candidate.layouts.length - 1; index >= 0; index -= 1) {
    rendered = (
      <OutletContext.Provider value={rendered}>
        {candidate.layouts[index]}
      </OutletContext.Provider>
    );
  }

  return (
    <ParamsContext.Provider value={candidate.params}>
      {rendered}
    </ParamsContext.Provider>
  );
};

const buildCandidates = (
  children: ReactNode,
  basePath = "/",
  layouts: ReactNode[] = [],
): RouteCandidate[] => {
  const candidates: RouteCandidate[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const props = child.props as {
      path?: string;
      index?: boolean;
      element?: ReactNode;
      children?: ReactNode;
    };

    const routePath = props.index ? basePath : joinPaths(basePath, props.path);
    const hasChildren = Boolean(props.children);
    const nextLayouts = props.element ? [...layouts, props.element] : layouts;

    if (hasChildren) {
      candidates.push(...buildCandidates(props.children, routePath, nextLayouts));
    }

    if (!hasChildren && props.element) {
      candidates.push({
        pattern: routePath,
        element: props.element,
        layouts,
        params: {},
        wildcard: props.path === "*" || routePath.includes("*"),
      });
    }
  });

  return candidates;
};

export const BrowserRouter = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationValue>(getCurrentLocation);

  useEffect(() => {
    const handlePopState = () => setLocation(getCurrentLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string | number, options?: NavigateOptions) => {
    if (typeof window === "undefined") return;

    if (typeof to === "number") {
      window.history.go(to);
      return;
    }

    const method = options?.replace ? "replaceState" : "pushState";
    window.history[method]({ usr: options?.state }, "", to);
    setLocation(getCurrentLocation());
  };

  const value = useMemo(() => ({ location, navigate }), [location]);

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};

export const Router = BrowserRouter;

export const Route = (_props: {
  path?: string;
  index?: boolean;
  element?: ReactNode;
  children?: ReactNode;
}) => null;

export const Routes = ({ children }: { children: ReactNode }) => {
  const { location } = useRouterContext();
  const candidates = useMemo(() => buildCandidates(children), [children]);

  const matchedCandidate = candidates.find((candidate) => {
    const params = matchPattern(candidate.pattern, location.pathname);
    if (!params) return false;
    candidate.params = params;
    return true;
  });

  const fallback = candidates.find((candidate) => candidate.pattern === "/*");
  const candidate = matchedCandidate ?? fallback;

  if (!candidate) return null;

  return renderWithLayouts(candidate);
};

export const Outlet = () => <>{useContext(OutletContext)}</>;

const useRouterContext = () => {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error("Router context is missing.");
  }

  return context;
};

export const useNavigate = () => useRouterContext().navigate;
export const useLocation = () => useRouterContext().location;
export const useParams = <T extends Record<string, string | undefined>>() =>
  useContext(ParamsContext) as T;

export const useSearchParams = (): [URLSearchParams, (next: URLSearchParams | Record<string, string> | string) => void] => {
  const { location, navigate } = useRouterContext();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const setSearchParams = (
    next: URLSearchParams | Record<string, string> | string,
  ) => {
    const nextParams =
      typeof next === "string"
        ? new URLSearchParams(next)
        : next instanceof URLSearchParams
        ? next
        : new URLSearchParams(next);

    const query = nextParams.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`);
  };

  return [params, setSearchParams];
};

export const Link = ({
  to,
  href,
  children,
  onClick,
  replace,
  state,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to?: string;
  href?: string;
  replace?: boolean;
  state?: unknown;
}) => {
  const navigate = useNavigate();
  const target = to ?? href ?? "#";

  return (
    <a
      {...props}
      href={target}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          props.target
        ) {
          return;
        }

        event.preventDefault();
        navigate(target, { replace, state });
      }}
    >
      {children}
    </a>
  );
};

export const NavLink = ({
  to,
  end,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "className"> & {
  to: string;
  end?: boolean;
  className?: string | ((args: { isActive: boolean }) => string);
}) => {
  const { pathname } = useLocation();
  const target = normalizePath(to);
  const current = normalizePath(pathname);
  const isActive = end ? current === target : current === target || current.startsWith(`${target}/`);
  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link to={to} className={resolvedClassName} {...props}>
      {children}
    </Link>
  );
};

export const Navigate = ({
  to,
  replace,
  state,
}: {
  to: string;
  replace?: boolean;
  state?: unknown;
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);

  return null;
};

export const createBrowserRouter = (_routes?: unknown) => ({});
export const RouterProvider = ({ children }: { children?: ReactNode }) => <>{children}</>;
