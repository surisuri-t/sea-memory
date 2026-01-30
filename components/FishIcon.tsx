
import React from 'react';

interface FishIconProps {
  color: string;
  className?: string;
  size?: number;
}

const FishIcon: React.FC<FishIconProps> = ({ color, className = "", size = 64 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M17.5 12C17.5 15.5 13.5 18 8 18C2.5 18 0.5 15 0.5 12C0.5 9 2.5 6 8 6C13.5 6 17.5 8.5 17.5 12Z" 
        fill={color} 
      />
      <path 
        d="M16 12L23.5 18V6L16 12Z" 
        fill={color} 
        fillOpacity="0.8"
      />
      <circle cx="5" cy="11" r="1" fill="white" />
      <path 
        d="M9 14.5C9.5 15 11 15 11.5 14.5" 
        stroke="white" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

export default FishIcon;
