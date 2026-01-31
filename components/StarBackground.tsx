
import React, { useEffect, useRef, useMemo } from 'react';

interface StarBackgroundProps {
  isSuccess: boolean;
}

const StarBackground: React.FC<StarBackgroundProps> = ({ isSuccess }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stars = useMemo(() => {
    return Array.from({ length: 300 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.2,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      color: Math.random() > 0.8 ? '#cbd5e1' : '#ffffff', // Mix of white and slightly blue stars
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 1. Deep Space Background
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Milky Way Nebulous Glow
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const nebulaGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      nebulaGrad.addColorStop(0, 'rgba(67, 56, 202, 0.15)'); // Indigo
      nebulaGrad.addColorStop(0.5, 'rgba(126, 34, 206, 0.05)'); // Purple
      nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 3. Stars
      stars.forEach(star => {
        const x = (star.x / 100) * canvas.width;
        const y = (star.y / 100) * canvas.height;
        
        // Twinkle Logic
        const time = Date.now() * 0.001;
        const twinkle = (Math.sin(time * star.twinkleSpeed * 50 + star.phase) + 1) / 2;
        const opacity = 0.3 + twinkle * 0.7;
        
        // Success effect: make stars much brighter and larger
        const scale = isSuccess ? 2.5 : 1.0;
        const finalOpacity = isSuccess ? Math.min(1, opacity * 1.5) : opacity;

        ctx.beginPath();
        ctx.arc(x, y, star.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = finalOpacity;
        
        if (isSuccess || star.size > 1.2) {
          ctx.shadowBlur = isSuccess ? 15 : 5;
          ctx.shadowColor = 'white';
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [stars, isSuccess]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
};

export default StarBackground;
