import { useEffect, useRef, type RefObject } from 'react';
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { useBloomStore } from '../state/store';
import { GestureClassifier } from './gestures';
import { setGesture } from './gestureBus';
import type { HandFrame, Vec2 } from '../types';

// Fetched at runtime by the browser — requires network access when the app actually runs.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const TRACKING_INPUT = { width: 640, height: 480 };

/**
 * Runs the camera + MediaPipe HandLandmarker pipeline and feeds classified gestures into the
 * gesture bus every detection frame. Detection targets ~30fps independent of the (60fps) R3F
 * render loop — see PRD §9.
 */
export function useHandTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  getNearPoint: () => Vec2 | null,
  enabled: boolean,
) {
  const setCameraStatus = useBloomStore((s) => s.setCameraStatus);
  const fallbackMode = useBloomStore((s) => s.fallbackMode);
  const classifierRef = useRef(new GestureClassifier());
  const getNearPointRef = useRef(getNearPoint);
  getNearPointRef.current = getNearPoint;

  useEffect(() => {
    if (fallbackMode || !enabled) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    let rafId = 0;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unsupported');
        return;
      }
      setCameraStatus('requesting');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: TRACKING_INPUT.width, height: TRACKING_INPUT.height, facingMode: 'user' },
          audio: false,
        });
      } catch {
        if (!cancelled) setCameraStatus('denied');
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setCameraStatus('granted');

      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        if (cancelled) return;
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch (err) {
        console.error('Failed to initialize hand tracking model', err);
        if (!cancelled) setCameraStatus('unsupported');
        return;
      }
      if (cancelled) return;

      let lastVideoTime = -1;
      const loop = () => {
        if (cancelled) return;
        if (!video || video.readyState < 2) {
          rafId = requestAnimationFrame(loop);
          return;
        }
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const now = performance.now();
          const result = landmarker!.detectForVideo(video, now);
          const frames: HandFrame[] = result.landmarks.map((lm, i) => ({
            handedness: (result.handedness[i]?.[0]?.categoryName as 'Left' | 'Right') ?? 'Right',
            landmarks: lm,
            worldLandmarks: result.worldLandmarks[i] ?? [],
          }));
          const gesture = classifierRef.current.update(frames, now, getNearPointRef.current());
          setGesture(gesture);
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      landmarker?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [fallbackMode, enabled, setCameraStatus, videoRef]);
}
