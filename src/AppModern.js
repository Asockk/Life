// AppModern.js - iOS-inspired modern design
import React, { useState, useEffect, lazy, Suspense, createContext, useContext } from 'react';
import { 
  Heart, Plus, BarChart3, Settings, Moon, Sun,
  Activity, Calendar, TrendingUp, Clock, FileText,
  Upload, Shield, ChevronRight, PieChart
} from 'lucide-react';
import './styles/ios-theme.css';
import { migrateOldDataFormats } from './utils/dataMigration';

// Custom Hook
import useBloodPressureData from './hooks/useBloodPressureData';

// Modern UI Components
import BackupExport from './components/UI/BackupExport';
import { CriticalErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded components
const EntryFormWithContext = lazy(() => import('./components/Forms/EntryFormWithContext'));
const ModernBloodPressureChart = lazy(() => import('./components/Dashboard/ModernBloodPressureChart'));
const BloodPressureTable = lazy(() => import('./components/Table/BloodPressureTableWrapper'));
const ImportModal = lazy(() => import('./components/Forms/ImportModal'));
const AdvancedStatistics = lazy(() => import('./components/Dashboard/AdvancedStatistics'));
const MedicalReportGenerator = lazy(() => import('./components/Reports/MedicalReportGenerator'));
const ContextFactorsTrend = lazy(() => import('./components/Dashboard/ContextFactorsTrend'));

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// Loading Component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-[var(--ios-bg-primary)]">
    <div className="text-center">
      <Heart className="h-16 w-16 text-[var(--ios-red)] mx-auto mb-4 ios-pulse" />
      <p className="text-[var(--ios-text-secondary)]">Lade...</p>
    </div>
  </div>
);

// Modern Card Component
const ModernCard = ({ children, className = '', onClick }) => (
  <div 
    className={`ios-card ${className}`} 
    onClick={onClick}
    style={{ 
      padding: 'var(--ios-spacing-lg)',
      marginBottom: 'var(--ios-spacing-md)'
    }}
  >
    {children}
  </div>
);

// Quick Stats Card
const QuickStatCard = ({ icon: Icon, label, value, color, trend }) => (
  <ModernCard className="flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform">
    <div className="flex items-center space-x-3">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-[var(--ios-text-secondary)]">{label}</p>
        <p className="text-xl font-semibold text-[var(--ios-text-primary)]">{value}</p>
      </div>
    </div>
    {trend && (
      <div className="text-sm text-[var(--ios-text-tertiary)]">
        {trend}
      </div>
    )}
  </ModernCard>
);

// Section Header
const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4 px-1">
    <h2 className="text-2xl font-bold text-[var(--ios-text-primary)]">{title}</h2>
    {action}
  </div>
);

