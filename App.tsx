
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CONSTELLATIONS } from './constants';
import { GameState, Constellation, RankEntry, StarPoint } from './types';
import StarBackground from './components/StarBackground';
import ShootingStar from './components/ShootingStar';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [userStars, setUserStars] = useState<number[]>([]);
  const [wrongClicks, setWrongClicks] = useState(0);
  
  // 힌트 관련 상태
  const [hintsUsed, setHintsUsed] = useState(0); // 사용한 힌트 개수 (최대 3)
  const [activeHintId, setActiveHintId] = useState<number | null>(null); // 현재 깜빡이고 있는 힌트 별 ID
  const [hintCooldown, setHintCooldown] = useState(0); // 남은 쿨다운 시간(초)

  const [showShootingStar, setShowShootingStar] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<string>("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [rankings, setRankings] = useState<RankEntry[]>([]);

  const constellation = CONSTELLATIONS[currentLevel % CONSTELLATIONS.length];

  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const decoys = useMemo(() => {
    const points: StarPoint[] = [];
    const minDistance = 9; 
    const maxDecoys = 14;
    const existingStars = constellation.stars;

    for (let i = 0; i < maxDecoys; i++) {
      let attempts = 0;
      let valid = false;
      let newPoint: StarPoint = { id: 1000 + i, x: 0, y: 0, isDecoy: true };

      while (!valid && attempts < 50) {
        newPoint.x = 10 + Math.random() * 80;
        newPoint.y = 10 + Math.random() * 80;
        
        const tooCloseToConstellation = existingStars.some(s => getDistance(newPoint, s) < minDistance);
        const tooCloseToDecoys = points.some(p => getDistance(newPoint, p) < minDistance);

        if (!tooCloseToConstellation && !tooCloseToDecoys) {
          valid = true;
        }
        attempts++;
      }

      if (valid) {
        points.push(newPoint);
      }
    }
    return points;
  }, [currentLevel, constellation]);

  useEffect(() => {
    const saved = localStorage.getItem('star_rankings');
    if (saved) setRankings(JSON.parse(saved));
  }, []);

  const saveScore = (finalScore: number) => {
    const newEntry: RankEntry = {
      name: `우주 여행자`,
      score: finalScore,
      level: currentLevel + 1,
      date: new Date().toLocaleDateString()
    };
    const updated = [...rankings, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setRankings(updated);
    localStorage.setItem('star_rankings', JSON.stringify(updated));
  };

  const fetchCelestialWisdom = async (success: boolean, scoreGained: number) => {
    setLoadingFeedback(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = success 
        ? `${constellation.koreanName} 별자리를 완벽하게 기억해낸 사용자에게 따뜻한 축하를 전해주세요. 획득 점수는 ${scoreGained}점입니다. 밤하늘의 은하수가 친구가 되어주고 있다는 느낌으로 한국어로 2문장 내외로 다정하게 말해주세요.`
        : `${constellation.koreanName} 그리기에 실패한 사용자에게 다정한 격려를 보내주세요. 다음에 떨어지는 별똥별이 소원을 들어줄 거라는 희망적인 메시지를 담아 한국어로 2문장 내외로 작성해주세요.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setGeminiFeedback(response.text || "");
    } catch (error) {
      setGeminiFeedback(success ? "우와! 별들이 당신의 기억력을 칭찬하며 춤추고 있어요!" : "아쉽지만 괜찮아요. 밤하늘은 언제나 당신을 기다리고 있답니다.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const startGame = () => {
    setGameState(GameState.OBSERVE);
    setUserStars([]);
    setWrongClicks(0);
    setHintsUsed(0);
    setActiveHintId(null);
    setHintCooldown(0);
    setGeminiFeedback("");
  };

  const retryLevel = () => {
    setGameState(GameState.OBSERVE);
    setUserStars([]);
    setWrongClicks(0);
    setHintsUsed(0);
    setActiveHintId(null);
    setHintCooldown(0);
    setGeminiFeedback("");
  };

  const nextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setGameState(GameState.OBSERVE);
    setUserStars([]);
    setWrongClicks(0);
    setHintsUsed(0);
    setActiveHintId(null);
    setHintCooldown(0);
    setGeminiFeedback("");
  };

  const prevLevel = () => {
    if (currentLevel > 0) {
      setCurrentLevel(prev => prev - 1);
      setGameState(GameState.OBSERVE);
      setUserStars([]);
      setWrongClicks(0);
      setHintsUsed(0);
      setActiveHintId(null);
      setHintCooldown(0);
      setGeminiFeedback("");
    }
  };

  const goToDraw = () => {
    setGameState(GameState.DRAW);
    setStartTime(Date.now());
  };

  const toggleStar = (id: number) => {
    if (gameState !== GameState.DRAW) return;
    
    // 만약 현재 힌트로 활성화된 별을 클릭했다면 힌트 비활성화
    if (id === activeHintId) {
      setActiveHintId(null);
    }

    const isCorrect = constellation.stars.some(s => s.id === id);
    if (!isCorrect && !userStars.includes(id)) {
      setWrongClicks(prev => prev + 1);
    }

    setUserStars(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const useHint = () => {
    if (hintsUsed >= 3 || hintCooldown > 0 || gameState !== GameState.DRAW) return;
    
    // 아직 선택하지 않은 정답 별 중 하나를 찾아 힌트로 지정
    const firstUnselected = constellation.stars.find(s => !userStars.includes(s.id));
    
    if (firstUnselected) {
      setActiveHintId(firstUnselected.id);
      setHintsUsed(prev => prev + 1);
      setHintCooldown(30);
    }
  };

  // 힌트 쿨다운 타이머
  useEffect(() => {
    let timer: any;
    if (hintCooldown > 0) {
      timer = setInterval(() => {
        setHintCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hintCooldown]);

  const checkResult = () => {
    const requiredStarIds = constellation.stars.map(s => s.id);
    const sortedUser = [...userStars].sort();
    const sortedRequired = [...requiredStarIds].sort();
    
    const isSuccess = JSON.stringify(sortedUser) === JSON.stringify(sortedRequired);

    if (isSuccess) {
      const duration = (Date.now() - startTime) / 1000;
      const difficultyBonus = constellation.difficulty === 'Hard' ? 2500 : constellation.difficulty === 'Medium' ? 1800 : 1200;
      const timeBonus = Math.max(0, Math.floor(1000 - duration * 15));
      const roundScore = difficultyBonus + timeBonus;
      
      setTotalScore(prev => prev + roundScore);
      setGameState(GameState.SUCCESS);
      fetchCelestialWisdom(true, roundScore);
      
      if (currentLevel === CONSTELLATIONS.length - 1) {
        saveScore(totalScore + roundScore);
      }
    } else {
      setGameState(GameState.FAILURE);
      setShowShootingStar(true);
      setTimeout(() => setShowShootingStar(false), 2000);
      fetchCelestialWisdom(false, 0);
    }
  };

  const goHome = () => {
    if (window.confirm("정말로 로비로 돌아갈까요? 모든 게임 진행 상황과 점수가 초기화됩니다.")) {
      setGameState(GameState.LOBBY);
      setCurrentLevel(0);
      setTotalScore(0);
      setUserStars([]);
      setWrongClicks(0);
      setHintsUsed(0);
      setActiveHintId(null);
      setHintCooldown(0);
      setGeminiFeedback("");
    }
  };

  useEffect(() => {
    if (gameState === GameState.OBSERVE) {
      const timer = setTimeout(() => goToDraw(), 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 1; i < 10; i++) {
      lines.push(i * 10);
    }
    return lines;
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4">
      <StarBackground isSuccess={gameState === GameState.SUCCESS} />
      {showShootingStar && <ShootingStar />}

      <div className="z-10 w-full max-w-2xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        
        {gameState === GameState.LOBBY && (
          <div className="text-center py-6 animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="relative w-32 h-32 animate-pulse-slow">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                  <circle cx="20" cy="30" r="3" fill="white" />
                  <circle cx="40" cy="50" r="3" fill="white" />
                  <circle cx="60" cy="40" r="3" fill="white" />
                  <circle cx="80" cy="60" r="3" fill="white" />
                  <circle cx="50" cy="80" r="3" fill="white" />
                  <path d="M20 30 L40 50 L60 40 L80 60 L50 80" stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.6" />
                </svg>
              </div>
            </div>

            <h1 className="text-6xl font-gamja mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-md">
              별빛 기억 여행
            </h1>
            <p className="text-lg text-blue-100/70 mb-10 font-quicksand tracking-wider">따뜻한 밤하늘의 별자리를 따라가요</p>
            
            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={startGame} 
                className="w-72 py-5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-full font-gamja text-3xl transition-all transform hover:scale-105 shadow-[0_10px_40px_rgba(59,130,246,0.4)] active:scale-95"
              >
                여행 시작하기
              </button>
              <div className="flex gap-4">
                <button onClick={() => setGameState(GameState.RANKING)} className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-full text-base border border-white/10 transition-all font-quicksand">🏆 명예의 전당</button>
                <button onClick={() => setGameState(GameState.ENCYCLOPEDIA)} className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-full text-base border border-white/10 transition-all font-quicksand">📚 별자리 도감</button>
              </div>
            </div>
          </div>
        )}

        {gameState === GameState.RANKING && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-gamja text-blue-200">명예의 여행자</h2>
              <button onClick={() => setGameState(GameState.LOBBY)} className="px-6 py-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white/70 transition-all text-base font-gamja">돌아가기</button>
            </div>
            <div className="space-y-5">
              {rankings.length > 0 ? rankings.map((r, i) => (
                <div key={i} className="flex justify-between items-center p-6 bg-white/5 rounded-[2rem] border border-white/10">
                  <div className="flex items-center gap-6">
                    <span className={`text-4xl font-gamja ${i === 0 ? 'text-yellow-300' : 'text-white/30'}`}>{i + 1}등</span>
                    <span className="font-medium text-2xl">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-blue-300 bg-blue-500/10 px-4 py-1 rounded-full font-quicksand">LV.{r.level}</span>
                    <span className="text-3xl font-gamja text-yellow-300">{r.score.toLocaleString()}</span>
                  </div>
                </div>
              )) : <p className="text-center text-white/30 py-24 text-xl font-light">아직 밤하늘에 새겨진 기록이 없어요.</p>}
            </div>
          </div>
        )}

        {gameState === GameState.ENCYCLOPEDIA && (
          <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#0a1022]/90 backdrop-blur-xl p-5 -mx-4 rounded-t-3xl z-20">
              <h2 className="text-4xl font-gamja text-blue-200">별자리 백과사전</h2>
              <button onClick={() => setGameState(GameState.LOBBY)} className="px-6 py-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white/70 transition-all text-base font-gamja">닫기</button>
            </div>
            <div className="space-y-8 pb-6">
              {CONSTELLATIONS.map(c => (
                <div key={c.id} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:border-blue-400/30 transition-all">
                  <div className="flex justify-between items-baseline mb-6">
                    <h3 className="text-4xl font-gamja text-blue-300">{c.koreanName}</h3>
                    <span className="text-sm font-quicksand text-white/30 uppercase tracking-widest">{c.difficulty}</span>
                  </div>
                  <p className="text-white/80 mb-8 leading-relaxed text-lg font-light">{c.description}</p>
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20">
                      <h4 className="text-blue-200 text-sm font-bold mb-3">✨ 전해오는 이야기</h4>
                      <p className="text-base text-white/90 font-light leading-relaxed">{c.myth}</p>
                    </div>
                    <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20">
                      <h4 className="text-amber-200 text-sm font-bold mb-3">💡 반짝 상식</h4>
                      <p className="text-base text-white/90 font-light leading-relaxed">{c.funFact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(gameState === GameState.OBSERVE || gameState === GameState.DRAW || gameState === GameState.SUCCESS || gameState === GameState.FAILURE) && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="mb-6 flex justify-between w-full items-end border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={goHome}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
                  title="로비로 돌아가기 (완전 초기화)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-hover:text-blue-300 transition-colors">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </button>
                <button 
                  onClick={prevLevel}
                  disabled={currentLevel === 0}
                  className={`p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group ${currentLevel === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                  title="이전 여행"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-hover:text-blue-300 transition-colors">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <div>
                  <span className="text-xs font-quicksand text-blue-400 tracking-[0.2em] mb-1 block">STAGE {currentLevel + 1} / {CONSTELLATIONS.length}</span>
                  <h2 className="text-3xl font-gamja">{constellation.koreanName}</h2>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-gamja text-yellow-300 drop-shadow-sm">{totalScore.toLocaleString()}</div>
                <div className="text-[0.6rem] text-white/30 uppercase tracking-widest font-quicksand">Total Points</div>
              </div>
            </div>

            {(gameState === GameState.DRAW) && (
              <div className="w-full flex justify-between items-center mb-4 px-2">
                <div className={`px-6 py-2 rounded-full border transition-all duration-300 font-gamja text-lg flex items-center gap-3 ${
                  userStars.length === constellation.stars.length 
                    ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.3)]' 
                    : 'bg-white/5 border-white/10 text-white/60'
                }`}>
                  <span className="text-sm font-quicksand tracking-widest text-white/40 uppercase">Selected</span>
                  <span className={`text-2xl ${userStars.length > constellation.stars.length ? 'text-red-400' : ''}`}>
                    {userStars.length}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="text-xl">{constellation.stars.length}</span>
                </div>

                <button 
                  onClick={useHint}
                  disabled={hintsUsed >= 3 || hintCooldown > 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-gamja text-lg transition-all active:scale-95 ${
                    hintsUsed >= 3 
                      ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' 
                      : hintCooldown > 0
                        ? 'bg-cyan-500/5 border-cyan-500/10 text-cyan-500/40 cursor-wait'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                    <path d="M9 18h6"></path>
                    <path d="M10 22h4"></path>
                  </svg>
                  {hintsUsed >= 3 ? '힌트 소진' : hintCooldown > 0 ? `대기 (${hintCooldown}s)` : `힌트 (${3 - hintsUsed}/3)`}
                </button>
              </div>
            )}

            <div className="relative w-full aspect-square bg-[#000000]/50 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-inner group/canvas">
              <svg viewBox="0 0 100 100" className="w-full h-full p-8">
                <g className="grid-layer pointer-events-none transition-opacity duration-500 opacity-20 group-hover/canvas:opacity-40">
                  {gridLines.map(pos => (
                    <React.Fragment key={pos}>
                      <line 
                        x1={pos} y1="0" x2={pos} y2="100" 
                        stroke="white" strokeWidth={pos === 50 ? "0.3" : "0.1"} 
                        strokeDasharray={pos === 50 ? "" : "2 2"} 
                      />
                      <line 
                        x1="0" y1={pos} x2="100" y2={pos} 
                        stroke="white" strokeWidth={pos === 50 ? "0.3" : "0.1"} 
                        strokeDasharray={pos === 50 ? "" : "2 2"} 
                      />
                    </React.Fragment>
                  ))}
                </g>

                {(gameState === GameState.OBSERVE || gameState === GameState.SUCCESS || gameState === GameState.FAILURE) && constellation.connections.map(([id1, id2], idx) => {
                  const s1 = constellation.stars.find(s => s.id === id1)!;
                  const s2 = constellation.stars.find(s => s.id === id2)!;
                  return (
                    <line 
                      key={idx} 
                      x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} 
                      stroke="white" 
                      strokeWidth="0.8" 
                      strokeOpacity={gameState === GameState.OBSERVE ? "0.15" : "0.7"} 
                      className="transition-all duration-1000"
                    />
                  );
                })}

                {(gameState === GameState.DRAW ? [...constellation.stars, ...decoys] : constellation.stars).map((star) => {
                  const isSelected = userStars.includes(star.id);
                  // 현재 활성화된 딱 하나의 힌트 별만 깜빡임
                  const isHinting = activeHintId === star.id;
                  
                  return (
                    <g key={star.id} onClick={() => toggleStar(star.id)} className="cursor-pointer group">
                      <circle cx={star.x} cy={star.y} r="5" className="fill-white/0 group-hover:fill-white/5" />
                      <circle 
                        cx={star.x} cy={star.y} r={gameState === GameState.OBSERVE ? "2.5" : "2.2"} 
                        className={`transition-all duration-500 ${
                          gameState === GameState.OBSERVE 
                            ? "fill-white animate-pulse" 
                            : isSelected 
                              ? "fill-yellow-200 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] scale-125 transform" 
                              : isHinting 
                                ? "fill-cyan-400 animate-hint-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                                : "fill-white/30 group-hover:fill-white/60"
                        }`}
                        style={{ transformOrigin: `${star.x}px ${star.y}px` }}
                      />
                      <circle cx={star.x} cy={star.y} r="3.5" fill="transparent" />
                    </g>
                  );
                })}
              </svg>
              
              {gameState === GameState.OBSERVE && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="px-6 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-sm font-gamja text-white/80 animate-pulse">
                     별의 기억을 따라가는 중...
                   </div>
                </div>
              )}

              {gameState === GameState.DRAW && activeHintId !== null && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                   <div className="px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-quicksand text-cyan-300 uppercase tracking-widest animate-fade-in flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                     Single Star Guide Active
                   </div>
                </div>
              )}
            </div>

            {gameState === GameState.DRAW && (
              <div className="mt-8 flex gap-4 w-full">
                <button 
                  onClick={checkResult} 
                  className={`flex-1 py-5 rounded-[1.5rem] font-gamja text-2xl shadow-xl transition-all active:scale-95 ${
                    userStars.length === constellation.stars.length
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white'
                    : 'bg-white/10 text-white/40 border border-white/10'
                  }`}
                >
                  별자리를 그려봐요
                </button>
                <button 
                  onClick={() => {
                    setUserStars([]);
                    setWrongClicks(0);
                    setHintsUsed(0);
                    setActiveHintId(null);
                    setHintCooldown(0);
                  }} 
                  className="px-8 py-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] font-gamja text-xl border border-white/10 transition-all text-white/50"
                >
                  다시하기
                </button>
              </div>
            )}

            {(gameState === GameState.SUCCESS || gameState === GameState.FAILURE) && (
              <div className="mt-8 w-full animate-fade-in max-h-[40vh] overflow-y-auto custom-scrollbar">
                <div className={`p-6 rounded-[2rem] mb-6 border backdrop-blur-md ${gameState === GameState.SUCCESS ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                   <h4 className={`text-2xl font-gamja mb-3 ${gameState === GameState.SUCCESS ? 'text-green-300' : 'text-red-300'}`}>
                     {gameState === GameState.SUCCESS ? '✨ 성공을 축하해요!' : '☄️ 별자리가 흩어졌네요'}
                   </h4>
                   
                   <div className="space-y-4 text-white/80 text-sm leading-relaxed mb-4 border-b border-white/10 pb-4">
                     <p className="font-semibold text-blue-200">"{constellation.description}"</p>
                     <p className="opacity-70 italic">{constellation.myth}</p>
                   </div>

                   <p className="text-white/90 text-sm font-gamja leading-relaxed text-base">
                     {loadingFeedback ? "별의 요정이 다정한 말을 준비 중..." : geminiFeedback}
                   </p>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={retryLevel} 
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 font-gamja text-xl transition-all"
                  >
                    다시 하기
                  </button>
                  <button 
                    onClick={nextLevel} 
                    className={`flex-1 py-4 rounded-2xl shadow-lg font-gamja text-xl transition-all transform hover:scale-105 ${
                      gameState === GameState.SUCCESS 
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-400' 
                      : 'bg-white/10 text-white/60 border border-white/10'
                    }`}
                  >
                    다음 여행
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        @keyframes hint-pulse { 
          0%, 100% { transform: scale(1); opacity: 0.5; } 
          50% { transform: scale(1.4); opacity: 1; } 
        }
        .animate-hint-pulse { animation: hint-pulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
