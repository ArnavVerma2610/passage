import type { ScreenPoint } from './classifier';

export type GestureSwipeDirection = 'left' | 'right';

export const GESTURE_SCALE_MIN = 0.85;
export const GESTURE_SCALE_MAX = 1.35;
export const GESTURE_SWIPE_EVENT = 'passage:gesture-swipe';

export function clampGestureScale(scale: number) {
  return Math.min(GESTURE_SCALE_MAX, Math.max(GESTURE_SCALE_MIN, scale));
}

function targetAt(point: ScreenPoint) {
  if (typeof document === 'undefined') return null;
  return document.elementFromPoint(point.x, point.y);
}

function mouseInit(point: ScreenPoint): MouseEventInit {
  return {
    bubbles: true,
    cancelable: true,
    clientX: point.x,
    clientY: point.y,
    button: 0,
    buttons: 1,
  };
}

export function dispatchGestureHover(point: ScreenPoint) {
  const target = targetAt(point);
  if (!target) return;
  target.dispatchEvent(new MouseEvent('mousemove', mouseInit(point)));
}

export function dispatchGestureClick(point: ScreenPoint) {
  const target = targetAt(point);
  if (!target) return;

  if (typeof PointerEvent !== 'undefined') {
    const pointerInit: PointerEventInit = {
      ...mouseInit(point),
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
    };
    target.dispatchEvent(new PointerEvent('pointerdown', pointerInit));
    target.dispatchEvent(new PointerEvent('pointerup', { ...pointerInit, buttons: 0 }));
  }

  target.dispatchEvent(new MouseEvent('mousedown', mouseInit(point)));
  target.dispatchEvent(new MouseEvent('mouseup', { ...mouseInit(point), buttons: 0 }));
  target.dispatchEvent(new MouseEvent('click', { ...mouseInit(point), buttons: 0 }));
}

export function dispatchGestureSwipe(dir: GestureSwipeDirection) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GESTURE_SWIPE_EVENT, { detail: { dir } }));
}

export function subscribeGestureSwipe(handler: (dir: GestureSwipeDirection) => void) {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const dir = (event as CustomEvent<{ dir?: GestureSwipeDirection }>).detail?.dir;
    if (dir === 'left' || dir === 'right') handler(dir);
  };

  window.addEventListener(GESTURE_SWIPE_EVENT, listener);
  return () => window.removeEventListener(GESTURE_SWIPE_EVENT, listener);
}
