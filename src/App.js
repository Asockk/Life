// App.js
import React, { useState, useEffect, useRef, createContext, useContext, lazy, Suspense } from 'react';
import { Plus, Upload, FileText, Home, PieChart, List, Settings, Sun, Moon, Shield } from 'lucide-react';
import { getEncryptionStatus } from './services/encryptionService';
import { migrateOldDataFormats } from './utils/dataMigration';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// UI Components (loaded immediately)
import StatusMessage from './components/UI/StatusMessage';
import ToggleViewButtons from './components/UI/ToggleViewButtons';

// Dashboard Components (loaded immediately for main view)
import BloodPressureSummary from './components/Dashboard/BloodPressureSummary';
import BloodPressureChart from './components/Dashboard/BloodPressureChart';
import BloodPressureCategoryLegend from './components/Dashboard/BloodPressureCategoryLegend';
import ContextFactorsTrend from './components/Dashboard/ContextFactorsTrend';

// Error Boundary
import { CriticalErrorBoundary } from './components/ErrorBoundary';

// Debug Component
import ResetButton from './components/UI/ResetButton';

// Lazy-loaded components (not immediately needed)
const AdvancedStatistics = lazy(() => import('./components/Dashboard/AdvancedStatistics'));
const BloodPressureTable = lazy(() => import('./components/Table/BloodPressureTableWrapper'));
const EntryFormWithContext = lazy(() => import('./components/Forms/EntryFormWithContext'));
const ImportModal = lazy(() => import('./components/Forms/ImportModal'));
const MedicalReportGenerator = lazy(() => import('./components/Reports/MedicalReportGenerator'));

