// components/UI/BottomNavBar.js
import React from 'react';
import { BarChart2, Table, FileText, Home, PlusCircle } from 'lucide-react';

const BottomNavBar = ({ activeSection, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'table', icon: Table, label: 'Tabelle' },
    { id: 'stats', icon: BarChart2, label: 'Statistik' },
    { id: 'report', icon: FileText, label: 'Bericht' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-lg pb-safe-area">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              activeSection === item.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavBar;