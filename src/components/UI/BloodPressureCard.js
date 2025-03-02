// components/UI/BloodPressureCard.js
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BloodPressureCard = ({ title, value, unit, trend, category, change, icon: Icon }) => {
  // Dynamic styling based on category/trend
  const getCardStyle = () => {
    // Color mapping for different BP categories
    const categoryColors = {
      'Optimal': 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200 dark:border-green-700',
      'Normal': 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700',
      'Hoch normal': 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700',
      'Hypertonie Grad 1': 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-200 dark:border-orange-700',
      'Hypertonie Grad 2': 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200 dark:border-red-700',
      'Hypertonie Grad 3': 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 border-rose-200 dark:border-rose-700',
    };
    
    // If there's a specific BP category, use that for styling
    if (category && categoryColors[category]) {
      return categoryColors[category];
    }
    
    // Otherwise base it on trend
    if (trend === 'up') {
      return 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200 dark:border-red-700';
    } else if (trend === 'down') {
      return 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-700';
    }
    
    // Default/stable
    return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 border-gray-200 dark:border-gray-700';
  };
  
  // Get trend indicator
  const getTrendIndicator = () => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <TrendingUp size={18} className="mr-1" />
          {change && <span className="text-xs font-medium">+{change}</span>}
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <TrendingDown size={18} className="mr-1" />
          {change && <span className="text-xs font-medium">{change}</span>}
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-gray-500 dark:text-gray-400">
        <Minus size={18} className="mr-1" />
        {change && <span className="text-xs font-medium">{change}</span>}
      </div>
    );
  };
  
  return (
    <div className={`p-4 rounded-xl border shadow-sm ${getCardStyle()} transition-all duration-200 hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</h3>
        {getTrendIndicator()}
      </div>
      
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-800 dark:text-white">{value}</span>
        {unit && <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      
      {Icon && (
        <div className="mt-3 text-gray-400 dark:text-gray-500">
          <Icon size={16} />
        </div>
      )}
      
      {category && (
        <div className="mt-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {category}
          </span>
        </div>
      )}
    </div>
  );
};

export default BloodPressureCard;