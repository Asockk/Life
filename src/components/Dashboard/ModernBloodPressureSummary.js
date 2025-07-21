// Modern Blood Pressure Summary with Glassmorphism
import React, { memo } from 'react';
import { Heart, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ModernBloodPressureSummary = ({ avgValues = {}, bpCategory = {}, minMaxValues = {}, darkMode = false }) => {
  const { sys = 0, dia = 0, puls = 0 } = avgValues || {};
  const { category = 'Normal', color = '#2ECC40' } = bpCategory || {};
  const { 
    sysMin = 0, 
    sysMax = 0, 
    diaMin = 0, 
    diaMax = 0 
  } = minMaxValues || {};

  // Calculate trend (simplified for demo)
  const getTrend = () => {
    if (sys > 130) return { icon: TrendingUp, color: 'var(--color-danger)', text: 'Steigend' };
    if (sys < 110) return { icon: TrendingDown, color: 'var(--color-optimal)', text: 'Fallend' };
    return { icon: Minus, color: 'var(--color-normal)', text: 'Stabil' };
  };

  const trend = getTrend();
  const TrendIcon = trend.icon;

  // Health score calculation (0-100)
  const calculateHealthScore = () => {
    let score = 100;
    if (sys > 140) score -= 30;
    else if (sys > 130) score -= 20;
    else if (sys > 120) score -= 10;
    
    if (dia > 90) score -= 20;
    else if (dia > 85) score -= 10;
    
    if (puls > 100) score -= 10;
    else if (puls < 50) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (healthScore / 100 * circumference);

  return (
    <div className="space-y-4 mb-6">
      {/* Main Card with Glassmorphism */}
      <div className="glass-card p-6 relative overflow-hidden">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at top right, ${color}20, transparent 70%)`
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Durchschnittswerte</h3>
              <div className="flex items-center gap-2">
                <div className="pulse-effect">
                  <Heart size={20} style={{ color }} />
                </div>
                <span className="text-sm font-semibold" style={{ color }}>
                  {category}
                </span>
              </div>
            </div>
            
            {/* Health Score Circle */}
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  stroke="var(--gray-200)"
                  strokeWidth="6"
                  fill="none"
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  stroke={color}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text">{healthScore}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Values */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Systolic */}
            <div className="text-center">
              <div className="value-highlight">{sys}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Systolisch</div>
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                {sysMin}-{sysMax}
              </div>
            </div>
            
            {/* Diastolic */}
            <div className="text-center">
              <div className="value-highlight" style={{ color: '#0074D9' }}>{dia}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Diastolisch</div>
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                {diaMin}-{diaMax}
              </div>
            </div>
            
            {/* Pulse */}
            <div className="text-center">
              <div className="value-highlight" style={{ color: 'var(--primary-wellness)' }}>{puls}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Puls</div>
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                bpm
              </div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <TrendIcon size={16} style={{ color: trend.color }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trend: {trend.text}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Activity size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Letzte 7 Tage
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Optimal Range Card */}
        <div className="glass-card p-4 text-center tap-scale">
          <div className="health-indicator mx-auto mb-2"></div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Optimal</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{'<120/80'}</div>
        </div>

        {/* Warning Range Card */}
        <div className="glass-card p-4 text-center tap-scale">
          <div className="health-indicator warning mx-auto mb-2"></div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Vorsicht</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">130-139</div>
        </div>

        {/* Danger Range Card */}
        <div className="glass-card p-4 text-center tap-scale">
          <div className="health-indicator danger mx-auto mb-2"></div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Kritisch</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{'>140/90'}</div>
        </div>
      </div>
    </div>
  );
};

export default memo(ModernBloodPressureSummary);