'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { NormalizedLandmark } from '@/lib/gesture/classifier';

interface HandTrackerFrame {
  hands: NormalizedLandmark[][];
  now: number;
}

interface UseHandTrackerArgs {
  enabled: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onFrame: (frame: HandTrackerFrame) => void;
  onStatus: (status: string | null) => void;
  onError: (message: string) => void;
}

type TasksVisionModule = typeof import('@mediapipe/tasks-vision');

interface HandLandmarkerLike {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => unknown;
  close?: () => void;
}

interface VideoFrameMetadataLike {
  mediaTime: number;
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: VideoFrameMetadataLike) => void,
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const MEDIAPIPE_WASM_URL = '/mediapipe/tasks-vision/wasm';
const HAND_MODEL_URL = '/mediapipe/models/hand_landmarker.task';
const TARGET_FRAME_MS = 1000 / 30;

async function createLandmarker(mp: TasksVisionModule, delegate: 'GPU' | 'CPU') {
  const filesetResolver = await mp.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
  return mp.HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_URL,
      delegate,
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.45,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
  });
}

export function useHandTracker({
  enabled,
  videoRef,
  onFrame,
  onStatus,
  onError,
}: UseHandTrackerArgs) {
  const callbacksRef = useRef({ onFrame, onStatus, onError });

  useEffect(() => {
    callbacksRef.current = { onFrame, onStatus, onError };
  }, [onFrame, onStatus, onError]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarkerLike | null = null;
    let activeVideo: VideoWithFrameCallback | null = null;
    let rafId: number | null = null;
    let videoFrameId: number | null = null;
    let lastInferenceAt = 0;

    const clearScheduledFrame = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (videoFrameId !== null && activeVideo?.cancelVideoFrameCallback) {
        activeVideo.cancelVideoFrameCallback(videoFrameId);
      }
      rafId = null;
      videoFrameId = null;
    };

    const scheduleFrame = () => {
      if (cancelled) return;
      const video = videoRef.current as VideoWithFrameCallback | null;
      if (video?.requestVideoFrameCallback) {
        videoFrameId = video.requestVideoFrameCallback(now => runFrame(now));
      } else {
        rafId = requestAnimationFrame(now => runFrame(now));
      }
    };

    const runFrame = (now: number) => {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || !landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        scheduleFrame();
        return;
      }

      if (now - lastInferenceAt >= TARGET_FRAME_MS) {
        lastInferenceAt = now;
        const result = landmarker.detectForVideo(video, now) as
          | { landmarks?: NormalizedLandmark[][] }
          | undefined;
        callbacksRef.current.onFrame({ hands: result?.landmarks ?? [], now });
      }

      scheduleFrame();
    };

    async function bootstrap() {
      callbacksRef.current.onError('');
      callbacksRef.current.onStatus('Loading hand model...');

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not available in this browser');
        }

        const mp = await import('@mediapipe/tasks-vision');
        if (cancelled) return;

        try {
          landmarker = (await createLandmarker(mp, 'GPU')) as HandLandmarkerLike;
        } catch {
          if (cancelled) return;
          callbacksRef.current.onStatus('GPU unavailable, using CPU...');
          landmarker = (await createLandmarker(mp, 'CPU')) as HandLandmarkerLike;
        }

        if (cancelled) {
          landmarker?.close?.();
          return;
        }

        callbacksRef.current.onStatus('Requesting camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const video = videoRef.current as VideoWithFrameCallback | null;
        if (!video) return;
        activeVideo = video;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        callbacksRef.current.onStatus(null);
        scheduleFrame();
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Could not start gesture control';
        callbacksRef.current.onStatus(null);
        callbacksRef.current.onError(message);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      clearScheduledFrame();
      stream?.getTracks().forEach(track => track.stop());
      landmarker?.close?.();
      if (activeVideo) activeVideo.srcObject = null;
      callbacksRef.current.onStatus(null);
    };
  }, [enabled, videoRef]);
}
