import React, { useState, useEffect } from 'react';
import { ROUTINES, RoutineDefinition, ExerciseDefinition } from '../data/routines';
import { Info, ArrowUp, Edit2, Activity, Dumbbell, Footprints, Zap, Target, BicepsFlexed, ChevronsDown, MoveDown, ChevronsUp, MoveRight, CircleArrowUp, PersonStanding } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../store';
import { WorkoutSession } from '../components/WorkoutSession';
import { audioController } from '../utils/audio';
import confetti from 'canvas-confetti';

const renderInfoText = (text: string) => {
  const formattedText = text.replace(/\\n/g, '\n');
  
  return formattedText.split('\n').map((line, i) => {
    const boldPrefixes = ['Objetivo:', 'Ejecución:', 'Punto Clave:', 'Formato:', 'Intensidad (RIR):', 'Aproximaciones (Rampa):', 'Aproximaciones:'];
    let isBold = false;
    let prefix = '';
    
    for (const p of boldPrefixes) {
      if (line.startsWith(p)) {
        isBold = true;
        prefix = p;
        break;
      }
    }

    if (isBold) {
      return (
        <span key={i} className="block mb-2 mt-4 first:mt-0">
          <strong className="text-white font-bold tracking-wide uppercase text-xs">{prefix}</strong>
          <span className="block mt-1">{line.substring(prefix.length).trim()}</span>
        </span>
      );
    }
    
    if (line.trim().startsWith('-')) {
      return (
        <span key={i} className="block pl-4 mb-1 relative text-[var(--color-text-muted)]">
          <span className="absolute left-0 top-0 text-[var(--color-neon-purple-light)]">•</span>
          {line.substring(1).trim()}
        </span>
      );
    }

    if (line.trim() === '') return null;

    return (
      <span key={i} className="block mb-2 text-[var(--color-text-muted)]">
        {line}
      </span>
    );
  });
};

const getIconForExercise = (name: string) => {
  const n = name.toLowerCase();
  // Lower body
  if (n.includes('sentadilla') || n.includes('zancada')) return <ChevronsDown size={20} />;
  if (n.includes('peso muerto') || n.includes('pmr')) return <MoveDown size={20} />;
  if (n.includes('elev') && n.includes('talones')) return <CircleArrowUp size={20} />;
  // Upper body
  if (n.includes('press')) return <ChevronsUp size={20} />;
  if (n.includes('remo')) return <MoveRight size={20} />;
  if (n.includes('elev') && n.includes('laterales')) return <CircleArrowUp size={20} />;
  if (n.includes('curl') || n.includes('superserie') || n.includes('brazos')) return <BicepsFlexed size={20} />;
  
  return <Dumbbell size={20} />;
};

