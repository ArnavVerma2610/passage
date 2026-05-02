export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export type HandPose = 'none' | 'point' | 'pinch' | 'open' | 'fist' | 'relaxed' | 'zoom';

export interface FingerState {
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  extendedCount: number;
}

export interface HandSample {
  landmarks: NormalizedLandmark[];
  fingers: FingerState;
  pinchRatio: number;
  wrist: NormalizedLandmark;
  indexTip: NormalizedLandmark;
  pinchCenter: NormalizedPoint;
  palmCenter: NormalizedPoint;
}

export const PINCH_ON_RATIO = 0.42;
export const PINCH_OFF_RATIO = 0.58;

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

export function distance2d(a: NormalizedPoint, b: NormalizedPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function average(points: NormalizedPoint[]): NormalizedPoint {
  const total = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: total.x / points.length, y: total.y / points.length };
}

function fingerExtended(landmarks: NormalizedLandmark[], tipIdx: number, pipIdx: number) {
  const wrist = landmarks[WRIST];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  return distance2d(tip, wrist) > distance2d(pip, wrist) * 1.08;
}

export function classifyHand(landmarks: NormalizedLandmark[]): HandSample {
  const wrist = landmarks[WRIST];
  const indexTip = landmarks[INDEX_TIP];
  const thumbTip = landmarks[THUMB_TIP];
  const index = fingerExtended(landmarks, INDEX_TIP, INDEX_PIP);
  const middle = fingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP);
  const ring = fingerExtended(landmarks, RING_TIP, RING_PIP);
  const pinky = fingerExtended(landmarks, PINKY_TIP, PINKY_PIP);
  const palmWidth = distance2d(landmarks[INDEX_MCP], landmarks[PINKY_MCP]);
  const palmLength = distance2d(wrist, landmarks[MIDDLE_MCP]);
  const palmScale = Math.max(0.001, (palmWidth + palmLength) / 2);

  return {
    landmarks,
    fingers: {
      index,
      middle,
      ring,
      pinky,
      extendedCount: [index, middle, ring, pinky].filter(Boolean).length,
    },
    pinchRatio: distance2d(thumbTip, indexTip) / palmScale,
    wrist,
    indexTip,
    pinchCenter: midpoint(thumbTip, indexTip),
    palmCenter: average([wrist, landmarks[INDEX_MCP], landmarks[MIDDLE_MCP], landmarks[PINKY_MCP]]),
  };
}

export function poseForHand(sample: HandSample, pinching: boolean): HandPose {
  const { fingers } = sample;
  if (pinching) return 'pinch';
  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) return 'point';
  if (fingers.extendedCount >= 3) return 'open';
  if (fingers.extendedCount === 0) return 'fist';
  return 'relaxed';
}

export function pointForPose(sample: HandSample, pose: HandPose): NormalizedPoint {
  if (pose === 'pinch') return sample.pinchCenter;
  if (pose === 'point') return sample.indexTip;
  return sample.palmCenter;
}

export function toScreenPoint(point: NormalizedPoint, viewport: ViewportSize): ScreenPoint {
  return {
    x: Math.round((1 - point.x) * viewport.width),
    y: Math.round(point.y * viewport.height),
  };
}
