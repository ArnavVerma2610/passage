import {
  PINCH_OFF_RATIO,
  PINCH_ON_RATIO,
  classifyHand,
  distance2d,
  pointForPose,
  poseForHand,
  toScreenPoint,
  type HandPose,
  type HandSample,
  type NormalizedLandmark,
  type ScreenPoint,
  type ViewportSize,
} from './classifier';
import { clampGestureScale, type GestureScrollDirection, type GestureSwipeDirection } from './actions';

interface GestureFrame {
  hands: NormalizedLandmark[][];
  now: number;
  viewport: ViewportSize;
  currentScale: number;
}

export type GestureIntent =
  | { type: 'click'; point: ScreenPoint }
  | { type: 'rightClick'; point: ScreenPoint }
  | { type: 'swipe'; dir: GestureSwipeDirection }
  | { type: 'scroll'; dir: GestureScrollDirection; point: ScreenPoint }
  | { type: 'scale'; scale: number };

export interface GestureControllerOutput {
  cursor: ScreenPoint | null;
  pose: HandPose;
  status: string;
  hands: number;
  pinchProgress: number;
  intents: GestureIntent[];
}

export interface GestureController {
  update: (frame: GestureFrame) => GestureControllerOutput;
  reset: () => void;
}

interface SwipePoint {
  x: number;
  y: number;
  t: number;
}

type PinchKind = 'index' | 'middle';

const CURSOR_SMOOTHING = 0.58;
const HAND_LOST_MS = 850;
const PINCH_HOLD_CLICK_MS = 350;
const CLICK_COOLDOWN_MS = 260;
const SWIPE_WINDOW_MS = 280;
const SWIPE_DISTANCE = 0.17;
const SWIPE_VELOCITY = 0.95;
const SWIPE_VERTICAL_LIMIT = 0.14;
const SWIPE_COOLDOWN_MS = 850;
const SCROLL_WINDOW_MS = 320;
const SCROLL_DISTANCE = 0.06;
const SCROLL_VELOCITY = 0.32;
const SCROLL_HORIZONTAL_LIMIT = 0.18;
const SCROLL_COOLDOWN_MS = 280;
const SCROLL_ARM_MS = 120;
const FIST_PAUSE_MS = 220;
const ZOOM_ARM_MS = 180;
const ZOOM_DEADZONE = 0.025;
const ZOOM_GAIN = 1.05;
const MIN_ZOOM_DISTANCE = 0.11;

function isPointShape(sample: HandSample) {
  const { fingers } = sample;
  return fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky;
}

function isScrollShape(sample: HandSample) {
  const { fingers } = sample;
  return fingers.index && fingers.middle && !fingers.ring && !fingers.pinky;
}

function clampPoint(point: ScreenPoint, viewport: ViewportSize): ScreenPoint {
  return {
    x: Math.min(viewport.width - 1, Math.max(0, point.x)),
    y: Math.min(viewport.height - 1, Math.max(0, point.y)),
  };
}

function midpoint(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) };
}

function isZoomReady(samples: HandSample[]) {
  return (
    samples.length >= 2 &&
    samples
      .slice(0, 2)
      .every(
        sample =>
          sample.fingers.extendedCount >= 3 &&
          sample.pinchRatio > PINCH_OFF_RATIO &&
          sample.middlePinchRatio > PINCH_OFF_RATIO,
      )
  );
}

function pinchRatioForKind(sample: HandSample, kind: PinchKind) {
  return kind === 'middle' ? sample.middlePinchRatio : sample.pinchRatio;
}

function pinchCenterForKind(sample: HandSample, kind: PinchKind) {
  return kind === 'middle' ? sample.middlePinchCenter : sample.pinchCenter;
}

function canUsePinch(sample: HandSample, kind: PinchKind, threshold: number) {
  if (kind === 'index') return sample.pinchRatio < threshold;

  const middlePinch = sample.middlePinchRatio < threshold;
  if (!middlePinch || isPointShape(sample)) return false;
  return sample.fingers.middle && !sample.fingers.index;
}

function bestPinchKind(sample: HandSample, threshold: number): PinchKind | null {
  const indexPinch = canUsePinch(sample, 'index', threshold);
  const middlePinch = canUsePinch(sample, 'middle', threshold);

  if (!indexPinch && !middlePinch) return null;
  if (indexPinch && !middlePinch) return 'index';
  if (middlePinch && !indexPinch) return 'middle';
  return sample.middlePinchRatio < sample.pinchRatio ? 'middle' : 'index';
}

