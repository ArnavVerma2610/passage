'use client';

/**
 * Webcam-driven gesture control.
 *
 * Architecture:
 *   - MediaPipe HandLandmarker runs in the browser (loaded lazily from a CDN)
 *     and produces 21 normalized landmarks per detected hand at ~25 fps.
 *   - A frame loop (requestAnimationFrame on the <video>) classifies a small
 *     state machine each tick:
 *       POINT  → index extended, others curled        → cursor mode
 *       OPEN   → all four fingers extended            → swipe candidate
 *       PINCH  → thumb tip + index tip < threshold    → zoom / right-click candidate
 *       FIST   → all four curled                      → idle
 *   - Cursor position is the smoothed index-tip coordinate (POINT mode) or
 *     the mid-pinch coordinate (PINCH mode).
 *   - Gestures dispatched to the page:
 *       Double tap (2 quick index flexions in POINT) → synthesizes a click
 *         on document.elementFromPoint(cursor).
 *       Double pinch (2 quick pinch-and-release events) → synthesizes a
 *         contextmenu (right click) at cursor.
 *       Pinch + hold (>250ms) + distance change       → applies CSS zoom to
 *         document.documentElement.
 *       Open-hand swipe (horizontal velocity above threshold) → clicks
 *         the matching aria-label button (Skip / Save / Back).
 *   - Any real mousemove / touch / keydown event hides the gesture cursor
 *     instantly; the cursor reappears the next time a hand is detected.
 */

import { useEffect, useRef, useState } from 'react';
import { usePassageStore } from '@/lib/store';

// ── tunables ─────────────────────────────────────────────────────────────
const PINCH_DISTANCE_ON = 0.055;
const PINCH_DISTANCE_OFF = 0.085;
const SWIPE_VELOCITY = 1.6;
const SWIPE_COOLDOWN_MS = 700;
const DOUBLE_TAP_WINDOW_MS = 550;
const DOUBLE_PINCH_WINDOW_MS = 600;
const ZOOM_HOLD_MS = 250;
const ZOOM_GAIN = 1.6;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.8;
const CURSOR_SMOOTHING = 0.55;
const TAP_FLEX_DELTA = 0.04;
const TAP_RELEASE_MS = 280;

// MediaPipe landmark indices.
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

function dist2d(a: NormalizedLandmark, b: NormalizedLandmark) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function fingerExtended(landmarks: NormalizedLandmark[], tipIdx: number, pipIdx: number) {
  const wrist = landmarks[WRIST];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  return dist2d(tip, wrist) > dist2d(pip, wrist) * 1.05;
}

type Pose = 'point' | 'open' | 'pinch' | 'fist' | 'unknown';

function classifyPose(landmarks: NormalizedLandmark[], pinching: boolean): Pose {
  const indexExt = fingerExtended(landmarks, INDEX_TIP, INDEX_PIP);
  const middleExt = fingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP);
  const ringExt = fingerExtended(landmarks, RING_TIP, RING_PIP);
  const pinkyExt = fingerExtended(landmarks, PINKY_TIP, PINKY_PIP);
  const extCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  if (pinching) return 'pinch';
  if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'point';
  if (extCount >= 3) return 'open';
  if (extCount === 0) return 'fist';
  return 'unknown';
}

interface IconProps {
  size?: number;
}

function EyeOffIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

function EyeIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HelpIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CloseIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
      <path
        d="M2 2 L12 12 M12 2 L2 12"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

const GESTURE_LIST = [
  { name: 'Point + move', desc: 'Index finger only — moves the cursor blob' },
  { name: 'Double tap', desc: 'Quickly flex your index twice — left click at cursor' },
  { name: 'Pinch + hold', desc: 'Thumb to index, hold + spread → zoom in / pinch in → zoom out' },
  { name: 'Double pinch', desc: 'Two quick pinch-and-releases — right click at cursor' },
  { name: 'Open-hand swipe', desc: 'All fingers extended, swipe left/right — like a touch swipe' },
];

