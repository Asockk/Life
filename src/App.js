// App.js
import React, { useState } from 'react';
import { Plus, Upload, FileText } from 'lucide-react';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// UI Components
import StatusMessage from './components/UI/StatusMessage';
import ToggleViewButtons from './components/UI/ToggleViewButtons';

// Dashboard Components
import BloodPressureSummary from './components/Dashboard/BloodPressureSummary';
import BloodPressureChart from './components/Dashboard/BloodPressureChart';
import BloodPressureCategoryLegend from './components/Dashboard/BloodPressureCategoryLegend';
import ContextFactorsTrend from './components/Dashboard/ContextFactorsTrend';
import AdvancedStatistics from './components/Dashboard/AdvancedStatistics'; // NEU: Erweiterte Statistik importieren

// Table Component
import BloodPressureTable from './components/Table/BloodPressureTable';

// Forms
import EntryFormWithContext from './components/Forms/EntryFormWithContext';
import ImportModal from './components/Forms/ImportModal';

// Reports
import MedicalReportGenerator from './components/Reports/MedicalReportGenerator';

const BlutdruckTracker = () => {
  // Daten-Hook
  const {
    data,
    dataWithMA,
    dataWithAvgLines,
    viewType,
    setViewType,
    avgValues,
    bpCategory,
    minMaxValues,
    statusMessage,
    addEntry,
    updateEntry,
    deleteEntry,
    importData,
    
    // Kontextfaktoren
    contextFactors,
    getContextForDisplayDate,
    getLatestContextFactors,
    factorCorrelations,
    
    // Berichtsfunktionen
    showReport,
    toggleReport
  } = useBloodPressureData();

  // UI-State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);

  // Event-Handler
  const handleAddNew = () => {
    setShowAddForm(true);
    setShowEditForm(false);
  };

  const handleEdit = (entry) => {
    setCurrentEntry(entry);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleAddSubmit = (_, formData, contextData) => {
    const result = addEntry(formData, contextData);
    if (result.success) {
      setShowAddForm(false);
    }
    return result;
  };

  const handleEditSubmit = (id, formData, contextData) => {
    const result = updateEntry(id, formData, contextData);
    if (result.success) {
      setShowEditForm(false);
      setCurrentEntry(null);
    }
    return result;
  };

  // Berechnet, ob genügend Kontext-Daten für die Trend-Anzeige vorhanden sind
  const hasContextData = Object.keys(contextFactors).length > 0;
  
  // Offline-Status (wird vom Service Worker aktualisiert)
  const [isOffline, setIsOffline] = useState(false);
  
  // Listener für Offline-Status
  React.useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('swOffline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialen Status prüfen
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('swOffline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="mx-auto p-2 sm:p-4 bg-gray-50 rounded-lg">
      {/* Header - optimiert für Mobile */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <h1 className="text-xl font-bold mb-3 sm:mb-0">Blutdruck-Tracker</h1>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleAddNew}
            className="flex-1 sm:flex-auto bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center sm:justify-start"
          >
            <Plus size={18} className="mr-1" />
            <span>Neuer Eintrag</span>
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-auto bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center sm:justify-start"
          >
            <Upload size={18} className="mr-1" />
            <span>Import/Export</span>
          </button>
        </div>
      </div>
      
      {/* Offline-Banner */}
      {isOffline && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Sie sind offline. Die App funktioniert weiterhin, alle Änderungen werden lokal gespeichert.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Status-Nachricht */}
      <StatusMessage message={statusMessage} />
      
      {/* Ansicht wechseln */}
      <ToggleViewButtons viewType={viewType} setViewType={setViewType} />
      
      {/* Zusammenfassung */}
      <BloodPressureSummary 
        avgValues={avgValues} 
        bpCategory={bpCategory} 
        minMaxValues={minMaxValues}
      />
      
      {/* Kontext-Faktoren-Trends, falls Daten vorhanden */}
      {hasContextData && (
        <ContextFactorsTrend contextData={contextFactors} />
      )}
      
      {/* Diagramm */}
      <BloodPressureChart 
        data={dataWithMA} 
        viewType={viewType} 
        avgValues={avgValues}
      />
      
      {/* NEU: Erweiterte Statistiken */}
      <AdvancedStatistics 
        data={data} 
        contextFactors={contextFactors} 
      />
      
      {/* Tabelle */}
      <BloodPressureTable 
        data={data} 
        onEdit={handleEdit} 
        onDelete={deleteEntry} 
      />
      
      {/* Berichterstellung Button - Responsive */}
      <div className="mb-4 flex justify-center sm:justify-end">
        <button 
          onClick={toggleReport}
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
        >
          <FileText size={18} className="mr-1" />
          Ärztlichen Bericht erstellen
        </button>
      </div>
      
      {/* Blutdruck-Kategorien */}
      <BloodPressureCategoryLegend />
      
      {/* Formulare mit integrierter Kontexterfassung */}
      {showAddForm && (
        <EntryFormWithContext 
          previousContext={getLatestContextFactors()}
          onSubmit={handleAddSubmit} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}
      
      {showEditForm && currentEntry && (
        <EntryFormWithContext 
          isEdit={true}
          entry={currentEntry}
          contextData={getContextForDisplayDate(currentEntry.datum)}
          onSubmit={handleEditSubmit} 
          onCancel={() => setShowEditForm(false)} 
        />
      )}
      
      {/* Import/Export-Modal */}
      {showImportModal && (
        <ImportModal 
          onImport={importData} 
          onClose={() => setShowImportModal(false)}
          data={data}
          contextFactors={contextFactors}
        />
      )}
      
      {/* Ärztlicher Bericht */}
      {showReport && (
        <MedicalReportGenerator 
          data={data}
          avgValues={avgValues}
          bpCategory={bpCategory}
          minMaxValues={minMaxValues}
          contextFactors={contextFactors}
        />
      )}
    </div>
  );
};

export default BlutdruckTracker;