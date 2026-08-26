import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartHoverPreview from "./CartHoverPreview";
import ProductSearchEnhancer from "./ProductSearchEnhancer";
import CompareNavbarEnhancer from "./CompareNavbarEnhancer";
import ProductBreadcrumb from "./ProductBreadcrumb";
import CookieBanner from "./CookieBanner";
import CompareTray from "../products/CompareTray";
import SeoManager from "../seo/SeoManager";

type LayoutProps = {
  children?: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    if (/^\/products\/[^/]+/.test(location.pathname)) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <SeoManager />
      <Navbar />
      <ProductSearchEnhancer />
      <CompareNavbarEnhancer />
      <CartHoverPreview />
      <CompareTray />
      <ProductBreadcrumb />
      <main className="min-w-0 flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Layout;
