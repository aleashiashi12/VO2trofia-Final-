import React, { useState, useEffect } from 'react';
import { StoreProvider } from './store';
import { TopNav } from './components/TopNav';
import { WorkoutTab } from './tabs/WorkoutTab';
import { ProgressTab } from './tabs/ProgressTab';
import { SettingsTab } from './tabs/SettingsTab';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTabState] = useState<'workout' | 'progress' | 'settings'>('workout');

  useEffect(() => {
    window.history.replaceState({ tab: 'workout' }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTabState(e.state.tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveTab = (tab: 'workout' | 'progress' | 'settings') => {
    if (tab === activeTab) return;
    window.history.pushState({ tab }, '');
    setActiveTabState(tab);
  };

  return (
    <StoreProvider>
      <div className="h-[100dvh] w-full bg-[var(--color-oled-black)] text-[var(--color-text-main)] font-sans selection:bg-[var(--color-neon-purple)] selection:text-white flex flex-col overflow-hidden">
        <TopNav activeTab={activeTab} onChange={setActiveTab} />
        <main className="flex-1 w-full overflow-hidden relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden"
            >
              {activeTab === 'workout' && <WorkoutTab />}
              {activeTab === 'progress' && <ProgressTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </StoreProvider>
  );
}
