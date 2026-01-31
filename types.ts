
export interface StarPoint {
  id: number;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  isDecoy?: boolean;
}

export interface Constellation {
  id: string;
  name: string;
  koreanName: string;
  description: string;
  myth: string;
  funFact: string;
  stars: StarPoint[];
  connections: [number, number][];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export enum GameState {
  LOBBY = 'LOBBY',
  OBSERVE = 'OBSERVE',
  DRAW = 'DRAW',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  ENCYCLOPEDIA = 'ENCYCLOPEDIA',
  RANKING = 'RANKING'
}

export interface RankEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}
