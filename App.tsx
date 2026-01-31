
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameStatus, OceanCreature, LevelConfig, SpecialItem } from './types';
import { OCEAN_CREATURES, LEVELS } from './constants';
import OceanBackground from './components/OceanBackground';
import OceanCreatureIcon from './components/OceanCreatureIcon';
import { oceanAudio } from './utils/audio';

const STORAGE_KEY = 'OCEAN_MEMORY_API_KEY';

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
  const [manualKey, setManualKey] = useState<string>(localStorage.getItem(STORAGE_KEY) || "");
  const [tempKey, setTempKey] = useState<string>(localStorage.getItem(STORAGE_KEY) || "");
  const [isApiReady, setIsApiReady] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [showKey, setShowKey] = useState<boolean>(false);
  
  // Special Item States
  const [activeItem, setActiveItem] = useState<SpecialItem | null>(null);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [slowMotion, setSlowMotion] = useState(false);

  const getActiveKey = useCallback(() => {
    return manualKey || process.env.API_KEY || "";
  }, [manualKey]);

  const checkApiKeyStatus = useCallback(async () => {
    const key = getActiveKey();
    if (key && key.length > 10) {
      setIsApiReady(true);
      return true;
    }
    
    try {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setIsApiReady(true);
          return true;
        }
      }
    } catch (e) {
      console.warn("AI Studio 플랫폼 확인 건너뜀");
    }

    setIsApiReady(false);
    return false;
  }, [getActiveKey]);

  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]);

  const handleSaveKey = () => {
    const trimmed = tempKey.trim();
    setManualKey(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
    setIsApiReady(trimmed.length > 10);
    setTestStatus('IDLE');
    alert("API 키가 저장되었습니다.");
  };

  const handleDeleteKey = () => {
    if (window.confirm("저장된 API 키를 삭제하시겠습니까?")) {
      setManualKey("");
      setTempKey("");
      localStorage.removeItem(STORAGE_KEY);
      setIsApiReady(false);
      setTestStatus('IDLE');
    }
  };

  const runConnectionTest = async () => {
    const keyToTest = tempKey.trim() || process.env.API_KEY;
    if (!keyToTest) {
      setTestStatus('ERROR');
      return;
    }

    setTestStatus('TESTING');
    try {
      const ai = new GoogleGenAI({ apiKey: keyToTest });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Hello! 짧은 인사를 한국어로 해줘.",
      });
      if (response.text) {
        setTestStatus('SUCCESS');
      }
    } catch (err: any) {
      console.error("연결 테스트 실패:", err);
      setTestStatus('ERROR');
    }
  };

  const fetchSeaFact = useCallback(async () => {
    try {
      const key = getActiveKey();
      if (!key) return;
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "바다 생물에 대한 아주 짧고 흥미로운 사실 하나를 한국어로 알려줘.",
        config: {
          systemInstruction: "당신은 재미있는 해양 생물학자입니다. 15단어 이내로 아주 짧게 설명하세요."
        }
      });
      if (response.text) {
        setSeaFact(response.text.trim());
      }
    } catch (err: any) {
      console.error("Gemini API error:", err);
    }
  }, [getActiveKey]);

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

  const startGame = (level: LevelConfig) => {
    setCurrentLevel(level);
    const newSeq = generateSequence(level);
    setActiveItem(null);
    setBonusMultiplier(1);
    setSlowMotion(false);
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

  const generateSequence = useCallback((level: LevelConfig) => {
    const newSeq: OceanCreature[] = [];
    for (let i = 0; i < level.fishCount; i++) {
      const randomIndex = Math.floor(Math.random() * OCEAN_CREATURES.length);
      newSeq.push(OCEAN_CREATURES[randomIndex]);
    }
    return newSeq;
  }, []);

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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white select-none overflow-hidden font-cute">
      <OceanBackground />

      {/* HUD */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-3xl md:text-5xl font-title drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-widest text-blue-50">
          바다탐험
        </h1>
        <p className="text-blue-200/80 text-lg md:text-2xl mt-1 font-bold drop-shadow-md">
          주어진 시간안에 바다 생물의 순서와 색을 기억해서 선택하는 게임입니다.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2 bg-blue-950/80 px-4 py-1.5 rounded-full border border-blue-400/30 shadow-lg backdrop-blur-md">
            <span className="text-base font-black text-blue-300 uppercase tracking-tighter">점수</span>
            <span className="text-2xl font-bold text-white">{score}</span>
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-8 right-8 z-30 p-3.5 bg-white/5 hover:bg-white/10 rounded-[1.2rem] backdrop-blur-xl border border-white/10 transition-all hover:rotate-90 group shadow-xl active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33-1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#05101c]/95 border-2 border-blue-500/30 rounded-[3rem] p-8 md:p-12 shadow-[0_0_150px_rgba(0,0,0,0.8)] animate-in zoom-in">
            <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 p-3 text-blue-400 hover:bg-white/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="flex flex-col items-center mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">API 키 관리 센터</h2>
              <p className="text-blue-400/60 text-lg">Gemini API 키를 설정하여 AI 정보를 활성화하세요.</p>
            </div>
            <div className="space-y-6">
              <div className="bg-blue-900/10 rounded-[2.5rem] p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-blue-200 text-lg uppercase tracking-widest">Gemini API Key</span>
                  <div className={`w-3 h-3 rounded-full ${isApiReady ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                </div>
                <div className="relative mb-4">
                  <input
                    type={showKey ? "text" : "password"}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="여기에 API 키를 입력하세요"
                    className="w-full bg-black/60 border-2 border-blue-900/50 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm pr-12"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50 hover:text-blue-400">
                    {showKey ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleSaveKey} className="py-3 bg-blue-700 hover:bg-blue-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg text-lg">저장</button>
                  <button onClick={handleDeleteKey} className="py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg">삭제</button>
                </div>
              </div>
              <div className="bg-blue-900/5 rounded-[2.5rem] p-6 border border-white/5">
                <button 
                  onClick={runConnectionTest}
                  disabled={testStatus === 'TESTING' || (!tempKey && !getActiveKey())}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 border border-white/5"
                >
                  {testStatus === 'TESTING' ? <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <span>연결 상태 테스트</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Stage */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        <div className="w-full min-h-[620px] md:min-h-[740px] bg-blue-950/20 backdrop-blur-2xl border-2 border-white/5 rounded-[4rem] shadow-[0_0_120px_rgba(0,0,0,0.8)] flex items-center justify-center relative overflow-hidden mb-8 transition-all p-8">
          
          {status === 'IDLE' && (
            <div className="text-center animate-in zoom-in p-12">
              <div className="mb-14 flex justify-center gap-12">
                <OceanCreatureIcon type="fish" color="#ef4444" size={100} className="animate-bounce opacity-80" />
                <OceanCreatureIcon type="seahorse" color="#a855f7" size={100} className="animate-bounce opacity-80" style={{animationDelay:'0.2s'}} />
                <OceanCreatureIcon type="starfish" color="#f97316" size={100} className="animate-bounce opacity-80" style={{animationDelay:'0.4s'}} />
              </div>
              <h2 className="text-5xl font-bold mb-14 drop-shadow-2xl tracking-widest">탐험 레벨 선택</h2>
              <div className="flex flex-wrap justify-center gap-10">
                {LEVELS.map((level) => (
                  <button key={level.id} onClick={() => startGame(level)} className="group relative px-12 py-8 bg-blue-900/30 hover:bg-blue-800/50 border-2 border-blue-400/20 rounded-[3rem] font-bold transition-all transform hover:scale-110 active:scale-95 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                    <span className="relative z-10 text-2xl md:text-2xl tracking-widest">{level.label}</span>
                    <div className="relative z-10 text-base md:text-lg opacity-80 mt-2">
                       {level.fishCount}개 기억
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/5 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'SHOWING' && (
            <div className="flex flex-col items-center p-12">
              <div className="text-4xl font-bold mb-24 animate-pulse text-blue-200 tracking-[0.5em] bg-blue-950/60 px-20 py-6 rounded-full border border-blue-400/10 shadow-inner uppercase">집중하세요!</div>
              <div className={`transition-all duration-500 transform ${activeCreature ? 'scale-[4.5] opacity-100' : 'scale-0 opacity-0 rotate-180'}`}>
                {activeCreature && <div className="drop-shadow-[0_0_80px_rgba(255,255,255,0.8)]"><OceanCreatureIcon type={activeCreature.type} color={activeCreature.hex} size={150} /></div>}
              </div>
            </div>
          )}

          {status === 'INPUTTING' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6">
              <div className="mb-8 flex flex-col items-center">
                <h2 className="text-5xl font-bold mb-4 drop-shadow-2xl tracking-widest">나타난 순서대로 탭하세요!</h2>
                <div className="flex items-center gap-3 bg-blue-950/40 px-6 py-2 rounded-full border border-white/10">
                   <span className="text-xl opacity-60">진행도:</span>
                   <span className="text-2xl font-black text-blue-300">{userSequence.length}</span>
                   <span className="text-xl opacity-60">/</span>
                   <span className="text-2xl font-black">{sequence.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-4 gap-8 md:gap-12 mb-12">
                {OCEAN_CREATURES.map((creature) => (
                  <button 
                    key={creature.id} 
                    onClick={() => handleInput(creature)} 
                    className="group relative transition-all transform hover:scale-125 active:scale-90 flex items-center justify-center"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="relative z-10 p-2">
                       <OceanCreatureIcon type={creature.type} color={creature.hex} size={80} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]" />
                    </div>
                    <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity scale-150 blur-xl" />
                  </button>
                ))}
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-3xl border border-white/10 min-h-[4rem] max-w-full overflow-x-auto scrollbar-hide">
                {userSequence.map((creature, idx) => (
                  <div key={idx} className="animate-in slide-in-from-right-2 flex-shrink-0 bg-white/5 p-1.5 rounded-xl border border-white/5">
                    <OceanCreatureIcon type={creature.type} color={creature.hex} size={32} />
                  </div>
                ))}
                {userSequence.length === 0 && (
                  <div className="flex items-center px-4 text-white/20 italic text-xl">선택을 기다리고 있어요...</div>
                )}
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center animate-in zoom-in w-full max-w-4xl px-12 py-12 flex flex-col items-center justify-center">
              <div className="text-[12rem] mb-10 animate-bounce drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)]">🐬</div>
              <h2 className="text-8xl font-bold text-yellow-300 mb-8 drop-shadow-[0_10px_40px_rgba(0,0,0,1)] tracking-widest">정답이에요!</h2>
              {seaFact && (
                <div className="mb-16 p-10 bg-blue-950/60 rounded-[4rem] border-2 border-blue-400/20 animate-in fade-in slide-in-from-bottom-4 w-full shadow-2xl relative">
                   <p className="text-blue-50 text-4xl leading-relaxed italic font-bold">"{seaFact}"</p>
                </div>
              )}
              <div className="flex flex-wrap gap-12 justify-center">
                <button onClick={() => startGame(currentLevel)} className="min-w-[260px] px-12 py-6 bg-yellow-400 hover:bg-yellow-500 text-blue-950 text-3xl font-bold rounded-[3rem] transition-all shadow-2xl hover:-translate-y-2">다시 하기</button>
                <button onClick={resetGame} className="min-w-[260px] px-12 py-6 bg-white/5 hover:bg-white/10 text-white text-3xl font-bold rounded-[3rem] transition-all border border-white/10">메뉴로</button>
              </div>
            </div>
          )}

          {status === 'FAIL' && (
            <div className="text-center animate-in zoom-in p-16 flex flex-col items-center justify-center">
              <div className="text-[12rem] mb-12 drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)]">🐙</div>
              <h2 className="text-8xl font-bold text-red-500 mb-12 drop-shadow-[0_10px_40px_rgba(0,0,0,1)] tracking-widest">아쉬워요!</h2>
              <div className="flex flex-wrap gap-12 justify-center">
                <button onClick={() => startGame(currentLevel)} className="min-w-[260px] px-12 py-6 bg-blue-700 hover:bg-blue-600 text-white text-3xl font-bold rounded-[3rem] transition-all shadow-2xl hover:-translate-y-2">재도전</button>
                <button onClick={resetGame} className="min-w-[260px] px-12 py-6 bg-white/5 hover:bg-white/10 text-white text-3xl font-bold rounded-[3rem] transition-all border border-white/10">메뉴로</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .animate-in { animation-duration: 0.6s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in { animation-name: zoomIn; }
        .slide-in-from-right-2 { animation-name: slideInRight; animation-duration: 0.3s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
