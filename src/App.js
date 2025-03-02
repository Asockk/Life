// App.js
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Upload, FileText } from 'lucide-react';
import './styles/theme.css';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// Theme Provider
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// UI Components
import StatusMessage from './components/UI/StatusMessage';
import ToggleViewButtons from './components/UI/ToggleViewButtons';
import VersionDisplay from './components/UI/VersionDisplay';
import BottomNavBar from './components/UI/BottomNavBar';
import FloatingActionButton from './components/UI/FloatingActionButton';
import PullToRefresh from './components/UI/PullToRefresh';
import ThemeToggle from './components/UI/ThemeToggle';
import ViewToggleButtons from './components/Dashboard/ViewToggleButtons';

// Dashboard Components
import BloodPressureSummary from './components/Dashboard/BloodPressureSummary';
import BloodPressureChart from './components/Dashboard/BloodPressureChart';
import BloodPressureCategoryLegend from './components/Dashboard/BloodPressureCategoryLegend';
import ContextFactorsTrend from './components/Dashboard/ContextFactorsTrend';
import AdvancedStatistics from './components/Dashboard/AdvancedStatistics';

// Table Component
import BloodPressureTable from './components/Table/BloodPressureTable';

// Forms
import EntryFormWithContext from './components/Forms/EntryFormWithContext';
import ImportModal from './components/Forms/ImportModal';

// Reports
import MedicalReportGenerator from './components/Reports/MedicalReportGenerator';

// Wrapper für Theme-Unterstützung
const AppContent = () => {
  const { theme } = useTheme();
  
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
  
  // Aktive Sektion für Bottom Navigation
  const [activeSection, setActiveSection] = useState('dashboard');

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

  // Handler für Bottom Navigation
  const handleNavigate = (section) => {
    setActiveSection(section);
    
    // Zusätzliche Aktionen je nach Sektion
    if (section === 'report') {
      if (!showReport) toggleReport();
    } else if (showReport && section !== 'report') {
      toggleReport();
    }
  };
  
  // Pull-to-Refresh Handler - Simulierte Aktualisierung
  const handleRefresh = useCallback(async () => {
    return new Promise(resolve => {
      // Hier würden Sie Ihre Daten neu laden
      // Da wir keinen direkten Reload haben, verzögern wir einfach
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }, []);
  
  // Berechnet, ob genügend Kontext-Daten für die Trend-Anzeige vorhanden sind
  const hasContextData = Object.keys(contextFactors).length > 0;
  
  // Offline-Status (wird vom Service Worker aktualisiert)
  const [isOffline, setIsOffline] = useState(false);
  
  // Listener für Offline-Status
  useEffect(() => {
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

  // Berechnung der Höhe des Hauptinhaltsbereichs unter Berücksichtigung der Bottom Navigation
  const mainContentStyle = {
    paddingBottom: '70px' // Platz für Bottom Navigation
  };

  // Rendert den aktiven Abschnitt basierend auf der Nav Bar
  const renderActiveSection = () => {
    switch(activeSection) {
      case 'dashboard':
        return (
          <>
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
            
            {/* Schalter für Morgen/Abend-Ansicht direkt über dem Diagramm */}
            <ViewToggleButtons viewType={viewType} setViewType={setViewType} />
            
            {/* Diagramm */}
            <BloodPressureChart 
              data={dataWithMA} 
              viewType={viewType} 
              avgValues={avgValues}
            />
            
            {/* Blutdruck-Kategorien */}
            <BloodPressureCategoryLegend />
          </>
        );
      
      case 'table':
        return (
          <BloodPressureTable 
            data={data} 
            onEdit={handleEdit} 
            onDelete={deleteEntry} 
          />
        );
      
      case 'stats':
        return (
          <AdvancedStatistics 
            data={data} 
            contextFactors={contextFactors} 
          />
        );
      
      case 'report':
        return (
          <MedicalReportGenerator 
            data={data}
            avgValues={avgValues}
            bpCategory={bpCategory}
            minMaxValues={minMaxValues}
            contextFactors={contextFactors}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto min-h-screen safe-area-top safe-area-left safe-area-right" style={{ backgroundColor: theme.background }}>
      {/* Header - optimiert für Mobile mit Dunkelmodus-Umschalter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 shadow-sm" style={{ 
        backgroundColor: theme.card,
        borderBottomColor: theme.border,
        borderBottomWidth: '1px'
      }}>
        <h1 className="text-xl font-bold mb-0" style={{ color: theme.text.primary }}>Blutdruck-Tracker</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <ThemeToggle />
          <button 
            onClick={() => setShowImportModal(true)}
            className="border py-1.5 px-3 rounded-lg flex items-center justify-center text-sm interactive"
            style={{ 
              backgroundColor: theme.card,
              color: theme.text.primary,
              borderColor: theme.border
            }}
          >
            <Upload size={18} className="mr-1" />
            <span className="hidden sm:inline">Import/Export</span>
          </button>
        </div>
      </div>
      
      {/* Offline-Banner */}
      {isOffline && (
        <div className="p-2 mb-2 border-l-4" style={{
          backgroundColor: `${theme.warning}15`,
          borderLeftColor: theme.warning
        }}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ color: theme.warning }}>
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm" style={{ color: theme.warning }}>
                Sie sind offline. Die App funktioniert weiterhin.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Status-Nachricht */}
      <StatusMessage message={statusMessage} />
      
      {/* Ansicht wechseln - nur anzeigen, wenn im Dashboard - AUSKOMMENTIERT, WEIL WIR EINE NEUE UMSCHALTKOMPONENTE VERWENDEN
      {activeSection === 'dashboard' && (
        <div className="mx-3 mt-3">
          <ToggleViewButtons viewType={viewType} setViewType={setViewType} />
        </div>
      )}
      */}
      
      {/* Hauptinhaltsbereich mit Pull-to-Refresh */}
      <div className="p-3" style={mainContentStyle}>
        <PullToRefresh onRefresh={handleRefresh}>
          {renderActiveSection()}
        </PullToRefresh>
      </div>
      
      {/* Floating Action Button für Hinzufügen */}
      <FloatingActionButton onClick={handleAddNew} />
      
      {/* Bottom Navigation */}
      <BottomNavBar activeSection={activeSection} onNavigate={handleNavigate} />
      
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
      
      {/* Version display */}
      <VersionDisplay />
    </div>
  );
};

// Haupt-App Komponente mit ThemeProvider
const BlutdruckTracker = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default BlutdruckTracker;