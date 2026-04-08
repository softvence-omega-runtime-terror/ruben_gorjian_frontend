"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) | undefined;
  }
}

export default function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pixelId) return;

    // Initialize Meta Pixel
    import("react-facebook-pixel")
      .then((module) => module.default)
      .then((ReactPixel) => {
        ReactPixel.init(pixelId);
        ReactPixel.pageView();
      });
  }, [pixelId]);

  useEffect(() => {
    if (!pixelId || typeof window.fbq === "undefined") return;

    // Track page views on route change
    import("react-facebook-pixel")
      .then((module) => module.default)
      .then((ReactPixel) => {
        ReactPixel.pageView();
      });
  }, [pathname, searchParams, pixelId]);

  return null;
}
