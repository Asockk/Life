// components/Dashboard/BloodPressureSummary.js
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Heart } from 'lucide-react';

const BloodPressureSummary = ({ avgValues, bpCategory, minMaxValues }) => {
  const { sys, dia, puls } = avgValues;

  // Verbesserte Bewertungsfunktion für Systolisch/Diastolisch
  const getBpEvaluation = (type, value) => {
    if (type === 'sys') {
      if (value < 120) return { status: 'optimal', label: 'Optimal', icon: <Minus size={18} />, color: '#2ECC40' };
      if (value < 130) return { status: 'normal', label: 'Normal', icon: <Minus size={18} />, color: '#01FF70' };
      if (value < 140) return { status: 'high-normal', label: 'Hoch normal', icon: <TrendingUp size={18} />, color: '#FFDC00' };
      if (value < 160) return { status: 'hypertension-1', label: 'Erhöht', icon: <TrendingUp size={18} />, color: '#FF851B' };
      return { status: 'hypertension-2', label: 'Stark erhöht', icon: <TrendingUp size={18} />, color: '#FF4136' };
    } else { // dia
      if (value < 80) return { status: 'optimal', label: 'Optimal', icon: <Minus size={18} />, color: '#2ECC40' };
      if (value < 85) return { status: 'normal', label: 'Normal', icon: <Minus size={18} />, color: '#01FF70' };
      if (value < 90) return { status: 'high-normal', label: 'Hoch normal', icon: <TrendingUp size={18} />, color: '#FFDC00' };
      if (value < 100) return { status: 'hypertension-1', label: 'Erhöht', icon: <TrendingUp size={18} />, color: '#FF851B' };
      return { status: 'hypertension-2', label: 'Stark erhöht', icon: <TrendingUp size={18} />, color: '#FF4136' };
    }
  };

  // Bewertungen ermitteln
  const sysEvaluation = getBpEvaluation('sys', sys);
  const diaEvaluation = getBpEvaluation('dia', dia);

  // Anzeige des Pulszustands
  const getPulseState = (value) => {
    if (value < 60) return { label: 'Niedrig', color: '#0074D9' };
    if (value > 100) return { label: 'Hoch', color: '#FF851B' };
    return { label: 'Normal', color: '#2ECC40' };
  };
  
  const pulseState = getPulseState(puls);

  return (
    <div className="mb-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {/* Hauptanzeige mit verbessertem Layout */}
        <div className="flex flex-col space-y-4">
          {/* Oberer Bereich: Durchschnittswerte und Kategorie */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Durchschnittswerte</h3>
            
            <div className="flex items-end justify-between">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{sys}/{dia}</span>
                <span className="text-lg ml-1 text-gray-500">mmHg</span>
              </div>
              
              <div 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `${bpCategory.color}25`, 
                  color: bpCategory.color
                }}
              >
                {bpCategory.category}
              </div>
            </div>
            
            <div className="flex items-center mt-1 text-gray-600">
              <Heart size={16} className="mr-1" />
              <span className="text-sm">Puls: <span className="font-medium" style={{ color: pulseState.color }}>{puls} bpm</span></span>
            </div>
          </div>
          
          {/* Unterer Bereich: Bewertung und Min/Max-Werte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bewertung */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Bewertung</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Systolisch</span>
                    <div className="h-1 bg-gray-200 w-full mt-1 mb-1" />
                  </div>
                  <div className="flex items-center">
                    <div 
                      className="p-1 rounded-full mr-2" 
                      style={{ color: sysEvaluation.color, backgroundColor: `${sysEvaluation.color}15` }}
                    >
                      {sysEvaluation.icon}
                    </div>
                    <span className="text-sm" style={{ color: sysEvaluation.color }}>{sysEvaluation.label}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Diastolisch</span>
                    <div className="h-1 bg-gray-200 w-full mt-1 mb-1" />
                  </div>
                  <div className="flex items-center">
                    <div 
                      className="p-1 rounded-full mr-2" 
                      style={{ color: diaEvaluation.color, backgroundColor: `${diaEvaluation.color}15` }}
                    >
                      {diaEvaluation.icon}
                    </div>
                    <span className="text-sm" style={{ color: diaEvaluation.color }}>{diaEvaluation.label}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Min/Max Werte */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Minima / Maxima</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Systolisch</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-medium text-blue-600">{minMaxValues.sysMin}</span>
                    <div className="flex-1 px-2">
                      <div className="h-1 bg-blue-100 w-full relative">
                        <div 
                          className="absolute h-1 bg-gradient-to-r from-blue-500 to-red-500"
                          style={{ 
                            left: '0%', 
                            width: '100%' 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-medium text-red-600">{minMaxValues.sysMax}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">mmHg</div>
                </div>
                
                <div>
                  <span className="text-sm font-medium">Diastolisch</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-medium text-blue-600">{minMaxValues.diaMin}</span>
                    <div className="flex-1 px-2">
                      <div className="h-1 bg-blue-100 w-full relative">
                        <div 
                          className="absolute h-1 bg-gradient-to-r from-blue-500 to-red-500"
                          style={{ 
                            left: '0%', 
                            width: '100%' 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-medium text-red-600">{minMaxValues.diaMax}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">mmHg</div>
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