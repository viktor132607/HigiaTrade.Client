import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartHoverPreview from "./CartHoverPreview";
import ProductSearchEnhancer from "./ProductSearchEnhancer";
import CompareNavbarEnhancer from "./CompareNavbarEnhancer";
import ProductBreadcrumb from "./ProductBreadcrumb";
import CookieBanner from "./CookieBanner";
import BrandSpellingFixer from "./BrandSpellingFixer";
import CompareTray from "../products/CompareTray";
import SeoManager from "../seo/SeoManager";

type LayoutProps = {
  children?: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <BrandSpellingFixer />
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
