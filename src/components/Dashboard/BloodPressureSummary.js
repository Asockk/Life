// components/Dashboard/BloodPressureSummary.js
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Minus, Activity, Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BloodPressureSummary = ({ avgValues, bpCategory, minMaxValues }) => {
  const { theme } = useTheme();
  const { sys, dia, puls } = avgValues;
  
  // Erklärung für die Trendanzeigen
  const getTrendExplanation = (value, type) => {
    if (type === 'sys') {
      if (value > 135) return "erhöht";
      if (value < 125) return "niedrig";
      return "normal";
    } else { // dia
      if (value > 70) return "erhöht";
      if (value < 65) return "niedrig";
      return "normal";
    }
  };
  
  // Trendinfo mit richtiger Styling-Farbe
  const getTrendColor = (value, type) => {
    if (type === 'sys') {
      if (value > 135) return theme.danger;
      if (value < 125) return theme.success;
      return theme.success;
    } else { // dia
      if (value > 70) return theme.danger;
      if (value < 65) return theme.primary;
      return theme.success;
    }
  };
  
  // Barge-Klasse für die Kategorie
  const getCategoryClass = () => {
    const category = bpCategory.category.toLowerCase();
    if (category.includes('optimal')) return { bg: theme.categories.optimal, color: '#fff' };
    if (category.includes('normal') && !category.includes('hoch')) return { bg: theme.categories.normal, color: '#fff' };
    if (category.includes('hoch normal')) return { bg: theme.categories.highNormal, color: '#000' };
    if (category.includes('hypertonie grad 1')) return { bg: theme.categories.hypertension1, color: '#fff' };
    if (category.includes('hypertonie grad 2')) return { bg: theme.categories.hypertension2, color: '#fff' };
    if (category.includes('hypertonie grad 3')) return { bg: theme.categories.hypertension3, color: '#fff' };
    
    return { bg: theme.text.muted, color: '#fff' };
  };
  
  const categoryStyle = getCategoryClass();

  return (
    <div className="mb-4">
      <div className="card p-4 transition-all duration-300" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Durchschnittswerte mit Trend */}
          <div className="flex-1 mb-5 md:mb-0">
            <div className="flex flex-wrap items-center mb-1 gap-2">
              <h3 className="text-sm font-medium" style={{ color: theme.text.secondary }}>Durchschnitt</h3>
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.color }}
              >
                {bpCategory.category}
              </span>
            </div>
            
            {/* Blutdruckwerte und Puls - mit animierten Zahlen */}
            <div className="flex items-center mb-3 md:mb-0">
              <div className="flex items-end">
                <div className="text-3xl font-bold transition-all duration-300" style={{ color: theme.text.primary }}>
                  {sys}/{dia}
                </div>
                <div className="text-lg ml-1 mb-0.5" style={{ color: theme.text.secondary }}>mmHg</div>
              </div>
              <div className="flex items-center ml-4 px-3 py-1 rounded-full" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                <Activity size={18} className="mr-1" />
                <span className="font-semibold">{puls}</span>
              </div>
            </div>
            
            {/* Trend Icons - dynamischer, moderner Stil */}
            <div className="flex items-center mt-2 space-x-6">
              <div 
                className="flex items-center px-3 py-1.5 rounded-lg transition-all duration-200 interactive"
                style={{ backgroundColor: `${getTrendColor(sys, 'sys')}15` }}
                title="Systolischer Trend"
              >
                {sys > 135 ? (
                  <TrendingUp size={18} className="mr-2" style={{ color: getTrendColor(sys, 'sys') }} />
                ) : sys < 125 ? (
                  <TrendingDown size={18} className="mr-2" style={{ color: getTrendColor(sys, 'sys') }} />
                ) : (
                  <Minus size={18} className="mr-2" style={{ color: getTrendColor(sys, 'sys') }} />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: getTrendColor(sys, 'sys') }}>
                    Systolisch
                  </span>
                  <span className="text-xs" style={{ color: theme.text.secondary }}>
                    {getTrendExplanation(sys, 'sys')}
                  </span>
                </div>
              </div>
              
              <div 
                className="flex items-center px-3 py-1.5 rounded-lg transition-all duration-200 interactive"
                style={{ backgroundColor: `${getTrendColor(dia, 'dia')}15` }}
                title="Diastolischer Trend"
              >
                {dia > 70 ? (
                  <TrendingUp size={18} className="mr-2" style={{ color: getTrendColor(dia, 'dia') }} />
                ) : dia < 65 ? (
                  <TrendingDown size={18} className="mr-2" style={{ color: getTrendColor(dia, 'dia') }} />
                ) : (
                  <Minus size={18} className="mr-2" style={{ color: getTrendColor(dia, 'dia') }} />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: getTrendColor(dia, 'dia') }}>
                    Diastolisch
                  </span>
                  <span className="text-xs" style={{ color: theme.text.secondary }}>
                    {getTrendExplanation(dia, 'dia')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Min/Max Werte - mit verbessertem Design */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-3 rounded-lg transition-all duration-200"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              <h3 className="text-sm font-medium mb-1" style={{ color: theme.text.secondary }}>Systolisch Min/Max</h3>
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold flex items-center" style={{ color: theme.primary }}>
                  <TrendingDown size={16} className="mr-1" />
                  {minMaxValues.sysMin}
                </div>
                <span style={{ color: theme.text.muted }}>/</span>
                <div className="text-lg font-bold flex items-center" style={{ color: theme.danger }}>
                  <TrendingUp size={16} className="mr-1" />
                  {minMaxValues.sysMax}
                </div>
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg transition-all duration-200"
              style={{ backgroundColor: `${theme.secondary}10` }}
            >
              <h3 className="text-sm font-medium mb-1" style={{ color: theme.text.secondary }}>Diastolisch Min/Max</h3>
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold flex items-center" style={{ color: theme.primary }}>
                  <TrendingDown size={16} className="mr-1" />
                  {minMaxValues.diaMin}
                </div>
                <span style={{ color: theme.text.muted }}>/</span>
                <div className="text-lg font-bold flex items-center" style={{ color: theme.danger }}>
                  <TrendingUp size={16} className="mr-1" />
                  {minMaxValues.diaMax}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodPressureSummary;