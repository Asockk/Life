// BackupExport.js
import React, { useState } from 'react';
import { Download, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { exportAllData } from '../../services/storageService';

const BackupExport = ({ onExportComplete }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const filename = await exportAllData();
      setExportStatus({
        type: 'success',
        message: `Backup erfolgreich erstellt: ${filename}`,
        filename
      });
      
      if (onExportComplete) {
        onExportComplete(filename);
      }
    } catch (error) {
      console.error('Export fehlgeschlagen:', error);
      setExportStatus({
        type: 'error',
        message: 'Backup konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Shield className="h-12 w-12 text-blue-500" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Datensicherung erstellen
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Erstellen Sie vor dem Deployment ein Backup Ihrer Blutdruckdaten. 
            Dies stellt sicher, dass Ihre Daten auch bei unerwarteten Problemen während der Migration sicher sind.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Wichtig:</strong> Speichern Sie die Backup-Datei an einem sicheren Ort. 
                Sie können diese Datei später verwenden, um Ihre Daten wiederherzustellen.
              </div>
            </div>
          </div>

          {exportStatus && (
            <div className={`mb-4 p-3 rounded-lg ${
              exportStatus.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start">
                {exportStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <div className={`text-sm ${
                  exportStatus.type === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {exportStatus.message}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`
              inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200 transform active:scale-95
              ${isExporting 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
              }
            `}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Backup wird erstellt...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Backup erstellen
              </>
            )}
          </button>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <p>Das Backup enthält:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Alle Blutdruckmessungen</li>
              <li>Kontextfaktoren</li>
              <li>App-Einstellungen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupExport;