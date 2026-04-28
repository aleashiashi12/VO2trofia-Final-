import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Info, Lock, Unlock, Flame, Zap, Activity, TrendingUp, Lightbulb, Check, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import Markdown from 'react-markdown';
import { ExerciseDefinition, SetDefinition } from '../data/routines';
import { audioController } from '../utils/audio';
import { useStore } from '../store';

interface WorkoutSessionProps {
  title: string;
  exercises: ExerciseDefinition[];
  onClose: () => void;
  onComplete: () => void;
  isHiit?: boolean;
  isGlobalWarmup?: boolean;
}

const getProgressionRecommendation = (exerciseId: string, achievedReps: number, targetRepsGoal: string) => {
  if (!targetRepsGoal) return null;
  // Extract max reps from target (e.g. "10-12 Reps" -> 12)
  const rangeMatch = targetRepsGoal.match(/(\d+)\s*-\s*(\d+)/);
  let maxReps = null;
  if (rangeMatch) {
    maxReps = parseInt(rangeMatch[2], 10);
  } else {
    const singleMatch = targetRepsGoal.match(/(\d+)\s*Reps?/i);
    if (singleMatch) maxReps = parseInt(singleMatch[1], 10);
  }
  
  if (!maxReps || achievedReps <= maxReps) return null;

  // achievedReps >= maxReps, suggest increment
  const barraPiernas = ['sentadilla-barra', 'pmr-barra'];
  const barraTorso = ['floor-press', 'remo-barra', 'press-militar', 'curl-biceps'];
  const mancuernasCompuestos = ['sentadilla-bulgara', 'remo-uni', 'press-suelo-espinal', 'zancadas-inv', 'sentadilla-goblet', 'elev-talones', 'elev-talones-sentado', 'pmr-mancuernas'];
  const mancuernasAislamiento = ['elev-laterales', 'super-brazos'];

  if (barraPiernas.includes(exerciseId)) return 'Sube de 2.5 kg a 5 kg en TOTAL (Añade 1.25 o 2.5 kg por lado)';
  if (barraTorso.includes(exerciseId)) return 'Sube de 1.25 kg a 2.5 kg en TOTAL (Discos mínimos por lado)';
  if (mancuernasCompuestos.includes(exerciseId)) return 'Siguiente mancuerna (+1 kg o +2 kg extra en cada mano)';
  if (mancuernasAislamiento.includes(exerciseId)) return 'El salto más pequeño (+1 kg máximo en cada mano)';

  return null;
};

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ title, exercises, onClose, onComplete, isHiit, isGlobalWarmup }) => {
  // Flatten exercises into a linear sequence of steps
  // A step can be an 'exercise' set or a 'rest' period
  type Step = {
    type: 'exercise' | 'rest';
    exerciseIndex: number;
    setIndex: number;
    exercise: ExerciseDefinition;
    set: SetDefinition;
    duration?: number; // for rest or time-based exercises
  };

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isControlsUnlocked, setIsControlsUnlocked] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Stats tracking per set
  const { state: storeState, addLog, incrementExtraSets } = useStore();
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [currentReps, setCurrentReps] = useState<string>('');
  const [repsConfirmed, setRepsConfirmed] = useState<boolean>(true);
  const prevExerciseIdRef = useRef<string | null>(null);
  const prevStepIndexRef = useRef<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<{ exerciseId: string, isWarmup: boolean, isExtra: boolean, reps: number, weight: number }[]>([]);

  useEffect(() => {
    // Intercept hardware back button to prevent accidental app exit
    window.history.pushState({ session: 'active' }, '');

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowExitConfirm(true);
      // Pushing state again so next back press gets caught while dialog is open
      window.history.pushState({ session: 'active' }, '');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up the history state if it exists
      if (window.history.state && window.history.state.session === 'active') {
        window.history.back();
      }
    };
  }, []);

  useEffect(() => {
    setShowInfo(false);
  }, [currentStepIndex]);

  useEffect(() => {
    const generatedSteps: Step[] = [];
    exercises.forEach((ex, eIdx) => {
      ex.sets.forEach((set, sIdx) => {
        generatedSteps.push({
          type: 'exercise',
          exerciseIndex: eIdx,
          setIndex: sIdx,
          exercise: ex,
          set: set,
          duration: set.timeGoal
        });
        // Add rest step if there is rest time and it's not the last set of the last exercise
        // Or actually, always add rest if restTime > 0, we can skip it if user wants
        if (set.restTime > 0) {
          generatedSteps.push({
            type: 'rest',
            exerciseIndex: eIdx,
            setIndex: sIdx,
            exercise: ex,
            set: set,
            duration: set.restTime
          });
        }
      });
    });
    setSteps(generatedSteps);
    
    if (generatedSteps.length > 0) {
      const firstStep = generatedSteps[0];
      if (firstStep.duration) {
        setTimeLeft(firstStep.duration);
      }
    }
  }, [exercises]);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!currentStep) return;

    // Track a unique identifier for the current step (index + exercise id + type)
    const stepIdentifier = `${currentStepIndex}-${currentStep.type}-${currentStep.type === 'exercise' ? currentStep.exercise.id : ''}`;
    
    if (prevStepIndexRef.current === stepIdentifier) {
      return;
    }
    prevStepIndexRef.current = stepIdentifier;

    setShowInfo(false);

    if (currentStep && currentStep.type === 'exercise') {
      const isWarmup = !!currentStep.set.isWarmup;

      const actualExerciseId = currentStep.exercise.isCircuit 
        ? `${currentStep.exercise.id}_${currentStep.set.label}`
        : currentStep.exercise.id;

      // Find previous session data (targetLog)
      const effectiveLogs = storeState.logs.filter(l => l.exerciseId === actualExerciseId && !l.isWarmup);
      let targetLog = null;
      if (effectiveLogs.length > 0) {
        const lastDateStr = effectiveLogs[effectiveLogs.length - 1].date;
        const lastDate = new Date(lastDateStr).toDateString();
        const lastSessionLogs = effectiveLogs.filter(l => new Date(l.date).toDateString() === lastDate);
        targetLog = lastSessionLogs[0];
      }

      // Find current session effective logs
      const currentExerciseLogs = sessionLogs.filter(l => l.exerciseId === actualExerciseId && !l.isWarmup);

      if (isWarmup) {
        if (targetLog && targetLog.weight > 0) {
          const indexToWarmups = steps.slice(0, currentStepIndex).filter(s => s.type === 'exercise' && s.exercise.id === currentStep.exercise.id && s.set.isWarmup).length;
          const numWarmups = steps.filter(s => s.type === 'exercise' && s.exercise.id === currentStep.exercise.id && s.set.isWarmup).length;
          
          let percentage = 50;
          if (numWarmups === 1) {
            percentage = 60;
          } else if (numWarmups === 2) {
            percentage = indexToWarmups === 0 ? 50 : 75;
          } else {
            percentage = 40 + (20 * indexToWarmups);
          }
          
          const suggestedWeight = Math.round((targetLog.weight * percentage) / 100);
          setCurrentWeight(suggestedWeight.toString());
        } else {
          setCurrentWeight('');
        }
        
        // Auto-set reps from repsGoal and disable input
        if (currentStep.set.repsGoal) {
          const matchedReps = parseInt(currentStep.set.repsGoal, 10);
          if (!isNaN(matchedReps)) {
            setCurrentReps(matchedReps.toString());
          } else {
            setCurrentReps('');
          }
        } else {
          setCurrentReps('');
        }
        setRepsConfirmed(true);
      } else {
        if (currentExerciseLogs.length > 0) {
          const lastLog = currentExerciseLogs[currentExerciseLogs.length - 1];
          setCurrentWeight(lastLog.weight.toString());
          setCurrentReps(lastLog.reps.toString());
          setRepsConfirmed(false);
        } else if (targetLog) {
          setCurrentWeight(targetLog.weight.toString());
          setCurrentReps(targetLog.reps.toString());
          setRepsConfirmed(false);
        } else {
          setCurrentWeight('');
          setCurrentReps('');
          setRepsConfirmed(true);
        }
      }
    }
  }, [currentStepIndex, currentStep, storeState.logs, sessionLogs]);

  // Audio feedback for countdowns
  useEffect(() => {
    if (timeLeft === null || isPaused) return;

    if (timeLeft <= 3 && timeLeft > 0) {
      audioController.playBeep('short');
    } else if (timeLeft === 0) {
      audioController.playBeep('long');
    }
  }, [timeLeft, isPaused]);

  useEffect(() => {
    if (timeLeft === null || isPaused) return;

    if (timeLeft <= 0) {
      handleNext();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isPaused, currentStepIndex]);

  const handleNext = (skipLog: boolean = false) => {
    if (!skipLog && currentStep && currentStep.type === 'exercise') {
      const w = parseFloat(currentWeight);
      let r = parseInt(currentReps, 10);
      
      if (currentStep.exercise.type === 'time' && isNaN(r)) {
        r = 1;
      }
      
      const actualExerciseId = currentStep.exercise.isCircuit 
        ? `${currentStep.exercise.id}_${currentStep.set.label}`
        : currentStep.exercise.id;
        
      const actualExerciseName = currentStep.exercise.isCircuit
        ? `${currentStep.exercise.name} - ${currentStep.set.label}`
        : currentStep.exercise.name;
      
      // Solo registra el ejercicio si ambos campos están llenos (peso se acepta en 0 para bodyweight)
      if (!isNaN(w) && !isNaN(r) && w >= 0 && r > 0) {
        addLog({
          date: new Date().toISOString(),
          exerciseId: actualExerciseId,
          exerciseName: actualExerciseName,
          weight: w,
          reps: r,
          isWarmup: !!currentStep.set.isWarmup
        });

        setSessionLogs(prev => [...prev, {
          exerciseId: actualExerciseId,
          isWarmup: !!currentStep.set.isWarmup,
          isExtra: !!currentStep.set.isExtra,
          weight: w,
          reps: r
        }]);
      }
      
      // If it's an Extra set and we actually did it (logged or timed), increment SNC Vitality
      if (currentStep.set.isExtra) {
        incrementExtraSets();
      }
    }

    if (currentStepIndex < steps.length - 1) {
      let nextIdx = currentStepIndex + 1;
      let targetStep = steps[nextIdx];

      // Automatic Fatigue Skip Check
      if (currentStep.type === 'rest' && targetStep.type === 'exercise' && targetStep.set.isExtra) {
        const exerciseLogs = sessionLogs.filter(l => l.exerciseId === currentStep.exercise.id && !l.isWarmup);
        if (exerciseLogs.length >= 2) {
          const firstSet = exerciseLogs[0];
          const lastSet = exerciseLogs[exerciseLogs.length - 1];
          const repsLost = firstSet.reps - lastSet.reps;
          
          const repsGoal = targetStep.set.repsGoal || '';
          const maxAllowedRepLoss = (repsGoal.includes('5-8') || repsGoal.includes('6-8')) ? 2 : 3;
          
          if (repsLost >= maxAllowedRepLoss) {
            // High fatigue: Auto-skip the extra set(s) and move to the next exercise
            const nextExerciseStepIndex = steps.findIndex((step, index) => index > currentStepIndex && step.exercise.id !== currentStep.exercise.id);
            if (nextExerciseStepIndex !== -1) {
              nextIdx = nextExerciseStepIndex;
              targetStep = steps[nextIdx];
            } else {
              onComplete();
              return;
            }
          }
        }
      }

      setCurrentStepIndex(nextIdx);
      setTimeLeft(targetStep.duration || null);
      setIsPaused(false);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      setCurrentStepIndex(currentStepIndex - 1);
      setTimeLeft(prevStep.duration || null);
      setIsPaused(false);
    }
  };

  const doSkipExercise = () => {
    const currentExerciseIndex = currentStep.exerciseIndex;
    const nextExerciseStepIndex = steps.findIndex((step, index) => index > currentStepIndex && step.exerciseIndex > currentExerciseIndex);
    
    if (nextExerciseStepIndex !== -1) {
      const nextStep = steps[nextExerciseStepIndex];
      setCurrentStepIndex(nextExerciseStepIndex);
      setTimeLeft(nextStep.duration || null);
      setIsPaused(false);
    } else {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(1, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentStep) return null;

  const isRest = currentStep.type === 'rest';
  const totalSets = currentStep.exercise.sets.length;
  const currentSetNum = currentStep.setIndex + 1;
  const progress = timeLeft !== null && currentStep.duration 
    ? ((currentStep.duration - timeLeft) / currentStep.duration) * 100 
    : 0;

  const primaryColor = isHiit ? 'text-red-500' : 'text-[var(--color-neon-purple-light)]';
  const strokeColor = isHiit ? '#ef4444' : '#9D4EDD'; // red-500 or neon-purple-light

  let nextStep = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null;
  let nextStepText = "Fin de la rutina";
  
  let fatigueSkipped = false;
  let lostRepsCount = 0;

  if (nextStep && currentStep.type === 'rest' && nextStep.type === 'exercise' && nextStep.set.isExtra) {
    const exerciseLogs = sessionLogs.filter(l => l.exerciseId === currentStep.exercise.id && !l.isWarmup);
    if (exerciseLogs.length >= 2) {
      const firstSet = exerciseLogs[0];
      const lastSet = exerciseLogs[exerciseLogs.length - 1];
      lostRepsCount = firstSet.reps - lastSet.reps;
      
      const repsGoal = nextStep.set.repsGoal || '';
      const maxAllowedRepLoss = (repsGoal.includes('5-8') || repsGoal.includes('6-8')) ? 2 : 3;
      
      if (lostRepsCount >= maxAllowedRepLoss) {
        fatigueSkipped = true;
        // Re-evaluate next step due to skip
        const nextExerciseStepIndex = steps.findIndex((step, index) => index > currentStepIndex && step.exercise.id !== currentStep.exercise.id);
        if (nextExerciseStepIndex !== -1) {
          nextStep = steps[nextExerciseStepIndex];
        } else {
          nextStep = null;
        }
      }
    }
  }

  if (nextStep) {
    if (nextStep.type === 'rest') {
      nextStepText = `Descanso (${nextStep.duration}s)`;
    } else {
      if (nextStep.exercise.isCircuit) {
        nextStepText = `${nextStep.set.label} (Ronda ${Math.floor(nextStep.setIndex / 4) + 1})`;
      } else {
        const setList = nextStep.exercise.sets.filter(s => !!s.isWarmup === !!nextStep.set.isWarmup);
        const actualIdx = setList.findIndex(s => s.id === nextStep.set.id);
        const setLabel = nextStep.set.isWarmup ? 'Aprox.' : 'Serie';
        nextStepText = `${nextStep.exercise.name} (${setLabel} ${actualIdx + 1}${nextStep.set.isExtra ? ' ★ Opcional' : ''})`;
      }
    }
  } else {
    nextStepText = "Fin de la rutina";
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[var(--color-oled-card-hover)] relative">
        <h2 className="font-bold text-lg">{title}</h2>
        <button onClick={() => setShowExitConfirm(true)} className="p-2 text-[var(--color-text-muted)] hover:text-white">
          <X size={24} />
        </button>
        {/* Top Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-[var(--color-oled-card-hover)] w-full">
          <div 
            className={clsx("h-full transition-all duration-300", isHiit ? "bg-red-500" : "bg-[var(--color-neon-purple-light)]")} 
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative flex flex-col p-5">
        <div className="absolute top-[-50%] left-1/2 translate-x-[-50%] w-[500px] h-[500px] bg-[var(--color-neon-purple)]/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => setShowSkipConfirm(true)} className="text-[var(--color-text-muted)] flex items-center text-xs font-bold uppercase tracking-wider bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
            Saltar {currentStep.type === 'exercise' && currentStep.exercise.isCircuit ? 'Circuito' : 'Ejercicio'} <SkipForward size={14} className="ml-1.5" />
          </button>
        </div>

        <div className="flex flex-col items-center my-auto w-full max-w-sm mx-auto pt-8 pb-4">
          <div className="text-center mb-6 w-full">
            <p className="text-[var(--color-text-muted)] text-base mb-2">
              Ejercicio {currentStep.exerciseIndex + 1} / {exercises.length}
            </p>
            
            <div className="relative flex items-center justify-center mb-5 w-full min-h-[70px]">
              <div className="flex flex-col items-center px-12">
                <span className={clsx("font-bold tracking-wider uppercase text-xs mb-1", primaryColor)}>
                  {currentStep.type === 'exercise' 
                    ? (currentStep.exercise.isCircuit 
                        ? `Ronda ${Math.floor(currentStep.setIndex / 4) + 1} de ${currentStep.exercise.sets.length / 4}` 
                        : (() => {
                            const setList = currentStep.exercise.sets.filter(s => !!s.isWarmup === !!currentStep.set.isWarmup);
                            const actualIdx = setList.findIndex(s => s.id === currentStep.set.id);
                            const setLabel = currentStep.set.isWarmup ? 'Aprox.' : 'Serie';
                            return `${setLabel} ${actualIdx + 1}${currentStep.set.isExtra ? ' ★ Opcional' : ''}`;
                          })()
                      ) 
                    : 'RECUPERACIÓN'}
                </span>
                <h1 className="text-3xl font-bold leading-tight text-center">
                  {currentStep.type === 'exercise' 
                    ? (currentStep.exercise.isCircuit ? currentStep.set.label : currentStep.exercise.name) 
                    : 'Descanso'}
                </h1>
              </div>
              {!isRest && (
                <button 
                  onClick={() => setShowInfo(!showInfo)} 
                  className={clsx(
                    "absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors shrink-0",
                    showInfo ? "bg-[var(--color-neon-purple-light)] text-white" : "bg-[var(--color-oled-card-hover)] text-[var(--color-neon-purple-light)]"
                  )}
                >
                  <Info size={20} />
                </button>
              )}
            </div>

            {!isRest && showInfo && (
              <div className="bg-[var(--color-oled-card)] p-4 rounded-2xl mb-4 border border-[var(--color-oled-card-hover)] text-left animate-in slide-in-from-top-2 w-full">
                <div className="text-[var(--color-text-muted)] text-sm leading-relaxed [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul>li]:mb-1 [&>strong]:text-white [&>h1]:text-white [&>h1]:font-bold [&>h2]:text-white [&>h2]:font-bold [&_strong]:text-white">
                  <Markdown>
                    {currentStep.exercise.info.replace(/\\n/g, '\n')}
                  </Markdown>
                </div>
              </div>
            )}

            {isRest && (() => {
              const originalNextStep = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null;
              const isRestBeforeExtra = originalNextStep && originalNextStep.type === 'exercise' && originalNextStep.set.isExtra;

              if (isRestBeforeExtra) {
                if (fatigueSkipped) {
                  return (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-4 text-center w-full">
                       <div className="text-red-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5 flex-wrap">
                          <AlertTriangle size={14} className="text-red-500" /> FATIGA ALTA DETECTADA
                       </div>
                       <p className="text-white text-sm leading-snug mb-3">
                         Perdiste <strong className="text-red-400">{lostRepsCount} reps</strong> respecto a la serie 1.
                       </p>
                       <p className="text-[var(--color-text-muted)] text-xs mb-1">
                         Fin del ejercicio. Serie extra cancelada automáticamente para optimizar recuperación.
                       </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-[var(--color-neon-purple)]/5 border border-[var(--color-neon-purple)]/30 rounded-2xl p-4 mb-4 text-center shadow-[0_0_20px_rgba(102,0,204,0.1)] w-full">
                       <div className="text-[var(--color-neon-purple-light)] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5 flex-wrap">
                          <Zap size={14} className="animate-pulse" /> RENDIMIENTO MANTENIDO
                       </div>
                       <p className="text-white text-sm leading-snug mb-3">
                         Perdiste solo <strong className="text-[var(--color-neon-purple-light)]">{Math.max(0, lostRepsCount)} reps</strong>.
                       </p>
                       <p className="text-[var(--color-text-muted)] text-xs mb-1">
                         ¡Serie extra al fallo desbloqueada! Prepárate para dar el máximo.
                       </p>
                    </div>
                  );
                }
              }

              return (
                <p className="text-[var(--color-text-muted)] whitespace-pre-line text-center mb-2">
                  {currentStepIndex === steps.length - 1 ? '¡Rutina terminada! Buen trabajo.' : 'Prepárate para la siguiente serie.'}
                </p>
              );
            })()}

            <div className="inline-flex items-center justify-center bg-[var(--color-oled-card)] px-4 py-1.5 rounded-full border border-[var(--color-oled-card-hover)]">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Siguiente: <span className="text-white">{nextStepText}</span>
              </p>
            </div>
          </div>

          {/* Timer or Set Display */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-6 shrink-0 aspect-square">
          {timeLeft !== null ? (
            <>
              <svg viewBox="0 0 256 256" className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" r="120" stroke="var(--color-oled-card-hover)" strokeWidth="12" fill="none" />
                <circle
                  cx="128" cy="128" r="120"
                  stroke={strokeColor}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  className="transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-[3.5rem] font-bold tracking-tighter">
                {formatTime(timeLeft)}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="text-[5rem] leading-none font-black mb-1">{currentSetNum}</div>
              <div className="text-[var(--color-text-muted)] text-xl uppercase tracking-widest">Set</div>
            </div>
          )}
        </div>

        {/* Set Dots or Progress Bar */}
        {!isRest && totalSets > 1 && (
          totalSets > 8 ? (
            <div className="w-full max-w-xs mb-6">
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-2 font-bold uppercase tracking-wider">
                <span>{currentStep.exercise.isCircuit ? 'Progreso del Circuito' : 'Progreso'}</span>
                <span>{currentStep.setIndex + 1} / {totalSets}</span>
              </div>
              <div className="h-2 bg-[var(--color-oled-card-hover)] rounded-full overflow-hidden">
                <div 
                  className={clsx(
                    "h-full transition-all duration-300", 
                    isHiit ? "bg-red-500" : "bg-[var(--color-neon-purple-light)]"
                  )}
                  style={{ width: `${((currentStep.setIndex + 1) / totalSets) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-6">
              {!currentStep.exercise.isCircuit && (
                <div className={`text-[10px] uppercase font-bold tracking-[0.2em] mb-3 ${currentStep.set.isWarmup ? 'text-amber-500' : 'text-[var(--color-neon-purple-light)]'}`}>
                  {currentStep.set.isWarmup ? 'Fase de Aproximación' : 'Fase de Trabajo'}
                </div>
              )}
              <div className="flex gap-3">
                {Array.from({ length: 
                  currentStep.exercise.isCircuit 
                    ? totalSets 
                    : currentStep.exercise.sets.filter(s => !!s.isWarmup === !!currentStep.set.isWarmup).length 
                }).map((_, idx) => {
                  const setList = currentStep.exercise.isCircuit
                    ? currentStep.exercise.sets
                    : currentStep.exercise.sets.filter(s => !!s.isWarmup === !!currentStep.set.isWarmup);
                  const activeIdx = currentStep.exercise.isCircuit
                    ? currentStep.setIndex
                    : setList.findIndex(s => s.id === currentStep.set.id);
                  
                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "w-4 h-4 rounded-full transition-all",
                        idx === activeIdx 
                          ? (isHiit 
                              ? "bg-red-500 ring-2 ring-offset-4 ring-offset-black ring-red-500" 
                              : currentStep.set.isWarmup 
                                ? "bg-amber-500 ring-2 ring-offset-4 ring-offset-black ring-amber-500"
                                : "bg-[var(--color-neon-purple-light)] ring-2 ring-offset-4 ring-offset-black ring-[var(--color-neon-purple-light)]")
                          : idx < activeIdx 
                            ? (isHiit 
                                ? "bg-red-900/50" 
                                : currentStep.set.isWarmup 
                                  ? "bg-amber-500/50" 
                                  : "bg-[var(--color-neon-purple-light)]")
                            : "bg-[var(--color-oled-card-hover)]"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Real-time Logger Input */}
        {!isRest && (
          <div className="w-full max-w-xs mb-6">
            <div className="flex flex-col items-center justify-center mb-3 text-center">
              {currentStep.set.isExtra && (
                 <div className="bg-[var(--color-neon-purple)]/10 text-[var(--color-neon-purple-light)] border border-[var(--color-neon-purple)]/30 rounded-xl py-2 px-3 mb-3 w-full animate-pulse shadow-[0_0_15px_rgba(102,0,204,0.15)] flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] mb-1 flex items-center justify-center gap-1.5"><Activity size={14} /> SNC Vitality Check</span>
                    <span className="text-xs">Estás en una serie opcional al fallo. Terminarla suma a tu vitalidad.</span>
                 </div>
              )}
              {currentStep.set.repsGoal && (
                <div className="text-xl font-bold mb-1">
                  Objetivo: {currentStep.set.repsGoal}
                </div>
              )}
              {currentStep.set.rir && (
                <div className={`text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-lg border inline-flex items-center gap-1.5 mt-1
                  ${currentStep.set.isWarmup
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                    : 'text-[var(--color-neon-purple-light)] bg-[var(--color-neon-purple)]/10 border-[var(--color-neon-purple)]/20 shadow-[0_0_10px_rgba(102,0,204,0.1)]'
                  }`}>
                  {currentStep.set.isWarmup ? <Zap size={14} /> : <Flame size={14} />} {currentStep.set.rir}
                </div>
              )}
            </div>
            {!isGlobalWarmup && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 text-center font-bold uppercase tracking-widest">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={currentWeight}
                    onChange={(e) => { setCurrentWeight(e.target.value); setRepsConfirmed(true); }}
                    className="w-full bg-[var(--color-surface)]/50 text-white font-mono text-center text-lg py-3 rounded-xl border border-white/10 focus:border-[var(--color-neon-purple-light)] focus:ring-1 focus:ring-[var(--color-neon-purple-light)] outline-none transition-all shadow-inner"
                    placeholder="Ej: 50"
                    step="any"
                  />
                </div>
                {currentStep.exercise.type !== 'time' && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 text-center font-bold uppercase tracking-widest">Reps</label>
                    <input 
                      type="number" 
                      value={currentReps}
                      readOnly={!!currentStep.set.isWarmup}
                      onChange={(e) => { setCurrentReps(e.target.value); setRepsConfirmed(true); }}
                      className={clsx(
                        "w-full text-center text-lg py-3 font-mono rounded-xl border outline-none transition-all shadow-inner",
                        currentStep.set.isWarmup 
                          ? "bg-[var(--color-surface)]/30 text-[var(--color-text-muted)] border-transparent cursor-not-allowed" 
                          : "bg-[var(--color-surface)]/50 text-white border-white/10 focus:border-[var(--color-neon-purple-light)] focus:ring-1 focus:ring-[var(--color-neon-purple-light)]"
                      )}
                      placeholder="Ej: 10"
                    />
                  </div>
                )}
              </div>
            )}
            
            {currentStep.exercise.type !== 'time' && !isGlobalWarmup && !repsConfirmed && currentReps !== '' && (
              <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-1">
                <button
                  onClick={() => setRepsConfirmed(true)}
                  className="flex-1 py-3 bg-[var(--color-neon-purple-light)] hover:bg-[var(--color-neon-purple)] text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-[0_4px_14px_0_rgba(140,0,255,0.39)] transition-all active:scale-95"
                >
                  <Check className="inline-block flex-shrink-0" size={16} /> Confirmar {currentReps}
                </button>
                <button
                  onClick={() => {
                    const num = parseInt(currentReps) || 0;
                    setCurrentReps(Math.max(0, num - 1).toString());
                    setRepsConfirmed(true);
                  }}
                  className="px-5 py-3 bg-[var(--color-surface)]/50 border border-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95 shadow-inner"
                >
                  -1
                </button>
                <button
                  onClick={() => {
                    const num = parseInt(currentReps) || 0;
                    setCurrentReps(Math.max(0, num - 2).toString());
                    setRepsConfirmed(true);
                  }}
                  className="px-5 py-3 bg-[var(--color-surface)]/50 border border-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95 shadow-inner"
                >
                  -2
                </button>
              </div>
            )}
            {!isGlobalWarmup && (() => {
              const exerciseLogs = sessionLogs.filter(l => l.exerciseId === currentStep.exercise.id && !l.isWarmup);
              const isFirstEffectiveSetOfSession = !currentStep.set.isWarmup && exerciseLogs.length === 0;
              const isWarmup = !!currentStep.set.isWarmup;
              
              if (!isFirstEffectiveSetOfSession && !isWarmup) return null;

              const effectiveLogs = storeState.logs.filter(l => l.exerciseId === currentStep.exercise.id && !l.isWarmup);
              if (effectiveLogs.length === 0) return null;
              
              const lastDateStr = effectiveLogs[effectiveLogs.length - 1].date;
              const lastDate = new Date(lastDateStr).toDateString();
              const lastSessionLogs = effectiveLogs.filter(l => new Date(l.date).toDateString() === lastDate);
              const targetLog = lastSessionLogs[0]; // First effective log of last session
              
              if (isWarmup) {
                 const indexToWarmups = steps.slice(0, currentStepIndex).filter(s => s.type === 'exercise' && s.exercise.id === currentStep.exercise.id && s.set.isWarmup).length;
                 const numWarmups = steps.filter(s => s.type === 'exercise' && s.exercise.id === currentStep.exercise.id && s.set.isWarmup).length;
                 
                 let percentage = 50;
                 if (numWarmups === 1) {
                    percentage = 60;
                 } else if (numWarmups === 2) {
                    percentage = indexToWarmups === 0 ? 50 : 75;
                 } else {
                    percentage = 40 + (20 * indexToWarmups);
                 }
                 
                 const suggestedWeight = Math.round((targetLog.weight * percentage) / 100);
                 
                 return (
                   <div className="flex flex-col gap-2 mt-3 text-[11px]">
                     <div className="text-[var(--color-text-muted)] text-center bg-[var(--color-oled-card)] py-2 rounded-lg border border-[var(--color-border)]">
                       Efectiva Anterior: <strong className="text-white">{targetLog.weight}kg</strong> × {targetLog.reps} reps
                     </div>
                     {targetLog.weight > 0 && (
                       <div className="text-[var(--color-neon-purple-light)] font-bold text-center flex items-center justify-center gap-1.5 bg-[var(--color-neon-purple)]/10 py-2 rounded-lg border border-[var(--color-neon-purple)]/20">
                         <Lightbulb size={16} /> Peso sugerido aprox.: {suggestedWeight}kg ({percentage}%)
                       </div>
                     )}
                   </div>
                 );
              }

              // Determine if we need to suggest a weight increment
              let progressionMsg = null;
              if (!isWarmup && targetLog) {
                const highestRepsLog = [...lastSessionLogs].sort((a, b) => b.reps - a.reps)[0];
                progressionMsg = getProgressionRecommendation(currentStep.exercise.id, highestRepsLog.reps, currentStep.set.repsGoal || '');
              }

              return (
                <div className="flex flex-col gap-2 mt-3">
                  <div className="text-xs text-[var(--color-text-muted)] text-center bg-[var(--color-oled-card)] py-2 rounded-lg border border-[var(--color-border)]">
                    1° Serie Efectiva Anterior: <strong className="text-white">{targetLog.weight}kg</strong> × {targetLog.reps} reps
                  </div>
                  {progressionMsg && (
                    <div className="text-xs font-bold text-center flex items-center justify-center gap-1.5 bg-green-500/10 text-green-400 py-2 rounded-lg border border-green-500/20">
                      <TrendingUp size={16} /> ¡Superaste las reps máximas! {progressionMsg}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Complete Button (if not timed) */}
        {timeLeft === null ? (
          <button 
            onClick={() => handleNext(false)}
            disabled={!isGlobalWarmup && !repsConfirmed && currentStep.type === 'exercise' && currentWeight !== '' && currentReps !== ''}
            className={clsx(
              "w-full max-w-xs py-3.5 rounded-xl font-bold text-lg transition-transform active:scale-95",
              (!isGlobalWarmup && !repsConfirmed && currentStep.type === 'exercise' && currentWeight !== '' && currentReps !== '')
                 ? "bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-50"
                 : (isHiit ? "bg-red-600 text-white" : "bg-[var(--color-neon-purple-light)] text-white")
            )}
          >
            Serie Completada
          </button>
        ) : (
          <button 
            onClick={() => handleNext(false)}
            className={clsx(
              "w-full max-w-xs py-3.5 rounded-xl font-bold text-lg transition-transform active:scale-95",
              isHiit ? "bg-red-600 text-white" : "bg-[var(--color-neon-purple-light)] text-white"
            )}
          >
            {currentStepIndex === steps.length - 1 ? 'Finalizar Rutina' : (isRest ? 'Saltar Descanso' : 'Saltar Tiempo')}
          </button>
        )}
        </div>
      </div>

      {/* Media Controls */}
      <div className="p-4 flex justify-between items-center border-t border-[var(--color-oled-card-hover)] relative">
        <button 
          onClick={() => setIsControlsUnlocked(!isControlsUnlocked)}
          className="w-12 h-12 flex items-center justify-center text-[var(--color-text-muted)] hover:text-white transition-colors"
          title={isControlsUnlocked ? "Bloquear navegación rápida" : "Desbloquear navegación rápida"}
        >
          {isControlsUnlocked ? <Unlock size={22} className="text-amber-500" /> : <Lock size={22} />}
        </button>

        <div className="flex items-center gap-6">
          <button 
            onClick={handlePrev} 
            disabled={currentStepIndex === 0 || !isControlsUnlocked} 
            className="text-[var(--color-text-muted)] disabled:opacity-20 hover:text-white transition-colors"
          >
            <SkipBack size={26} />
          </button>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            disabled={timeLeft === null}
            className={clsx(
              "w-16 h-16 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-transform active:scale-95 shadow-lg",
              isHiit ? "bg-red-600 shadow-red-600/30" : "bg-[var(--color-neon-purple-light)] shadow-[var(--color-neon-purple-light)]/30"
            )}
          >
            {isPaused ? <Play size={30} className="ml-2" /> : <Pause size={30} />}
          </button>
          <button 
            onClick={() => handleNext(true)} 
            disabled={currentStepIndex >= steps.length - 1 || !isControlsUnlocked} 
            className="text-[var(--color-text-muted)] hover:text-white transition-colors disabled:opacity-20"
          >
            <SkipForward size={26} />
          </button>
        </div>

        <div className="w-12 h-12"></div> {/* Spacer to maintain center alignment */}
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-oled-card)] w-full max-w-sm rounded-3xl p-6 border border-[var(--color-oled-card-hover)] animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4 text-white">¿Saltar {currentStep.type === 'exercise' && currentStep.exercise.isCircuit ? 'Circuito' : 'Ejercicio'}?</h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              Esto omitirá todas las {currentStep.type === 'exercise' && currentStep.exercise.isCircuit ? 'rondas' : 'series'} restantes de este {currentStep.type === 'exercise' && currentStep.exercise.isCircuit ? 'circuito' : 'ejercicio'} y pasará al siguiente.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-[var(--color-oled-card-hover)] text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowSkipConfirm(false);
                  doSkipExercise();
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white"
              >
                Saltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-red-500/10 w-full max-w-sm rounded-3xl p-6 border border-red-500/30 animate-in zoom-in-95 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <h3 className="text-xl font-black mb-3 text-red-500 uppercase tracking-wide">¿Cancelar Entrenamiento?</h3>
            <p className="text-white text-sm mb-6 leading-relaxed">
              Estás a punto de salir de la sesión actual. <strong className="text-red-400">Se perderá tu progreso no guardado</strong>. ¿Estás seguro?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Sí, Cancelar Todo
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 rounded-xl font-bold text-sm bg-[var(--color-oled-card-hover)] hover:bg-[var(--color-surface)] text-white transition-colors"
              >
                Me Equivoqué, Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
