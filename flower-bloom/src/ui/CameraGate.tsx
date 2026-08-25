import type { CameraStatus } from '../state/store';

interface CameraGateProps {
  started: boolean;
  cameraStatus: CameraStatus;
  fallbackMode: boolean;
  onEnableCamera: () => void;
  onUseFallback: () => void;
}

export function CameraGate({ started, cameraStatus, fallbackMode, onEnableCamera, onUseFallback }: CameraGateProps) {
  if (fallbackMode) return null;
  if (started && cameraStatus === 'granted') return null;

  let title = 'Grow flowers with your hands';
  let body = 'Bloom is a full-screen, camera-based experience — your webcam tracks your hands live, right in your browser. Nothing is recorded or uploaded.';
  let showEnable = true;

  if (started && cameraStatus === 'requesting') {
    title = 'Requesting camera access…';
    body = 'Allow camera access in the browser prompt to begin.';
    showEnable = false;
  } else if (started && cameraStatus === 'denied') {
    title = 'Camera access denied';
    body = "No problem — you can still grow and bloom flowers with your mouse: click to pinch, drag to point and rotate, double-click to pick.";
    showEnable = false;
  } else if (started && cameraStatus === 'unsupported') {
    title = 'Camera unavailable';
    body = "Your browser or device doesn't support the camera pipeline here. You can still use mouse controls instead.";
    showEnable = false;
  }

  return (
    <div className="camera-gate">
      <div className="camera-gate-card">
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="camera-gate-actions">
          {showEnable && (
            <button className="primary-btn" onClick={onEnableCamera}>
              Enable camera
            </button>
          )}
          <button className="secondary-btn" onClick={onUseFallback}>
            Use mouse instead
          </button>
        </div>
      </div>
    </div>
  );
}
