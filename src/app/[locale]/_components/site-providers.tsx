"use client";

import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";

/** Site-wide: top bar on client navigations + Sonner toasts. Must render inside `ThemeProvider`. */
export function SiteProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#e8ff47"
        height={3}
        showSpinner={false}
        crawlSpeed={200}
        speed={400}
        shadow="0 0 12px rgba(232, 255, 71, 0.45)"
        zIndex={99999}
      />
      <Toaster richColors closeButton position="top-center" />
      {children}
    </>
  );
}