// Loading component for lazy-loaded modules
const LoadingFallback = ({ message = 'Lade...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const BlutdruckTracker = () => {
  // Refs für Cleanup von Timeouts
  const swipeTimeoutRef = useRef(null);
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
    // Add transitioning class to prevent flashing
    const root = window.document.documentElement;
    root.classList.add('transitioning');
    
    setDarkMode(!darkMode);
    
    // Remove transitioning class after a short delay
    setTimeout(() => {
      root.classList.remove('transitioning');
    }, 50);
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

    // Use modern addEventListener API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
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

  // Datenmigration beim App-Start durchführen
  useEffect(() => {
    const runMigration = async () => {
      try {
        const migrationPerformed = await migrateOldDataFormats();
        if (migrationPerformed) {
          console.log('[APP] Datenmigration erfolgreich durchgeführt');
          // Seite neu laden, um die migrierten Daten zu laden
          window.location.reload();
        }
      } catch (error) {
        console.error('[APP] Fehler bei der Datenmigration:', error);
      }
    };
    
    runMigration();
  }, []); // Nur einmal beim App-Start ausführen

  // Debug: Log data changes
  useEffect(() => {
    console.log('[APP] Data updated:', data?.length || 0, 'entries');
    if (data && data.length > 0) {
      console.log('[APP] First entry:', data[0]);
      console.log('[APP] Last entry:', data[data.length - 1]);
    }
  }, [data]);

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  // Swipe state for view switching with animation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeTransition, setSwipeTransition] = useState({
    transform: 'translateX(0)',
    opacity: 1,
    transition: 'none'
  });
  
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
    console.log('[APP] handleAddSubmit called with:', formData, contextData);
    const result = addEntry(formData, contextData);
    console.log('[APP] addEntry result:', result);
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
  
  // Encryption Status
  const [encryptionStatus, setEncryptionStatus] = useState(getEncryptionStatus());
  
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
  
  // Update encryption status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setEncryptionStatus(getEncryptionStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Hide swipe label after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeLabel(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Touch event handlers for horizontal swiping with animation
  const handleTouchStart = (e) => {
    if (activeTab !== 'home') return; // Only enable swiping on home tab
    
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setTouchEnd(null);
    
    // Reset transition when touch starts
    setSwipeTransition({
      transform: 'translateX(0)',
      opacity: 1,
      transition: 'none'
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStart || activeTab !== 'home') return;
    
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    
    const distanceX = e.targetTouches[0].clientX - touchStart.x;
    const distanceY = Math.abs(e.targetTouches[0].clientY - touchStart.y);
    const screenWidth = window.innerWidth;
    
    // If more vertical than horizontal, let normal scroll happen
    if (distanceY > Math.abs(distanceX)) return;
    
    // Determine if swipe direction is valid
    const validDirection = (viewType === 'morgen' && distanceX < 0) || 
                         (viewType === 'abend' && distanceX > 0);
    
    // Apply transform with resistance if needed
    if (validDirection) {
      // Full movement in valid direction with smooth fade effect
      setSwipeTransition({
        transform: `translateX(${distanceX}px)`,
        opacity: 1 - Math.min(0.3, Math.abs(distanceX) / screenWidth * 0.5),
        transition: 'none'
      });
    } else {
      // Resistance in invalid direction (reduced movement)
      setSwipeTransition({
        transform: `translateX(${distanceX * 0.2}px)`,
        opacity: 1,
        transition: 'none'
      });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || activeTab !== 'home') return;
    
    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = Math.abs(touchEnd.y - touchStart.y);
    const isHorizontalSwipe = distanceY < Math.abs(distanceX) * 0.8;
    const screenWidth = window.innerWidth;
    const swipeThreshold = screenWidth * 0.2; // 20% of screen width
    
    // Clear any existing timeout
    if (swipeTimeoutRef.current) {
      clearTimeout(swipeTimeoutRef.current);
      swipeTimeoutRef.current = null;
    }
    
    if (isHorizontalSwipe) {
      if (distanceX < -swipeThreshold && viewType === 'morgen') {
        // Left swipe to evening - animate out
        setSwipeTransition({
          transform: `translateX(${-screenWidth}px)`,
          opacity: 0,
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out'
        });
        
        // Change view after animation
        swipeTimeoutRef.current = setTimeout(() => {
          setViewType('abend');
          // Immediate reset
          setSwipeTransition({
            transform: 'translateX(0)',
            opacity: 1,
            transition: 'none'
          });
          swipeTimeoutRef.current = null;
        }, 300);
      } else if (distanceX > swipeThreshold && viewType === 'abend') {
        // Right swipe to morning - animate out
        setSwipeTransition({
          transform: `translateX(${screenWidth}px)`,
          opacity: 0,
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out'
        });
        
        // Change view after animation
        swipeTimeoutRef.current = setTimeout(() => {
          setViewType('morgen');
          // Immediate reset
          setSwipeTransition({
            transform: 'translateX(0)',
            opacity: 1,
            transition: 'none'
          });
          swipeTimeoutRef.current = null;
        }, 300);
      } else {
        // Snap back to center
        setSwipeTransition({
          transform: 'translateX(0)',
          opacity: 1,
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out'
        });
      }
    } else {
      // Reset if not a horizontal swipe
      setSwipeTransition({
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending swipe timeouts
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current);
      }
    };
  }, []);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <CriticalErrorBoundary componentName="AdvancedStatistics" fallbackMessage="Statistiken können nicht angezeigt werden.">
            <Suspense fallback={<LoadingFallback message="Lade Statistiken..." />}>
              <AdvancedStatistics 
                data={data} 
                contextFactors={contextFactors}
                darkMode={darkMode}
              />
            </Suspense>
          </CriticalErrorBoundary>
        );
      case 'table':
        return (
          <CriticalErrorBoundary componentName="BloodPressureTable" fallbackMessage="Tabelle kann nicht angezeigt werden.">
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
                className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center mb-3"
              >
                <FileText size={18} className="mr-2" />
                Ärztlichen Bericht erstellen
              </button>
              {/* Debug Reset Button */}
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Debug-Optionen:</p>
                <ResetButton />
              </div>
            </div>
            <BloodPressureCategoryLegend darkMode={darkMode} />
          </>
        );
      default: // 'home'
        return (
          <>
            {/* Main content area with touch events for swiping */}
            <div 
              className="relative overflow-hidden" 
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
              
              {/* Toggle buttons for morning/evening - tablet and desktop */}
              <div className="hidden sm:block">
                <ToggleViewButtons viewType={viewType} setViewType={setViewType} darkMode={darkMode} />
              </div>
              
              {/* Content with animation */}
              <div 
                style={{
                  transform: swipeTransition.transform,
                  opacity: swipeTransition.opacity,
                  transition: swipeTransition.transition
                }}
              >
                {/* Blood pressure summary - with key to force re-render when viewType changes */}
                <BloodPressureSummary 
                  key={`summary-${viewType}`} 
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
                
                {/* Blood pressure chart - with key to force re-render when viewType changes */}
                <CriticalErrorBoundary componentName="BloodPressureChart" fallbackMessage="Diagramm kann nicht angezeigt werden.">
                  <BloodPressureChart 
                    key={`chart-${viewType}`}
                    data={dataWithMA} 
                    viewType={viewType} 
                    avgValues={avgValues}
                    darkMode={darkMode}
                  />
                </CriticalErrorBoundary>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className="mx-auto px-1 py-2 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900 min-h-screen max-w-screen-xl relative transition-all duration-300">
        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-3 mb-3 rounded-md transition-colors duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Sie sind offline. Die App funktioniert weiterhin, alle Änderungen werden lokal gespeichert.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Message */}
        <StatusMessage message={statusMessage} />
        
        {/* Theme Toggle Button and Encryption Status - Mobile */}
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 sm:hidden">
          {/* Encryption Status Indicator - TEMPORÄR DEAKTIVIERT */}
          {false && encryptionStatus.active && (
            <div 
              className="flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs"
              title={`Verschlüsselung aktiv (${encryptionStatus.algorithm})`}
            >
              <Shield size={14} className="mr-1" />
              <span className="hidden xs:inline">Verschlüsselt</span>
            </div>
          )}
          
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 hover:scale-110"
            aria-label={darkMode ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
          >
            {darkMode ? <Sun size={18} className="animate-pulse" /> : <Moon size={18} />}
          </button>
        </div>
        
        {/* Tablet Navigation Bar */}
        <div className="hidden sm:block md:hidden bg-white dark:bg-slate-800 shadow-md dark:shadow-slate-900/50 p-3 mb-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Blutdruck Tracker</h1>
            <div className="flex items-center space-x-2">
              {encryptionStatus.active && (
                <Shield size={16} className="text-green-600 dark:text-green-400" title={`Verschlüsselung aktiv (${encryptionStatus.algorithm})`} />
              )}
              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                aria-label={darkMode ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Desktop Header with Navigation */}
        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-4 mb-4 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Blutdruck Tracker</h1>
              {/* Encryption Status for Desktop - TEMPORÄR DEAKTIVIERT */}
              {false && encryptionStatus.active && (
                <div 
                  className="flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm transition-colors duration-300"
                  title={`Verschlüsselung aktiv (${encryptionStatus.algorithm})`}
                >
                  <Shield size={16} className="mr-1" />
                  <span>Verschlüsselt</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200 hover:scale-110"
                aria-label={darkMode ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
              >
                {darkMode ? <Sun size={18} className="animate-pulse" /> : <Moon size={18} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'home' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'stats' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <PieChart size={18} />
                <span>Statistiken</span>
              </button>
              
              <button
                onClick={() => setActiveTab('table')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'table' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <List size={18} />
                <span>Einträge</span>
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Settings size={18} />
                <span>Einstellungen</span>
              </button>
            </div>
            
            <button
              onClick={handleAddNew}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Neuer Eintrag</span>
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="mt-1 mb-20 md:mb-4">
          {renderTabContent()}
        </div>
        
        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-2 flex justify-around z-10 transition-all duration-300 md:hidden shadow-lg dark:shadow-slate-900/50">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-1 transition-colors duration-200 ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}
          >
            <Home size={activeTab === 'home' ? 22 : 20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center p-1 transition-colors duration-200 ${activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}
          >
            <PieChart size={activeTab === 'stats' ? 22 : 20} />
            <span className="text-xs mt-1">Statistik</span>
          </button>
          
          <button
            onClick={handleAddNew}
            className="flex flex-col items-center p-1 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white -mt-4 rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 transition-all duration-200"
          >
            <Plus size={28} />
          </button>
          
          <button
            onClick={() => setActiveTab('table')}
            className={`flex flex-col items-center p-1 transition-colors duration-200 ${activeTab === 'table' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}
          >
            <List size={activeTab === 'table' ? 22 : 20} />
            <span className="text-xs mt-1">Einträge</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-1 transition-colors duration-200 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}
          >
            <Settings size={activeTab === 'settings' ? 22 : 20} />
            <span className="text-xs mt-1">Mehr</span>
          </button>
        </div>
        
        {/* Forms with context capture */}
        {showAddForm && (
          <Suspense fallback={<LoadingFallback message="Lade Formular..." />}>
            <EntryFormWithContext 
              previousContext={getLatestContextFactors()}
              onSubmit={handleAddSubmit} 
              onCancel={() => setShowAddForm(false)}
              darkMode={darkMode}
            />
          </Suspense>
        )}
        
        {showEditForm && currentEntry && (
          <Suspense fallback={<LoadingFallback message="Lade Formular..." />}>
            <EntryFormWithContext 
              isEdit={true}
              entry={currentEntry}
              contextData={getContextForDisplayDate(currentEntry.datum)}
              onSubmit={handleEditSubmit} 
              onCancel={() => setShowEditForm(false)}
              darkMode={darkMode}
            />
          </Suspense>
        )}
        
        {/* Import/Export Modal */}
        {showImportModal && (
          <Suspense fallback={<LoadingFallback message="Lade Import/Export..." />}>
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
          <Suspense fallback={<LoadingFallback message="Lade Bericht..." />}>
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
    </ThemeContext.Provider>
  );
};

export default BlutdruckTracker;