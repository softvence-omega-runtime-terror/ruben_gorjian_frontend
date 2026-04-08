"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export default function SmoothScroller() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lenis = new Lenis();
    const handleTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(handleTick);

    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(handleTick);
      lenis.destroy();
    };
  }, []);

  return null;
}
