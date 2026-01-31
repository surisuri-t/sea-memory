
export type GameStatus = 'IDLE' | 'SHOWING' | 'INPUTTING' | 'SUCCESS' | 'FAIL';

export type CreatureType = 'fish' | 'shell' | 'starfish' | 'seahorse';

export interface OceanCreature {
  id: string;
  name: string;
  type: CreatureType;
  colorClass: string;
  hex: string;
}

export interface SpecialItem {
  id: 'treasure' | 'slow';
  name: string;
  description: string;
}

export interface LevelConfig {
  id: number;
  label: string;
  fishCount: number;
  displayDuration: number;
}