function bestPinchRatio(sample: HandSample) {
  const indexRatio = canUsePinch(sample, 'index', PINCH_ON_RATIO) ? sample.pinchRatio : Number.POSITIVE_INFINITY;
  const middleRatio = canUsePinch(sample, 'middle', PINCH_ON_RATIO)
    ? sample.middlePinchRatio
    : Number.POSITIVE_INFINITY;
  return Math.min(indexRatio, middleRatio);
}

function pinchKindForHand(sample: HandSample, activeKind: PinchKind | null): PinchKind | null {
  if (activeKind && canUsePinch(sample, activeKind, PINCH_OFF_RATIO)) return activeKind;
  return bestPinchKind(sample, PINCH_ON_RATIO);
}

function choosePrimaryHand(samples: HandSample[], activeKind: PinchKind | null) {
  if (activeKind) {
    return samples.reduce((best, sample) =>
      pinchRatioForKind(sample, activeKind) < pinchRatioForKind(best, activeKind) ? sample : best,
    );
  }

  if (samples.some(sample => bestPinchRatio(sample) < PINCH_ON_RATIO)) {
    return samples.reduce((best, sample) =>
      bestPinchRatio(sample) < bestPinchRatio(best) ? sample : best,
    );
  }

  const scrollHand = samples.find(sample => isScrollShape(sample));
  if (scrollHand) return scrollHand;

  return samples.find(sample => sample.fingers.index && sample.fingers.extendedCount <= 2) ?? samples[0];
}

class GestureControllerImpl implements GestureController {
  private cursor: ScreenPoint | null = null;
  private pinchKind: PinchKind | null = null;
  private pinchStartedAt = 0;
  private lastPinchPoint: ScreenPoint | null = null;
  private pinchClickFired = false;
  private lastClickAt = 0;
  private lastHandSeenAt = 0;
  private swipeHistory: SwipePoint[] = [];
  private lastSwipeAt = 0;
  private scrollHistory: SwipePoint[] = [];
  private lastScrollAt = 0;
  private scrollStartedAt = 0;
  private fistStartedAt = 0;
  private zoomCandidateStartedAt = 0;
  private zooming = false;
  private zoomStartDistance = 0;
  private zoomStartScale = 1;

  reset() {
    this.cursor = null;
    this.pinchKind = null;
    this.pinchStartedAt = 0;
    this.lastPinchPoint = null;
    this.pinchClickFired = false;
    this.lastHandSeenAt = 0;
    this.swipeHistory = [];
    this.scrollHistory = [];
    this.scrollStartedAt = 0;
    this.fistStartedAt = 0;
    this.zoomCandidateStartedAt = 0;
    this.zooming = false;
  }

  update(frame: GestureFrame): GestureControllerOutput {
    const samples = frame.hands
      .filter(hand => hand.length > 20)
      .map(hand => classifyHand(hand));
    const intents: GestureIntent[] = [];

    if (samples.length === 0) {
      this.pinchKind = null;
      this.lastPinchPoint = null;
      this.pinchClickFired = false;
      this.swipeHistory = [];
      this.scrollHistory = [];
      this.scrollStartedAt = 0;
      this.fistStartedAt = 0;
      this.zoomCandidateStartedAt = 0;
      this.zooming = false;
      if (!this.lastHandSeenAt || frame.now - this.lastHandSeenAt > HAND_LOST_MS) this.cursor = null;
      return {
        cursor: this.cursor,
        pose: 'none',
        status: 'No hand',
        hands: 0,
        pinchProgress: 0,
        intents,
      };
    }

    this.lastHandSeenAt = frame.now;

    const zoomOutput = this.updateZoom(samples, frame, intents);
    if (zoomOutput) return zoomOutput;

    const primary = choosePrimaryHand(samples, this.pinchKind);
    const nextPinchKind = pinchKindForHand(primary, this.pinchKind);

    const pose = poseForHand(primary, nextPinchKind !== null);
    if (nextPinchKind) this.updatePinchCursor(primary, nextPinchKind, frame.viewport);
    else this.updateCursor(primary, pose, frame.viewport);
    const pinchProgress = this.updatePinch(nextPinchKind, frame.now, intents);
    this.updateScroll(primary, pose, frame.now, frame.viewport, intents);
    this.updateSwipe(primary, pose, frame.now, intents);
    this.pinchKind = nextPinchKind;

    if (pose === 'fist') {
      if (!this.fistStartedAt) this.fistStartedAt = frame.now;
      if (frame.now - this.fistStartedAt >= FIST_PAUSE_MS) this.cursor = null;
      this.swipeHistory = [];
      return {
        cursor: this.cursor,
        pose,
        status: 'Fist: paused',
        hands: samples.length,
        pinchProgress: 0,
        intents,
      };
    }
    this.fistStartedAt = 0;

    return {
      cursor: this.cursor,
      pose,
      status: statusForPose(pose, pinchProgress, this.pinchClickFired, nextPinchKind),
      hands: samples.length,
      pinchProgress,
      intents,
    };
  }

