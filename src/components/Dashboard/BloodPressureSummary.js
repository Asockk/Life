// components/Dashboard/BloodPressureSummary.js
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Minus } from 'lucide-react';

const BloodPressureSummary = ({ avgValues, bpCategory, minMaxValues }) => {
  const { sys, dia, puls } = avgValues;
  
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
                
                {/* Trend Icons */}
                <div className="flex items-center ml-3">
                  <div className="flex flex-col items-center mx-1" title="Systolischer Trend">
                    {sys > 135 ? (
                      <ArrowUpCircle size={18} color="#FF4136" />
                    ) : sys < 125 ? (
                      <ArrowDownCircle size={18} color="#0074D9" />
                    ) : (
                      <Minus size={18} color="#2ECC40" />
                    )}
                    <span className="text-xs mt-0.5">Sys</span>
                  </div>
                  <div className="flex flex-col items-center mx-1" title="Diastolischer Trend">
                    {dia > 70 ? (
                      <ArrowUpCircle size={18} color="#FF4136" />
                    ) : dia < 65 ? (
                      <ArrowDownCircle size={18} color="#0074D9" />
                    ) : (
                      <Minus size={18} color="#2ECC40" />
                    )}
                    <span className="text-xs mt-0.5">Dia</span>
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