'use client';

import { useEffect, useRef, useState } from 'react';
import { useHandTracker } from '@/hooks/useHandTracker';
import {
  dispatchGestureClick,
  dispatchGestureHover,
  dispatchGestureSwipe,
} from '@/lib/gesture/actions';
import { createGestureController } from '@/lib/gesture/controller';
import type { HandPose, ScreenPoint } from '@/lib/gesture/classifier';
import { usePassageStore } from '@/lib/store';

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
  { name: 'Point', desc: 'Index finger only - move the cursor and hover targets.' },
  { name: 'Pinch click', desc: 'Touch thumb to index, then release - click at cursor.' },
  { name: 'Open-palm swipe', desc: 'Open palm, swipe left or right - skip or save the deck card.' },
  { name: 'Two-palm zoom', desc: 'Show both palms, then move them apart or together - app zoom.' },
  { name: 'Fist', desc: 'Close your hand - pause cursor and actions.' },
];

function labelForPose(pose: HandPose) {
  if (pose === 'none') return 'NO HAND';
  if (pose === 'zoom') return 'ZOOM';
  return pose.toUpperCase();
}

function cursorStyleForPose(pose: HandPose) {
  if (pose === 'pinch') {
    return {
      size: 22,
      background: 'radial-gradient(circle at 35% 35%, rgba(106,156,106,0.95), rgba(106,156,106,0.25))',
      shadow: '0 0 24px 6px rgba(106,156,106,0.35)',
    };
  }
  if (pose === 'zoom') {
    return {
      size: 34,
      background: 'radial-gradient(circle at 35% 35%, rgba(204,153,0,0.95), rgba(204,153,0,0.18))',
      shadow: '0 0 28px 8px rgba(204,153,0,0.25)',
    };
  }
  return {
    size: 28,
    background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(255,255,255,0.15))',
    shadow: '0 0 24px 6px rgba(106,156,106,0.24)',
  };
}