  private updateZoom(
    samples: HandSample[],
    frame: GestureFrame,
    intents: GestureIntent[],
  ): GestureControllerOutput | null {
    if (!isZoomReady(samples)) {
      this.zoomCandidateStartedAt = 0;
      this.zooming = false;
      return null;
    }

    this.pinchKind = null;
    this.lastPinchPoint = null;
    this.pinchClickFired = false;
    this.swipeHistory = [];
    this.scrollHistory = [];
    this.scrollStartedAt = 0;
    this.fistStartedAt = 0;

    const [first, second] = samples;
    const distance = distance2d(first.palmCenter, second.palmCenter);
    const firstPoint = toScreenPoint(first.palmCenter, frame.viewport);
    const secondPoint = toScreenPoint(second.palmCenter, frame.viewport);
    this.cursor = midpoint(firstPoint, secondPoint);

    if (!this.zoomCandidateStartedAt) this.zoomCandidateStartedAt = frame.now;

    if (!this.zooming && frame.now - this.zoomCandidateStartedAt >= ZOOM_ARM_MS) {
      this.zooming = distance >= MIN_ZOOM_DISTANCE;
      this.zoomStartDistance = Math.max(distance, MIN_ZOOM_DISTANCE);
      this.zoomStartScale = frame.currentScale;
    }

    if (this.zooming) {
      const ratio = distance / this.zoomStartDistance;
      const gained = 1 + (ratio - 1) * ZOOM_GAIN;
      const nextScale = clampGestureScale(this.zoomStartScale * gained);
      if (Math.abs(nextScale - frame.currentScale) > ZOOM_DEADZONE) {
        intents.push({ type: 'scale', scale: nextScale });
      }
    }

    const scale = intents.find(intent => intent.type === 'scale')?.scale ?? frame.currentScale;
    return {
      cursor: this.cursor,
      pose: 'zoom',
      status: this.zooming ? `Zoom ${Math.round(scale * 100)}%` : 'Hold both palms to zoom',
      hands: samples.length,
      pinchProgress: 0,
      intents,
    };
  }

  private updatePinchCursor(sample: HandSample, kind: PinchKind, viewport: ViewportSize) {
    const target = clampPoint(toScreenPoint(pinchCenterForKind(sample, kind), viewport), viewport);
    if (this.pinchKind !== kind || !this.lastPinchPoint) this.lastPinchPoint = this.cursor ?? target;
    this.cursor = this.lastPinchPoint;
  }

  private updateCursor(sample: HandSample, pose: HandPose, viewport: ViewportSize) {
    if (!sample.fingers.index && pose !== 'point' && pose !== 'pinch' && pose !== 'scroll') {
      return;
    }

    const targetPoint = sample.fingers.index ? sample.indexTip : pointForPose(sample, pose);
    const target = clampPoint(toScreenPoint(targetPoint, viewport), viewport);
    if (!this.cursor) {
      this.cursor = target;
      return;
    }

    this.cursor = {
      x: this.cursor.x * CURSOR_SMOOTHING + target.x * (1 - CURSOR_SMOOTHING),
      y: this.cursor.y * CURSOR_SMOOTHING + target.y * (1 - CURSOR_SMOOTHING),
    };
  }