const BlutdruckTrackerModern = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('blutdruck-theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme
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
    viewType,
    setViewType,
    bpCategory,
    statusMessage,
    addEntry,
    updateEntry,
    deleteEntry,
    importData,
    toggleReport,
    showReport,
    contextFactors,
    getContextForDisplayDate,
    factorCorrelations
  } = useBloodPressureData();

  // Run migration on app start
  useEffect(() => {
    const runMigration = async () => {
      try {
        const migrationPerformed = await migrateOldDataFormats();
        if (migrationPerformed) {
          console.log('[APP] Datenmigration erfolgreich durchgeführt');
          window.location.reload();
        }
      } catch (error) {
        console.error('[APP] Fehler bei der Datenmigration:', error);
      }
    };
    runMigration();
  }, []);

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Calculate statistics
  const todayData = data.filter(entry => {
    const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    return entry.datum === today;
  })[0];

  const weekData = data.slice(0, 7);
  const avgPulse = weekData.length > 0 
    ? Math.round(weekData.reduce((sum, entry) => {
        let count = 0;
        let total = 0;
        if (entry.morgenPuls) { total += entry.morgenPuls; count++; }
        if (entry.abendPuls) { total += entry.abendPuls; count++; }
        return sum + (count > 0 ? total / count : 0);
      }, 0) / weekData.length)
    : null;

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <SectionHeader 
              title="Übersicht" 
              action={
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="ios-button ios-button-primary"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Neue Messung
                </button>
              }
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickStatCard
                icon={Heart}
                label="Heutiger Blutdruck"
                value={todayData ? `${todayData.morgenSys || '-'}/${todayData.morgenDia || '-'}` : 'Keine Messung'}
                color="var(--ios-red)"
              />
              <QuickStatCard
                icon={Activity}
                label="Durchschnittspuls (7 Tage)"
                value={avgPulse ? `${avgPulse} bpm` : '-'}
                color="var(--ios-orange)"
              />
              <QuickStatCard
                icon={TrendingUp}
                label="Kategorie"
                value={bpCategory?.category || 'Keine Daten'}
                color="var(--ios-green)"
              />
              <QuickStatCard
                icon={Calendar}
                label="Messungen diese Woche"
                value={`${weekData.length} Einträge`}
                color="var(--ios-blue)"
              />
            </div>

            {/* Actions */}
            <ModernCard>
              <h3 className="text-lg font-semibold text-[var(--ios-text-primary)] mb-4">
                Schnellaktionen
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowBackupModal(true)}
                  className="w-full ios-list-item flex items-center justify-between rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-[var(--ios-blue)]" />
                    <span>Backup erstellen</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--ios-text-tertiary)]" />
                </button>
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="w-full ios-list-item flex items-center justify-between rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-[var(--ios-green)]" />
                    <span>Daten importieren</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--ios-text-tertiary)]" />
                </button>
                <button 
                  onClick={toggleReport}
                  className="w-full ios-list-item flex items-center justify-between rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-[var(--ios-purple)]" />
                    <span>Bericht generieren</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--ios-text-tertiary)]" />
                </button>
              </div>
            </ModernCard>
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-6">
            <SectionHeader title="Verlauf" />
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Lade Chart...</div>}>
              <ModernBloodPressureChart data={data} viewType={viewType} darkMode={darkMode} />
            </Suspense>
            
            {/* View Type Selector */}
            <div className="ios-segmented-control mx-auto">
              <button 
                className={`ios-segmented-item ${viewType === 'morgen' ? 'active' : ''}`}
                onClick={() => setViewType('morgen')}
              >
                Morgen
              </button>
              <button 
                className={`ios-segmented-item ${viewType === 'abend' ? 'active' : ''}`}
                onClick={() => setViewType('abend')}
              >
                Abend
              </button>
              <button 
                className={`ios-segmented-item ${viewType === 'beide' ? 'active' : ''}`}
                onClick={() => setViewType('beide')}
              >
                Beide
              </button>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-6">
            <SectionHeader title="Alle Messungen" />
            <ModernCard className="p-0 overflow-hidden">
              <Suspense fallback={<div className="h-96 flex items-center justify-center">Lade Tabelle...</div>}>
                <BloodPressureTable 
                  data={data} 
                  onEdit={updateEntry}
                  onDelete={deleteEntry}
                />
              </Suspense>
            </ModernCard>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-6">
            <SectionHeader title="Detaillierte Statistiken" />
            
            {/* Advanced Statistics */}
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Lade Statistiken...</div>}>
              <AdvancedStatistics 
                data={data} 
                darkMode={darkMode}
              />
            </Suspense>

            {/* Context Factors */}
            {contextFactors && Object.keys(contextFactors).length > 0 && (
              <>
                <SectionHeader title="Einflussfaktoren" />
                <Suspense fallback={<div className="h-64 flex items-center justify-center">Lade Faktoren...</div>}>
                  <ContextFactorsTrend 
                    contextFactors={contextFactors || {}}
                    factorCorrelations={factorCorrelations || {}}
                    darkMode={darkMode}
                  />
                </Suspense>
              </>
            )}

            {/* Medical Report */}
            {showReport && (
              <ModernCard className="p-0">
                <Suspense fallback={<div className="h-64 flex items-center justify-center">Lade Bericht...</div>}>
                  <MedicalReportGenerator
                    data={data}
                    contextFactors={contextFactors}
                    onClose={toggleReport}
                    darkMode={darkMode}
                  />
                </Suspense>
              </ModernCard>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <SectionHeader title="Einstellungen" />
            
            <ModernCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <span>Dark Mode</span>
                  </div>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={`ios-toggle ${darkMode ? 'active' : ''}`}
                  >
                    <div className="ios-toggle-knob" />
                  </button>
                </div>
              </div>
            </ModernCard>

            <ModernCard>
              <h3 className="text-lg font-semibold text-[var(--ios-text-primary)] mb-4">
                Über diese App
              </h3>
              <div className="space-y-2 text-sm text-[var(--ios-text-secondary)]">
                <p>Blutdruck Tracker v2.0</p>
                <p>Entwickelt für eine bessere Gesundheitsüberwachung</p>
                <p className="text-xs text-[var(--ios-text-tertiary)] mt-4">
                  Mit modernem iOS-Design und verbesserter Benutzerfreundlichkeit
                </p>
              </div>
            </ModernCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <CriticalErrorBoundary>
      <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
        <div className="min-h-screen bg-[var(--ios-bg-primary)]">
          {/* Navigation Bar */}
          <nav className="ios-nav ios-safe-area-top">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[var(--ios-text-primary)] flex items-center">
                  <Heart className="h-6 w-6 mr-2 text-[var(--ios-red)]" />
                  Blutdruck Tracker
                </h1>
                <Clock className="h-5 w-5 text-[var(--ios-text-tertiary)]" />
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-6 pb-20">
            {renderContent()}
          </main>

          {/* Tab Bar */}
          <div className="fixed bottom-0 left-0 right-0 ios-tab-bar ios-safe-area-bottom">
            <button 
              className={`ios-tab-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Heart className="ios-tab-icon" />
              <span className="ios-tab-label">Start</span>
            </button>
            <button 
              className={`ios-tab-item ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <BarChart3 className="ios-tab-icon" />
              <span className="ios-tab-label">Verlauf</span>
            </button>
            <button 
              className={`ios-tab-item ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <PieChart className="ios-tab-icon" />
              <span className="ios-tab-label">Statistik</span>
            </button>
            <button 
              className={`ios-tab-item ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              <Calendar className="ios-tab-icon" />
              <span className="ios-tab-label">Liste</span>
            </button>
            <button 
              className={`ios-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="ios-tab-icon" />
              <span className="ios-tab-label">Mehr</span>
            </button>
          </div>

          {/* Modals */}
          {showAddForm && (
            <div className="ios-modal-backdrop" onClick={() => setShowAddForm(false)}>
              <div className="ios-modal" onClick={e => e.stopPropagation()}>
                <Suspense fallback={<LoadingScreen />}>
                  <EntryFormWithContext
                    onSubmit={(_, formData, contextData) => {
                      const result = addEntry(formData, contextData);
                      if (result.success) {
                        setShowAddForm(false);
                      }
                    }}
                    onCancel={() => setShowAddForm(false)}
                    isEdit={false}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {showImportModal && (
            <div className="ios-modal-backdrop" onClick={() => setShowImportModal(false)}>
              <div className="ios-modal" onClick={e => e.stopPropagation()}>
                <Suspense fallback={<LoadingScreen />}>
                  <ImportModal
                    onImport={importData}
                    onClose={() => setShowImportModal(false)}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {showBackupModal && (
            <div className="ios-modal-backdrop" onClick={() => setShowBackupModal(false)}>
              <div className="ios-modal" onClick={e => e.stopPropagation()}>
                <BackupExport 
                  onExportComplete={() => {
                    setTimeout(() => setShowBackupModal(false), 2000);
                  }}
                />
              </div>
            </div>
          )}

          {/* Status Messages */}
          {statusMessage && (
            <div 
              className={`fixed top-20 left-4 right-4 mx-auto max-w-md z-50 ios-card ${
                statusMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
              }`}
              style={{ animation: 'ios-modal-enter 0.3s ease-out' }}
            >
              <p className={`text-sm ${
                statusMessage.type === 'error' ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
              }`}>
                {statusMessage.message}
              </p>
            </div>
          )}
        </div>
      </ThemeContext.Provider>
    </CriticalErrorBoundary>
  );
};

export default BlutdruckTrackerModern;