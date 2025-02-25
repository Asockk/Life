// components/Forms/ImportModal.js
import React, { useState } from 'react';
import { Check, X, FileText } from 'lucide-react';
import { parseCSVData } from '../../utils/dataUtils';

const ImportModal = ({ onImport, onClose }) => {
  const [importData, setImportData] = useState(null);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importInfo, setImportInfo] = useState('');
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setImportError('');
    setImportInfo('');
    
    if (!file) {
      return;
    }
    
    // Prüfen ob es eine CSV-Datei ist
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportError('Bitte wählen Sie eine CSV-Datei aus.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const result = parseCSVData(text);
        const parsedData = result.data;
        setImportData(parsedData);
        
        // Vorschau mit max. 5 Einträgen erstellen
        setImportPreview(parsedData.slice(0, 5));
        
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
      } catch (error) {
        setImportError(error.message);
        setImportData(null);
        setImportPreview([]);
      }
    };
    
    reader.onerror = () => {
      setImportError('Fehler beim Lesen der Datei.');
    };
    
    reader.readAsText(file);
  };
  
  const confirmImport = () => {
    if (!importData || importData.length === 0) {
      setImportError('Keine Daten zum Importieren vorhanden.');
      return;
    }
    
    // Importieren der Daten
    if (onImport(importData)) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Blutdruckdaten importieren</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Wählen Sie eine CSV-Datei mit Blutdruckdaten zum Importieren aus. 
            Das Format sollte Spalten für Tag, Datum, und Blutdruckwerte (morgens und abends) enthalten.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText size={40} className="text-blue-500 mb-2" />
              <span className="font-medium text-blue-500">CSV-Datei auswählen</span>
              <span className="text-xs text-gray-500 mt-1">oder hierher ziehen</span>
            </label>
          </div>
          
          {importError && (
            <div className="mt-3 text-sm text-red-600">
              Fehler: {importError}
            </div>
          )}
          
          {importInfo && (
            <div className="mt-3 text-sm text-blue-600">
              Info: {importInfo}
            </div>
          )}
          
          {importPreview.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Vorschau der Importdaten:</h4>
              <div className="overflow-x-auto bg-gray-50 rounded p-2">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="p-1 text-left">Tag</th>
                      <th className="p-1 text-left">Datum</th>
                      <th className="p-1 text-center">Morgen (Sys/Dia/Puls)</th>
                      <th className="p-1 text-center">Abend (Sys/Dia/Puls)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-1">{entry.tag}</td>
                        <td className="p-1">{entry.datum}</td>
                        <td className="p-1 text-center">
                          {entry.morgenSys > 0 && entry.morgenDia > 0 
                            ? `${entry.morgenSys}/${entry.morgenDia}/${entry.morgenPuls}` 
                            : '-'}
                        </td>
                        <td className="p-1 text-center">
                          {entry.abendSys > 0 && entry.abendDia > 0 
                            ? `${entry.abendSys}/${entry.abendDia}/${entry.abendPuls}` 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData && importData.length > importPreview.length && (
                  <p className="text-xs text-gray-500 mt-2">
                    ...und {importData.length - importPreview.length} weitere Einträge
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-3"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={confirmImport}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none flex items-center"
            disabled={!importData || importData.length === 0}
          >
            <Check size={16} className="mr-2" />
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;