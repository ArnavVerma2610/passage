'use client';

import { useEffect, useRef, useState } from 'react';
import { useHandTracker } from '@/hooks/useHandTracker';
import {
  dispatchGestureClick,
  dispatchGestureHover,
  dispatchGestureRightClick,
  dispatchGestureScroll,
  dispatchGestureSwipe,
} from '@/lib/gesture/actions';
import { createGestureController } from '@/lib/gesture/controller';
import type { HandPose, ScreenPoint } from '@/lib/gesture/classifier';
import { usePassageStore } from '@/lib/store';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type DictationTarget = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

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
  { name: 'Pinch hold', desc: 'Thumb to index, hold 350ms - cursor freezes, then clicks.' },
  { name: 'Middle pinch', desc: 'Thumb to middle finger, hold 350ms - right-clicks.' },
  { name: 'Two-finger scroll', desc: 'Index + middle extended, swipe up or down - scrolls the page.' },
  { name: 'Open-palm swipe', desc: 'Open palm, swipe left or right - skip or save the deck card.' },
  { name: 'Two-palm zoom', desc: 'Show both palms, then move them apart or together - app zoom.' },
  { name: 'Fist', desc: 'Close your hand - pause cursor and actions.' },
  { name: 'Dictate', desc: 'Focus any text field, then use Dictate to speak text into it.' },
];

const ACTIVE_GESTURE_LIST = [
  'Point: move cursor',
  'Pinch hold: click / set slider',
  'Two fingers: scroll',
  'Open palm: skip/save',
  'Focus text: dictate',
];

function labelForPose(pose: HandPose) {
  if (pose === 'none') return 'NO HAND';
  if (pose === 'zoom') return 'ZOOM';
  return pose.toUpperCase();
}

function cursorStyleForPose(pose: HandPose) {
  if (pose === 'pinch') {
    return {
      size: 34,
      background: '#fff',
      shadow: '0 0 22px 4px rgba(255,255,255,0.34)',
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

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function isTextTarget(target: EventTarget | null): target is DictationTarget {
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(
      target.type,
    );
  }
  return target instanceof HTMLElement && target.isContentEditable;
}

function insertDictationText(target: DictationTarget, text: string) {
  const addition = text.trim();
  if (!addition) return;

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const prefix = start > 0 && !/\s$/.test(target.value.slice(0, start)) ? ' ' : '';
    const suffix = end < target.value.length && !/^\s/.test(target.value.slice(end)) ? ' ' : '';
    target.setRangeText(`${prefix}${addition}${suffix}`, start, end, 'end');
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  target.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    target.append(addition);
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(addition));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: addition }));
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
  const [pinchProgress, setPinchProgress] = useState(0);
  const [dictationTarget, setDictationTarget] = useState<DictationTarget | null>(null);
  const [dictationMsg, setDictationMsg] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [controller] = useState(createGestureController);
  const scaleRef = useRef(gestureScale);
  const lastGestureMoveAtRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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

  useEffect(() => {
    if (!enabled) return;

    const onFocusIn = (event: FocusEvent) => {
      setDictationTarget(isTextTarget(event.target) ? event.target : null);
      setDictationMsg(null);
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isTextTarget(document.activeElement)) setDictationTarget(null);
      }, 0);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      window.setTimeout(() => {
        setListening(false);
        setDictationMsg(null);
      }, 0);
    }
  }, [enabled]);

  function startDictation() {
    if (!dictationTarget) {
      setDictationMsg('Focus a text field first');
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setDictationMsg('Speech input is not supported here');
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = event => {
      let finalText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
      }
      if (finalText) insertDictationText(dictationTarget, finalText);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setListening(false);
      setDictationMsg('Could not hear speech');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setListening(true);
    setDictationMsg('Listening...');
    recognition.start();
  }

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
      setPinchProgress(output.pinchProgress);

      if (output.cursor) {
        setShowCursor(true);
        if (output.pose === 'point' || output.pose === 'pinch' || output.pose === 'scroll' || output.pose === 'relaxed') {
          lastGestureMoveAtRef.current = Date.now();
          dispatchGestureHover(output.cursor);
        }
      }

      for (const intent of output.intents) {
        if (intent.type === 'click') dispatchGestureClick(intent.point);
        if (intent.type === 'rightClick') dispatchGestureRightClick(intent.point);
        if (intent.type === 'scroll') dispatchGestureScroll(intent.dir, intent.point);
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
        setPinchProgress(0);
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
            width: poseLabel === 'pinch' ? cursorStyle.size + 18 : cursorStyle.size,
            height: poseLabel === 'pinch' ? cursorStyle.size + 18 : cursorStyle.size,
            transition: 'width 120ms ease, height 120ms ease, opacity 120ms ease',
          }}
        >
          {poseLabel === 'pinch' && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(255,255,255,0.95)',
                opacity: 0.65 + pinchProgress * 0.35,
              }}
            />
          )}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: cursorStyle.size,
              height: cursorStyle.size,
              background: cursorStyle.background,
              boxShadow: cursorStyle.shadow,
              mixBlendMode: poseLabel === 'pinch' ? 'normal' : 'difference',
            }}
          />
        </div>
      )}

      <div
        className="fixed z-[390] w-[210px] border border-ghost bg-bg/95 p-2.5 font-mono text-[0.625rem] text-dim shadow-lg"
        style={{
          right: 'calc(16px + var(--safe-right))',
          bottom: 'calc(72px + var(--safe-bottom))',
        }}
      >
        <div className="mb-2 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
          Gesture map
        </div>
        {ACTIVE_GESTURE_LIST.map(item => (
          <div key={item} className="mb-1 last:mb-0">
            {item}
          </div>
        ))}
        <div className="mt-2 border-t border-ghost pt-2">
          <button
            type="button"
            onClick={startDictation}
            className={`w-full cursor-pointer border px-2 py-1.5 uppercase tracking-[0.1em] ${
              listening ? 'border-fg bg-fg text-bg' : 'border-ghost bg-transparent text-fg'
            }`}
          >
            {listening ? 'Listening' : 'Dictate'}
          </button>
          <div className="mt-1 leading-snug text-faint">
            {dictationMsg ?? (dictationTarget ? 'Text field ready' : 'Focus text to dictate')}
          </div>
        </div>
      </div>

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
