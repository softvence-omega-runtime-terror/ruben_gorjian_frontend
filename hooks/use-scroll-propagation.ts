import { useCallback, useRef } from "react";

export type UseScrollPropagationOptions = {
  /**
   * When true, at scroll boundaries (top/bottom) the window is scrolled by the
   * same delta so modal and page scroll feel like one continuous motion.
   */
  scrollWindowAtBoundary?: boolean;
};

/**
 * Hook that enables conditional scroll propagation.
 *
 * When a scroll container reaches its boundaries (top/bottom),
 * scroll events can propagate or drive window scroll, so there's
 * no hard boundary between modal and page.
 *
 * @param options.scrollWindowAtBoundary - If true, at boundaries call window.scrollBy
 *   so the page scrolls when the user "scrolls past" the modal edge.
 * @returns Object with onWheel and onTouchMove handlers
 */
export function useScrollPropagation(options: UseScrollPropagationOptions = {}) {
  const { scrollWindowAtBoundary = false } = options;
  const lastTouchY = useRef<number | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;

      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;

      const atBoundaryAndScrollingOut =
        (scrollingDown && isAtBottom) || (scrollingUp && isAtTop);

      if (atBoundaryAndScrollingOut) {
        if (scrollWindowAtBoundary) {
          e.preventDefault();
          window.scrollBy(0, e.deltaY);
        }
        return;
      }

      e.stopPropagation();
    },
    [scrollWindowAtBoundary]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;

      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      const touch = e.touches[0];
      if (!touch) {
        e.stopPropagation();
        return;
      }
      const currentY = touch.clientY;
      const prevY = lastTouchY.current;
      lastTouchY.current = currentY;
      if (prevY === null) return;

      const deltaY = prevY - currentY;
      const scrollingDown = deltaY > 0;
      const scrollingUp = deltaY < 0;
      const atBoundaryAndScrollingOut =
        (scrollingDown && isAtBottom) || (scrollingUp && isAtTop);

      if (atBoundaryAndScrollingOut && scrollWindowAtBoundary) {
        window.scrollBy(0, deltaY);
        return;
      }

      e.stopPropagation();
    },
    [scrollWindowAtBoundary]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    lastTouchY.current = t ? t.clientY : null;
  }, []);

  return {
    onWheel: handleWheel,
    onTouchMove: handleTouchMove,
    onTouchStart: handleTouchStart,
  };
}




