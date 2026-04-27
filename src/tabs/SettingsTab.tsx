import React, { useState } from 'react';
import { useStore } from '../store';
import { Moon, Sun, Trash2, Volume2, Vibrate, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';

export const SettingsTab: React.FC = () => {
  const { state, updateSettings, resetData } = useStore();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleReset = () => {
    resetData();
    setShowConfirmDelete(false);
    // Optionally add a toast notification here later.
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Preferences */}
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-2">Preferencias</h3>
          <div className="bg-[var(--color-oled-card)] rounded-2xl border border-[var(--color-oled-card-hover)] overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-oled-card-hover)]">
              <div className="flex items-center">
                {state.settings.theme === 'oled' ? <Moon size={20} className="mr-3 text-[var(--color-neon-purple-light)]" /> : <Sun size={20} className="mr-3 text-yellow-500" />}
                <span className="font-medium">Tema Visual</span>
              </div>
              <button 
                onClick={() => updateSettings({ theme: state.settings.theme === 'oled' ? 'light' : 'oled' })}
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  state.settings.theme === 'oled' ? "bg-[var(--color-neon-purple-light)]" : "bg-gray-600"
                )}
              >
                <div className={clsx(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                  state.settings.theme === 'oled' ? "translate-x-7" : "translate-x-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-[var(--color-oled-card-hover)]">
              <div className="flex items-center">
                <Volume2 size={20} className="mr-3 text-[var(--color-neon-purple-light)]" />
                <span className="font-medium">Sonidos</span>
              </div>
              <button 
                onClick={() => updateSettings({ soundEnabled: !state.settings.soundEnabled })}
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  state.settings.soundEnabled ? "bg-[var(--color-neon-purple-light)]" : "bg-gray-600"
                )}
              >
                <div className={clsx(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                  state.settings.soundEnabled ? "translate-x-7" : "translate-x-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Vibrate size={20} className="mr-3 text-[var(--color-neon-purple-light)]" />
                <span className="font-medium">Vibración</span>
              </div>
              <button 
                onClick={() => updateSettings({ vibrationEnabled: !state.settings.vibrationEnabled })}
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  state.settings.vibrationEnabled ? "bg-[var(--color-neon-purple-light)]" : "bg-gray-600"
                )}
              >
                <div className={clsx(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                  state.settings.vibrationEnabled ? "translate-x-7" : "translate-x-1"
                )} />
              </button>
            </div>

          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-2">Datos</h3>
          <div className="bg-[var(--color-oled-card)] rounded-2xl border border-[var(--color-oled-card-hover)] overflow-hidden">
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="w-full flex items-center justify-between p-4 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-center">
                <Trash2 size={20} className="mr-3" />
                <span className="font-medium">Borrar Todos los Datos</span>
              </div>
              <ChevronRight size={20} className="opacity-50" />
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2 px-2">
            Esto eliminará permanentemente tu historial de entrenamientos y configuraciones locales.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-oled-black)] border border-red-500/30 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 text-center">
            <h3 className="text-xl font-black mb-3 text-red-500 uppercase tracking-wide">¿Borrar todo el progreso?</h3>
            <p className="text-white text-sm mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar TODOS tus datos de entrenamiento? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleReset}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Sí, Borrar Todo
              </button>
              <button 
                onClick={() => setShowConfirmDelete(false)}
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
