// components/ContextFactors/ContextFactorsTracker.js
import React, { useState } from 'react';
import { Heart, Coffee, Utensils, Moon, Activity, Wine } from 'lucide-react';

const ContextFactorsTracker = ({ onSaveFactors }) => {
  // Standardwerte für Faktoren - Reduziert auf 3 Stufen (0, 1, 2)
  const [factors, setFactors] = useState({
    stress: 1,    // 0=Niedrig, 1=Mittel, 2=Hoch
    sleep: 1,     // 0=Schlecht, 1=Mittel, 2=Gut
    activity: 1,  // 0=Niedrig, 1=Mittel, 2=Hoch
    salt: 1,      // 0=Niedrig, 1=Mittel, 2=Hoch
    caffeine: 1,  // 0=Niedrig, 1=Mittel, 2=Hoch
    alcohol: 0,   // 0=Keiner, 1=Wenig, 2=Viel
  });

  // Speichern der Faktoren und Schließen
  const handleSave = () => {
    onSaveFactors(factors);
  };

  // Aktualisieren eines Faktors
  const updateFactor = (factor, value) => {
    setFactors(prev => ({
      ...prev,
      [factor]: value
    }));
  };
  
  // Komponentenliste für jeden Faktor mit Icon, Name und max Wert
  const factorComponents = [
    { name: 'stress', icon: <Heart size={24} />, label: 'Stress', options: ["Niedrig", "Mittel", "Hoch"] },
    { name: 'sleep', icon: <Moon size={24} />, label: 'Schlafqualität', options: ["Schlecht", "Mittel", "Gut"] },
    { name: 'activity', icon: <Activity size={24} />, label: 'Körperliche Aktivität', options: ["Niedrig", "Mittel", "Hoch"] },
    { name: 'salt', icon: <Utensils size={24} />, label: 'Salzkonsum', options: ["Niedrig", "Mittel", "Hoch"] },
    { name: 'caffeine', icon: <Coffee size={24} />, label: 'Koffein', options: ["Niedrig", "Mittel", "Hoch"] },
    { name: 'alcohol', icon: <Wine size={24} />, label: 'Alkohol', options: ["Keiner", "Wenig", "Viel"] },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4">Kontextfaktoren</h2>
      <p className="text-sm text-gray-600 mb-4">
        Diese Faktoren können Ihren Blutdruck beeinflussen.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {factorComponents.map((factor) => (
          <div key={factor.name} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-blue-500 mr-2">{factor.icon}</span>
              <span className="font-medium text-sm">{factor.label}</span>
            </div>
            
            <div className="flex justify-between space-x-2">
              {factor.options.map((label, i) => (
                <button
                  key={i}
                  onClick={() => updateFactor(factor.name, i)}
                  className={`h-10 flex-1 rounded-lg flex items-center justify-center text-xs 
                    ${factors[factor.name] === i 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          Faktoren speichern
        </button>
      </div>
    </div>
  );
};

export default ContextFactorsTracker;