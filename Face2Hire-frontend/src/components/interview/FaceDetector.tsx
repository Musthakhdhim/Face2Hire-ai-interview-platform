import { useEffect, useRef, useState } from 'react';

interface FaceDetectorProps {
  onViolation: () => void;
  onFaceStatus?: (faceDetected: boolean, violationCount: number) => void;
  maxViolations?: number;
  showPreview?: boolean;
}

interface FaceDetectionResults {
  detections: Array<unknown>;
}

interface FaceDetectionInstance {
  setOptions: (options: { model: string; minDetectionConfidence: number }) => void;
  onResults: (callback: (results: FaceDetectionResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface WindowWithFaceDetection extends Window {
  FaceDetection: new (config: { locateFile: (file: string) => string }) => FaceDetectionInstance;
}

declare const window: WindowWithFaceDetection;

export default function FaceDetector({
  onViolation,
  onFaceStatus,
  maxViolations = 5,
  showPreview = true,
}: FaceDetectorProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [warningVisible, setWarningVisible] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastViolationTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<FaceDetectionInstance | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const enabledRef = useRef(false);

  // Report status to parent
  useEffect(() => {
    if (onFaceStatus && faceDetected !== null) {
      onFaceStatus(faceDetected, violationCount);
    }
  }, [faceDetected, violationCount, onFaceStatus]);

  // Camera initialisation and detection loop
  useEffect(() => {
    if (enabledRef.current) return;
    enabledRef.current = true;

    let localAnimationId: number | null = null;
    let localDetector: FaceDetectionInstance | null = null;

    const triggerViolation = () => {
      setViolationCount((prev) => {
        if (prev >= maxViolations) return prev;
        const now = Date.now();
        if (now - lastViolationTimeRef.current > 2000) {
          lastViolationTimeRef.current = now;
          const newCount = prev + 1;
          console.log(`[Violation] ${newCount}/${maxViolations}`);
          setWarningVisible(true);
          onViolation();
          return newCount;
        }
        return prev;
      });
    };

    const startDetectionLoop = () => {
      if (!localDetector) return;
      const detect = async () => {
        if (!localDetector || !hiddenVideoRef.current) return;
        try {
          await localDetector.send({ image: hiddenVideoRef.current });
        } catch {
          // ignore detection errors
        }
        localAnimationId = requestAnimationFrame(detect);
      };
      detect();
    };

    const init = async () => {
      setPermissionError(null);
      setLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;

        const hiddenVideo = document.createElement('video');
        hiddenVideo.style.display = 'none';
        hiddenVideo.autoplay = true;
        hiddenVideo.muted = true;
        hiddenVideo.playsInline = true;
        document.body.appendChild(hiddenVideo);
        hiddenVideo.srcObject = stream;
        await hiddenVideo.play();
        hiddenVideoRef.current = hiddenVideo;

        // wait for video dimensions
        await new Promise<void>((resolve) => {
          if (hiddenVideo.videoWidth > 0 && hiddenVideo.videoHeight > 0) resolve();
          else hiddenVideo.onloadedmetadata = () => resolve();
        });

        // load MediaPipe script if not present
        if (!window.FaceDetection) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js';
            script.onload = () => resolve();
            document.head.appendChild(script);
          });
        }

        const faceDetection = new window.FaceDetection({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });
        faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });

        faceDetection.onResults((results: FaceDetectionResults) => {
          const hasFace = results.detections && results.detections.length > 0;
          setFaceDetected(hasFace);
          if (!hasFace) triggerViolation();
        });

        localDetector = faceDetection;
        detectorRef.current = faceDetection;
        setCameraEnabled(true);
        startDetectionLoop();
      } catch (err) {
        const error = err as Error;
        setPermissionError(error.message || 'Camera error');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (localAnimationId) cancelAnimationFrame(localAnimationId);
      if (localDetector) localDetector.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = null;
        hiddenVideoRef.current.remove();
      }
    };
  }, [maxViolations, onViolation]);

  // Attach stream to preview video
  useEffect(() => {
    if (cameraEnabled && showPreview && previewRef.current && streamRef.current) {
      if (previewRef.current.srcObject !== streamRef.current) {
        previewRef.current.srcObject = streamRef.current;
        previewRef.current.play().catch(() => {
          // ignore play errors (user interaction may be required)
        });
      }
    }
  }, [cameraEnabled, showPreview]);

  if (loading) return null;
  if (permissionError)
    return (
      <div className="fixed bottom-4 left-4 bg-red-600 text-white px-3 py-1 rounded flex gap-2 items-center z-50 text-xs">
        <span>⚠️ {permissionError}</span>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-black px-2 py-0.5 rounded text-xs"
        >
          Retry
        </button>
      </div>
    );
  if (!cameraEnabled) return null;

  return (
    <>
      {showPreview && (
        <div className="fixed bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/70 shadow-lg z-50 bg-black">
          <video
            ref={previewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {warningVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md text-center">
            <h3 className="text-xl font-bold mb-2">⚠️ Face Not Detected</h3>
            <p className="text-gray-600 mb-4">
              Violation {violationCount} of {maxViolations}
            </p>
            <button
              onClick={() => setWarningVisible(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              I'm Back
            </button>
          </div>
        </div>
      )}
    </>
  );
}