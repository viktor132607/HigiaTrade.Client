import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

type LayoutProps = {
  children?: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="min-w-0 flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