export default function GestureControl() {
  const enabled = usePassageStore(s => s.gestureEnabled);
  const setEnabled = usePassageStore(s => s.setGestureEnabled);
  const previewHidden = usePassageStore(s => s.gesturePreviewHidden);
  const setPreviewHidden = usePassageStore(s => s.setGesturePreviewHidden);
  const legendOpen = usePassageStore(s => s.gestureLegendOpen);
  const setLegendOpen = usePassageStore(s => s.setGestureLegendOpen);
  const gestureScale = usePassageStore(s => s.gestureScale);
  const setGestureScale = usePassageStore(s => s.setGestureScale);
  const _hasHydrated = usePassageStore(s => s._hasHydrated);

  const [cursor, setCursor] = useState<ScreenPoint | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('No hand');
  const [poseLabel, setPoseLabel] = useState<HandPose>('none');
  const [error, setError] = useState<string | null>(null);
  const [showCursor, setShowCursor] = useState(true);
  const [handsSeen, setHandsSeen] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [controller] = useState(createGestureController);
  const scaleRef = useRef(gestureScale);
  const lastGestureMoveAtRef = useRef(0);

  useEffect(() => {
    scaleRef.current = gestureScale;
  }, [gestureScale]);

  useEffect(() => {
    if (!enabled) controller.reset();
  }, [controller, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMouseMove = () => {
      if (Date.now() - lastGestureMoveAtRef.current > 250) setShowCursor(false);
    };
    const onKeyDown = () => setShowCursor(false);
    const onTouchStart = () => setShowCursor(false);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, [enabled]);

  useHandTracker({
    enabled: _hasHydrated && enabled,
    videoRef,
    onFrame: frame => {
      const output = controller.update({
        hands: frame.hands,
        now: frame.now,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        currentScale: scaleRef.current,
      });

      setCursor(output.cursor);
      setPoseLabel(output.pose);
      setActionMsg(output.status);
      setHandsSeen(output.hands);

      if (output.cursor) {
        setShowCursor(true);
        if (output.pose === 'point' || output.pose === 'pinch') {
          lastGestureMoveAtRef.current = Date.now();
          dispatchGestureHover(output.cursor);
        }
      }

      for (const intent of output.intents) {
        if (intent.type === 'click') dispatchGestureClick(intent.point);
        if (intent.type === 'swipe') dispatchGestureSwipe(intent.dir);
        if (intent.type === 'scale') {
          scaleRef.current = intent.scale;
          setGestureScale(intent.scale);
        }
      }
    },
    onStatus: status => {
      if (status) {
        setCursor(null);
        setPoseLabel('none');
        setHandsSeen(0);
        setActionMsg('No hand');
      }
      setStatusMsg(status);
    },
    onError: message => setError(message || null),
  });

  if (!_hasHydrated) return null;
  if (!enabled) return null;

  const cursorStyle = cursorStyleForPose(poseLabel);
  const liveStatus = statusMsg ?? actionMsg;
  const scalePct = Math.round(gestureScale * 100);

  return (
    <>
      {!previewHidden && (
        <div
          className="fixed z-[400] flex flex-col border border-ghost bg-bg font-mono shadow-lg"
          style={{
            top: 'calc(16px + var(--safe-top))',
            right: 'calc(16px + var(--safe-right))',
            width: 214,
          }}
        >
          <div className="flex items-center justify-between border-b border-ghost px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: handsSeen > 0 ? 'var(--c-success)' : 'var(--c-faint)' }}
              />
              <span>{labelForPose(poseLabel)}</span>
              {handsSeen > 0 && <span className="text-dim">{handsSeen}H</span>}
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
            {liveStatus && (
              <div className="absolute inset-x-0 bottom-0 bg-bg/85 px-2 py-1.5 text-[0.625rem] text-dim">
                {liveStatus}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[0.5625rem] tracking-[0.06em] text-faint">
            <span>LIVE - SCALE {scalePct}%</span>
            <div className="flex items-center gap-1.5">
              {scalePct !== 100 && (
                <button
                  type="button"
                  onClick={() => setGestureScale(1)}
                  className="cursor-pointer border border-ghost bg-transparent px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-[0.1em] text-dim"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setEnabled(false)}
                className="cursor-pointer border border-ghost bg-transparent px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-[0.1em] text-dim"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

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

      {cursor && showCursor && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[500] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: cursor.x,
            top: cursor.y,
            width: cursorStyle.size,
            height: cursorStyle.size,
            background: cursorStyle.background,
            boxShadow: cursorStyle.shadow,
            mixBlendMode: 'difference',
            transition: 'width 120ms ease, height 120ms ease, opacity 120ms ease',
          }}
        />
      )}

      <div
        className="fixed z-[400] font-mono"
        style={{
          left: 'calc(16px + var(--safe-left))',
          bottom: 'calc(16px + var(--safe-bottom))',
        }}
      >
        {legendOpen && (
          <div className="mb-2 max-w-[360px] border border-ghost bg-bg p-3 text-[0.6875rem] text-sub shadow-lg">
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
            {GESTURE_LIST.map(gesture => (
              <div key={gesture.name} className="mb-1.5 last:mb-0">
                <div className="text-[0.6875rem] text-fg">{gesture.name}</div>
                <div className="text-[0.625rem] leading-relaxed text-dim">{gesture.desc}</div>
              </div>
            ))}
            <div className="mt-2 border-t border-ghost pt-2 text-[0.625rem] italic text-faint">
              Use your mouse, keyboard, or touch at any time to take over instantly.
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

      {error && (
        <div
          className="fixed z-[600] border border-danger-border bg-bg px-3 py-2 text-[0.6875rem] text-danger shadow-lg"
          style={{
            top: 'calc(16px + var(--safe-top) + 254px)',
            right: 'calc(16px + var(--safe-right))',
            maxWidth: 260,
          }}
        >
          Gesture control failed: {error}
        </div>
      )}
    </>
  );
}
