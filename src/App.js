// App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Plus, Upload, FileText, Home, PieChart, List, Settings, Sun, Moon } from 'lucide-react';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// UI Components
import StatusMessage from './components/UI/StatusMessage';
import ToggleViewButtons from './components/UI/ToggleViewButtons';
import VersionDisplay from './components/UI/VersionDisplay';

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

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const BlutdruckTracker = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('blutdruck-theme');
      return savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Update the HTML class and localStorage when darkMode changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('blutdruck-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('blutdruck-theme', 'light');
    }
  }, [darkMode]);

  // Listen for OS theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('blutdruck-theme')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Data Hook
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
    
    // Context Factors
    contextFactors,
    getContextForDisplayDate,
    getLatestContextFactors,
    factorCorrelations,
    
    // Report Functions
    showReport,
    toggleReport
  } = useBloodPressureData();

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  // Swipe state for view switching
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Label for swipe instruction
  const [showSwipeLabel, setShowSwipeLabel] = useState(true);

  // Event Handlers
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

  const handleOpenImport = () => {
    setShowImportModal(true);
  };
  
  const handleToggleReport = () => {
    toggleReport();
  };

  // Check if we have enough context data for trend display
  const hasContextData = Object.keys(contextFactors).length > 0;
  
  // Offline Status (updated by Service Worker)
  const [isOffline, setIsOffline] = useState(false);
  
  // Listener for Offline Status
  React.useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('swOffline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('swOffline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hide swipe label after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeLabel(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Touch event handlers for horizontal swiping
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = Math.abs(touchEnd.y - touchStart.y);
    const isHorizontalSwipe = distanceY < 100;
    
    // Horizontal swipe detection (only if we're on the home tab)
    if (isHorizontalSwipe && activeTab === 'home') {
      if (distanceX < -50) { // Left swipe
        // Switch to evening if currently on morning
        if (viewType === 'morgen') {
          setViewType('abend');
        }
      } else if (distanceX > 50) { // Right swipe
        // Switch to morning if currently on evening
        if (viewType === 'abend') {
          setViewType('morgen');
        }
      }
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <>
            <AdvancedStatistics 
              data={data} 
              contextFactors={contextFactors} 
            />
          </>
        );
      case 'table':
        return (
          <BloodPressureTable 
            data={data} 
            onEdit={handleEdit} 
            onDelete={deleteEntry}
            darkMode={darkMode}
          />
        );
      case 'settings':
        return (
          <>
            <div className="mb-4 mt-2">
              <button 
                onClick={handleOpenImport}
                className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center mb-3"
              >
                <Upload size={18} className="mr-2" />
                <span>Import/Export</span>
              </button>
              <button 
                onClick={handleToggleReport}
                className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
              >
                <FileText size={18} className="mr-2" />
                Ärztlichen Bericht erstellen
              </button>
            </div>
            <BloodPressureCategoryLegend darkMode={darkMode} />
          </>
        );
      default: // 'home'
        return (
          <>
            {/* Main content area with touch events for swiping */}
            <div 
              className="relative" 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe instruction - shown only initially */}
              {showSwipeLabel && (
                <div className="absolute top-0 left-0 right-0 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs p-2 text-center rounded-md mb-2 z-10">
                  ← Links/Rechts wischen zum Wechseln zwischen Morgen- und Abendwerten →
                </div>
              )}
              
              {/* Toggle buttons for morning/evening */}
              <ToggleViewButtons viewType={viewType} setViewType={setViewType} darkMode={darkMode} />
              
              {/* Blood pressure summary */}
              <BloodPressureSummary 
                avgValues={avgValues} 
                bpCategory={bpCategory} 
                minMaxValues={minMaxValues}
                darkMode={darkMode}
              />
              
              {/* Context factors trend if available */}
              {hasContextData && (
                <ContextFactorsTrend 
                  contextData={contextFactors}
                  darkMode={darkMode}
                />
              )}
              
              {/* Blood pressure chart */}
              <BloodPressureChart 
                data={dataWithMA} 
                viewType={viewType} 
                avgValues={avgValues}
                darkMode={darkMode}
              />
            </div>
          </>
        );
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className="mx-auto px-1 py-2 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-900 min-h-screen max-w-screen-xl relative transition-colors duration-200">
        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-3 mb-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  Sie sind offline. Die App funktioniert weiterhin, alle Änderungen werden lokal gespeichert.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Message */}
        <StatusMessage message={statusMessage} />
        
        {/* Theme Toggle Button */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors duration-200"
            aria-label={darkMode ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="mt-1 mb-20">
          {renderTabContent()}
        </div>
        
        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around z-10 transition-colors duration-200">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-1 ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <Home size={activeTab === 'home' ? 22 : 20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center p-1 ${activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <PieChart size={activeTab === 'stats' ? 22 : 20} />
            <span className="text-xs mt-1">Statistik</span>
          </button>
          
          <button
            onClick={handleAddNew}
            className="flex flex-col items-center p-1 bg-blue-500 dark:bg-blue-600 text-white -mt-4 rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800"
          >
            <Plus size={28} />
          </button>
          
          <button
            onClick={() => setActiveTab('table')}
            className={`flex flex-col items-center p-1 ${activeTab === 'table' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <List size={activeTab === 'table' ? 22 : 20} />
            <span className="text-xs mt-1">Einträge</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-1 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <Settings size={activeTab === 'settings' ? 22 : 20} />
            <span className="text-xs mt-1">Mehr</span>
          </button>
        </div>
        
        {/* Forms with context capture */}
        {showAddForm && (
          <EntryFormWithContext 
            previousContext={getLatestContextFactors()}
            onSubmit={handleAddSubmit} 
            onCancel={() => setShowAddForm(false)}
            darkMode={darkMode}
          />
        )}
        
        {showEditForm && currentEntry && (
          <EntryFormWithContext 
            isEdit={true}
            entry={currentEntry}
            contextData={getContextForDisplayDate(currentEntry.datum)}
            onSubmit={handleEditSubmit} 
            onCancel={() => setShowEditForm(false)}
            darkMode={darkMode}
          />
        )}
        
        {/* Import/Export Modal */}
        {showImportModal && (
          <ImportModal 
            onImport={importData} 
            onClose={() => setShowImportModal(false)}
            data={data}
            contextFactors={contextFactors}
            darkMode={darkMode}
          />
        )}
        
        {/* Medical Report */}
        {showReport && (
          <MedicalReportGenerator 
            data={data}
            avgValues={avgValues}
            bpCategory={bpCategory}
            minMaxValues={minMaxValues}
            contextFactors={contextFactors}
            darkMode={darkMode}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
};

export default BlutdruckTracker;