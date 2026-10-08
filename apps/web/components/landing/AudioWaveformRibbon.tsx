'use client';

import React, { useRef, useEffect } from 'react';

interface AudioWaveformRibbonProps {
  isActive?: boolean;
  isPlaying?: boolean;
  colorTheme?: 'purple' | 'cyan' | 'emerald' | 'gradient';
  barCount?: number;
  height?: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AudioWaveformRibbon({
  isActive = true,
  isPlaying,
  colorTheme = 'gradient',
  barCount = 32,
  height = 40,
  interactive = false,
  className,
  style,
}: AudioWaveformRibbonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const effectivelyActive = isPlaying !== undefined ? isPlaying : isActive;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = 1;
    if (typeof window !== 'undefined') {
      dpr = window.devicePixelRatio || 1;
    }

    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 320) * dpr;
    canvas.height = (height || 40) * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      if (!ctx || !canvas) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      const spacing = 3;
      const totalSpacing = spacing * (barCount - 1);
      const barWidth = Math.max(2, (w - totalSpacing) / barCount);

      phaseRef.current += effectivelyActive ? 0.04 : 0.008;
      const phase = phaseRef.current;

      for (let i = 0; i < barCount; i++) {
        // Procedural frequency synthesis mimicking audio spectrum
        const normalizedIdx = i / barCount;
        const wave1 = Math.sin(normalizedIdx * Math.PI * 3 + phase);
        const wave2 = Math.cos(normalizedIdx * Math.PI * 5 - phase * 1.5);
        const wave3 = Math.sin(phase * 2 + i);

        let amplitude = (Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) + 0.15) * (h * 0.85);
        if (!isActive) amplitude = Math.max(3, amplitude * 0.25);

        const x = i * (barWidth + spacing);
        const y = (h - amplitude) / 2;
        const radius = Math.min(barWidth / 2, 3);

        // Color theme palette
        let fill = '#7C3AED';
        if (colorTheme === 'gradient') {
          const grad = ctx.createLinearGradient(0, y, 0, y + amplitude);
          grad.addColorStop(0, '#A855F7');
          grad.addColorStop(0.5, '#38BDF8');
          grad.addColorStop(1, '#10B981');
          fill = grad as any;
        } else if (colorTheme === 'cyan') {
          fill = '#38BDF8';
        } else if (colorTheme === 'emerald') {
          fill = '#10B981';
        }

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, amplitude, [radius, radius, radius, radius]);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [effectivelyActive, colorTheme, barCount, height]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height,
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        role="presentation"
        style={{
          width: '100%',
          height,
          display: 'block',
        }}
      />
    </div>
  );
}
