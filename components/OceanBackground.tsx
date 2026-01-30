
import React, { useMemo } from 'react';

const OceanBackground: React.FC = () => {
  const bubbles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 25 + 5}px`,
      duration: `${Math.random() * 12 + 6}s`,
      delay: `${Math.random() * 8}s`,
    }));
  }, []);

  const corals = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: `${i * 18 + 5}%`,
      height: `${60 + Math.random() * 100}px`,
      color: ['#ff7f50', '#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57'][i % 5],
      delay: `${Math.random() * 2}s`
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-b from-[#1da1f2] via-[#005ea8] to-[#001f3f]">
      {/* Deep Background particles */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full blur-[1px]" />
        <div className="absolute top-1/3 left-3/4 w-2 h-2 bg-white rounded-full blur-[2px]" />
        <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-white rounded-full blur-[1px]" />
      </div>

      {/* Animated Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            animationDuration: bubble.duration,
            animationDelay: bubble.delay,
          }}
        />
      ))}

      {/* Volumetric Light Rays */}
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        <div className="absolute -top-[10%] left-[20%] w-[30%] h-[120%] bg-gradient-to-b from-white/40 to-transparent rotate-[25deg] blur-[80px]" />
        <div className="absolute -top-[10%] left-[60%] w-[40%] h-[120%] bg-gradient-to-b from-white/30 to-transparent rotate-[15deg] blur-[100px]" />
      </div>

      {/* Foreground Corals & Rocks */}
      <div className="absolute bottom-[-10px] w-full flex items-end justify-around px-8">
        {corals.map((coral) => (
          <div
            key={coral.id}
            className="relative flex flex-col items-center"
            style={{ left: coral.left, transition: 'transform 3s ease-in-out' }}
          >
            {/* Rock base */}
            <div className="w-16 h-8 bg-[#3d3d3d] rounded-t-[50%] blur-[2px]" />
            {/* Coral structure */}
            <div 
              className="w-4 rounded-full opacity-80"
              style={{
                height: coral.height,
                backgroundColor: coral.color,
                boxShadow: `0 0 15px ${coral.color}66`,
                animation: `sway ${4 + Math.random() * 2}s ease-in-out infinite alternate`,
                animationDelay: coral.delay,
                transformOrigin: 'bottom'
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes sway {
          from { transform: skewX(-8deg) rotate(-2deg); }
          to { transform: skewX(8deg) rotate(2deg); }
        }
        .bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          pointer-events: none;
          animation: bubble linear infinite;
        }
        @keyframes bubble {
          0% { transform: translateY(110vh) scale(0.8); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default OceanBackground;
