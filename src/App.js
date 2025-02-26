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

  return (
    <div className="mx-auto p-4 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Blutdruck-Tracker</h1>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleAddNew}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Neuer Eintrag
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <Upload size={18} className="mr-1" />
            Import/Export
          </button>
        </div>
      </div>
      
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
      
      {/* Tabelle */}
      <BloodPressureTable 
        data={data} 
        onEdit={handleEdit} 
        onDelete={deleteEntry} 
      />
      
      {/* Berichterstellung Button */}
      <div className="mb-4 flex justify-end">
        <button 
          onClick={toggleReport}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center"
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