export default function GestureControl() {
  const enabled = usePassageStore(s => s.gestureEnabled);
  const setEnabled = usePassageStore(s => s.setGestureEnabled);
  const previewHidden = usePassageStore(s => s.gesturePreviewHidden);
  const setPreviewHidden = usePassageStore(s => s.setGesturePreviewHidden);
  const legendOpen = usePassageStore(s => s.gestureLegendOpen);
  const setLegendOpen = usePassageStore(s => s.setGestureLegendOpen);
  const _hasHydrated = usePassageStore(s => s._hasHydrated);

  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [poseLabel, setPoseLabel] = useState<Pose>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [showCursor, setShowCursor] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  // ── single-lifecycle effect: webcam + model + frame loop ─────────────
  useEffect(() => {
    if (!_hasHydrated || !enabled) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: {
      detectForVideo: (v: HTMLVideoElement, ts: number) => unknown;
      close?: () => void;
    } | null = null;
    let rafId: number | null = null;
    let lastGestureMoveAt = 0;

    const state = {
      pinching: false,
      pinchStartedAt: 0,
      pinchInitialDistance: 0,
      zoomMode: false,
      zoomBaseline: 1,
      lastPinchReleaseAt: 0,
      pinchReleaseCount: 0,
      lastTapAt: 0,
      tapStartIndexY: 0,
      tapPhase: 'idle' as 'idle' | 'flexing' | 'released',
      tapStartedAt: 0,
      tapCount: 0,
      swipeLastTriggerAt: 0,
      handPositionHistory: [] as { x: number; t: number }[],
      lastHandSeenAt: 0,
      cursorPos: null as { x: number; y: number } | null,
    };

    // Mouse-revert listeners — any real input hides the gesture cursor.
    const onMouseMove = () => {
      if (Date.now() - lastGestureMoveAt > 250) setShowCursor(false);
    };
    const onKeyDown = () => setShowCursor(false);
    const onTouchStart = () => setShowCursor(false);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    function synthesizeClick(x: number, y: number, button: 0 | 2 = 0) {
      const target = document.elementFromPoint(x, y);
      if (!target) return;
      const eventName = button === 2 ? 'contextmenu' : 'click';
      const ev = new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button,
      });
      target.dispatchEvent(ev);
      if (button === 0 && target instanceof HTMLElement) {
        try {
          target.click();
        } catch {
          // ignore
        }
      }
    }

    function triggerSwipe(dir: 'left' | 'right') {
      const label = dir === 'left' ? 'Skip' : 'Save';
      const btn = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
      if (btn) {
        btn.click();
        return;
      }
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const target = document.elementFromPoint(cx, cy) ?? document.body;
      target.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy }),
      );
      target.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: dir === 'right' ? cx + 220 : cx - 220,
          clientY: cy,
        }),
      );
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: cx, clientY: cy }));
    }

    function applyZoomDelta(delta: number) {
      const root = document.documentElement;
      const current = parseFloat(root.style.zoom || '1') || 1;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current + delta));
      root.style.zoom = String(next);
    }

    function tick() {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const result = landmarker.detectForVideo(video, performance.now()) as
        | { landmarks?: NormalizedLandmark[][] }
        | undefined;
      const hand = result?.landmarks?.[0];
      const now = performance.now();

      if (!hand) {
        if (state.lastHandSeenAt && now - state.lastHandSeenAt > 400) {
          if (state.cursorPos !== null) {
            state.cursorPos = null;
            setCursor(null);
            setPoseLabel('unknown');
          }
          state.handPositionHistory = [];
          state.tapPhase = 'idle';
        }
        rafId = requestAnimationFrame(tick);
        return;
      }
      state.lastHandSeenAt = now;

      // Pinch state with hysteresis
      const pinchD = dist2d(hand[THUMB_TIP], hand[INDEX_TIP]);
      let pinching = state.pinching;
      if (!pinching && pinchD < PINCH_DISTANCE_ON) pinching = true;
      else if (pinching && pinchD > PINCH_DISTANCE_OFF) pinching = false;

      const pose = classifyPose(hand, pinching);
      setPoseLabel(pose);

      // Cursor target
      let targetX = hand[INDEX_TIP].x;
      let targetY = hand[INDEX_TIP].y;
      if (pose === 'pinch') {
        targetX = (hand[THUMB_TIP].x + hand[INDEX_TIP].x) / 2;
        targetY = (hand[THUMB_TIP].y + hand[INDEX_TIP].y) / 2;
      } else if (pose === 'open' || pose === 'fist') {
        targetX = hand[WRIST].x;
        targetY = hand[WRIST].y;
      }
      // Mirror X (selfie cam).
      targetX = 1 - targetX;

      const tcx = Math.round(targetX * window.innerWidth);
      const tcy = Math.round(targetY * window.innerHeight);
      const prev = state.cursorPos;
      const sx = prev ? prev.x * CURSOR_SMOOTHING + tcx * (1 - CURSOR_SMOOTHING) : tcx;
      const sy = prev ? prev.y * CURSOR_SMOOTHING + tcy * (1 - CURSOR_SMOOTHING) : tcy;
      state.cursorPos = { x: sx, y: sy };
      setCursor({ x: sx, y: sy });
      lastGestureMoveAt = Date.now();
      setShowCursor(true);

      // Hover synthesis
      const hoverEv = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: sx,
        clientY: sy,
      });
      const hoverTarget = document.elementFromPoint(sx, sy);
      if (hoverTarget) hoverTarget.dispatchEvent(hoverEv);

      // PINCH transitions → zoom + double-pinch (right click)
      if (pinching && !state.pinching) {
        state.pinchStartedAt = now;
        state.pinchInitialDistance = pinchD;
        state.zoomMode = false;
      } else if (!pinching && state.pinching) {
        const heldFor = now - state.pinchStartedAt;
        if (!state.zoomMode && heldFor < ZOOM_HOLD_MS + 50) {
          if (now - state.lastPinchReleaseAt < DOUBLE_PINCH_WINDOW_MS) {
            state.pinchReleaseCount += 1;
          } else {
            state.pinchReleaseCount = 1;
          }
          state.lastPinchReleaseAt = now;
          if (state.pinchReleaseCount >= 2) {
            state.pinchReleaseCount = 0;
            const c = state.cursorPos;
            if (c) synthesizeClick(c.x, c.y, 2);
          }
        }
        state.zoomMode = false;
      } else if (pinching && state.pinching) {
        const heldFor = now - state.pinchStartedAt;
        if (heldFor > ZOOM_HOLD_MS && !state.zoomMode) {
          state.zoomMode = true;
          state.zoomBaseline = pinchD;
        }
        if (state.zoomMode) {
          const delta = (pinchD - state.zoomBaseline) * ZOOM_GAIN;
          if (Math.abs(delta) > 0.005) {
            applyZoomDelta(delta);
            state.zoomBaseline = pinchD;
          }
        }
      }
      state.pinching = pinching;

      // POINT mode → double-tap detection
      if (pose === 'point') {
        const indexY = hand[INDEX_TIP].y;
        if (state.tapPhase === 'idle') {
          state.tapStartIndexY = indexY;
          state.tapPhase = 'released';
          state.tapStartedAt = now;
        } else if (state.tapPhase === 'released') {
          if (indexY - state.tapStartIndexY > TAP_FLEX_DELTA) {
            state.tapPhase = 'flexing';
            state.tapStartedAt = now;
          }
        } else if (state.tapPhase === 'flexing') {
          if (now - state.tapStartedAt > TAP_RELEASE_MS) {
            state.tapPhase = 'idle';
          } else if (indexY - state.tapStartIndexY < TAP_FLEX_DELTA / 2) {
            state.tapPhase = 'released';
            state.tapStartIndexY = indexY;
            if (now - state.lastTapAt < DOUBLE_TAP_WINDOW_MS) {
              state.tapCount += 1;
            } else {
              state.tapCount = 1;
            }
            state.lastTapAt = now;
            if (state.tapCount >= 2) {
              state.tapCount = 0;
              const c = state.cursorPos;
              if (c) synthesizeClick(c.x, c.y, 0);
            }
          }
        }
      } else {
        state.tapPhase = 'idle';
        state.tapCount = 0;
      }

      // OPEN-HAND swipe
      if (pose === 'open') {
        state.handPositionHistory.push({ x: 1 - hand[WRIST].x, t: now });
        state.handPositionHistory = state.handPositionHistory.filter(p => now - p.t < 250);
        if (state.handPositionHistory.length >= 3) {
          const first = state.handPositionHistory[0];
          const last = state.handPositionHistory[state.handPositionHistory.length - 1];
          const dt = (last.t - first.t) / 1000;
          if (dt > 0.05) {
            const vx = (last.x - first.x) / dt;
            if (
              Math.abs(vx) > SWIPE_VELOCITY &&
              now - state.swipeLastTriggerAt > SWIPE_COOLDOWN_MS
            ) {
              state.swipeLastTriggerAt = now;
              triggerSwipe(vx > 0 ? 'right' : 'left');
              state.handPositionHistory = [];
            }
          }
        }
      } else {
        state.handPositionHistory = [];
      }

      rafId = requestAnimationFrame(tick);
    }

    async function bootstrap() {
      // Defer state mutations so they don't fire synchronously inside the effect body.
      await Promise.resolve();
      if (cancelled) return;
      setError(null);
      setStatusMsg('Loading hand model…');
      try {
        const mp = await import('@mediapipe/tasks-vision');
        if (cancelled) return;
        const filesetResolver = await mp.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
        );
        if (cancelled) return;
        const lm = await mp.HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
        if (cancelled) {
          if (typeof lm.close === 'function') lm.close();
          return;
        }
        landmarker = lm as typeof landmarker;
        setStatusMsg('Requesting camera…');
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          userStream.getTracks().forEach(t => t.stop());
          return;
        }
        stream = userStream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = userStream;
        await video.play();
        if (cancelled) return;
        setStatusMsg(null);
        rafId = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Could not start camera';
        setError(msg);
        setStatusMsg(null);
        setEnabled(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (landmarker && typeof landmarker.close === 'function') landmarker.close();
      // Note: video element unmounts with the component; no need to touch it here.
      document.documentElement.style.zoom = '';
      setCursor(null);
      setPoseLabel('unknown');
      setStatusMsg(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, _hasHydrated]);

  if (!_hasHydrated) return null;
  if (!enabled) return null;

  return (
    <>
      {/* Floating webcam preview */}
      {!previewHidden && (
        <div
          className="fixed z-[400] flex flex-col border border-ghost bg-bg font-mono shadow-lg"
          style={{
            top: 'calc(16px + var(--safe-top))',
            right: 'calc(16px + var(--safe-right))',
            width: 200,
          }}
        >
          <div className="flex items-center justify-between border-b border-ghost px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: poseLabel === 'unknown' ? 'var(--c-faint)' : 'var(--c-success)',
                }}
              />
              <span>{poseLabel === 'unknown' ? 'NO HAND' : poseLabel.toUpperCase()}</span>
            </div>
            <button
              type="button"
              aria-label="Hide camera preview"
              onClick={() => setPreviewHidden(true)}
              className="flex h-5 w-5 cursor-pointer items-center justify-center border border-ghost bg-transparent text-faint"
            >
              <EyeOffIcon size={11} />
            </button>
          </div>
          <div className="relative bg-active" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="h-full w-full"
              style={{ transform: 'scaleX(-1)' }}
            />
            {statusMsg && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg/80 px-2 text-center text-[0.625rem] text-dim">
                {statusMsg}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[0.5625rem] tracking-[0.06em] text-faint">
            <span>GESTURE · LIVE</span>
            <button
              type="button"
              onClick={() => setEnabled(false)}
              className="cursor-pointer border border-ghost bg-transparent px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-[0.1em] text-dim"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Mini "show preview" tab when hidden */}
      {previewHidden && (
        <button
          type="button"
          aria-label="Show camera preview"
          onClick={() => setPreviewHidden(false)}
          className="fixed z-[400] flex h-9 w-9 cursor-pointer items-center justify-center border border-ghost bg-bg text-fg"
          style={{
            top: 'calc(16px + var(--safe-top))',
            right: 'calc(16px + var(--safe-right))',
          }}
          title="Show camera preview"
        >
          <EyeIcon size={14} />
        </button>
      )}

      {/* Cursor blob */}
      {cursor && showCursor && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[500] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: cursor.x,
            top: cursor.y,
            width: poseLabel === 'pinch' ? 22 : 28,
            height: poseLabel === 'pinch' ? 22 : 28,
            background:
              poseLabel === 'pinch'
                ? 'radial-gradient(circle at 35% 35%, rgba(106,156,106,0.95), rgba(106,156,106,0.25))'
                : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(255,255,255,0.15))',
            boxShadow: '0 0 24px 6px rgba(106,156,106,0.35)',
            mixBlendMode: 'difference',
            transition: 'width 120ms ease, height 120ms ease',
          }}
        />
      )}

      {/* Bottom legend bar */}
      <div
        className="fixed z-[400] font-mono"
        style={{
          left: 'calc(16px + var(--safe-left))',
          bottom: 'calc(16px + var(--safe-bottom))',
        }}
      >
        {legendOpen && (
          <div className="mb-2 max-w-[340px] border border-ghost bg-bg p-3 text-[0.6875rem] text-sub shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                Gesture controls
              </span>
              <button
                type="button"
                aria-label="Close legend"
                onClick={() => setLegendOpen(false)}
                className="flex h-5 w-5 cursor-pointer items-center justify-center border border-ghost bg-transparent text-faint"
              >
                <CloseIcon size={11} />
              </button>
            </div>
            {GESTURE_LIST.map(g => (
              <div key={g.name} className="mb-1.5 last:mb-0">
                <div className="text-[0.6875rem] text-fg">{g.name}</div>
                <div className="text-[0.625rem] leading-relaxed text-dim">{g.desc}</div>
              </div>
            ))}
            <div className="mt-2 border-t border-ghost pt-2 text-[0.625rem] italic text-faint">
              Use your mouse or keyboard at any time to take over instantly.
            </div>
          </div>
        )}
        <button
          type="button"
          aria-label="Gesture help"
          onClick={() => setLegendOpen(!legendOpen)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border border-ghost bg-bg text-fg"
          title="Gesture help"
        >
          <HelpIcon size={15} />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="fixed z-[600] border border-danger-border bg-bg px-3 py-2 text-[0.6875rem] text-danger shadow-lg"
          style={{
            top: 'calc(16px + var(--safe-top) + 240px)',
            right: 'calc(16px + var(--safe-right))',
            maxWidth: 240,
          }}
        >
          Gesture control failed: {error}
        </div>
      )}
    </>
  );
}
