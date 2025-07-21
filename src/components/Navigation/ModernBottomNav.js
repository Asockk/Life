// Modern Bottom Navigation with iOS-inspired Design
import React, { useState, useEffect } from 'react';
import { Home, PieChart, Plus, List, Settings } from 'lucide-react';

const ModernBottomNav = ({ activeTab, setActiveTab, onAddNew, darkMode }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'stats', icon: PieChart, label: 'Statistik' },
    { id: 'add', icon: Plus, label: 'Hinzufügen', special: true },
    { id: 'table', icon: List, label: 'Einträge' },
    { id: 'settings', icon: Settings, label: 'Mehr' }
  ];

  // Handle add button animation
  const handleAddClick = () => {
    // Haptic feedback simulation (visual)
    const button = document.getElementById('add-button');
    button.classList.add('scale-95');
    setTimeout(() => button.classList.remove('scale-95'), 100);
    
    // Show menu or directly add
    onAddNew();
  };

  return (
    <>
      {/* Backdrop blur for iOS effect */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-100/80 to-transparent dark:from-gray-900/80 pointer-events-none" />
      
      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-card rounded-t-3xl border-t border-gray-200/50 dark:border-gray-700/50 px-2 pb-safe">
          <div className="flex items-center justify-around py-2">
            {tabs.map((tab) => {
              if (tab.special) {
                return (
                  <button
                    key={tab.id}
                    id="add-button"
                    onClick={handleAddClick}
                    className="relative -mt-6 transition-transform duration-100"
                  >
                    <div className="relative">
                      {/* Pulsing background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-lg opacity-50 animate-pulse" />
                      
                      {/* Main button */}
                      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 active:scale-95">
                        <Plus size={28} className="text-white" strokeWidth={3} />
                        
                        {/* Ripple effect on hover */}
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-20 transition-opacity duration-300" />
                      </div>
                    </div>
                  </button>
                );
              }

              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center py-2 px-4 group"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                  
                  {/* Icon container */}
                  <div className={`
                    relative p-1 transition-all duration-300
                    ${isActive ? 'transform scale-110' : 'group-hover:scale-105'}
                  `}>
                    <Icon 
                      size={24} 
                      className={`
                        transition-all duration-300
                        ${isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
                      `}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Glow effect for active tab */}
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`
                    text-xs mt-1 font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
                  `}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Menu Overlay */}
      {showAddMenu && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setShowAddMenu(false)}
        >
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            <div className="glass-card p-4 rounded-2xl shadow-2xl">
              <button className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="font-medium">Neue Messung</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Blutdruckwerte hinzufügen</p>
              </button>
              <button className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-2">
                <span className="font-medium">Schnelleintrag</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nur aktuelle Werte</p>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pb-safe {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
};

export default ModernBottomNav;