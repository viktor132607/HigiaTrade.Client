"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { preloadHomeSlideshow } from "../utils/homeSlideshowPreload";

const App = dynamic(() => import("./../App"), { ssr: false });

export default function CatchAllPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (window.location.pathname === "/" || window.location.pathname === "") {
        await preloadHomeSlideshow();
      }

      if (!cancelled) setReady(true);
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <img src="/higiqlogo.png" alt="HygiaTrade" className="h-14 w-auto opacity-90" />
      </div>
    );
  }

  return <App />;
}
