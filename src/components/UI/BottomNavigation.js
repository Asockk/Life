// components/UI/BottomNavigation.js
import React from 'react';
import { Activity, List, BarChart2, User, Plus } from 'lucide-react';

const BottomNavigation = ({ 
  activeTab = 'dashboard', 
  onTabChange, 
  onAddNew
}) => {
  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={20} /> },
    { id: 'entries', label: 'Einträge', icon: <List size={20} /> },
    { id: 'stats', label: 'Statistik', icon: <BarChart2 size={20} /> },
    { id: 'profile', label: 'Profil', icon: <User size={20} /> }
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-up border-t border-gray-200 dark:border-gray-800 z-30">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            className={`flex flex-col items-center justify-center ${
              activeTab === item.id 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => onTabChange(item.id)}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
        
        {/* Add new button (center) */}
        <button
          className="flex flex-col items-center justify-center"
          onClick={onAddNew}
        >
          <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-1 text-white shadow-lg transform -translate-y-2">
            <Plus size={24} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;