import { useEffect, useRef, useState } from 'react';
import type { AvatarStyle } from '../../services/interviewService';

interface AvatarProps {
  mode: AvatarStyle;
  isSpeaking: boolean;
  audioElement?: HTMLAudioElement;
}

const config = {
  professional: { emoji: '👔', color: '#4299e1', voice: 'echo' },
  friendly: { emoji: '😊', color: '#ecc94b', voice: 'nova' },
  strict: { emoji: '🧐', color: '#4a5568', voice: 'onyx' },
};

export default function Avatar({ mode, isSpeaking, audioElement }: AvatarProps) {
  const { emoji, color } = config[mode];
  const [mouthOpen, setMouthOpen] = useState(0);
  const animRef = useRef<number | null>(null); 
  useEffect(() => {
    if (!audioElement) return;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audioElement);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    const update = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;
      const volume = Math.min(1, avg / 128);
      setMouthOpen(volume);
      animRef.current = requestAnimationFrame(update);
    };
    audioCtx.resume().then(() => update());
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audioCtx.close();
    };
  }, [audioElement]);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative size-40 rounded-full flex items-center justify-center text-7xl transition-all duration-75"
        style={{ backgroundColor: `${color}20`, boxShadow: isSpeaking ? `0 0 0 3px ${color}` : 'none' }}
      >
        <span className="scale-150">{emoji}</span>
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: `${color}40` }} />
        )}
      </div>
      <div className="mt-4 w-16 h-3 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-700 transition-all duration-75"
          style={{ width: `${mouthOpen * 100}%`, maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}