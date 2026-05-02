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
import { clampGestureScale, type GestureSwipeDirection } from './actions';

interface GestureFrame {
  hands: NormalizedLandmark[][];
  now: number;
  viewport: ViewportSize;
  currentScale: number;
}

export type GestureIntent =
  | { type: 'click'; point: ScreenPoint }
  | { type: 'swipe'; dir: GestureSwipeDirection }
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

const CURSOR_SMOOTHING = 0.58;
const HAND_LOST_MS = 350;
const PINCH_HOLD_CLICK_MS = 280;
const CLICK_COOLDOWN_MS = 260;
const SWIPE_WINDOW_MS = 280;
const SWIPE_DISTANCE = 0.17;
const SWIPE_VELOCITY = 0.95;
const SWIPE_VERTICAL_LIMIT = 0.14;
const SWIPE_COOLDOWN_MS = 850;
const ZOOM_ARM_MS = 180;
const ZOOM_DEADZONE = 0.025;
const ZOOM_GAIN = 1.05;
const MIN_ZOOM_DISTANCE = 0.11;

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
      .every(sample => sample.fingers.extendedCount >= 3 && sample.pinchRatio > PINCH_OFF_RATIO)
  );
}

function choosePrimaryHand(samples: HandSample[], pinching: boolean) {
  if (pinching || samples.some(sample => sample.pinchRatio < PINCH_ON_RATIO)) {
    return samples.reduce((best, sample) => (sample.pinchRatio < best.pinchRatio ? sample : best));
  }
  return samples.find(sample => sample.fingers.index && sample.fingers.extendedCount <= 2) ?? samples[0];
}

class GestureControllerImpl implements GestureController {
  private cursor: ScreenPoint | null = null;
  private pinching = false;
  private pinchStartedAt = 0;
  private lastPinchPoint: ScreenPoint | null = null;
  private pinchClickFired = false;
  private lastClickAt = 0;
  private lastHandSeenAt = 0;
  private swipeHistory: SwipePoint[] = [];
  private lastSwipeAt = 0;
  private zoomCandidateStartedAt = 0;
  private zooming = false;
  private zoomStartDistance = 0;
  private zoomStartScale = 1;

  reset() {
    this.cursor = null;
    this.pinching = false;
    this.pinchStartedAt = 0;
    this.lastPinchPoint = null;
    this.pinchClickFired = false;
    this.lastHandSeenAt = 0;
    this.swipeHistory = [];
    this.zoomCandidateStartedAt = 0;
    this.zooming = false;
  }

  update(frame: GestureFrame): GestureControllerOutput {
    const samples = frame.hands
      .filter(hand => hand.length > 20)
      .map(hand => classifyHand(hand));
    const intents: GestureIntent[] = [];

    if (samples.length === 0) {
      this.pinching = false;
      this.lastPinchPoint = null;
      this.pinchClickFired = false;
      this.swipeHistory = [];
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

    const primary = choosePrimaryHand(samples, this.pinching);
    let nextPinching = this.pinching;
    if (!nextPinching && primary.pinchRatio < PINCH_ON_RATIO) nextPinching = true;
    if (nextPinching && primary.pinchRatio > PINCH_OFF_RATIO) nextPinching = false;

    const pose = poseForHand(primary, nextPinching);
    if (nextPinching) this.updatePinchCursor(primary, frame.viewport);
    else this.updateCursor(primary, pose, frame.viewport);
    const pinchProgress = this.updatePinch(nextPinching, frame.now, intents);
    this.updateSwipe(primary, pose, frame.now, intents);
    this.pinching = nextPinching;

    if (pose === 'fist') {
      this.cursor = null;
      this.swipeHistory = [];
      return {
        cursor: null,
        pose,
        status: 'Fist: paused',
        hands: samples.length,
        pinchProgress: 0,
        intents,
      };
    }

    return {
      cursor: this.cursor,
      pose,
      status: statusForPose(pose, pinchProgress, this.pinchClickFired),
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

    this.pinching = false;
    this.lastPinchPoint = null;
    this.pinchClickFired = false;
    this.swipeHistory = [];

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

  private updatePinchCursor(sample: HandSample, viewport: ViewportSize) {
    const target = clampPoint(toScreenPoint(pointForPose(sample, 'pinch'), viewport), viewport);
    if (!this.pinching || !this.lastPinchPoint) this.lastPinchPoint = this.cursor ?? target;
    this.cursor = this.lastPinchPoint;
  }

  private updateCursor(sample: HandSample, pose: HandPose, viewport: ViewportSize) {
    if (pose !== 'point' && pose !== 'pinch') {
      this.cursor = null;
      return;
    }

    const target = clampPoint(toScreenPoint(pointForPose(sample, pose), viewport), viewport);
    if (!this.cursor) {
      this.cursor = target;
      return;
    }

    this.cursor = {
      x: this.cursor.x * CURSOR_SMOOTHING + target.x * (1 - CURSOR_SMOOTHING),
      y: this.cursor.y * CURSOR_SMOOTHING + target.y * (1 - CURSOR_SMOOTHING),
    };
  }

  private updatePinch(nextPinching: boolean, now: number, intents: GestureIntent[]) {
    if (nextPinching && !this.pinching) {
      this.pinchStartedAt = now;
      this.pinchClickFired = false;
      this.lastPinchPoint = this.lastPinchPoint ?? this.cursor;
      return 0;
    }

    if (nextPinching) {
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
        intents.push({ type: 'click', point });
        this.pinchClickFired = true;
        this.lastClickAt = now;
      }
      return progress;
    }

    if (this.pinching) {
      this.lastPinchPoint = null;
      this.pinchClickFired = false;
    }
    return 0;
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

function statusForPose(pose: HandPose, pinchProgress: number, pinchClickFired: boolean) {
  if (pose === 'point') return 'Point: aim';
  if (pose === 'pinch') {
    if (pinchClickFired) return 'Clicked - release pinch';
    if (pinchProgress > 0) return `Hold pinch ${Math.round(pinchProgress * 100)}%`;
    return 'Hold pinch to click';
  }
  if (pose === 'open') return 'Open palm: swipe left or right';
  if (pose === 'fist') return 'Fist: paused';
  return 'Relax hand or point';
}

export function createGestureController(): GestureController {
  return new GestureControllerImpl();
}
