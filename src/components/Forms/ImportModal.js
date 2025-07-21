// components/Forms/ImportModal.js
import React, { useState } from 'react';
import { Check, X, Download, Upload, Save, Trash2 } from 'lucide-react';
import { parseCSVData } from '../../utils/dataUtils';
import { exportToCSV } from '../../utils/csvExportUtils';

// Import der neuen Storage-Service Funktionen für erweiterte Export/Import
import { exportAllData, importAllData, clearAllData } from '../../services/storageService';

// Hilfsfunktion zum Konvertieren von englischen zu deutschen Monatsnamen
const convertToGermanDate = (entry) => {
  if (!entry || !entry.datum) return entry;

  // Kopie des Eintrags erstellen
  const updatedEntry = { ...entry };
  
  // Übersetze englische Monatsnamen zu deutschen
  const monthTranslation = {
    'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
    'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
    'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember'
  };

  // Formatprüfung und Konvertierung
  let datumStr = entry.datum;
  
  // Prüfe verschiedene Formate und konvertiere Monatsnamen
  // Format "13. January, 2025"
  if (datumStr.includes('.') && datumStr.includes(',')) {
    const parts = datumStr.split('.');
    if (parts.length >= 2) {
      const dayPart = parts[0].trim();
      let restPart = parts[1].trim();
      
      // Jahr entfernen, falls vorhanden
      if (restPart.includes(',')) {
        restPart = restPart.split(',')[0].trim();
      }
      
      // Englischen Monatsnamen zu deutschen konvertieren
      for (const [engMonth, deMonth] of Object.entries(monthTranslation)) {
        if (restPart.includes(engMonth)) {
          restPart = restPart.replace(engMonth, deMonth);
          break;
        }
      }
      
      updatedEntry.datum = `${dayPart}. ${restPart}`;
    }
  } 
  // Format "January 13, 2025"
  else if (datumStr.includes(' ') && !datumStr.includes('.')) {
    const parts = datumStr.split(' ');
    if (parts.length >= 2) {
      let monthPart = parts[0].trim();
      let dayPart = parts[1].trim();
      
      // Komma oder Jahr entfernen
      if (dayPart.includes(',')) {
        dayPart = dayPart.replace(',', '');
      }
      
      // Englischen Monatsnamen zu deutschen konvertieren
      monthPart = monthTranslation[monthPart] || monthPart;
      
      // In deutsches Format umwandeln: "13. Januar"
      updatedEntry.datum = `${dayPart}. ${monthPart}`;
    }
  }
  
  return updatedEntry;
};

