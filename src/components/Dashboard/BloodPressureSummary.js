// components/Dashboard/BloodPressureSummary.js
import React from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const BloodPressureSummary = ({ avgValues, bpCategory, minMaxValues }) => {
  const { sys, dia, puls } = avgValues;
  
  // Bewertung für Trendanzeigen
  const getSystolicTrend = (value) => {
    if (value > 135) return { icon: <ArrowUp size={28} strokeWidth={2} className="text-red-500" />, text: "erhöht", color: "text-red-600" };
    if (value < 125) return { icon: <ArrowDown size={28} strokeWidth={2} className="text-blue-500" />, text: "niedrig", color: "text-blue-600" };
    return { icon: <Minus size={28} strokeWidth={2} className="text-green-500" />, text: "normal", color: "text-green-600" };
  };
  
  const getDiastolicTrend = (value) => {
    if (value > 70) return { icon: <ArrowUp size={28} strokeWidth={2} className="text-red-500" />, text: "erhöht", color: "text-red-600" };
    if (value < 65) return { icon: <ArrowDown size={28} strokeWidth={2} className="text-blue-500" />, text: "niedrig", color: "text-blue-600" };
    return { icon: <Minus size={28} strokeWidth={2} className="text-green-500" />, text: "normal", color: "text-green-600" };
  };
  
  const systolicTrend = getSystolicTrend(sys);
  const diastolicTrend = getDiastolicTrend(dia);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Hauptkarte: Durchschnittswerte */}
      <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-1.5">
              <h3 className="text-sm font-medium text-gray-500 mr-2">Durchschnitt</h3>
              <span 
                className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: bpCategory.color + '20', color: bpCategory.color }}
              >
                {bpCategory.category}
              </span>
            </div>
            
            <div className="flex items-baseline mb-3">
              <div className="text-3xl font-bold">{sys}/{dia}</div>
              <div className="text-lg ml-2 text-gray-600">mmHg</div>
              <div className="text-sm text-gray-500 ml-4">Puls: {puls} bpm</div>
            </div>
            
            <div className="flex flex-wrap gap-5">
              <div className="flex flex-col items-center" title="Systolischer Trend">
                {systolicTrend.icon}
                <span className={`text-sm font-medium mt-1 ${systolicTrend.color}`}>
                  Sys: {systolicTrend.text}
                </span>
              </div>
              
              <div className="flex flex-col items-center" title="Diastolischer Trend">
                {diastolicTrend.icon}
                <span className={`text-sm font-medium mt-1 ${diastolicTrend.color}`}>
                  Dia: {diastolicTrend.text}
                </span>
              </div>
            </div>
          </div>
          
          {/* Visuelle Darstellung */}
          <div className="hidden md:block relative w-32 h-32 mt-3 md:mt-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 120 120">
                {/* Hintergrundkreise */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" strokeWidth="12" />
                
                {/* Fortschrittskreis - Systolisch */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={bpCategory.color}
                  strokeWidth="12"
                  strokeDasharray="339.3"
                  strokeDashoffset={339.3 * (1 - (sys / 220))}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                
                {/* Fortschrittskreis - Diastolisch */}
                <circle
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke="#0074D9"
                  strokeWidth="10"
                  strokeDasharray="263.9"
                  strokeDashoffset={263.9 * (1 - (dia / 120))}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                
                {/* Puls-Symbol */}
                <Activity x="48" y="48" width="24" height="24" stroke="#2ECC40" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{puls}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Min/Max Werte */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Min/Max Werte</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium">Systolisch</p>
              <div className="flex items-center">
                <span className="text-blue-600 font-bold">{minMaxValues.sysMin}</span>
                <span className="mx-2 text-gray-400">-</span>
                <span className="text-red-600 font-bold">{minMaxValues.sysMax}</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600"
                style={{ 
                  width: '100%', 
                  clipPath: `inset(0 ${100 - ((minMaxValues.sysMax - minMaxValues.sysMin) / (220 - 80) * 100)}% 0 ${(minMaxValues.sysMin - 80) / (220 - 80) * 100}%)`
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium">Diastolisch</p>
              <div className="flex items-center">
                <span className="text-blue-600 font-bold">{minMaxValues.diaMin}</span>
                <span className="mx-2 text-gray-400">-</span>
                <span className="text-red-600 font-bold">{minMaxValues.diaMax}</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600"
                style={{ 
                  width: '100%', 
                  clipPath: `inset(0 ${100 - ((minMaxValues.diaMax - minMaxValues.diaMin) / (120 - 40) * 100)}% 0 ${(minMaxValues.diaMin - 40) / (120 - 40) * 100}%)`
                }}
              ></div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Blutdruckkategorien</p>
            <div className="flex w-full h-2 mt-1 rounded-full overflow-hidden">
              <div className="bg-green-500 h-2 flex-grow" style={{flexBasis: "30%"}}></div>
              <div className="bg-yellow-500 h-2 flex-grow" style={{flexBasis: "20%"}}></div>
              <div className="bg-orange-500 h-2 flex-grow" style={{flexBasis: "20%"}}></div>
              <div className="bg-red-500 h-2 flex-grow" style={{flexBasis: "30%"}}></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Optimal</span>
              <span>Normal</span>
              <span>Grad 1</span>
              <span>Grad 2+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodPressureSummary;