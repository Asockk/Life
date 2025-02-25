// components/Dashboard/BloodPressureSummary.js
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Minus } from 'lucide-react';

const BloodPressureSummary = ({ avgValues, bpCategory, minMaxValues }) => {
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
  
  return (
    <div className="mb-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between">
          {/* Durchschnittswerte mit Trend */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-medium text-gray-500 mr-2">Durchschnitt</h3>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: bpCategory.color + '30', color: bpCategory.color }}
                >
                  {bpCategory.category}
                </span>
              </div>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{sys}/{dia}</div>
                <div className="text-lg ml-1">mmHg</div>
                <div className="text-sm text-gray-500 ml-3">Puls: {puls}</div>
                
                {/* Vergrößerte Trend Icons mit mehr horizontalem Abstand */}
                <div className="flex items-center ml-6 space-x-6">
                  <div className="flex flex-col items-center" title="Systolischer Trend">
                    {sys > 135 ? (
                      <ArrowUpCircle size={32} color="#FF4136" strokeWidth={2.5} />
                    ) : sys < 125 ? (
                      <ArrowDownCircle size={32} color="#0074D9" strokeWidth={2.5} />
                    ) : (
                      <Minus size={32} color="#2ECC40" strokeWidth={2.5} />
                    )}
                    <span className="text-sm font-medium mt-1">Sys: {getTrendExplanation(sys, 'sys')}</span>
                  </div>
                  <div className="flex flex-col items-center" title="Diastolischer Trend">
                    {dia > 70 ? (
                      <ArrowUpCircle size={32} color="#FF4136" strokeWidth={2.5} />
                    ) : dia < 65 ? (
                      <ArrowDownCircle size={32} color="#0074D9" strokeWidth={2.5} />
                    ) : (
                      <Minus size={32} color="#2ECC40" strokeWidth={2.5} />
                    )}
                    <span className="text-sm font-medium mt-1">Dia: {getTrendExplanation(dia, 'dia')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Min/Max Werte */}
          <div className="flex items-center space-x-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Systolisch Min/Max</h3>
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold text-blue-600">
                  {minMaxValues.sysMin}
                </div>
                <span className="text-gray-400">/</span>
                <div className="text-xl font-bold text-red-600">
                  {minMaxValues.sysMax}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Diastolisch Min/Max</h3>
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold text-blue-600">
                  {minMaxValues.diaMin}
                </div>
                <span className="text-gray-400">/</span>
                <div className="text-xl font-bold text-red-600">
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