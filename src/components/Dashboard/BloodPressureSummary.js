// src/components/Dashboard/BloodPressureSummary.js
import React, { memo } from 'react';
import { Heart, Activity } from 'lucide-react';

const BloodPressureSummary = ({ avgValues = {}, bpCategory = {}, minMaxValues = {}, darkMode = false }) => {
  // Add default values to prevent errors if data is undefined
  const { sys = 0, dia = 0, puls = 0 } = avgValues || {};
  const { category = 'Normal', color = '#2ECC40' } = bpCategory || {};
  const { 
    sysMin = 0, 
    sysMax = 0, 
    diaMin = 0, 
    diaMax = 0 
  } = minMaxValues || {};

  // Calculate percentage for gauge
  const calculateGaugePercentage = (value) => {
    if (value < 100) return 20;
    if (value < 120) return 40; // Optimal
    if (value < 130) return 55; // Normal
    if (value < 140) return 70; // High normal
    if (value < 160) return 85; // Hypertension 1
    return 95; // Hypertension 2/3
  };

  const sysPercentage = calculateGaugePercentage(sys);
  
  // Helper function to determine background color based on category
  const getCategoryBg = () => {
    const lightModeColors = {
      'Optimal': '#e6f7ed',
      'Normal': '#ebf9e6',
      'Hoch normal': '#fef9e6',
      'Hypertonie Grad 1': '#fef3e6',
      'Hypertonie Grad 2': '#feeae6',
      'Hypertonie Grad 3': '#f8e6ef'
    };
    
    const darkModeColors = {
      'Optimal': '#0a3317',
      'Normal': '#1a3305',
      'Hoch normal': '#332505',
      'Hypertonie Grad 1': '#331805',
      'Hypertonie Grad 2': '#330c05',
      'Hypertonie Grad 3': '#2a0518'
    };
    
    const colors = darkMode ? darkModeColors : lightModeColors;
    return colors[category] || (darkMode ? '#1a1a1a' : '#f0f0f0');
  };

  return (
    <div className="overflow-hidden rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      {/* Top banner showing category */}
      <div className="flex items-center p-2" style={{ backgroundColor: getCategoryBg() }}>
        <div className="flex-1">
          <div className="flex items-center">
            <Heart className="mr-1.5" size={18} style={{ color }} />
            <span className="text-sm font-semibold" style={{ color }}>
              {category}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold flex items-baseline">
            {sys}/{dia}
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">mmHg</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
            <Activity size={12} className="mr-1" />
            Puls {puls} bpm
          </div>
        </div>
      </div>
      
      {/* Gauge visualization */}
      <div className="relative h-16 overflow-hidden px-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200 dark:bg-gray-700"></div>
        
        {/* Color zones */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          <div className="w-1/5 bg-green-500 opacity-80"></div>
          <div className="w-1/5 bg-lime-500 opacity-80"></div>
          <div className="w-1/5 bg-yellow-500 opacity-80"></div>
          <div className="w-1/5 bg-orange-500 opacity-80"></div>
          <div className="w-1/5 bg-red-500 opacity-80"></div>
        </div>
        
        {/* Gauge indicator */}
        <div 
          className="absolute bottom-0 h-3 w-1 transform -translate-x-1/2 bg-black dark:bg-white"
          style={{ left: `${sysPercentage}%` }}
        ></div>
        
        {/* Gauge labels */}
        <div className="absolute bottom-4 left-0 right-0 flex text-xs justify-between px-1 text-gray-400 dark:text-gray-500">
          <span>100</span>
          <span>120</span>
          <span>140</span>
          <span>160</span>
          <span>180+</span>
        </div>
      </div>
      
      {/* Details grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-700">
        {/* Systolic */}
        <div className="p-3">
          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Systolisch</div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{sys} mmHg</span>
            <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
              {sysMin}-{sysMax}
            </div>
          </div>
        </div>
        
        {/* Diastolic */}
        <div className="p-3">
          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Diastolisch</div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{dia} mmHg</span>
            <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
              {diaMin}-{diaMax}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(BloodPressureSummary, (prevProps, nextProps) => {
  return (
    prevProps.avgValues?.sys === nextProps.avgValues?.sys &&
    prevProps.avgValues?.dia === nextProps.avgValues?.dia &&
    prevProps.avgValues?.puls === nextProps.avgValues?.puls &&
    prevProps.bpCategory?.category === nextProps.bpCategory?.category &&
    prevProps.minMaxValues?.sysMin === nextProps.minMaxValues?.sysMin &&
    prevProps.minMaxValues?.sysMax === nextProps.minMaxValues?.sysMax &&
    prevProps.minMaxValues?.diaMin === nextProps.minMaxValues?.diaMin &&
    prevProps.minMaxValues?.diaMax === nextProps.minMaxValues?.diaMax &&
    prevProps.darkMode === nextProps.darkMode
  );
});