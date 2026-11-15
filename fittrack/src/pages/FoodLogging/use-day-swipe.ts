import { useRef, type PointerEvent } from "react";
import { useSelectedDay } from "./use-selected-day";

const SWIPE_THRESHOLD = 56;
const HORIZONTAL_BIAS = 1.25;
const IGNORE_SELECTOR =
  "button, a, input, textarea, select, [role='slider'], [contenteditable='true'], [data-no-day-swipe]";

/**
 * Horizontal swipe navigation for the selected day.
 * Only touch/pen input is considered, so mouse dragging is unaffected.
 */
export const useDaySwipe = () => {
  const { goToPreviousDay, goToNextDay } = useSelectedDay();
  const origin = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;

    const target = event.target as Element;
    if (target.closest(IGNORE_SELECTOR)) return;

    origin.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = origin.current;
    origin.current = null;

    if (!start || event.pointerType === "mouse") return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (
      Math.abs(dx) < SWIPE_THRESHOLD ||
      Math.abs(dx) < Math.abs(dy) * HORIZONTAL_BIAS
    ) {
      return;
    }

    if (dx < 0) goToNextDay();
    else goToPreviousDay();
  };

  const onPointerCancel = () => {
    origin.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
};