const ImportModal = ({ onImport, onClose, data, contextFactors, darkMode }) => {
  const [importData, setImportData] = useState(null);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importInfo, setImportInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importMethod, setImportMethod] = useState('csv'); // 'csv' oder 'backup'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setImportError('');
    setImportInfo('');
    setImportData(null);
    setImportPreview([]);
    
    if (!file) {
      return;
    }
    
    setIsLoading(true);
    
    // Unterschiedliche Behandlung basierend auf Dateityp
    if (importMethod === 'backup' || file.name.toLowerCase().endsWith('.json')) {
      // JSON Backup einlesen
      handleBackupImport(file);
    } else {
      // Standard CSV Import
      handleCsvImport(file);
    }
  };
  
  const handleCsvImport = (file) => {
    // Prüfen ob es eine CSV-Datei ist oder die Endung .csv hat
    const isCSV = file.type === 'text/csv' || 
                  file.name.toLowerCase().endsWith('.csv') || 
                  file.name.toLowerCase().endsWith('.txt');
                  
    if (!isCSV) {
      setImportError('Bitte wählen Sie eine CSV- oder Textdatei aus.');
      setIsLoading(false);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        
        // Sicherstellen, dass wir einen Text haben
        if (!text || typeof text !== 'string') {
          throw new Error('Die Datei enthält keinen gültigen Text.');
        }
        
        const result = parseCSVData(text);
        
        // WICHTIGE ÄNDERUNG: Monatsnamen zu Deutsch konvertieren
        const localizedData = result.data.map(convertToGermanDate);
        
        setImportData(localizedData);
        
        // Vorschau mit max. 5 Einträgen erstellen
        setImportPreview(localizedData.slice(0, 5));
        
        // Meldung über übersprungene Datensätze und Nullwerte
        let infoMessage = '';
        if (result.skippedCount > 0) {
          infoMessage += `${result.skippedCount} Datensätze ohne Blutdruckwerte wurden ignoriert. `;
        }
        if (result.zeroValuesCount > 0) {
          infoMessage += `${result.zeroValuesCount} Datensätze enthalten einzelne Nullwerte, die im Diagramm ignoriert werden.`;
        }
        
        if (infoMessage) {
          setImportInfo(infoMessage);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Fehler beim Parsen der CSV-Datei:', error);
        setImportError(error.message || 'Fehler beim Parsen der Datei.');
        setImportData(null);
        setImportPreview([]);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setImportError('Fehler beim Lesen der Datei.');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleBackupImport = (file) => {
    // Prüfen ob es eine JSON-Datei ist
    const isJSON = file.type === 'application/json' || 
                   file.name.toLowerCase().endsWith('.json');
                  
    if (!isJSON) {
      setImportError('Bitte wählen Sie eine JSON-Backup-Datei aus.');
      setIsLoading(false);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        
        // Sicherstellen, dass wir einen Text haben
        if (!text || typeof text !== 'string') {
          throw new Error('Die Datei enthält keinen gültigen Text.');
        }
        
        // JSON parsen um Vorschau anzuzeigen
        const backupData = JSON.parse(text);
        
        if (!backupData.measurements || !Array.isArray(backupData.measurements)) {
          throw new Error('Ungültiges Backup-Format: Messungen fehlen oder haben falsches Format');
        }
        
        // Speichere für späteren Import
        setImportData(text);
        
        // Vorschau erstellen
        setImportPreview(backupData.measurements.slice(0, 5));
        
        // Info-Nachricht erstellen
        setImportInfo(`Backup vom ${new Date(backupData.exportDate).toLocaleString()} mit ${backupData.measurements.length} Messungen und ${Object.keys(backupData.contextFactors || {}).length} Kontextfaktoren.`);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Fehler beim Parsen der Backup-Datei:', error);
        setImportError(error.message || 'Fehler beim Parsen der Backup-Datei.');
        setImportData(null);
        setImportPreview([]);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setImportError('Fehler beim Lesen der Datei.');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const confirmImport = async () => {
    if (!importData) {
      setImportError('Keine Daten zum Importieren vorhanden.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (importMethod === 'backup' || typeof importData === 'string') {
        // Bei Backup-Import die neue Funktion verwenden
        const result = await importAllData(importData);
        
        if (result.success) {
          onClose(); // Schließe das Modal
          // Die App wird die Daten neu laden
        } else {
          setImportError('Fehler beim Importieren der Backup-Datei.');
        }
      } else {
        // Bei CSV-Import die herkömmliche Funktion verwenden
        if (onImport(importData)) {
          onClose();
        } else {
          setImportError('Fehler beim Importieren der Daten.');
        }
      }
    } catch (error) {
      console.error('Fehler beim Import:', error);
      setImportError(error.message || 'Import fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funktion für neuen JSON-Export
  const handleBackupExport = async () => {
    setIsLoading(true);
    
    try {
      const filename = await exportAllData();
      setImportInfo(`Backup wurde erfolgreich erstellt: ${filename}`);
    } catch (error) {
      console.error('Fehler beim Erstellen des Backups:', error);
      setImportError('Fehler beim Erstellen des Backups: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funktion zum Export der aktuellen Daten als CSV
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      setImportError('Keine Daten zum Exportieren vorhanden.');
      return;
    }
    
    try {
      const filename = exportToCSV(data, contextFactors);
      setImportInfo(`CSV-Export wurde erfolgreich erstellt: ${filename}`);
    } catch (error) {
      console.error('Fehler beim CSV-Export:', error);
      setImportError('Fehler beim Exportieren der CSV-Datei: ' + error.message);
    }
  };
  
  // Funktion zum Löschen aller Daten
  const handleClearAllData = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      await clearAllData();
      setImportInfo('Alle Daten wurden erfolgreich gelöscht. Die App wird neu geladen.');
      
      // Kurze Verzögerung bevor die Seite neu geladen wird
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Fehler beim Löschen der Daten:', error);
      setImportError('Fehler beim Löschen der Daten: ' + error.message);
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Blutdruckdaten importieren/exportieren</h3>
          <button 
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          {/* Tabs für Import-Methode */}
          <div className={`flex border-b mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              className={`px-4 py-2 ${importMethod === 'csv' 
                ? `border-b-2 border-blue-500 ${darkMode ? 'text-blue-400' : 'text-blue-600'}` 
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}`}
              onClick={() => setImportMethod('csv')}
            >
              CSV Import/Export
            </button>
            <button
              className={`px-4 py-2 ${importMethod === 'backup' 
                ? `border-b-2 border-blue-500 ${darkMode ? 'text-blue-400' : 'text-blue-600'}` 
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}`}
              onClick={() => setImportMethod('backup')}
            >
              Backup & Wiederherstellung
            </button>
          </div>
        
          {importMethod === 'csv' ? (
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 min-w-[280px]">
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Daten importieren:</strong> Wählen Sie eine CSV-Datei mit Blutdruckdaten aus.
                  Das Format sollte Spalten für Tag, Datum, und Blutdruckwerte enthalten.
                </p>
                
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <label 
                    htmlFor="file-upload"
                    className={`cursor-pointer flex flex-col items-center ${isLoading ? 'opacity-50' : ''}`}
                  >
                    <Upload size={40} className={`mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>CSV-Datei auswählen</span>
                    <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>oder hierher ziehen</span>
                  </label>
                </div>
              </div>
              
              <div className="flex-1 min-w-[280px]">
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Daten exportieren:</strong> Laden Sie Ihre aktuellen Blutdruckdaten als CSV-Datei
                  herunter, um sie zu sichern oder in anderen Programmen zu verwenden.
                </p>
                
                <div className={`border-2 rounded-lg p-6 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <button
                    onClick={handleExportCSV}
                    className={`cursor-pointer flex flex-col items-center w-full ${isLoading ? 'opacity-50' : ''}`}
                    disabled={isLoading}
                  >
                    <Download size={40} className={`mb-2 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-500'}`}>Daten als CSV exportieren</span>
                    <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Enthält alle Messungen und Kontextfaktoren</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 min-w-[280px]">
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Backup wiederherstellen:</strong> Wählen Sie eine zuvor erstellte Backup-Datei, 
                  um Ihre Daten wiederherzustellen oder auf ein anderes Gerät zu übertragen.
                </p>
                
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="file"
                    id="backup-upload"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <label 
                    htmlFor="backup-upload"
                    className={`cursor-pointer flex flex-col items-center ${isLoading ? 'opacity-50' : ''}`}
                  >
                    <Upload size={40} className={`mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>Backup-Datei auswählen</span>
                    <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>.json Format</span>
                  </label>
                </div>
              </div>
              
              <div className="flex-1 min-w-[280px]">
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Vollständiges Backup erstellen:</strong> Sichern Sie alle Ihre Daten 
                  (Messungen, Kontextfaktoren, Einstellungen) in einer einzigen Datei.
                </p>
                
                <div className={`border-2 rounded-lg p-6 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <button
                    onClick={handleBackupExport}
                    className={`cursor-pointer flex flex-col items-center w-full ${isLoading ? 'opacity-50' : ''}`}
                    disabled={isLoading}
                  >
                    <Save size={40} className={`mb-2 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-500'}`}>Backup erstellen</span>
                    <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Exportiert alle Daten als JSON-Datei</span>
                  </button>
                </div>
                
                {/* Lösch-Funktion */}
                <div className={`mt-4 border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Alle Daten löschen:</strong> Entfernt alle gespeicherten Daten und setzt die App zurück.
                  </p>
                  
                  <button
                    onClick={handleClearAllData}
                    className={`w-full flex items-center justify-center py-2 px-4 rounded-md ${
                      showDeleteConfirm 
                        ? 'bg-red-600 text-white' 
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {showDeleteConfirm ? 'Wirklich alle Daten löschen?' : 'Daten zurücksetzen'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {importError && (
            <div className={`mt-3 text-sm p-3 rounded-md border ${darkMode ? 'text-red-400 bg-red-900/20 border-red-800' : 'text-red-600 bg-red-50 border-red-200'}`}>
              Fehler: {importError}
            </div>
          )}
          
          {importInfo && (
            <div className={`mt-3 text-sm p-3 rounded-md border ${darkMode ? 'text-blue-400 bg-blue-900/20 border-blue-800' : 'text-blue-600 bg-blue-50 border-blue-200'}`}>
              Info: {importInfo}
            </div>
          )}
          
          {isLoading && (
            <div className={`mt-3 text-sm flex items-center justify-center p-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <svg className={`animate-spin h-5 w-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Bitte warten...
            </div>
          )}
          
          {importPreview.length > 0 && (
            <div className="mt-4 max-h-[40vh] overflow-y-auto">
              <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Vorschau der Importdaten:</h4>
              <div className={`overflow-x-auto rounded p-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <table className={`min-w-full text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <th className={`p-1 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tag</th>
                      <th className={`p-1 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Datum</th>
                      <th className={`p-1 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Morgen (Sys/Dia/Puls)</th>
                      <th className={`p-1 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Abend (Sys/Dia/Puls)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((entry, index) => (
                      <tr key={index} className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className={`p-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{entry.tag}</td>
                        <td className={`p-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{entry.datum}</td>
                        <td className={`p-1 text-center ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {entry.morgenSys > 0 && entry.morgenDia > 0 
                            ? `${entry.morgenSys}/${entry.morgenDia}/${entry.morgenPuls}` 
                            : '-'}
                        </td>
                        <td className={`p-1 text-center ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {entry.abendSys > 0 && entry.abendDia > 0 
                            ? `${entry.abendSys}/${entry.abendDia}/${entry.abendPuls}` 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData && (
                  Array.isArray(importData) && importData.length > importPreview.length ? (
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ...und {importData.length - importPreview.length} weitere Einträge
                    </p>
                  ) : (
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Vorschau der ersten 5 Einträge
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Buttons am unteren Rand fixiert */}
        {importData && (
          <div className={`sticky bottom-0 pt-4 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              disabled={isLoading}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={confirmImport}
              className={`w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none flex items-center justify-center ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={isLoading}
            >
              <Check size={16} className="mr-2" />
              Importieren
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;