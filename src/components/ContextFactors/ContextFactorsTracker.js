// components/ContextFactors/ContextFactorsTracker.js
import React, { useState } from 'react';
import { Heart, Coffee, Utensils, Moon, Activity, PieChart } from 'lucide-react';

const ContextFactorsTracker = ({ onSaveFactors }) => {
  // Standardwerte für Faktoren
  const [factors, setFactors] = useState({
    stress: 1, // 1-5 Skala
    sleep: 3, // 1-5 Skala
    activity: 2, // 1-5 Skala
    salt: 2, // 1-5 Skala
    caffeine: 1, // 1-3 Skala
    alcohol: 0, // 0-3 Skala
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
    { name: 'stress', icon: <Heart size={24} />, label: 'Stress', max: 5 },
    { name: 'sleep', icon: <Moon size={24} />, label: 'Schlafqualität', max: 5 },
    { name: 'activity', icon: <Activity size={24} />, label: 'Körperliche Aktivität', max: 5 },
    { name: 'salt', icon: <Utensils size={24} />, label: 'Salzkonsum', max: 5 },
    { name: 'caffeine', icon: <Coffee size={24} />, label: 'Koffein', max: 3 },
    { name: 'alcohol', icon: <PieChart size={24} />, label: 'Alkohol', max: 3 },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4">Kontextfaktoren</h2>
      <p className="text-sm text-gray-600 mb-4">
        Diese Faktoren können Ihren Blutdruck beeinflussen. Ein Klick genügt für die Erfassung.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {factorComponents.map((factor) => (
          <div key={factor.name} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-blue-500 mr-2">{factor.icon}</span>
              <span className="font-medium text-sm">{factor.label}</span>
            </div>
            
            <div className="flex justify-between">
              {[...Array(factor.max + 1)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateFactor(factor.name, i)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs 
                    ${factors[factor.name] === i 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {i}
                </button>
              ))}
            </div>
            
            <div className="mt-1 text-xs text-gray-500 text-center">
              {factor.name === 'stress' && (factors[factor.name] === 0 
                ? 'Keine' 
                : factors[factor.name] === 5 
                  ? 'Sehr hoch' 
                  : factors[factor.name] === 1 
                    ? 'Niedrig' 
                    : factors[factor.name] === 2 
                      ? 'Mäßig' 
                      : factors[factor.name] === 3 
                        ? 'Mittel' 
                        : 'Hoch')}
              
              {factor.name === 'sleep' && (factors[factor.name] === 0 
                ? 'Sehr schlecht' 
                : factors[factor.name] === 5 
                  ? 'Sehr gut' 
                  : factors[factor.name] === 1 
                    ? 'Schlecht' 
                    : factors[factor.name] === 2 
                      ? 'Mäßig' 
                      : factors[factor.name] === 3 
                        ? 'Normal' 
                        : 'Gut')}
              
              {factor.name === 'activity' && (factors[factor.name] === 0 
                ? 'Keine' 
                : factors[factor.name] === 5 
                  ? 'Intensiv' 
                  : factors[factor.name] === 1 
                    ? 'Wenig' 
                    : factors[factor.name] === 2 
                      ? 'Mäßig' 
                      : factors[factor.name] === 3 
                        ? 'Mittel' 
                        : 'Viel')}
              
              {factor.name === 'salt' && (factors[factor.name] === 0 
                ? 'Sehr wenig' 
                : factors[factor.name] === 5 
                  ? 'Sehr viel' 
                  : factors[factor.name] === 1 
                    ? 'Wenig' 
                    : factors[factor.name] === 2 
                      ? 'Normal' 
                      : factors[factor.name] === 3 
                        ? 'Erhöht' 
                        : 'Viel')}
              
              {factor.name === 'caffeine' && (factors[factor.name] === 0 
                ? 'Keines' 
                : factors[factor.name] === 3 
                  ? 'Viel' 
                  : factors[factor.name] === 1 
                    ? 'Wenig' 
                    : 'Mittel')}
              
              {factor.name === 'alcohol' && (factors[factor.name] === 0 
                ? 'Keiner' 
                : factors[factor.name] === 3 
                  ? 'Viel' 
                  : factors[factor.name] === 1 
                    ? 'Wenig' 
                    : 'Mittel')}
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