import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ROUTINES } from '../data/routines';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Activity, Plus, Save, TrendingUp, Dumbbell, Zap, Target, Brain, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

export const ProgressTab: React.FC = () => {
  const { state, addLog, updateLog, deleteLog } = useStore();
  const [selectedExercise, setSelectedExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showOneRM, setShowOneRM] = useState(false);
  
  const [selectedHistoryExercise, setSelectedHistoryExercise] = useState('');
  
  // Edit logic
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  // Flatten all exercises for the dropdown
  const allExercises = ROUTINES.flatMap(r => r.exercises || []).map(e => ({ id: e.id, name: e.name }));
  const uniqueExercises = Array.from(new Map(allExercises.map(item => [item.id, item])).values());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise || !weight || !reps) return;

    const exName = uniqueExercises.find(e => e.id === selectedExercise)?.name || '';

    addLog({
      date: new Date().toISOString(),
      exerciseId: selectedExercise,
      exerciseName: exName,
      weight: parseFloat(weight),
      reps: parseInt(reps, 10)
    });

    setWeight('');
    setReps('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleEditOpen = (log: any) => {
    setEditingLogId(log.id);
    setEditWeight(log.weight.toString());
    setEditReps(log.reps.toString());
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogId || !editWeight || !editReps) return;

    updateLog(editingLogId, {
      weight: parseFloat(editWeight),
      reps: parseInt(editReps, 10)
    });
    setEditingLogId(null);
  };

  const [logToDelete, setLogToDelete] = useState<{id: string, name: string} | null>(null);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string, name: string) => {
    setLogToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (logToDelete) {
      deleteLog(logToDelete.id);
      setLogToDelete(null);
    }
  };

  const confirmDateDelete = () => {
    if (dateToDelete) {
      const group = groupedLogs.find(g => g.date === dateToDelete);
      if (group) {
        group.items.forEach(log => deleteLog(log.id));
      }
      setDateToDelete(null);
    }
  };

  // Prepare chart data (exclude warm-ups)
  const volumeData = state.logs
    .filter(log => !log.isWarmup)
    .reduce((acc, log) => {
      const dateStr = format(new Date(log.date), 'MMM dd');
      const existing = acc.find(d => d.date === dateStr);
      const volume = log.weight * log.reps || log.reps; 
      
      if (existing) {
        existing.volume += volume;
      } else {
        acc.push({ date: dateStr, volume });
      }
      return acc;
    }, [] as { date: string, volume: number }[]).slice(-7);

  // Prepare exercise history data
  const historyData = useMemo(() => {
    if (!selectedHistoryExercise) return [];
    // Only use sets that are NOT warm-ups to calculate real progress / 1RM
    const logs = state.logs.filter(l => l.exerciseId === selectedHistoryExercise && !l.isWarmup);
    
    const byDate: Record<string, { weight: number, reps: number, oneRM: number }> = {};
    logs.forEach(log => {
      const dStr = format(new Date(log.date), 'MMM dd');
      const calculated1RM = Math.round(log.weight * (1 + log.reps / 30));
      
      if (!byDate[dStr]) {
        byDate[dStr] = { weight: log.weight, reps: log.reps, oneRM: calculated1RM };
      } else {
        // Evaluate by what we are currently looking to maximize
        if (showOneRM) {
           if (calculated1RM > byDate[dStr].oneRM) {
             byDate[dStr].weight = log.weight;
             byDate[dStr].reps = log.reps;
             byDate[dStr].oneRM = calculated1RM;
           }
        } else {
           if (log.weight > byDate[dStr].weight) {
             byDate[dStr].weight = log.weight;
             byDate[dStr].reps = log.reps;
             byDate[dStr].oneRM = calculated1RM;
           }
        }
      }
    });

    return Object.entries(byDate).map(([date, data]) => ({ date, ...data }));
  }, [state.logs, selectedHistoryExercise, showOneRM]);

  const groupedLogs = useMemo(() => {
    let logs = [...state.logs];
    if (selectedHistoryExercise) {
      logs = logs.filter(l => l.exerciseId === selectedHistoryExercise);
    }
    // Sort by date descending
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limited = logs.slice(0, 30); // Show up to 30 recent

    const groups: { [dateStr: string]: typeof logs } = {};
    limited.forEach(log => {
      const dStr = format(new Date(log.date), 'dd MMM yyyy');
      if (!groups[dStr]) groups[dStr] = [];
      groups[dStr].push(log);
    });

    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }, [state.logs, selectedHistoryExercise]);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Auto-expand the first group when data changes
  React.useEffect(() => {
    if (groupedLogs.length > 0 && Object.keys(expandedDates).length === 0) {
      setExpandedDates({ [groupedLogs[0].date]: true });
    }
  }, [groupedLogs]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      
      {/* Header */}
      <div className="pt-2 pb-2">
        <h2 className="text-3xl font-display font-black mb-1 tracking-tight">Métricas & Análisis</h2>
        <p className="text-[var(--color-text-muted)] text-sm tracking-wide">Inteligencia de entrenamiento en tiempo real.</p>
      </div>

      {/* Global Stats Overview - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[var(--color-oled-card)] to-blue-900/10 rounded-3xl p-4 border border-blue-500/10 relative overflow-hidden backdrop-blur-sm shadow-lg shadow-black/50">
          <div className="absolute -right-2 -bottom-2 text-blue-500/10">
            <Activity size={60} strokeWidth={2} />
          </div>
          <div className="relative z-10">
            <div className="text-[var(--color-text-muted)] text-[9px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
              <Activity size={10} className="text-blue-400" /> Sesiones
            </div>
            <div className="text-3xl font-display font-black text-blue-400 mb-0.5 tracking-tighter shadow-blue-500/20 drop-shadow-md">
              {new Set(state.logs.map(l => l.date.split('T')[0])).size}
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              Días de entreno
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-oled-card)] to-[var(--color-neon-purple)]/10 rounded-3xl p-4 border border-[var(--color-neon-purple)]/10 relative overflow-hidden backdrop-blur-sm shadow-lg shadow-black/50">
          <div className="absolute -right-2 -bottom-2 text-[var(--color-neon-purple)]/10">
            <Target size={60} strokeWidth={2} />
          </div>
          <div className="relative z-10">
            <div className="text-[var(--color-text-muted)] text-[9px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
              <Target size={10} className="text-[var(--color-neon-purple-light)]" /> Tonelaje
            </div>
            <div className="text-3xl font-display font-black text-[var(--color-neon-purple-light)] mb-0.5 tracking-tighter shadow-[var(--color-neon-purple)]/20 drop-shadow-md">
              {(state.logs.reduce((acc, l) => acc + (l.weight * l.reps || 0), 0) / 1000).toFixed(1)}<span className="text-sm font-bold opacity-70 ml-0.5">T</span>
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              Vol. Acumulado
            </p>
          </div>
        </div>
      </div>

      {/* Progress History Per Exercise */}
      <div className="bg-[var(--color-oled-card)] rounded-3xl p-6 border border-white/5 relative shadow-lg shadow-black/50">
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-2">
             <Dumbbell size={18} className="text-[var(--color-neon-purple-light)]" />
             <h3 className="font-bold text-sm tracking-wide uppercase text-[var(--color-neon-purple-light)]">Curva de Fuerza</h3>
           </div>
           {selectedHistoryExercise && historyData.length > 0 && (
             <button 
               onClick={() => setShowOneRM(!showOneRM)}
               className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"
             >
               {showOneRM ? 'Ver Peso Real' : 'Ver 1RM Est.'}
             </button>
           )}
        </div>
        
        <div className="relative mb-6">
          <select 
            value={selectedHistoryExercise}
            onChange={(e) => setSelectedHistoryExercise(e.target.value)}
            className="w-full bg-[var(--color-surface)]/50 border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm font-medium appearance-none focus:outline-none focus:border-[var(--color-neon-purple-light)] focus:ring-1 focus:ring-[var(--color-neon-purple-light)] transition-all shadow-inner"
          >
            <option value="" disabled>Selecciona un ejercicio...</option>
            {uniqueExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
            ▼
          </div>
        </div>
        
        {selectedHistoryExercise ? (
          historyData.length > 0 ? (
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={showOneRM ? '#3b82f6' : 'var(--color-neon-purple-light)'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={showOneRM ? '#3b82f6' : 'var(--color-neon-purple-light)'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--color-text-muted)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--color-text-muted)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '12px' }}
                    itemStyle={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    formatter={(value: number, name: string, props: any) => {
                      if (showOneRM) return [`${value} kg`, '1RM Estimado'];
                      return [`${value} kg × ${props.payload.reps}`, 'Mejor Serie'];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={showOneRM ? "oneRM" : "weight"} 
                    stroke={showOneRM ? '#3b82f6' : 'var(--color-neon-purple-light)'} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMetric)"
                    activeDot={{ r: 6, fill: '#fff', stroke: showOneRM ? '#3b82f6' : 'var(--color-neon-purple)', strokeWidth: 2 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-[var(--color-text-muted)] text-sm italic bg-[var(--color-surface)]/30 rounded-2xl border border-white/5">
              <Dumbbell className="opacity-20 mb-3" size={28} />
              <p>Esperando datos de entrenamiento.</p>
            </div>
          )
        ) : null}
      </div>

      {/* Volume Chart */}
      <div className="bg-[var(--color-oled-card)] rounded-3xl p-6 border border-white/5 shadow-lg shadow-black/50">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-white" />
          <h3 className="font-bold text-sm tracking-wide uppercase text-white">Volumen Reciente</h3>
        </div>
        
        <div className="h-48 w-full">
          {volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-text-muted)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--color-surface)' }}
                  contentStyle={{ backgroundColor: 'var(--color-oled-black)', border: '1px solid var(--color-oled-card-hover)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: 'white', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="rgba(255,255,255,0.9)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={16}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] text-sm bg-[var(--color-surface)]/20 rounded-2xl border border-white/5">
              <Activity className="opacity-20 mb-2" size={24} />
              <p>Sin actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Log Form */}
      <div className="bg-[var(--color-oled-card)] rounded-3xl p-6 border border-white/5 shadow-lg shadow-black/50 relative overflow-hidden">
        {savedSuccess && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-neon-purple)]/20 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[var(--color-oled-black)] border border-[var(--color-neon-purple)] text-[var(--color-neon-purple-light)] px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,20,147,0.4)]">
              Registro Sincronizado
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-5">
          <Plus size={18} className="text-[var(--color-text-muted)]" />
          <h3 className="font-bold text-sm tracking-wide uppercase text-[var(--color-text-muted)]">Añadir Entrada Manual</h3>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1.5 pl-1">Ejercicio</label>
            <select 
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full bg-[var(--color-surface)]/50 border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm appearance-none focus:outline-none focus:border-[var(--color-text-muted)] transition-colors shadow-inner"
              required
            >
              <option value="" disabled>Seleccionar de la base de datos...</option>
              {uniqueExercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <div className="absolute right-4 bottom-3.5 pointer-events-none text-[var(--color-text-muted)]">
              ▼
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1.5 pl-1">Peso (Kg)</label>
              <input 
                type="number" 
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ej. 100"
                className="w-full bg-[var(--color-surface)]/50 border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm focus:outline-none focus:border-[var(--color-text-muted)] transition-colors shadow-inner font-mono"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1.5 pl-1">Reps</label>
              <input 
                type="number" 
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="Ej. 8"
                className="w-full bg-[var(--color-surface)]/50 border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm focus:outline-none focus:border-[var(--color-text-muted)] transition-colors shadow-inner font-mono"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full mt-3 py-4 bg-[var(--color-neon-purple-light)] hover:bg-[var(--color-neon-purple)] shadow-[0_4px_14px_0_rgba(255,105,180,0.39)] uppercase tracking-widest text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center transition-all active:scale-95"
          >
            <Save size={16} className="mr-2" />
            Guardar Datos
          </button>
        </form>
      </div>

      {/* Recent Logs List */}
      <div className="bg-[var(--color-oled-card)] rounded-3xl p-6 border border-white/5 shadow-lg shadow-black/50">
        <div className="flex items-center gap-2 mb-5">
          <Edit2 size={18} className="text-[var(--color-text-muted)]" />
          <h3 className="font-bold text-sm tracking-wide uppercase text-[var(--color-text-muted)]">
            {selectedHistoryExercise ? 'Historial del Ejercicio' : 'Últimos Registros'}
          </h3>
        </div>

        {groupedLogs.length > 0 ? (
          <div className="space-y-4">
            {groupedLogs.map((group, index) => {
              const isExpanded = expandedDates[group.date];
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={group.date} 
                  className="overflow-hidden bg-[var(--color-surface)]/20 border border-[var(--color-border)] rounded-2xl"
                >
                  <div 
                    onClick={() => toggleDate(group.date)}
                    className="w-full flex items-center justify-between p-4 bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface)]/50 transition-colors cursor-pointer"
                  >
                    <span className="text-white font-bold text-xs uppercase tracking-wider">{group.date}</span>
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] group">
                      <span className="text-[10px] font-medium opacity-50">{group.items.length} registros</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateToDelete(group.date);
                        }}
                        className="p-1.5 ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                        title={`Eliminar todo el ${group.date}`}
                      >
                        <Trash2 size={12} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 space-y-2 border-t border-[var(--color-border)]">
                      {group.items.map((log) => (
                        <div key={log.id} className="bg-[var(--color-surface)]/30 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <div className="text-[var(--color-text-muted)] text-[9px] uppercase font-bold mb-0.5 flex items-center gap-2">
                              <span>{format(new Date(log.date), 'HH:mm')}</span>
                              {log.isWarmup && (
                                <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Aprox.</span>
                              )}
                            </div>
                            <div className="text-white text-xs font-bold truncate max-w-[180px]">
                              {log.exerciseName}
                            </div>
                            <div className={clsx("text-xs font-black mt-1 flex items-center gap-1.5", log.isWarmup ? "text-amber-400" : "text-[var(--color-neon-purple-light)]")}>
                              {(() => {
                                // Find if it's a time exercise
                                const isTimed = ROUTINES.flatMap(r => [...(r.warmup || []), ...(r.exercises || [])])
                                  .find(e => log.exerciseId.startsWith(e.id))?.type === 'time';
                                  
                                if (isTimed) {
                                  return log.weight > 0 ? `${log.weight}kg` : 'Peso Corporal';
                                }
                                return `${log.weight > 0 ? `${log.weight}kg × ` : ''}${log.reps} reps`;
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditOpen(log)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(log.id, log.exerciseName)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--color-text-muted)] text-sm italic">
            No hay registros disponibles.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingLogId && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-oled-black)] border border-[var(--color-oled-card-hover)] w-full max-w-sm rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-white">Editar Registro</h3>
              <button 
                onClick={() => setEditingLogId(null)}
                className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1.5 pl-1">Peso (Kg)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full bg-[var(--color-surface)]/50 border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm focus:outline-none focus:border-[var(--color-neon-purple-light)] transition-colors"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1.5 pl-1">Reps</label>
                  <input 
                    type="number" 
                    value={editReps}
                    onChange={(e) => setEditReps(e.target.value)}
                    className="w-full bg-[var(--color-surface)]/50 border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm focus:outline-none focus:border-[var(--color-neon-purple-light)] transition-colors"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full mt-6 py-4 bg-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple-light)] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(102,0,204,0.3)]"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-oled-black)] border border-red-500/30 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 text-center">
            <h3 className="text-xl font-black mb-3 text-red-500 uppercase tracking-wide">¿Eliminar Registro?</h3>
            <p className="text-white text-sm mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el registro de <strong>{logToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Sí, Eliminar
              </button>
              <button 
                onClick={() => setLogToDelete(null)}
                className="w-full py-4 rounded-xl font-bold text-sm bg-[var(--color-oled-card-hover)] hover:bg-[var(--color-surface)] text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Delete Confirmation Modal */}
      {dateToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-oled-black)] border border-red-500/30 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 text-center">
            <h3 className="text-xl font-black mb-3 text-red-500 uppercase tracking-wide">¿Eliminar Día?</h3>
            <p className="text-white text-sm mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar TODOS los registros del <strong>{dateToDelete}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDateDelete}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Sí, Eliminar Todos
              </button>
              <button 
                onClick={() => setDateToDelete(null)}
                className="w-full py-4 rounded-xl font-bold text-sm bg-[var(--color-oled-card-hover)] hover:bg-[var(--color-surface)] text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
