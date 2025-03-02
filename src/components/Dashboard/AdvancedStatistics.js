// components/Dashboard/AdvancedStatistics/index.js
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Importiere die einzelnen Analysekomponenten
import DayNightAnalysis from './AdvancedStatistics/DayNightAnalysis';
import WeekdayAnalysis from './AdvancedStatistics/WeekdayAnalysis';
import SeasonalAnalysis from './AdvancedStatistics/SeasonalAnalysis';
import ContextCorrelation from './AdvancedStatistics/ContextCorrelation';

// Haupt-AdvancedStatistics Komponente
const AdvancedStatistics = ({ data, contextFactors }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('daynight');
  
  // Tabs für die verschiedenen Analysen
  const tabs = [
    { id: 'daynight', label: 'Tag/Nacht-Rhythmus' },
    { id: 'weekday', label: 'Wochentagsanalyse' },
    { id: 'seasonal', label: 'Jahreszeitliche Schwankungen' },
    { id: 'correlation', label: 'Kontextfaktor-Korrelation' }
  ];
  
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
      {/* Header mit Toggle */}
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-lg font-semibold">Erweiterte Statistiken &amp; Trends</h2>
        <div className="text-blue-600">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4">
          {/* Tab-Navigation */}
          <div className="flex overflow-x-auto mb-4 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab-Inhalte */}
          <div className="mt-4">
            {/* Jede Analyse wird als separate Komponente gerendert */}
            {activeTab === 'daynight' && (
              <DayNightAnalysis data={data} />
            )}
            
            {activeTab === 'weekday' && (
              <WeekdayAnalysis data={data} />
            )}
            
            {activeTab === 'seasonal' && (
              <SeasonalAnalysis data={data} />
            )}
            
            {activeTab === 'correlation' && (
              <ContextCorrelation data={data} contextFactors={contextFactors} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStatistics;