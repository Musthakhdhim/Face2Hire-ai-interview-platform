import { useEffect, useRef, useState } from 'react';

interface FaceDetectorProps {
  onViolation: () => void;
  onFaceStatus?: (faceDetected: boolean, violationCount: number) => void;
  maxViolations?: number;
  showPreview?: boolean;
}

declare global {
  interface Window {
    FaceDetection: any;
  }
}

export default function FaceDetector({ onViolation, onFaceStatus, maxViolations = 5, showPreview = true }: FaceDetectorProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [warningVisible, setWarningVisible] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastViolationTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  // Report status to parent
  useEffect(() => {
    if (onFaceStatus && faceDetected !== null) {
      onFaceStatus(faceDetected, violationCount);
    }
  }, [faceDetected, violationCount, onFaceStatus]);

  const triggerViolation = () => {
    if (violationCount >= maxViolations) return;
    const now = Date.now();
    if (now - lastViolationTimeRef.current > 2000) {
      lastViolationTimeRef.current = now;
      setViolationCount(prev => {
        const newCount = prev + 1;
        console.log(`[Violation] ${newCount}/${maxViolations}`);
        setWarningVisible(true);
        onViolation();
        return newCount;
      });
    }
  };

  const startDetectionLoop = () => {
    if (!detectorRef.current || !hiddenVideoRef.current) return;
    const video = hiddenVideoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(startDetectionLoop, 500);
      return;
    }
    const detect = async () => {
      if (!detectorRef.current || !hiddenVideoRef.current) return;
      try {
        await detectorRef.current.send({ image: hiddenVideoRef.current });
      } catch (err) {}
      animationIdRef.current = requestAnimationFrame(detect);
    };
    detect();
  };

  const enableCamera = async () => {
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

      await new Promise<void>((resolve) => {
        if (hiddenVideo.videoWidth > 0 && hiddenVideo.videoHeight > 0) resolve();
        else hiddenVideo.onloadedmetadata = () => resolve();
      });

      if (!window.FaceDetection) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const faceDetection = new window.FaceDetection({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });
      faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });

      faceDetection.onResults((results: any) => {
        frameCountRef.current++;
        const hasFace = results.detections && results.detections.length > 0;
        setFaceDetected(hasFace);
        if (!hasFace) triggerViolation();
      });

      detectorRef.current = faceDetection;
      startDetectionLoop();
      setCameraEnabled(true);
    } catch (err: any) {
      setPermissionError(err.message || 'Camera error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    enableCamera();
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (detectorRef.current) detectorRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = null;
        hiddenVideoRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (cameraEnabled && showPreview && previewRef.current && streamRef.current) {
      if (previewRef.current.srcObject !== streamRef.current) {
        previewRef.current.srcObject = streamRef.current;
        previewRef.current.play().catch(console.error);
      }
    }
  }, [cameraEnabled, showPreview]);

  if (loading) return null;
  if (permissionError) return (
    <div className="fixed bottom-4 left-4 bg-red-600 text-white px-3 py-1 rounded flex gap-2 items-center z-50 text-xs">
      <span>⚠️ {permissionError}</span>
      <button onClick={enableCamera} className="bg-white text-black px-2 py-0.5 rounded text-xs">Retry</button>
    </div>
  );
  if (!cameraEnabled) return null;

  return (
    <>
      {showPreview && (
        <div className="fixed bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/70 shadow-lg z-50 bg-black">
          <video ref={previewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      )}
      {warningVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md text-center">
            <h3 className="text-xl font-bold mb-2">⚠️ Face Not Detected</h3>
            <p className="text-gray-600 mb-4">Violation {violationCount} of {maxViolations}</p>
            <button onClick={() => setWarningVisible(false)} className="px-4 py-2 bg-indigo-600 text-white rounded">I'm Back</button>
          </div>
        </div>
      )}
    </>
  );
}