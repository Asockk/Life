// App.js
import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// UI Components
import StatusMessage from './components/UI/StatusMessage';
import ToggleViewButtons from './components/UI/ToggleViewButtons';

// Dashboard Components
import BloodPressureSummary from './components/Dashboard/BloodPressureSummary';
import BloodPressureChart from './components/Dashboard/BloodPressureChart';
import BloodPressureCategoryLegend from './components/Dashboard/BloodPressureCategoryLegend';

// Table Component
import BloodPressureTable from './components/Table/BloodPressureTable';

// Forms
import AddEntryForm from './components/Forms/AddEntryForm';
import EditEntryForm from './components/Forms/EditEntryForm';
import ImportModal from './components/Forms/ImportModal';

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
    importData
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

  const handleAddSubmit = (formData) => {
    const result = addEntry(formData);
    if (result.success) {
      setShowAddForm(false);
    }
    return result;
  };

  const handleEditSubmit = (id, formData) => {
    const result = updateEntry(id, formData);
    if (result.success) {
      setShowEditForm(false);
      setCurrentEntry(null);
    }
    return result;
  };

  return (
    <div className="mx-auto p-4 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Blutdruck-Tracker</h1>
        <div className="flex">
          <button 
            onClick={handleAddNew}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Neuer Eintrag
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center ml-2"
          >
            <Upload size={18} className="mr-1" />
            Importieren
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
      
      {/* Blutdruck-Kategorien */}
      <BloodPressureCategoryLegend />
      
      {/* Formulare */}
      {showAddForm && (
        <AddEntryForm 
          onSubmit={handleAddSubmit} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}
      
      {showEditForm && currentEntry && (
        <EditEntryForm 
          entry={currentEntry} 
          onSubmit={handleEditSubmit} 
          onCancel={() => setShowEditForm(false)} 
        />
      )}
      
      {/* Import-Modal */}
      {showImportModal && (
        <ImportModal 
          onImport={importData} 
          onClose={() => setShowImportModal(false)} 
        />
      )}
    </div>
  );
};

export default BlutdruckTracker;