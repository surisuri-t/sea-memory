import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameStatus, OceanCreature, LevelConfig, SpecialItem } from './types';
import { OCEAN_CREATURES, LEVELS } from './constants';
import OceanBackground from './components/OceanBackground';
import OceanCreatureIcon from './components/OceanCreatureIcon';
import { oceanAudio } from './utils/audio';

// Fix: Define AIStudio interface and use it in Window declaration with identical modifiers
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [sequence, setSequence] = useState<OceanCreature[]>([]);
  const [userSequence, setUserSequence] = useState<OceanCreature[]>([]);
  const [activeCreature, setActiveCreature] = useState<OceanCreature | null>(null);
  const [showIndex, setShowIndex] = useState<number>(-1);
  const [score, setScore] = useState(0);
  const [seaFact, setSeaFact] = useState<string>("");
  
  // API & Settings States
  const [isApiReady, setIsApiReady] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // Special Item States
  const [activeItem, setActiveItem] = useState<SpecialItem | null>(null);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [slowMotion, setSlowMotion] = useState(false);

  // API 키 선택 여부 확인
  const checkApiKey = useCallback(async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsApiReady(hasKey);
      return hasKey;
    } catch (e) {
      console.error("API 키 확인 중 오류:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // 연결 테스트 실행
  const runConnectionTest = async () => {
    setTestStatus('TESTING');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "안녕! 연결 테스트 중이야. 짧게 인사해줘.",
      });
      if (response.text) {
        setTestStatus('SUCCESS');
        setIsApiReady(true);
      }
    } catch (err: any) {
      console.error("연결 테스트 실패:", err);
      setTestStatus('ERROR');
      if (err.message?.includes("Requested entity was not found")) {
        setIsApiReady(false);
      }
    }
  };

  const handleOpenKeyPicker = async () => {
    await window.aistudio.openSelectKey();
    // 팝업이 닫힌 후 상태 업데이트 (Race condition 방지를 위해 즉시 true 가정 후 확인)
    setIsApiReady(true);
    checkApiKey();
  };

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
    } catch (err: any) {
      console.error("Gemini API error:", err);
      if (err.message?.includes("Requested entity was not found")) {
        setIsApiReady(false);
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'SUCCESS' && isApiReady) {
      oceanAudio.playSuccess();
      fetchSeaFact();
    } else if (status === 'FAIL') {
      oceanAudio.playFail();
    } else if (status === 'IDLE' || status === 'SHOWING') {
      setSeaFact("");
    }
  }, [status, fetchSeaFact, isApiReady]);

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

      {/* HUD & Settings Button */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-4xl md:text-5xl font-title drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tracking-widest text-blue-50">
          바다의 기억
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-blue-100 font-bold bg-blue-900/40 px-4 py-1 rounded-full border border-blue-400/30 shadow-lg">
            점수: {score}
          </p>
          {activeItem && (
            <div className="flex items-center gap-2 px-4 py-1 bg-yellow-500/80 rounded-full border border-yellow-200 animate-pulse shadow-md">
              <span className="text-xs font-black">SPECIAL:</span>
              <span className="text-xs font-bold">{activeItem.name}</span>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-8 right-8 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/30 transition-all hover:rotate-90 group shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-blue-900/80 backdrop-blur-2xl border-2 border-white/20 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h2 className="text-3xl font-title mb-6 text-center text-blue-100">설정 및 보안</h2>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-200 uppercase tracking-widest">API 키 상태</span>
                  <div className={`w-3 h-3 rounded-full ${isApiReady ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400 shadow-[0_0_10px_#f87171]'}`} />
                </div>
                <p className="text-sm text-blue-50/70 mb-4 leading-relaxed">
                  Gemini API 키는 구글 플랫폼에 의해 로컬 드라이브에 안전하게 암호화되어 관리됩니다.
                </p>
                <button 
                  onClick={handleOpenKeyPicker}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  API 키 설정하기
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <span className="text-sm font-bold text-blue-200 uppercase tracking-widest block mb-4">연결 테스트</span>
                <button 
                  onClick={runConnectionTest}
                  disabled={testStatus === 'TESTING'}
                  className={`w-full py-3 ${testStatus === 'TESTING' ? 'bg-white/10' : 'bg-white/20 hover:bg-white/30'} rounded-xl font-bold transition-all flex items-center justify-center gap-2`}
                >
                  {testStatus === 'TESTING' ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  )}
                  통신 확인하기
                </button>
                
                {testStatus === 'SUCCESS' && (
                  <p className="mt-3 text-center text-green-400 font-bold text-sm animate-in slide-in-from-top-2">✓ 연결이 성공적으로 확인되었습니다!</p>
                )}
                {testStatus === 'ERROR' && (
                  <p className="mt-3 text-center text-red-400 font-bold text-sm animate-in slide-in-from-top-2">✗ 연결 실패. 키 설정을 다시 확인해주세요.</p>
                )}
              </div>
              
              <p className="text-[10px] text-center text-white/30 uppercase tracking-[0.2em]">
                Securely Managed by Google GenAI SDK
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Setup Overlay for first time users */}
      {!isApiReady && status === 'IDLE' && !showSettings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-blue-950/80 backdrop-blur-md px-4">
          <div className="text-center max-w-md animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-400/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"></path></svg>
            </div>
            <h2 className="text-3xl font-title mb-4">시작하기 전에</h2>
            <p className="text-blue-100/70 mb-8 leading-relaxed">
              이 게임은 똑똑한 바다 생물학자(AI)와 함께합니다. <br/>
              안전한 게임 환경을 위해 API 키 설정이 필요합니다.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleOpenKeyPicker}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95"
              >
                API 키 설정하기
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 opacity-60"
              >
                결제 및 요금 안내 확인하기
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Main Stage */}
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
                    className="group relative px-10 py-5 bg-white/10 hover:bg-white/30 border-2 border-white/40 rounded-3xl font-black transition-all transform hover:scale-110 active:scale-95 overflow-hidden shadow-lg"
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
              <div className="text-2xl font-black mb-12 animate-pulse text-blue-100 tracking-widest bg-black/20 px-8 py-2 rounded-full backdrop-blur-sm shadow-xl">
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
        .slide-in-from-top-2 { animation-name: slideInTop; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(2rem); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInBottom { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInTop { from { opacity: 0; transform: translateY(-0.5rem); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;