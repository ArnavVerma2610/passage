import type { ScreenPoint } from './classifier';

export type GestureSwipeDirection = 'left' | 'right';
export type GestureScrollDirection = 'up' | 'down';

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

function mouseInit(point: ScreenPoint, button: 0 | 2 = 0, buttons = button === 2 ? 2 : 1): MouseEventInit {
  return {
    bubbles: true,
    cancelable: true,
    clientX: point.x,
    clientY: point.y,
    button,
    buttons,
  };
}

function nearestScrollable(start: Element | null) {
  let node: Element | null = start;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const canScroll = /(auto|scroll|overlay)/.test(style.overflowY);
    if (canScroll && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

export function dispatchGestureHover(point: ScreenPoint) {
  const target = targetAt(point);
  if (!target) return;
  target.dispatchEvent(new MouseEvent('mousemove', mouseInit(point, 0, 0)));
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

export function dispatchGestureRightClick(point: ScreenPoint) {
  const target = targetAt(point);
  if (!target) return;

  target.dispatchEvent(new MouseEvent('mousedown', mouseInit(point, 2)));
  target.dispatchEvent(new MouseEvent('mouseup', { ...mouseInit(point, 2), buttons: 0 }));
  target.dispatchEvent(new MouseEvent('contextmenu', mouseInit(point, 2, 0)));
}

export function dispatchGestureScroll(dir: GestureScrollDirection, point: ScreenPoint) {
  if (typeof window === 'undefined') return;

  const amount = Math.round(window.innerHeight * 0.5) * (dir === 'down' ? 1 : -1);
  const target = targetAt(point);
  const scrollable = nearestScrollable(target instanceof Element ? target : null);

  if (scrollable) {
    scrollable.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: amount }));
    scrollable.scrollBy({ top: amount, behavior: 'auto' });
  } else {
    window.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: amount }));
    window.scrollBy({ top: amount, behavior: 'auto' });
  }
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
