
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameStatus, OceanCreature, LevelConfig, SpecialItem } from './types';
import { OCEAN_CREATURES, LEVELS } from './constants';
import OceanBackground from './components/OceanBackground';
import OceanCreatureIcon from './components/OceanCreatureIcon';
import { oceanAudio } from './utils/audio';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [sequence, setSequence] = useState<OceanCreature[]>([]);
  const [userSequence, setUserSequence] = useState<OceanCreature[]>([]);
  const [activeCreature, setActiveCreature] = useState<OceanCreature | null>(null);
  const [showIndex, setShowIndex] = useState<number>(-1);
  const [score, setScore] = useState(0);
  const [seaFact, setSeaFact] = useState<string>("");
  
  // Special Item States
  const [activeItem, setActiveItem] = useState<SpecialItem | null>(null);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [slowMotion, setSlowMotion] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSeaFact = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "바다 생물에 대한 아주 짧고 흥미로운 사실 하나를 한국어로 알려줘.",
        config: {
          systemInstruction: "당신은 재미있는 해양 생물학자입니다. 15단어 이내로 어린이가 이해하기 쉽게 설명하세요."
        }
      });
      if (response.text) {
        setSeaFact(response.text.trim());
      }
    } catch (err) {
      console.error("Gemini API error:", err);
    }
  }, []);

  useEffect(() => {
    if (status === 'SUCCESS') {
      oceanAudio.playSuccess();
      fetchSeaFact();
    } else if (status === 'FAIL') {
      oceanAudio.playFail();
    } else if (status === 'IDLE' || status === 'SHOWING') {
      setSeaFact("");
    }
  }, [status, fetchSeaFact]);

  const generateSequence = useCallback((level: LevelConfig) => {
    const newSeq: OceanCreature[] = [];
    for (let i = 0; i < level.fishCount; i++) {
      const randomIndex = Math.floor(Math.random() * OCEAN_CREATURES.length);
      newSeq.push(OCEAN_CREATURES[randomIndex]);
    }
    return newSeq;
  }, []);

  const startGame = (level: LevelConfig) => {
    setCurrentLevel(level);
    const newSeq = generateSequence(level);
    
    // Logic for special items appearing
    const itemRoll = Math.random();
    if (itemRoll > 0.8) {
      setActiveItem({ id: 'treasure', name: '보물 상자', description: '점수 2배 보너스!' });
      setBonusMultiplier(2);
      setSlowMotion(false);
    } else if (itemRoll > 0.6) {
      setActiveItem({ id: 'slow', name: '거북이의 마법', description: '느리게 나타납니다!' });
      setSlowMotion(true);
      setBonusMultiplier(1);
    } else {
      setActiveItem(null);
      setBonusMultiplier(1);
      setSlowMotion(false);
    }

    setSequence(newSeq);
    setUserSequence([]);
    setStatus('SHOWING');
    setShowIndex(0);
  };

  useEffect(() => {
    if (status === 'SHOWING' && showIndex < sequence.length) {
      setActiveCreature(sequence[showIndex]);
      
      const duration = slowMotion ? currentLevel.displayDuration * 1.5 : currentLevel.displayDuration;

      const timer = setTimeout(() => {
        setActiveCreature(null);
        setTimeout(() => {
          setShowIndex(prev => prev + 1);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else if (status === 'SHOWING' && showIndex >= sequence.length) {
      setStatus('INPUTTING');
      setActiveCreature(null);
    }
  }, [status, showIndex, sequence, currentLevel.displayDuration, slowMotion]);

  const handleInput = (creature: OceanCreature) => {
    if (status !== 'INPUTTING') return;
    
    oceanAudio.playBloop();

    const nextUserSeq = [...userSequence, creature];
    setUserSequence(nextUserSeq);

    const currentIdx = nextUserSeq.length - 1;
    if (creature.id !== sequence[currentIdx].id) {
      setStatus('FAIL');
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      setStatus('SUCCESS');
      setScore(prev => prev + (currentLevel.id * 10 * bonusMultiplier));
    }
  };

  const resetGame = () => {
    setStatus('IDLE');
    setSequence([]);
    setUserSequence([]);
    setScore(0);
    setActiveItem(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white select-none overflow-hidden">
      <OceanBackground />

      {/* HUD */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-4xl md:text-5xl font-title drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tracking-widest text-blue-50">
          바다의 기억
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-blue-100 font-bold bg-blue-900/40 px-4 py-1 rounded-full border border-blue-400/30">
            점수: {score}
          </p>
          {activeItem && (
            <div className="flex items-center gap-2 px-4 py-1 bg-yellow-500/80 rounded-full border border-yellow-200 animate-pulse">
              <span className="text-xs font-black">SPECIAL:</span>
              <span className="text-xs font-bold">{activeItem.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* Main Stage - Adjusted aspect ratio to 16:9 and min-height for more vertical space */}
        <div className="w-full min-h-[500px] md:min-h-[600px] aspect-video bg-blue-400/5 backdrop-blur-xl border-4 border-white/20 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] flex items-center justify-center relative overflow-hidden mb-10 transition-all">
          
          {status === 'IDLE' && (
            <div className="text-center animate-in fade-in zoom-in duration-700 p-6">
              <div className="mb-10 flex justify-center gap-8">
                <OceanCreatureIcon type="fish" color="#ef4444" size={80} className="animate-bounce" />
                <OceanCreatureIcon type="seahorse" color="#a855f7" size={80} className="animate-bounce" style={{animationDelay: '0.2s'}} />
                <OceanCreatureIcon type="starfish" color="#f97316" size={80} className="animate-bounce" style={{animationDelay: '0.4s'}} />
              </div>
              <h2 className="text-4xl font-title mb-8 drop-shadow-lg">난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => startGame(level)}
                    className="group relative px-10 py-5 bg-white/10 hover:bg-white/30 border-2 border-white/40 rounded-3xl font-black transition-all transform hover:scale-110 active:scale-95 overflow-hidden"
                  >
                    <span className="relative z-10 text-2xl">{level.label}</span>
                    <div className="text-xs font-normal opacity-70 mt-1">{level.fishCount}개 생물</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'SHOWING' && (
            <div className="flex flex-col items-center">
              <div className="text-2xl font-black mb-12 animate-pulse text-blue-100 tracking-widest bg-black/20 px-8 py-2 rounded-full backdrop-blur-sm">
                순서를 잘 기억하세요!
              </div>
              <div className={`transition-all duration-500 transform ${activeCreature ? 'scale-[3] opacity-100' : 'scale-0 opacity-0 rotate-180'}`}>
                {activeCreature && (
                  <div className="drop-shadow-[0_0_40px_rgba(255,255,255,0.8)]">
                    <OceanCreatureIcon type={activeCreature.type} color={activeCreature.hex} size={140} />
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'INPUTTING' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-10">
              <h2 className="text-3xl font-title mb-10 text-white drop-shadow-md">나타난 순서대로 선택하세요!</h2>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-5 mb-14">
                {OCEAN_CREATURES.map((creature) => (
                  <button
                    key={creature.id}
                    onClick={() => handleInput(creature)}
                    className={`group w-16 h-16 md:w-20 md:h-20 rounded-2xl ${creature.colorClass} border-4 border-white/30 hover:border-white hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-xl relative overflow-hidden`}
                    title={creature.name}
                  >
                    <OceanCreatureIcon type={creature.type} color="white" size={40} className="opacity-90 group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                {sequence.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full border-2 border-white/30 transition-all duration-300 ${
                      i < userSequence.length ? 'bg-green-400 scale-125 shadow-[0_0_15px_#4ade80]' : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center animate-in zoom-in duration-700 w-full max-w-2xl px-8 py-12 flex flex-col items-center justify-center">
              <div className="text-8xl mb-4 animate-bounce">🐬</div>
              <h2 className="text-5xl md:text-6xl font-title text-yellow-300 mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">대단해요!</h2>
              <p className="text-xl md:text-2xl font-bold mb-6">모든 순서를 정확히 맞췄습니다!</p>
              
              {seaFact && (
                <div className="mb-8 p-6 bg-blue-900/60 rounded-[2rem] border-2 border-blue-400/30 animate-in fade-in slide-in-from-bottom-4 w-full">
                   <p className="text-blue-300 text-sm font-black uppercase tracking-widest mb-2">알고 있었나요?</p>
                   <p className="text-white text-lg md:text-xl leading-relaxed italic">"{seaFact}"</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 md:gap-6 justify-center w-full">
                <button
                  onClick={() => startGame(currentLevel)}
                  className="min-w-[180px] px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-blue-950 text-xl font-black rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                >
                  다시 하기
                </button>
                <button
                  onClick={resetGame}
                  className="min-w-[180px] px-8 py-4 bg-white/20 hover:bg-white/30 text-white text-xl font-black rounded-2xl transition-all backdrop-blur-sm shadow-lg hover:-translate-y-1 active:translate-y-0"
                >
                  메뉴로
                </button>
              </div>
            </div>
          )}

          {status === 'FAIL' && (
            <div className="text-center animate-in zoom-in duration-700 p-8 flex flex-col items-center justify-center">
              <div className="text-8xl mb-6">🐙</div>
              <h2 className="text-5xl md:text-6xl font-title text-red-400 mb-4 drop-shadow-lg">아쉬워요!</h2>
              <p className="text-xl md:text-2xl font-bold mb-10">순서가 틀렸습니다. 다시 도전해보세요!</p>
              <div className="flex flex-wrap gap-6 justify-center">
                <button
                  onClick={() => startGame(currentLevel)}
                  className="min-w-[180px] px-12 py-4 bg-blue-500 hover:bg-blue-600 text-white text-xl font-black rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                >
                  재도전
                </button>
                <button
                  onClick={resetGame}
                  className="min-w-[180px] px-12 py-4 bg-white/20 hover:bg-white/30 text-xl font-black rounded-2xl transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  메뉴로
                </button>
              </div>
            </div>
          )}

        </div>

        {/* User History Tracker */}
        {(status === 'INPUTTING' || status === 'SUCCESS' || status === 'FAIL') && (
           <div className="flex flex-wrap gap-3 md:gap-4 min-h-[4rem] items-center bg-black/40 px-6 md:px-10 py-2 rounded-3xl border border-white/20 backdrop-blur-md shadow-inner mb-4">
             <span className="text-xs font-black uppercase tracking-widest text-blue-300 mr-2">입력 기록:</span>
             <div className="flex gap-2 flex-wrap">
               {userSequence.map((item, i) => (
                 <div key={i} className="animate-in slide-in-from-right-8">
                    <OceanCreatureIcon type={item.type} color={item.hex} size={28} />
                 </div>
               ))}
               {userSequence.length === 0 && <span className="text-sm text-white/40 italic">첫 번째 선택을 기다리는 중...</span>}
             </div>
           </div>
        )}
      </div>

      <style>{`
        .animate-in {
          animation-duration: 0.8s;
          animation-fill-mode: both;
        }
        .fade-in { animation-name: fadeIn; }
        .zoom-in { animation-name: zoomIn; }
        .slide-in-from-right-8 { animation-name: slideInRight; }
        .slide-in-from-bottom-4 { animation-name: slideInBottom; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(2rem); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInBottom { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
