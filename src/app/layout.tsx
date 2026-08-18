import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../index.css";
import "../App.css";

export const metadata: Metadata = {
  title: "HygiaTrade",
  description: "HygiaTrade онлайн магазин",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