  private updatePinch(nextPinchKind: PinchKind | null, now: number, intents: GestureIntent[]) {
    if (nextPinchKind && this.pinchKind !== nextPinchKind) {
      this.pinchStartedAt = now;
      this.pinchClickFired = false;
      this.lastPinchPoint = this.lastPinchPoint ?? this.cursor;
      return 0;
    }

    if (nextPinchKind) {
      this.lastPinchPoint = this.cursor ?? this.lastPinchPoint;
      const heldFor = now - this.pinchStartedAt;
      const progress = Math.min(1, heldFor / PINCH_HOLD_CLICK_MS);
      const point = this.lastPinchPoint;
      if (
        point &&
        progress >= 1 &&
        !this.pinchClickFired &&
        now - this.lastClickAt > CLICK_COOLDOWN_MS
      ) {
        intents.push({ type: nextPinchKind === 'middle' ? 'rightClick' : 'click', point });
        this.pinchClickFired = true;
        this.lastClickAt = now;
      }
      return progress;
    }

    if (this.pinchKind) {
      this.lastPinchPoint = null;
      this.pinchClickFired = false;
    }
    return 0;
  }

  private updateScroll(
    sample: HandSample,
    pose: HandPose,
    now: number,
    viewport: ViewportSize,
    intents: GestureIntent[],
  ) {
    if (pose !== 'scroll') {
      this.scrollHistory = [];
      this.scrollStartedAt = 0;
      return;
    }

    if (!this.scrollStartedAt) this.scrollStartedAt = now;
    if (now - this.scrollStartedAt < SCROLL_ARM_MS) return;

    this.scrollHistory.push({ x: 1 - sample.scrollCenter.x, y: sample.scrollCenter.y, t: now });
    this.scrollHistory = this.scrollHistory.filter(point => now - point.t <= SCROLL_WINDOW_MS);
    if (this.scrollHistory.length < 3 || now - this.lastScrollAt <= SCROLL_COOLDOWN_MS) return;

    const first = this.scrollHistory[0];
    const last = this.scrollHistory[this.scrollHistory.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (dt <= 0.05) return;

    const dx = Math.abs(last.x - first.x);
    const dy = last.y - first.y;
    const velocity = dy / dt;
    if (Math.abs(dy) < SCROLL_DISTANCE || Math.abs(velocity) < SCROLL_VELOCITY || dx > SCROLL_HORIZONTAL_LIMIT) {
      return;
    }

    intents.push({
      type: 'scroll',
      dir: dy < 0 ? 'down' : 'up',
      point: clampPoint(toScreenPoint(sample.scrollCenter, viewport), viewport),
    });
    this.lastScrollAt = now;
    this.scrollHistory = [];
  }

  private updateSwipe(sample: HandSample, pose: HandPose, now: number, intents: GestureIntent[]) {
    if (pose !== 'open') {
      this.swipeHistory = [];
      return;
    }

    this.swipeHistory.push({ x: 1 - sample.wrist.x, y: sample.wrist.y, t: now });
    this.swipeHistory = this.swipeHistory.filter(point => now - point.t <= SWIPE_WINDOW_MS);
    if (this.swipeHistory.length < 3 || now - this.lastSwipeAt <= SWIPE_COOLDOWN_MS) return;

    const first = this.swipeHistory[0];
    const last = this.swipeHistory[this.swipeHistory.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (dt <= 0.05) return;

    const dx = last.x - first.x;
    const dy = Math.abs(last.y - first.y);
    const velocity = dx / dt;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(velocity) < SWIPE_VELOCITY || dy > SWIPE_VERTICAL_LIMIT) {
      return;
    }

    intents.push({ type: 'swipe', dir: dx > 0 ? 'right' : 'left' });
    this.lastSwipeAt = now;
    this.swipeHistory = [];
  }
}

function statusForPose(
  pose: HandPose,
  pinchProgress: number,
  pinchClickFired: boolean,
  pinchKind: PinchKind | null,
) {
  if (pose === 'point') return 'Point: aim';
  if (pose === 'pinch') {
    const action = pinchKind === 'middle' ? 'right-click' : 'click';
    if (pinchClickFired) return `${action === 'right-click' ? 'Right-clicked' : 'Clicked'} - release pinch`;
    if (pinchProgress > 0) return `Hold ${action} ${Math.round(pinchProgress * 100)}%`;
    return `Hold pinch to ${action}`;
  }
  if (pose === 'scroll') return 'Two-finger swipe: scroll';
  if (pose === 'open') return 'Open palm: swipe left or right';
  if (pose === 'fist') return 'Fist: paused';
  return 'Relax hand or point';
}

export function createGestureController(): GestureController {
  return new GestureControllerImpl();
}
