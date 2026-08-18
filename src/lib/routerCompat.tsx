"use client";

import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type To = string;

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
  to?: To;
  href?: To;
  className?: string;
  children: ReactNode;
};

export function Link({ to, href, children, ...props }: LinkProps) {
  return (
    <NextLink href={href ?? to ?? "/"} {...props}>
      {children}
    </NextLink>
  );
}

type NavLinkProps = Omit<LinkProps, "className"> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
};

export function NavLink({ to, href, end = false, className, children, ...props }: NavLinkProps) {
  const currentPathname = usePathname() ?? "/";
  const target = href ?? to ?? "/";
  const normalizedTarget = target === "/" ? "/" : target.replace(/\/$/, "");
  const normalizedPath = currentPathname === "/" ? "/" : currentPathname.replace(/\/$/, "");
  const isActive = end
    ? normalizedPath === normalizedTarget
    : normalizedPath === normalizedTarget || normalizedPath.startsWith(`${normalizedTarget}/`);
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;

  return (
    <NextLink href={target} className={resolvedClassName} {...props}>
      {children}
    </NextLink>
  );
}

function stateKey(pathname: string) {
  return `navigationState:${pathname}`;
}

export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") {
      window.history.go(to);
      return;
    }

    const path = to.split("?")[0] || "/";
    if (options?.state !== undefined) {
      sessionStorage.setItem(stateKey(path), JSON.stringify(options.state));
    }

    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() ?? "/";
  const searchParams = useNextSearchParams();
  const [state, setState] = useState<unknown>(null);

  useEffect(() => {
    const key = stateKey(pathname);
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      setState(null);
      return;
    }

    try {
      setState(JSON.parse(stored));
    } catch {
      setState(null);
    } finally {
      sessionStorage.removeItem(key);
    }
  }, [pathname]);

  const search = searchParams?.toString() ?? "";

  return {
    pathname,
    search: search ? `?${search}` : "",
    state,
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useNextParams() as T;
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => void] {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const nextSearchParams = useNextSearchParams();
  const params = useMemo(() => new URLSearchParams(nextSearchParams?.toString() ?? ""), [nextSearchParams]);

  const setSearchParams = (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
    const resolved = typeof next === "function" ? next(new URLSearchParams(params)) : next;
    const query = resolved.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return [params, setSearchParams];
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}