export const WorkoutTab: React.FC = () => {
  const { state: storeState } = useStore();
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDay());
  const [routine, setRoutine] = useState<RoutineDefinition | null>(null);
  
  const [activeSession, setActiveSession] = useState<'warmup' | 'routine' | null>(null);
  const [vo2PrepSession, setVo2PrepSession] = useState<'warmup' | 'routine' | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<{title: string, info: string} | null>(null);

  const getExerciseMaxWeight = (exerciseId: string) => {
    const exLogs = storeState.logs.filter(l => l.exerciseId === exerciseId && !l.isWarmup);
    if (exLogs.length === 0) return 0;
    
    // Get max weight from the last session
    const lastLog = exLogs[exLogs.length - 1];
    const lastDate = lastLog.date.split('T')[0];
    const logsLastDay = exLogs.filter(l => l.date.split('T')[0] === lastDate);
    
    return Math.max(...logsLastDay.map(l => l.weight || 0));
  };
  
  const getLastVo2Weight = (label: string) => {
    const exLogs = storeState.logs.filter(l => l.exerciseId === `circuito-hiit_${label}` && !l.isWarmup);
    if (exLogs.length === 0) return 0;
    
    // Get max weight from the last session for this exact vo2 exercise
    const lastLog = exLogs[exLogs.length - 1];
    const lastDate = lastLog.date.split('T')[0];
    const logsLastDay = exLogs.filter(l => l.date.split('T')[0] === lastDate);
    
    return Math.max(...logsLastDay.map(l => l.weight || 0));
  };
  const [showTransitionConfirm, setShowTransitionConfirm] = useState(false);

  const days = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' },
  ];

  useEffect(() => {
    const todayRoutine = ROUTINES.find(r => r.dayOfWeek === currentDay);
    setRoutine(todayRoutine || null);
  }, [currentDay]);

  if (!routine) return <div className="p-6 text-center text-[var(--color-text-muted)]">Cargando rutina...</div>;

  const isHiit = routine.id.includes('hiit');

  const handleWarmupComplete = () => {
    setActiveSession(null);
    if (routine.id === 'monday-hiit') {
      // Automatically start VO2 Max
      setActiveSession('routine');
    } else {
      setShowTransitionConfirm(true);
    }
  };

  const handleRoutineComplete = () => {
    setActiveSession(null);
    audioController.playVictory();
    
    // Premium completion effect
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9D4EDD', '#39FF14', '#ffffff']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9D4EDD', '#39FF14', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      {/* Day Selector */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
        {days.map(day => (
          <button
            key={day.id}
            onClick={() => setCurrentDay(day.id)}
            className={clsx(
              "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
              currentDay === day.id 
                ? "bg-[var(--color-neon-purple-light)] text-white shadow-[0_0_15px_rgba(255,105,180,0.5)] transform scale-[1.02]" 
                : "bg-[var(--color-oled-card)] border border-white/5 text-[var(--color-text-muted)] hover:text-white hover:bg-white/5"
            )}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Routine Header Card */}
      <div className="bg-[var(--color-oled-card)] border border-white/5 rounded-3xl p-6 mb-6 relative shadow-lg shadow-black/50">
        <h2 className="text-3xl font-display font-black mb-1 pr-8 leading-tight flex items-center gap-2">
          {routine.title}
          {isHiit ? (
            <Activity className="text-red-500 w-6 h-6 shrink-0" />
          ) : routine.isRestDay ? (
            <Footprints className="text-emerald-500 w-6 h-6 shrink-0" />
          ) : routine.id.includes('torso') ? (
            <BicepsFlexed className="text-[var(--color-neon-purple-light)] w-6 h-6 shrink-0" />
          ) : (
            <Dumbbell className="text-[var(--color-neon-purple-light)] w-6 h-6 shrink-0" />
          )}
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm mb-6 tracking-wide font-medium">
          {days.find(d => d.id === currentDay)?.label}
        </p>

        {!routine.isRestDay && (
          <div className="space-y-3">
            {routine.warmup && routine.warmup.length > 0 && (
              <button 
                onClick={() => {
                  if (routine.id === 'monday-hiit') {
                    setVo2PrepSession('warmup');
                  } else {
                    audioController.init();
                    setActiveSession('warmup');
                  }
                }}
                className="w-full py-3.5 bg-[var(--color-neon-purple-light)] hover:bg-[var(--color-neon-purple)] text-white font-bold tracking-wide rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-[0_4px_14px_0_rgba(140,0,255,0.39)] hover:shadow-[0_6px_20px_rgba(140,0,255,0.23)]"
              >
                <Zap size={18} className="mr-2" /> Iniciar Calentamiento {isHiit ? '(hiit)' : '(fuerza)'}
              </button>
            )}

            {routine.exercises && routine.exercises.length > 0 && (
              <button 
                onClick={() => {
                  if (routine.id === 'monday-hiit') {
                    setVo2PrepSession('routine');
                  } else {
                    audioController.init();
                    setActiveSession('routine');
                  }
                }}
                className={clsx(
                  "w-full py-3.5 font-bold tracking-wide rounded-xl flex items-center justify-center transition-all active:scale-95",
                  isHiit 
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)]" 
                    : "bg-[var(--color-neon-purple-light)] hover:bg-[var(--color-neon-purple)] text-white shadow-[0_4px_14px_0_rgba(140,0,255,0.39)] hover:shadow-[0_6px_20px_rgba(140,0,255,0.23)]"
                )}
              >
                {isHiit ? <><Activity size={18} className="mr-2" /> Iniciar VO2 Máx</> : <><Dumbbell size={18} className="mr-2" /> Iniciar Rutina de Fuerza</>}
              </button>
            )}
          </div>
        )}

        {routine.isRestDay && (
          <div className="bg-[var(--color-oled-card)] border border-[var(--color-oled-card-hover)] rounded-xl p-4 mt-4 flex items-start">
            <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-4 shrink-0">
              <PersonStanding className="text-blue-400" size={20} />
            </div>
            <div>
              <h4 className="font-bold mb-1">Descanso Activo (Pasos)</h4>
              <p className="text-sm text-[var(--color-text-muted)]">{routine.restDayMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Exercise List */}
      {!routine.isRestDay && routine.exercises && (
        <div className="space-y-3">
          {routine.exercises.map((ex, idx) => (
            <div key={ex.id} className="bg-[var(--color-oled-card)] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-4 flex items-center shadow-md">
              <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-inner",
                isHiit ? "bg-red-900/30 text-red-500" : "bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple-light)]"
              )}>
                {isHiit ? <Activity size={20} /> : getIconForExercise(ex.name)}
              </div>
              
              <div className="flex-1 pr-2">
                <h4 className="font-bold text-sm mb-1 leading-tight">{ex.name}</h4>
                <div className="text-xs text-[var(--color-text-muted)] flex gap-3 font-mono">
                  {ex.isCircuit ? (
                    <>
                      <span><strong className="text-white">{ex.sets.length / 4}</strong> rondas</span>
                      <span><strong className="text-white">40s</strong> act / <strong className="text-white">20s</strong> desc</span>
                    </>
                  ) : (
                    <>
                      <span><strong className="text-white">{ex.sets.filter(s => !s.isExtra && !s.isWarmup).length}{ex.sets.some(s => s.isExtra) ? `+${ex.sets.filter(s => s.isExtra).length}` : ''}</strong> sets</span>
                      {ex.sets.find(s => !s.isWarmup)?.repsGoal && <span><strong className="text-white">{ex.sets.find(s => !s.isWarmup)?.repsGoal?.split(' ')[0]}</strong> reps</span>}
                      {ex.sets.find(s => !s.isWarmup)?.restTime && <span><strong className="text-white">{ex.sets.find(s => !s.isWarmup)?.restTime}s</strong> rest</span>}
                    </>
                  )}
                </div>
                {(() => {
                  const exLogs = storeState.logs.filter(l => l.exerciseId === ex.id);
                  if (exLogs.length === 0) return null;
                  
                  const lastLog = exLogs[exLogs.length - 1];
                  const lastDate = lastLog.date.split('T')[0];
                  const logsLastDay = exLogs.filter(l => l.date.split('T')[0] === lastDate);
                  
                  // Get max weight from the last session
                  const maxWeight = Math.max(...logsLastDay.map(l => l.weight || 0));
                  
                  if (maxWeight <= 0) return null;

                  return (
                    <div className="inline-flex mt-1 items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface)]/50 border border-white/5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      <span className="opacity-80 flex items-center gap-1"><Target size={12} /> ÚLTIMO PESO:</span> <span className="text-white text-[11px] ml-1">{maxWeight} KG</span>
                    </div>
                  );
                })()}
              </div>

              <button 
                onClick={() => setShowInfoModal({ title: ex.name, info: ex.info })}
                className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                <Info size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-oled-card)] w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl border border-[var(--color-oled-card-hover)] animate-in slide-in-from-bottom-10">
            <div className="p-6 pb-4 shrink-0">
              <h3 className="text-xl font-bold text-[var(--color-neon-purple-light)]">{showInfoModal.title}</h3>
            </div>
            
            <div className="px-6 overflow-y-auto hide-scrollbar flex-1">
              <div className="text-sm leading-relaxed mb-6">
                {renderInfoText(showInfoModal.info)}
              </div>
              <div className="space-y-4 mb-6">
                {(() => {
                  const ex = routine.exercises?.find(e => e.name === showInfoModal.title);
                  if (!ex) return null;
                  
                  if (ex.type === 'time') {
                    return (
                      <div>
                        <h4 className="font-bold text-[var(--color-neon-blue)] uppercase tracking-widest text-xs mb-3">Series Planificadas</h4>
                        <div className="bg-[var(--color-surface)]/50 p-3 rounded-xl border border-white/5 flex gap-4 overflow-x-auto snap-x text-center">
                          {ex.sets.map((set) => (
                            <div key={set.id} className="min-w-[80px] snap-center">
                              <div className="text-xs text-[var(--color-text-muted)] mb-1 font-medium">{set.label}</div>
                              <div className="font-bold text-lg">{set.timeGoal}s</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const warmups = ex.sets.filter(s => s.isWarmup);
                  const working = ex.sets.filter(s => !s.isWarmup);

                  return (
                    <>
                      {warmups.length > 0 && (
                        <div>
                          <h4 className="font-bold text-amber-500 uppercase tracking-widest text-xs mb-3 flex items-center gap-1.5">
                            <Zap size={14} className="animate-pulse" /> Fase de Aproximación
                          </h4>
                          <div className="space-y-2">
                            {warmups.map((set) => (
                              <div key={set.id} className="flex justify-between items-center bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                                <div className="flex flex-col">
                                  <span className="font-bold text-amber-400 text-sm">{set.label}</span>
                                  {set.rir && <span className="text-xs text-amber-400/70">{set.rir}</span>}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <span className="font-bold text-amber-400/90">{set.repsGoal}</span>
                                  {set.restTime > 0 && (
                                    <span className="text-[10px] text-amber-500/50 mt-0.5">⏱ {set.restTime}s desc.</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {working.length > 0 && (
                        <div>
                          <h4 className="font-bold text-[var(--color-neon-blue)] uppercase tracking-widest text-xs mb-3 flex items-center gap-1.5 mt-4">
                            <Dumbbell size={14} className="text-[var(--color-neon-purple-light)]" /> Series de Trabajo
                          </h4>
                          <div className="space-y-2">
                            {working.map((set) => (
                              <div key={set.id} className="flex justify-between items-center bg-[var(--color-surface)]/50 p-3 rounded-xl border border-white/5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white">{set.label}</span>
                                  {set.rir && <span className="text-xs text-[var(--color-text-muted)]">{set.rir}</span>}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <span className="font-bold text-[var(--color-neon-blue-light)]">{set.repsGoal}</span>
                                  {set.restTime > 0 && (
                                    <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">⏱ {set.restTime}s desc.</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="p-6 pt-4 shrink-0">
              <button 
                onClick={() => setShowInfoModal(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-wider transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Overlay */}
      {activeSession === 'warmup' && routine.warmup && (
        <WorkoutSession 
          title={isHiit ? "Calentamiento VO2 Máx" : "Calentamiento Fuerza"}
          exercises={routine.warmup}
          onClose={() => setActiveSession(null)}
          onComplete={handleWarmupComplete}
          isHiit={isHiit}
          isGlobalWarmup={true}
        />
      )}

      {activeSession === 'routine' && routine.exercises && (
        <WorkoutSession 
          title={isHiit ? "VO2 Máx" : "Strength Routine"}
          exercises={routine.exercises}
          onClose={() => setActiveSession(null)}
          onComplete={handleRoutineComplete}
          isHiit={isHiit}
        />
      )}

      {/* Transition Confirm Modal */}
      {showTransitionConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-oled-card)] w-full max-w-sm rounded-3xl p-6 border border-[var(--color-oled-card-hover)] animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4 text-white">¡Calentamiento Completado!</h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              ¿Deseas pasar directamente al entrenamiento principal?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowTransitionConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-[var(--color-oled-card-hover)] text-white"
              >
                Más tarde
              </button>
              <button 
                onClick={() => {
                  if (routine.id === 'monday-hiit') {
                    setShowTransitionConfirm(false);
                    setVo2PrepSession('routine');
                  } else {
                    audioController.init();
                    setShowTransitionConfirm(false);
                    setActiveSession('routine');
                  }
                }}
                className={clsx(
                  "flex-1 py-3 rounded-xl font-bold text-white",
                  isHiit ? "bg-red-600" : "bg-[var(--color-neon-purple-light)]"
                )}
              >
                Iniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VO2 Max Preparation Modal */}
      {vo2PrepSession && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[var(--color-oled-card)] w-full max-w-sm rounded-[2rem] border-2 border-red-900/50 p-6 animate-in zoom-in-95 shadow-[0_0_50px_rgba(220,38,38,0.15)] max-h-[90vh] overflow-y-auto hide-scrollbar">
              <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-1 relative flex items-center gap-2">
                <Target className="text-red-500 shrink-0" size={24} /> PREPARA TU EQUIPO
              </h3>
              <p className="text-red-400 font-bold mb-6 text-sm uppercase tracking-wider">Alista el material ANTES de darle Iniciar</p>

              <div className="space-y-4 mb-8">
                  <div className="bg-[var(--color-surface)]/50 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                          <Target size={24} className="text-red-500 shrink-0" />
                          <div>
                              <div className="text-white font-bold text-sm">Shadow Boxing c/Mancuernas</div>
                              <div className="text-[var(--color-text-muted)] text-xs mt-1">Mancuernas de <strong className="text-white">1 a 2 kg</strong> (Max. 3 kg)</div>
                          </div>
                      </div>
                      {(() => {
                          const lastWeight = getLastVo2Weight('Shadow Boxing');
                          if (lastWeight > 0) {
                              return <div className="mt-3 bg-black/40 rounded-xl p-2.5 text-center border-l-2 border-green-500/50">
                                  <span className="text-xs text-white/50 block mb-1 font-medium">Última vez usaste:</span>
                                  <span className="text-green-400 font-black tracking-wide">{lastWeight} kg</span>
                              </div>
                          }
                          return null;
                      })()}
                  </div>

                  <div className="bg-[var(--color-surface)]/50 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                          <Activity className="text-[var(--color-neon-purple-light)] w-6 h-6 shrink-0" />
                          <div>
                              <div className="text-white font-bold text-sm">Press Z Sentado</div>
                              <div className="text-[var(--color-text-muted)] text-xs mt-1">~40-50% de tu Press Militar estricto</div>
                          </div>
                      </div>
                      {(() => {
                          const weight = getExerciseMaxWeight('press-militar');
                          const lastWeight = getLastVo2Weight('Press Z');
                          if (weight > 0 || lastWeight > 0) {
                              return <div className="mt-3 bg-black/40 rounded-xl p-2.5 text-center border-l-2 border-red-500 flex justify-around">
                                  {weight > 0 && (
                                  <div>
                                    <span className="text-xs text-white/50 block mb-1 font-medium">Sugerido:</span>
                                    <span className="text-red-400 font-black tracking-wide">{Math.round(weight * 0.4)} - {Math.round(weight * 0.5)} kg</span>
                                  </div>
                                  )}
                                  {lastWeight > 0 && (
                                  <div>
                                    <span className="text-xs text-white/50 block mb-1 font-medium">Última vez:</span>
                                    <span className="text-green-400 font-black tracking-wide">{lastWeight} kg</span>
                                  </div>
                                  )}
                              </div>
                          }
                          return null;
                      })()}
                  </div>

                  <div className="bg-[var(--color-surface)]/50 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                          <MoveRight size={24} className="text-[var(--color-neon-purple-light)] shrink-0" />
                          <div>
                              <div className="text-white font-bold text-sm">Remo Renegado en Plancha</div>
                              <div className="text-[var(--color-text-muted)] text-xs mt-1">~50-60% de tu Remo Unilateral</div>
                          </div>
                      </div>
                      {(() => {
                          const weight = getExerciseMaxWeight('remo-uni');
                          const lastWeight = getLastVo2Weight('Remo Renegado');
                          if (weight > 0 || lastWeight > 0) {
                              return <div className="mt-3 bg-black/40 rounded-xl p-2.5 text-center border-l-2 border-red-500 flex justify-around">
                                  {weight > 0 && (
                                  <div>
                                    <span className="text-xs text-white/50 block mb-1 font-medium">Sugerido:</span>
                                    <span className="text-red-400 font-black tracking-wide">{Math.round(weight * 0.5)} - {Math.round(weight * 0.6)} kg</span>
                                  </div>
                                  )}
                                  {lastWeight > 0 && (
                                  <div>
                                    <span className="text-xs text-white/50 block mb-1 font-medium">Última vez:</span>
                                    <span className="text-green-400 font-black tracking-wide">{lastWeight} kg</span>
                                  </div>
                                  )}
                              </div>
                          }
                          return null;
                      })()}
                  </div>

                  <div className="bg-[var(--color-surface)]/50 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                          <Activity size={24} className="text-amber-400 shrink-0" />
                          <div>
                              <div className="text-white font-bold text-sm">Floor Press Explosivo</div>
                              <div className="text-[var(--color-text-muted)] text-xs mt-1">~50-60% de tu Floor Press c/Barra</div>
                          </div>
                      </div>
                      {(() => {
                          const weight = getExerciseMaxWeight('floor-press');
                          const lastWeight = getLastVo2Weight('Floor Press');
                          if (weight > 0 || lastWeight > 0) {
                              return <div className="mt-3 bg-black/40 rounded-xl p-2.5 text-center border-l-2 border-red-500 flex justify-around">
                                  {weight > 0 && (
                                  <div>
                                    <span className="text-xs text-white/50 block mb-1 font-medium">Sugerido:</span>
                                    <span className="text-red-400 font-black tracking-wide">{Math.round(weight * 0.5)} - {Math.round(weight * 0.6)} kg</span>
                                  </div>
                                  )}
                                  {lastWeight > 0 && (
                                  <div>
                                    <span className="text-xs text-white/50 block mb-1 font-medium">Última vez:</span>
                                    <span className="text-green-400 font-black tracking-wide">{lastWeight} kg</span>
                                  </div>
                                  )}
                              </div>
                          }
                          return null;
                      })()}
                  </div>

              </div>

              <div className="flex gap-3">
                  <button 
                      onClick={() => setVo2PrepSession(null)}
                      className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl active:scale-95 transition-transform"
                  >
                      Volver
                  </button>
                  <button 
                      onClick={() => {
                          audioController.init();
                          setActiveSession(vo2PrepSession);
                          setVo2PrepSession(null);
                      }}
                      className="flex-[2] py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
                  >
                      Todo Listo
                  </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
