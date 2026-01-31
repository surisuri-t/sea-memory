
import React from 'react';

const ShootingStar: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 right-0 w-[2px] h-[100px] bg-gradient-to-t from-white to-transparent rotate-[225deg] animate-shooting-star"></div>
      <style>{`
        @keyframes shooting-star {
          0% {
            transform: translate(0, 0) rotate(225deg);
            opacity: 1;
          }
          100% {
            transform: translate(-1500px, 1500px) rotate(225deg);
            opacity: 0;
          }
        }
        .animate-shooting-star {
          animation: shooting-star 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ShootingStar;
