import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { audioController } from '../utils/audio';

interface TimerOverlayProps {
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export const TimerOverlay: React.FC<TimerOverlayProps> = ({ initialSeconds, onComplete, onSkip }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  // Audio feedback for countdowns
  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0) {
      audioController.playBeep('short');
    } else if (timeLeft === 0) {
      audioController.playBeep('long');
    }
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((initialSeconds - timeLeft) / initialSeconds) * 100;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
        {/* Circular Progress */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="var(--color-oled-card-hover)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="var(--color-neon-purple)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="text-6xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(138,43,226,0.8)]">
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="text-[var(--color-text-muted)] text-sm uppercase tracking-widest mb-8">
        Recuperación del SNC
      </div>

      <button
        onClick={onSkip}
        className="px-8 py-3 rounded-full border border-[var(--color-text-muted)] text-[var(--color-text-muted)] uppercase text-xs tracking-widest font-bold hover:bg-white/10 transition-colors"
      >
        Saltar Descanso
      </button>
    </div>
  );
};
