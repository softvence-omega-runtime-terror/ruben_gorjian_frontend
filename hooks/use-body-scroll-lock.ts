import { useEffect } from "react";

/**
 * Hook to lock body scroll when a modal is open.
 * 
 * This prevents:
 * - Background page scrolling while modal is open
 * - Layout shift from scrollbar disappearing
 * - Scroll position loss when modal closes
 * 
 * Uses position: fixed approach which is more reliable than overflow: hidden
 * because it preserves scroll position and prevents layout shift.
 */
export function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;

    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock body scroll
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    
    // Add padding to compensate for scrollbar to prevent layout shift
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      // Restore body styles
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [open]);
}




