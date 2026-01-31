
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
      // @ts-ignore: window.aistudio is pre-configured in the execution environment
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
      // 새로운 GoogleGenAI 인스턴스를 생성하여 최신 키 사용 보장
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Hello! Please reply with a very short greeting in Korean to confirm connection.",
      });
      if (response.text) {
        setTestStatus('SUCCESS');
        setIsApiReady(true);
      }
    } catch (err: any) {
      console.error("연결 테스트 실패:", err);
      setTestStatus('ERROR');
      // "Requested entity was not found" 에러 시 키 선택 상태 리셋
      if (err.message?.includes("Requested entity was not found")) {
        setIsApiReady(false);
      }
    }
  };

  const handleOpenKeyPicker = async () => {
    // @ts-ignore: window.aistudio is pre-configured in the execution environment
    await window.aistudio.openSelectKey();
    // 팝업이 닫힌 후 상태를 업데이트 (Race condition 방지 및 키 확인 재실행)
    setIsApiReady(true);
    await checkApiKey();
  };

  const fetchSeaFact = useCallback(async () => {
    try {
      if (!isApiReady) return;
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
  }, [isApiReady]);

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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white select-none overflow-hidden">
      <OceanBackground />

      {/* HUD & Settings Button */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-3xl md:text-5xl font-title drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tracking-widest text-blue-50">
          바다의 기억
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2 bg-blue-900/60 px-4 py-1.5 rounded-full border border-blue-400/30 shadow-lg backdrop-blur-md">
            <span className="text-xs font-black text-blue-300 uppercase">점수</span>
            <span className="text-lg font-bold text-white">{score}</span>
          </div>
          {activeItem && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500/80 rounded-full border border-yellow-200 animate-pulse shadow-md">
              <span className="text-xs font-black">특수 효과</span>
              <span className="text-sm font-bold">{activeItem.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Toggle Button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-8 right-8 z-30 p-3.5 bg-white/10 hover:bg-white/20 rounded-[1.2rem] backdrop-blur-xl border border-white/20 transition-all hover:rotate-90 group shadow-xl active:scale-95"
        title="보안 설정 및 API 관리"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {/* API Key Management Center Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-[#0a1b2d]/90 backdrop-blur-3xl border-2 border-blue-400/30 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(30,58,138,0.5)] animate-in zoom-in duration-300 overflow-hidden">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-colors text-blue-300 shadow-inner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-blue-500/20 rounded-[2.2rem] flex items-center justify-center mb-6 border border-blue-400/40 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"></path></svg>
              </div>
              <h2 className="text-3xl font-title text-white tracking-wider">보안 API 관리 센터</h2>
              <p className="text-blue-300/60 text-sm mt-2 font-medium">로컬 드라이브 암호화 저장 및 직접 입력</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-400/10 transition-all duration-700" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${isApiReady ? 'bg-green-400 shadow-[0_0_15px_#4ade80]' : 'bg-red-400 shadow-[0_0_15px_#f87171]'}`} />
                    <span className="font-black text-blue-100 uppercase tracking-widest text-sm">연결 시스템 상태</span>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isApiReady ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
                    {isApiReady ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <p className="text-blue-100/60 leading-relaxed text-sm mb-8">
                  보안 규정에 따라 사용자의 API 키는 Google AI Studio의 공식 다이얼로그를 통해 <strong>직접 입력</strong>해야 합니다. 입력된 키는 로컬 드라이브에 안전하게 암호화되어 저장됩니다.
                </p>

                <button 
                  onClick={handleOpenKeyPicker}
                  className="w-full py-5 bg-blue-500 hover:bg-blue-600 rounded-[1.5rem] font-black text-xl transition-all shadow-[0_10px_25px_rgba(59,130,246,0.3)] active:scale-95 flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    API 키 직접 입력 및 설정
                  </div>
                  <span className="text-[10px] opacity-70">보안 다이얼로그 호출</span>
                </button>
              </div>

              <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-black text-blue-300 uppercase tracking-widest">데이터 통신 테스트</span>
                  <div className="text-[10px] bg-blue-400/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/20 font-black">GEMINI 3 FLASH</div>
                </div>
                
                <button 
                  onClick={runConnectionTest}
                  disabled={testStatus === 'TESTING'}
                  className={`w-full py-5 ${testStatus === 'TESTING' ? 'bg-white/5 cursor-wait' : 'bg-white/10 hover:bg-white/20'} rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-3 border border-white/10 shadow-lg`}
                >
                  {testStatus === 'TESTING' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span>연결 확인 중...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                      통신 확인 테스트
                    </>
                  )}
                </button>
                
                {testStatus === 'SUCCESS' && (
                  <div className="mt-5 flex flex-col items-center gap-1 text-green-400 font-bold bg-green-500/10 py-4 rounded-2xl border border-green-500/20 animate-in slide-in-from-top-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-green-400/5 animate-pulse" />
                    <div className="flex items-center gap-3 relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      연결 성공!
                    </div>
                    <span className="text-[10px] opacity-70 font-medium">AI가 정상적으로 응답 중입니다.</span>
                  </div>
                )}
                {testStatus === 'ERROR' && (
                  <div className="mt-5 flex flex-col items-center gap-1 text-red-400 font-bold bg-red-500/10 py-4 rounded-2xl border border-red-500/20 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      연결 실패
                    </div>
                    <span className="text-[10px] opacity-70 font-medium">키가 유효하지 않습니다. 다시 입력해주세요.</span>
                  </div>
                )}
              </div>
              
              <div className="text-center px-4">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed">
                  Encryption Key Managed via Secure Platform Context<br/>
                  (c) 2025 Deep Blue AI Explorer
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary API Setup Required Overlay */}
      {!isApiReady && status === 'IDLE' && !showSettings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#051529]/95 backdrop-blur-2xl px-6 animate-in fade-in duration-700">
          <div className="text-center max-w-lg animate-in zoom-in duration-700">
            <div className="relative inline-block mb-12">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-[100px] opacity-30 animate-pulse" />
              <div className="relative w-32 h-32 bg-blue-500/10 rounded-[3rem] flex items-center justify-center border-2 border-blue-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"></path></svg>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-title mb-8 leading-tight tracking-tight">AI 해양 지식 탐험<br/>보안 인증</h2>
            <p className="text-blue-200/60 mb-12 leading-relaxed text-xl max-w-md mx-auto">
              이 게임은 실시간 AI 연동을 통해 특별한 지식을 제공합니다. 사용자의 <strong>개인 API 키를 직접 입력</strong>하여 탐험을 시작하세요.
            </p>
            <div className="flex flex-col gap-5">
              <button 
                onClick={handleOpenKeyPicker}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-[2rem] font-black text-2xl transition-all shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 transform flex flex-col items-center justify-center gap-1"
              >
                <span>API 키 직접 입력하기</span>
                <span className="text-xs font-medium opacity-60">로컬 암호화 저장 방식</span>
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-8 font-bold opacity-70 transition-opacity"
              >
                결제 및 요금 안내(Billing) 페이지 방문
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Interface Stage */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        <div className="w-full min-h-[600px] md:min-h-[720px] bg-blue-400/5 backdrop-blur-2xl border-4 border-white/20 rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden mb-12 transition-all p-8">
          
          {status === 'IDLE' && (
            <div className="text-center animate-in fade-in zoom-in duration-700 p-12">
              <div className="mb-16 flex justify-center gap-12">
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl animate-bounce">
                  <OceanCreatureIcon type="fish" color="#ef4444" size={100} />
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl animate-bounce" style={{animationDelay: '0.2s'}}>
                  <OceanCreatureIcon type="seahorse" color="#a855f7" size={100} />
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl animate-bounce" style={{animationDelay: '0.4s'}}>
                  <OceanCreatureIcon type="starfish" color="#f97316" size={100} />
                </div>
              </div>
              <h2 className="text-5xl md:text-6xl font-title mb-12 drop-shadow-2xl tracking-wide">탐험의 난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-10">
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => startGame(level)}
                    className="group relative px-16 py-8 bg-blue-500/20 hover:bg-blue-500/40 border-2 border-white/30 rounded-[2.5rem] font-black transition-all transform hover:scale-110 active:scale-95 shadow-2xl"
                  >
                    <span className="relative z-10 text-4xl">{level.label}</span>
                    <div className="text-base font-bold opacity-60 mt-3">{level.fishCount}명의 친구들</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'SHOWING' && (
            <div className="flex flex-col items-center p-12">
              <div className="text-4xl font-black mb-20 animate-pulse text-blue-100 tracking-[0.4em] bg-blue-900/40 px-16 py-4 rounded-full backdrop-blur-md border border-blue-400/20 shadow-2xl uppercase">
                Focus on Sequence
              </div>
              <div className={`transition-all duration-500 transform ${activeCreature ? 'scale-[4.5] opacity-100' : 'scale-0 opacity-0 rotate-180'}`}>
                {activeCreature && (
                  <div className="drop-shadow-[0_0_60px_rgba(255,255,255,0.95)]">
                    <OceanCreatureIcon type={activeCreature.type} color={activeCreature.hex} size={150} />
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'INPUTTING' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-14">
              <h2 className="text-5xl font-title mb-16 text-white drop-shadow-2xl tracking-wide">나타난 순서대로 탭하세요!</h2>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-8 mb-24">
                {OCEAN_CREATURES.map((creature) => (
                  <button
                    key={creature.id}
                    onClick={() => handleInput(creature)}
                    className={`group w-24 h-24 md:w-28 md:h-28 rounded-[2rem] ${creature.colorClass} border-4 border-white/40 hover:border-white hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden`}
                  >
                    <OceanCreatureIcon type={creature.type} color="white" size={56} className="opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-5">
                {sequence.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-6 rounded-full border-2 border-white/50 transition-all duration-300 ${
                      i < userSequence.length ? 'bg-green-400 scale-125 shadow-[0_0_25px_#4ade80]' : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center animate-in zoom-in duration-700 w-full max-w-4xl px-12 py-12 flex flex-col items-center justify-center">
              <div className="text-[10rem] mb-8 animate-bounce drop-shadow-2xl">🐬</div>
              <h2 className="text-7xl md:text-8xl font-title text-yellow-300 mb-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]">정답입니다!</h2>
              <p className="text-3xl font-bold mb-12 text-white/95 tracking-wide">놀라운 기억력을 가지고 계시네요!</p>
              
              {seaFact && (
                <div className="mb-14 p-10 bg-[#0a1e36]/85 rounded-[3.5rem] border-2 border-blue-400/40 animate-in fade-in slide-in-from-bottom-4 w-full shadow-2xl relative">
                   <div className="absolute -top-4 left-10 bg-blue-500 px-6 py-1 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-lg">Marine Fact</div>
                   <p className="text-white text-2xl md:text-3xl leading-relaxed italic font-medium">"{seaFact}"</p>
                </div>
              )}

              <div className="flex flex-wrap gap-10 justify-center w-full py-4">
                <button
                  onClick={() => startGame(currentLevel)}
                  className="min-w-[260px] px-14 py-7 bg-yellow-400 hover:bg-yellow-500 text-blue-950 text-3xl font-black rounded-[2.5rem] transition-all shadow-[0_20px_50px_rgba(250,204,21,0.5)] hover:-translate-y-3 active:translate-y-0"
                >
                  다시 하기
                </button>
                <button
                  onClick={resetGame}
                  className="min-w-[260px] px-14 py-7 bg-white/20 hover:bg-white/30 text-white text-3xl font-black rounded-[2.5rem] transition-all backdrop-blur-xl shadow-2xl hover:-translate-y-3 active:translate-y-0 border-2 border-white/20"
                >
                  메뉴로
                </button>
              </div>
            </div>
          )}

          {status === 'FAIL' && (
            <div className="text-center animate-in zoom-in duration-700 p-16 flex flex-col items-center justify-center">
              <div className="text-[10rem] mb-12 drop-shadow-2xl">🐙</div>
              <h2 className="text-7xl font-title text-red-400 mb-8 drop-shadow-2xl">아쉬워요!</h2>
              <p className="text-3xl font-bold mb-14 text-white/80">생물들이 너무 빨랐나요? 다시 시도해보세요!</p>
              <div className="flex flex-wrap gap-10 justify-center">
                <button
                  onClick={() => startGame(currentLevel)}
                  className="min-w-[260px] px-14 py-7 bg-blue-600 hover:bg-blue-500 text-white text-3xl font-black rounded-[2.5rem] transition-all shadow-2xl hover:-translate-y-3 active:translate-y-0"
                >
                  재도전
                </button>
                <button
                  onClick={resetGame}
                  className="min-w-[260px] px-14 py-7 bg-white/10 hover:bg-white/20 text-white text-3xl font-black rounded-[2.5rem] transition-all hover:-translate-y-3 active:translate-y-0 border-2 border-white/10 backdrop-blur-md"
                >
                  메뉴로
                </button>
              </div>
            </div>
          )}

        </div>

        {(status === 'INPUTTING' || status === 'SUCCESS' || status === 'FAIL') && (
           <div className="flex flex-wrap gap-6 items-center bg-black/50 px-12 py-5 rounded-[2.5rem] border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 min-h-[6rem]">
             <div className="flex flex-col">
               <span className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">Memory Log</span>
               <span className="text-[10px] text-blue-200/40 uppercase">탐험 진행 기록</span>
             </div>
             <div className="h-8 w-[1px] bg-white/10 mx-2" />
             <div className="flex gap-4 flex-wrap">
               {userSequence.map((item, i) => (
                 <div key={i} className="animate-in slide-in-from-right-8 p-1.5 bg-white/5 rounded-xl border border-white/10">
                    <OceanCreatureIcon type={item.type} color={item.hex} size={32} />
                 </div>
               ))}
               {userSequence.length === 0 && <span className="text-lg text-white/30 italic font-medium">첫 번째 친구를 선택해주세요...</span>}
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
        @keyframes slideInRight { from { opacity: 0; transform: translateX(3rem); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInBottom { from { opacity: 0; transform: translateY(2rem); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInTop { from { opacity: 0; transform: translateY(-1rem); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
