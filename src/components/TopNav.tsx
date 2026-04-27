import React from 'react';
import { Calendar, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface TopNavProps {
  activeTab: 'workout' | 'progress' | 'settings';
  onChange: (tab: 'workout' | 'progress' | 'settings') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'workout', label: 'Planner', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="w-full bg-[var(--color-oled-black)] pt-12 pb-2 px-4 sticky top-0 z-40 relative">
      {/* Very faint background ambient glow */}
      <div className="absolute top-[-50px] left-1/2 translate-x-[-50%] w-[300px] h-[150px] bg-[var(--color-neon-purple)]/10 blur-[80px] pointer-events-none rounded-full" />
      
      <div className="flex justify-between items-start mb-6 relative">
        <div>
          <h1 className="text-4xl font-black font-display text-[var(--color-neon-purple-light)] tracking-tight">VO2trofia</h1>
          <p className="text-[var(--color-text-muted)] text-sm tracking-wide mt-1">Your Weekly Fitness Planner</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-[var(--color-oled-card-hover)] relative">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "flex items-center justify-center py-4 flex-1 transition-all relative font-medium",
                isActive ? "text-[var(--color-neon-purple-light)]" : "text-[var(--color-text-muted)] hover:text-white"
              )}
            >
              <Icon size={18} className="mr-2" />
              <span className="text-sm">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-neon-purple-light)] shadow-[0_0_8px_rgba(255,105,180,0.8)]" 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
