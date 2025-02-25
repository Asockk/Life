// hooks/useBloodPressureData.js
import { useState, useCallback, useMemo } from 'react';
import { initialData, prepareDataWithMovingAverages, prepareDataWithAverages, sortDataByDate } from '../utils/dataUtils';
import { getBloodPressureCategory, calculateAverage } from '../utils/bloodPressureUtils';
import { validateBloodPressure, validateForm, formatDateForDisplay } from '../utils/validationUtils';

const useBloodPressureData = () => {
  // State für die Daten
  const [data, setData] = useState(initialData);
  const [viewType, setViewType] = useState('morgen'); // 'morgen' oder 'abend'
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Funktion: Statusnachricht anzeigen
  const showStatusMessage = useCallback((text, type) => {
    setStatusMessage({ text, type });
    
    // Nach 3 Sekunden ausblenden
    setTimeout(() => {
      setStatusMessage({ text: '', type: '' });
    }, 3000);
  }, []);

  // Prozessierte Daten mit berechneten Werten
  const dataWithMA = useMemo(() => 
    prepareDataWithMovingAverages(data), [data]
  );

  // Daten mit Durchschnittslinien
  const { data: dataWithAvgLines, averages } = useMemo(() => 
    prepareDataWithAverages(data), [data]
  );

  // Aktuelle Durchschnittswerte basierend auf viewType
  const avgValues = useMemo(() => ({
    sys: viewType === 'morgen' ? averages.morgen.sys : averages.abend.sys,
    dia: viewType === 'morgen' ? averages.morgen.dia : averages.abend.dia,
    puls: viewType === 'morgen' ? averages.morgen.puls : averages.abend.puls
  }), [viewType, averages]);

  // Blutdruckkategorie basierend auf Durchschnittswerten
  const bpCategory = useMemo(() => 
    getBloodPressureCategory(avgValues.sys, avgValues.dia), 
    [avgValues.sys, avgValues.dia]
  );

  // Min/Max-Werte für die Anzeige
  const minMaxValues = useMemo(() => {
    const sysField = viewType === 'morgen' ? 'morgenSys' : 'abendSys';
    const diaField = viewType === 'morgen' ? 'morgenDia' : 'abendDia';
    
    const sysValues = data.filter(d => d[sysField] > 0).map(d => d[sysField]);
    const diaValues = data.filter(d => d[diaField] > 0).map(d => d[diaField]);
    
    return {
      sysMin: Math.min(...sysValues),
      sysMax: Math.max(...sysValues),
      diaMin: Math.min(...diaValues),
      diaMax: Math.max(...diaValues),
    };
  }, [data, viewType]);

  // Funktionen zum Hinzufügen, Bearbeiten und Löschen von Einträgen
  const addEntry = useCallback((formData) => {
    // Prüfe, ob das Formular gültig ist
    const errors = validateForm(formData, validateBloodPressure);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
    
    // Datum formatieren für die Anzeige
    const displayDate = formatDateForDisplay(formData.datum);
    
    // Numerische Werte konvertieren
    const numericValues = {};
    ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls'].forEach(field => {
      numericValues[field] = formData[field] ? Number(formData[field]) : 0;
    });
    
    // Neuen Eintrag erstellen
    const newEntry = {
      id: Date.now(),
      tag: formData.tag,
      datum: displayDate,
      ...numericValues
    };
    
    // Zu den Daten hinzufügen
    setData(prevData => [...prevData, newEntry]);
    showStatusMessage("Neuer Eintrag hinzugefügt", "success");
    
    return { success: true };
  }, [showStatusMessage]);

  const updateEntry = useCallback((id, formData) => {
    // Prüfe, ob das Formular gültig ist
    const errors = validateForm(formData, validateBloodPressure);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
    
    // Datum formatieren für die Anzeige
    const displayDate = formatDateForDisplay(formData.datum);
    
    // Numerische Werte konvertieren
    const numericValues = {};
    ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls'].forEach(field => {
      numericValues[field] = formData[field] ? Number(formData[field]) : 0;
    });
    
    // Daten aktualisieren
    setData(prevData => prevData.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          tag: formData.tag,
          datum: displayDate,
          ...numericValues
        };
      }
      return entry;
    }));
    
    showStatusMessage("Eintrag aktualisiert", "success");
    return { success: true };
  }, [showStatusMessage]);

  const deleteEntry = useCallback((id) => {
    const confirmed = window.confirm("Möchten Sie diesen Eintrag wirklich löschen?");
    if (confirmed) {
      setData(prevData => prevData.filter(item => item.id !== id));
      showStatusMessage("Eintrag erfolgreich gelöscht", "success");
    }
  }, [showStatusMessage]);

  // Funktion zum Importieren von Daten
  const importData = useCallback((importedData) => {
    if (!importedData || importedData.length === 0) {
      return false;
    }
    
    // Bestehende Daten mit den neuen Daten zusammenführen
    const existingData = [...data];
    
    // Für jedes importierte Element prüfen, ob es bereits existiert
    importedData.forEach(newEntry => {
      const existingIndex = existingData.findIndex(item => 
        item.datum === newEntry.datum && item.tag === newEntry.tag
      );
      
      if (existingIndex !== -1) {
        // Eintrag mit diesem Datum ersetzen
        existingData[existingIndex] = newEntry;
      } else {
        // Neuen Eintrag hinzufügen
        existingData.push(newEntry);
      }
    });
    
    // Nach Datum sortieren und Daten aktualisieren
    const sortedData = sortDataByDate(existingData);
    setData(sortedData);
    
    // Status-Nachricht anzeigen
    showStatusMessage(`${importedData.length} Einträge erfolgreich importiert`, 'success');
    
    return true;
  }, [data, showStatusMessage]);

  return {
    // Daten
    data,
    dataWithMA,
    dataWithAvgLines,
    viewType,
    setViewType,
    
    // Berechnete Werte
    avgValues,
    bpCategory,
    minMaxValues,
    
    // Status
    statusMessage,
    showStatusMessage,
    
    // CRUD Operationen
    addEntry,
    updateEntry,
    deleteEntry,
    importData
  };
};

export default useBloodPressureData;