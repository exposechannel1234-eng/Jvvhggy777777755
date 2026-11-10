import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  onSeek?: (ratio: number) => void;
  barCount?: number;
  height?: number;
  accentColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  progress,
  onSeek,
  barCount = 64,
  height = 42,
  accentColor = '#A855F7',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const barWidth = width / barCount;
      const gap = Math.max(1, barWidth * 0.25);
      const effectiveBarWidth = barWidth - gap;

      if (isPlaying) {
        phase += 0.08;
      }

      for (let i = 0; i < barCount; i++) {
        const ratio = i / barCount;
        const isPast = ratio <= progress;

        // Static wave profile modulated by audio-like noise + animation phase
        const baseSin = Math.sin(i * 0.25 + 0.5) * 0.35 + 0.5;
        const dynamicMod = isPlaying
          ? Math.sin(phase + i * 0.4) * 0.25 + Math.cos(phase * 1.5 + i * 0.2) * 0.15
          : 0;

        const amplitude = Math.max(0.12, Math.min(0.95, baseSin + dynamicMod));
        const barHeight = amplitude * (h - 8);

        const x = i * barWidth;
        const y = (h - barHeight) / 2;

        // Gradient for current bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPast) {
          gradient.addColorStop(0, '#C084FC');
          gradient.addColorStop(0.5, accentColor);
          gradient.addColorStop(1, '#7C3AED');
        } else {
          gradient.addColorStop(0, '#373052');
          gradient.addColorStop(1, '#1F1A30');
        }

        ctx.fillStyle = gradient;
        // Rounded bar
        const radius = Math.min(effectiveBarWidth / 2, 2.5);
        ctx.beginPath();
        ctx.roundRect(x, y, effectiveBarWidth, barHeight, radius);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, progress, barCount, accentColor]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio);
  };

  return (
    <div className="relative w-full cursor-pointer group" style={{ height }}>
      <canvas
        ref={canvasRef}
        width={480}
        height={height}
        onClick={handleClick}
        className="w-full h-full block rounded-md"
      />
    </div>
  );
};
