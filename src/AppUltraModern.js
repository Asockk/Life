// Ultra Modern Blutdruck Tracker App
import React, { useState, useEffect, useRef, createContext, useContext, lazy, Suspense } from 'react';
import { Sun, Moon, Sparkles, TrendingUp, Bell, User } from 'lucide-react';
import { getEncryptionStatus } from './services/encryptionService';
import { migrateOldDataFormats } from './utils/dataMigration';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// Context Providers
import { DialogProvider } from './contexts/DialogContext';

// Modern Components
import ModernBloodPressureSummary from './components/Dashboard/ModernBloodPressureSummary';
import UltraModernChart from './components/Dashboard/UltraModernChart';
import ModernBottomNav from './components/Navigation/ModernBottomNav';
import FixedModernEntryForm from './components/Forms/FixedModernEntryForm';
import StatusMessage from './components/UI/StatusMessage';
import OfflineIndicator from './components/UI/OfflineIndicator';

// Error Boundary
import { CriticalErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded components
const AdvancedStatistics = lazy(() => import('./components/Dashboard/AdvancedStatistics'));
const BloodPressureTable = lazy(() => import('./components/Table/BloodPressureTableWrapper'));
const ImportModal = lazy(() => import('./components/Forms/ImportModal'));
const MedicalReportGenerator = lazy(() => import('./components/Reports/MedicalReportGenerator'));

// Loading component
const LoadingFallback = ({ message = 'Lade...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-2">{message}</p>
    </div>
  </div>
);

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const UltraModernBlutdruckTracker = () => {
  // Theme state with smooth transitions
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('blutdruck-theme');
      return savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const toggleDarkMode = () => {
    const root = window.document.documentElement;
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setDarkMode(!darkMode);
  };

  // Update HTML classes
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

  // Data Hook
  const {
    data,
    dataWithMA,
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
    contextFactors,
    getContextForDisplayDate,
    getLatestContextFactors,
    showReport,
    toggleReport
  } = useBloodPressureData();

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

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

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    if (activeTab !== 'home') return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || activeTab !== 'home') return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (Math.abs(diff) > 50) {
      setSwipeDirection(diff > 0 ? 'left' : 'right');
    }
  };

  const handleTouchEnd = () => {
    if (!swipeDirection) return;
    
    if (swipeDirection === 'left' && viewType === 'morgen') {
      setViewType('abend');
    } else if (swipeDirection === 'right' && viewType === 'abend') {
      setViewType('morgen');
    }
    
    setTouchStart(null);
    setSwipeDirection(null);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <CriticalErrorBoundary componentName="AdvancedStatistics">
            <Suspense fallback={<LoadingFallback message="Lade Statistiken..." />}>
              <AdvancedStatistics data={data} contextFactors={contextFactors} darkMode={darkMode} />
            </Suspense>
          </CriticalErrorBoundary>
        );
        
      case 'table':
        return (
          <CriticalErrorBoundary componentName="BloodPressureTable">
            <Suspense fallback={<LoadingFallback message="Lade Tabelle..." />}>
              <BloodPressureTable 
                data={data} 
                onEdit={handleEdit} 
                onDelete={deleteEntry}
                darkMode={darkMode}
              />
            </Suspense>
          </CriticalErrorBoundary>
        );
        
      case 'settings':
        return (
          <div className="space-y-4 p-4">
            {/* Settings Cards */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Einstellungen</h3>
              
              <div className="space-y-4">
                {/* Import/Export */}
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="w-full glass-card p-4 text-left hover:scale-105 transition-transform tap-scale"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Import/Export</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daten sichern und wiederherstellen</p>
                    </div>
                    <Sparkles className="text-blue-500" />
                  </div>
                </button>
                
                {/* Medical Report */}
                <button 
                  onClick={toggleReport}
                  className="w-full glass-card p-4 text-left hover:scale-105 transition-transform tap-scale"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Ärztlicher Bericht</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PDF-Bericht für Ihren Arzt erstellen</p>
                    </div>
                    <TrendingUp className="text-green-500" />
                  </div>
                </button>
                
                {/* Notifications */}
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-full glass-card p-4 text-left hover:scale-105 transition-transform tap-scale"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Erinnerungen</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tägliche Mess-Erinnerungen</p>
                    </div>
                    <div className="relative">
                      <Bell className={showNotifications ? "text-blue-500" : "text-gray-400"} />
                      {showNotifications && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Profile Card */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">Ihr Profil</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{data.length} Messungen gespeichert</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default: // 'home'
        return (
          <div 
            className="space-y-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Time Toggle Pills */}
            <div className="flex justify-center mb-6">
              <div className="glass-card p-1 rounded-full inline-flex">
                <button
                  onClick={() => setViewType('morgen')}
                  className={`
                    px-6 py-2 rounded-full font-medium transition-all duration-300
                    ${viewType === 'morgen' 
                      ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-400'}
                  `}
                >
                  <Sun size={16} className="inline mr-2" />
                  Morgen
                </button>
                <button
                  onClick={() => setViewType('abend')}
                  className={`
                    px-6 py-2 rounded-full font-medium transition-all duration-300
                    ${viewType === 'abend' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-400'}
                  `}
                >
                  <Moon size={16} className="inline mr-2" />
                  Abend
                </button>
              </div>
            </div>
            
            {/* Modern Summary */}
            <ModernBloodPressureSummary 
              avgValues={avgValues} 
              bpCategory={bpCategory} 
              minMaxValues={minMaxValues}
              darkMode={darkMode}
            />
            
            {/* Ultra Modern Chart */}
            <CriticalErrorBoundary componentName="UltraModernChart">
              <UltraModernChart 
                data={dataWithMA} 
                viewType={viewType} 
                avgValues={avgValues}
                darkMode={darkMode}
              />
            </CriticalErrorBoundary>
          </div>
        );
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <DialogProvider>
        <div className={`min-h-screen transition-colors duration-300 ${
          darkMode ? 'bg-gray-950' : 'bg-gray-50'
        }`}>
        {/* Gradient Background */}
        <div className="fixed inset-0 opacity-10">
          <div className="absolute inset-0 gradient-bg" />
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 px-4 py-6 pb-24 max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold gradient-text">
              Blutdruck Tracker
            </h1>
            
            <button
              onClick={toggleDarkMode}
              className="glass-card p-3 rounded-full hover:scale-110 transition-transform tap-scale"
              aria-label={darkMode ? 'Licht Modus' : 'Dunkel Modus'}
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-purple-600" />}
            </button>
          </div>
          
          {/* Status Message */}
          <StatusMessage message={statusMessage} />
          
          {/* Offline Indicator */}
          <OfflineIndicator darkMode={darkMode} />
          
          {/* Tab Content */}
          {renderTabContent()}
        </div>
        
        {/* Modern Bottom Navigation */}
        <ModernBottomNav 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddNew={handleAddNew}
          darkMode={darkMode}
        />
        
        {/* Forms */}
        {showAddForm && (
          <FixedModernEntryForm 
            previousContext={getLatestContextFactors()}
            onSubmit={handleAddSubmit} 
            onCancel={() => setShowAddForm(false)}
            darkMode={darkMode}
          />
        )}
        
        {showEditForm && currentEntry && (
          <FixedModernEntryForm 
            isEdit={true}
            entry={currentEntry}
            contextData={getContextForDisplayDate(currentEntry.datum)}
            onSubmit={handleEditSubmit} 
            onCancel={() => setShowEditForm(false)}
            darkMode={darkMode}
          />
        )}
        
        {/* Import Modal */}
        {showImportModal && (
          <Suspense fallback={<LoadingFallback />}>
            <ImportModal 
              onImport={importData} 
              onClose={() => setShowImportModal(false)}
              data={data}
              contextFactors={contextFactors}
              darkMode={darkMode}
            />
          </Suspense>
        )}
        
        {/* Medical Report */}
        {showReport && (
          <Suspense fallback={<LoadingFallback />}>
            <MedicalReportGenerator 
              data={data}
              avgValues={avgValues}
              bpCategory={bpCategory}
              minMaxValues={minMaxValues}
              contextFactors={contextFactors}
              darkMode={darkMode}
            />
          </Suspense>
        )}
      </div>
      </DialogProvider>
    </ThemeContext.Provider>
  );
};

export default UltraModernBlutdruckTracker;