
import React from 'react';
import { CreatureType } from '../types';

interface OceanCreatureIconProps {
  type: CreatureType;
  color: string;
  className?: string;
  size?: number;
}

const OceanCreatureIcon: React.FC<OceanCreatureIconProps> = ({ type, color, className = "", size = 64 }) => {
  if (type === 'fish') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M17.5 12C17.5 15.5 13.5 18 8 18C2.5 18 0.5 15 0.5 12C0.5 9 2.5 6 8 6C13.5 6 17.5 8.5 17.5 12Z" fill={color} />
        <path d="M16 12L23.5 18V6L16 12Z" fill={color} fillOpacity="0.8" />
        <circle cx="5" cy="11" r="1" fill="white" />
        <path d="M9 14.5C9.5 15 11 15 11.5 14.5" stroke="white" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'starfish') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L14.81 8.62L22 9.24L16.5 13.97L18.18 21L12 17.27L5.82 21L7.5 13.97L2 9.24L9.19 8.62L12 2Z" fill={color} />
        <circle cx="12" cy="12" r="1.5" fill="white" fillOpacity="0.4" />
      </svg>
    );
  }

  if (type === 'shell') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} />
        <path d="M12 6V18M8 7V17M16 7V17M5 10V14M19 10V14" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'seahorse') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M14 2C11 2 9 4 9 7C9 9 11 10 11 12C11 14 8 15 8 18C8 21 11 22 13 22C15 22 16 20 16 18C16 16 14 15 14 13C14 11 16 10 16 7C16 4 15 2 14 2Z" fill={color} />
        <path d="M10 5C10 5 11 4 12 4" stroke="white" strokeLinecap="round" />
        <circle cx="13" cy="6" r="1" fill="white" />
      </svg>
    );
  }

  return null;
};

export default OceanCreatureIcon;
