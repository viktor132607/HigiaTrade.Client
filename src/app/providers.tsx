"use client";

import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { store } from "../store";
import Layout from "../components/layout/Layout";
import "react-toastify/dist/ReactToastify.css";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <Layout>{children}</Layout>
      <ToastContainer position="bottom-right" newestOnTop />
    </Provider>
  );
}
