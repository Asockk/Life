// components/Forms/EntryFormWithContext.js
import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Heart, Moon, Activity, Utensils, Coffee, Wine } from 'lucide-react';
import { validateBloodPressure, validateForm, getWeekdayFromDate } from '../../utils/validationUtils';

// Parse-Datum Funktion
const parseDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Fall 1: Format "Januar 15" (Standardformat)
  if (dateStr.includes(' ') && !dateStr.includes('.')) {
    const monthName = dateStr.split(' ')[0];
    const day = dateStr.split(' ')[1];
    
    // Monatsnamen in Zahlen umwandeln
    const months = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    const month = months[monthName] || '01';
    return `2025-${month}-${day.padStart(2, '0')}`;
  }
  
  // Fall 2: Format "1. Januar" (europäisches Format)
  if (dateStr.includes('.') && dateStr.includes(' ')) {
    let day, month;
    
    if (dateStr.startsWith(dateStr.match(/\d+/)[0])) {
      // Format "1. Januar"
      day = dateStr.match(/\d+/)[0];
      month = dateStr.split('. ')[1].trim();
    } else {
      // Andere Varianten
      const parts = dateStr.split(' ');
      month = parts[0];
      day = parts[1].replace('.', '').trim();
    }
    
    // Monatsnamen in Zahlen umwandeln
    const months = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    const month_num = months[month] || '01';
    return `2025-${month_num}-${day.padStart(2, '0')}`;
  }
  
  // Fall 3: Bereits im ISO-Format (YYYY-MM-DD)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Wenn das Format nicht erkannt wird, aktuelles Datum zurückgeben
  console.warn('Unbekanntes Datumsformat:', dateStr);
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const EntryFormWithContext = ({ 
  isEdit = false, 
  entry = null, 
  contextData = null,
  previousContext = null, 
  onSubmit, 
  onCancel 
}) => {
  // Initialer State mit heutigem Datum oder Eintragsdaten, falls vorhanden
  const today = new Date();
  const initialFormData = entry ? {
    tag: entry.tag,
    datum: entry.datum.includes(' ') || entry.datum.includes('.') 
      ? parseDate(entry.datum)
      : entry.datum,
    morgenSys: entry.morgenSys,
    morgenDia: entry.morgenDia,
    morgenPuls: entry.morgenPuls,
    abendSys: entry.abendSys,
    abendDia: entry.abendDia,
    abendPuls: entry.abendPuls
  } : {
    tag: getWeekdayFromDate(today.toISOString().split('T')[0]),
    datum: today.toISOString().split('T')[0], // Format: YYYY-MM-DD
    morgenSys: '',
    morgenDia: '',
    morgenPuls: '',
    abendSys: '',
    abendDia: '',
    abendPuls: ''
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  
  // State für Kontextfaktoren
  const [showContext, setShowContext] = useState(false);
  const [contextFactors, setContextFactors] = useState(contextData || {
    stress: previousContext?.stress !== undefined ? previousContext.stress : 1,
    sleep: previousContext?.sleep !== undefined ? previousContext.sleep : 1,
    activity: previousContext?.activity !== undefined ? previousContext.activity : 1,
    salt: previousContext?.salt !== undefined ? previousContext.salt : 1,
    caffeine: previousContext?.caffeine !== undefined ? previousContext.caffeine : 1,
    alcohol: previousContext?.alcohol !== undefined ? previousContext.alcohol : 0,
  });
  
  // Aktualisiere den Wochentag, wenn sich das Datum ändert
  useEffect(() => {
    if (formData.datum) {
      const weekday = getWeekdayFromDate(formData.datum);
      if (weekday && weekday !== formData.tag) {
        setFormData(prev => ({ ...prev, tag: weekday }));
      }
    }
  }, [formData.datum]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Formular validieren
    const errors = validateForm(formData, validateBloodPressure);
    setFormErrors(errors);
    
    // Wenn keine Fehler, sende das Formular ab (mit Kontextfaktoren)
    if (Object.keys(errors).length === 0) {
      // Nur nicht-leere Kontextfaktoren einfügen
      const contextToSubmit = Object.fromEntries(
        Object.entries(contextFactors).filter(([_, value]) => value !== undefined)
      );
      
      const result = onSubmit(
        isEdit ? entry.id : undefined, 
        formData, 
        Object.keys(contextToSubmit).length > 0 ? contextToSubmit : null
      );
      
      if (!result.success) {
        setFormErrors(result.errors || {});
      }
    }
  };
  
  // Aktualisieren eines Faktors
  const updateFactor = (factor, value) => {
    setContextFactors(prev => ({
      ...prev,
      [factor]: value
    }));
  };
  
  // Komponentenliste für jeden Faktor mit korrekten Icons, Name und verkürzten Optionen (nur 3 pro Faktor)
  const factorComponents = [
    { 
      name: 'stress', 
      icon: <Heart size={20} />, 
      label: 'Stress', 
      options: [
        { value: 0, label: 'Niedrig' },
        { value: 1, label: 'Mittel' },
        { value: 2, label: 'Hoch' }
      ]
    },
    { 
      name: 'sleep', 
      icon: <Moon size={20} />, 
      label: 'Schlafqualität', 
      options: [
        { value: 0, label: 'Schlecht' },
        { value: 1, label: 'Mittel' },
        { value: 2, label: 'Gut' }
      ]
    },
    { 
      name: 'activity', 
      icon: <Activity size={20} />, 
      label: 'Körperliche Aktivität', 
      options: [
        { value: 0, label: 'Niedrig' },
        { value: 1, label: 'Mittel' },
        { value: 2, label: 'Hoch' }
      ]
    },
    { 
      name: 'salt', 
      icon: <Utensils size={20} />, 
      label: 'Salzkonsum', 
      options: [
        { value: 0, label: 'Niedrig' },
        { value: 1, label: 'Mittel' },
        { value: 2, label: 'Hoch' }
      ]
    },
    { 
      name: 'caffeine', 
      icon: <Coffee size={20} />, 
      label: 'Koffein', 
      options: [
        { value: 0, label: 'Niedrig' },
        { value: 1, label: 'Mittel' },
        { value: 2, label: 'Hoch' }
      ]
    },
    { 
      name: 'alcohol', 
      icon: <Wine size={20} />, 
      label: 'Alkohol', 
      options: [
        { value: 0, label: 'Keiner' },
        { value: 1, label: 'Wenig' },
        { value: 2, label: 'Viel' }
      ]
    }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {isEdit ? 'Eintrag bearbeiten' : 'Neuen Eintrag hinzufügen'}
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wochentag
              </label>
              <select 
                name="tag"
                value={formData.tag}
                onChange={handleInputChange}
                className={`w-full p-2 border ${formErrors.tag ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                required
              >
                <option value="">Wählen...</option>
                <option value="Mo">Montag</option>
                <option value="Di">Dienstag</option>
                <option value="Mi">Mittwoch</option>
                <option value="Do">Donnerstag</option>
                <option value="Fr">Freitag</option>
                <option value="Sa">Samstag</option>
                <option value="So">Sonntag</option>
              </select>
              {formErrors.tag && (
                <p className="text-red-500 text-xs mt-1">{formErrors.tag}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-500" />
                </div>
                <input 
                  type="date"
                  name="datum"
                  value={formData.datum}
                  onChange={handleInputChange}
                  className={`w-full p-2 pl-10 border ${formErrors.datum ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  required
                />
                {formErrors.datum && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.datum}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-4 border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Morgen-Messung</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Systolisch
                </label>
                <input 
                  type="number"
                  min="80"
                  max="220"
                  name="morgenSys"
                  value={formData.morgenSys}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.morgenSys ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="z.B. 120"
                />
                {formErrors.morgenSys && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.morgenSys}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Diastolisch
                </label>
                <input 
                  type="number"
                  min="40"
                  max="120"
                  name="morgenDia"
                  value={formData.morgenDia}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.morgenDia ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="z.B. 80"
                />
                {formErrors.morgenDia && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.morgenDia}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Puls
                </label>
                <input 
                  type="number"
                  min="40"
                  max="200"
                  name="morgenPuls"
                  value={formData.morgenPuls}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.morgenPuls ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="z.B. 70"
                />
                {formErrors.morgenPuls && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.morgenPuls}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-4 border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Abend-Messung</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Systolisch
                </label>
                <input 
                  type="number"
                  min="80"
                  max="220"
                  name="abendSys"
                  value={formData.abendSys}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.abendSys ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="z.B. 120"
                />
                {formErrors.abendSys && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.abendSys}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Diastolisch
                </label>
                <input 
                  type="number"
                  min="40"
                  max="120"
                  name="abendDia"
                  value={formData.abendDia}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.abendDia ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="z.B. 80"
                />
                {formErrors.abendDia && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.abendDia}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Puls
                </label>
                <input 
                  type="number"
                  min="40"
                  max="200"
                  name="abendPuls"
                  value={formData.abendPuls}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.abendPuls ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="z.B. 70"
                />
                {formErrors.abendPuls && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.abendPuls}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Kontextfaktoren Toggle-Button */}
          <div className="mb-4 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="w-full flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              <div className="flex items-center">
                <Heart size={18} className="text-indigo-500 mr-2" />
                <span className="font-medium text-gray-700">Kontextfaktoren erfassen</span>
              </div>
              <span className="text-gray-500">{showContext ? '▲' : '▼'}</span>
            </button>
          </div>
          
          {/* Kontextfaktoren-Bereich - vereinfacht auf 3 Optionen pro Faktor */}
          {showContext && (
            <div className="mb-4 bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                Diese Faktoren können Ihren Blutdruck beeinflussen:
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {factorComponents.map((factor) => (
                  <div key={factor.name} className="bg-white p-2 rounded-md shadow-sm">
                    <div className="flex items-center mb-1">
                      <span className="text-indigo-500 mr-2">{factor.icon}</span>
                      <span className="text-sm font-medium">{factor.label}</span>
                    </div>
                    
                    <div className="flex justify-between space-x-2">
                      {factor.options.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => updateFactor(factor.name, option.value)}
                          className={`flex-1 py-2 rounded-md text-xs 
                            ${contextFactors[factor.name] === option.value
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-3"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none flex items-center"
            >
              <Check size={16} className="mr-2" />
              {isEdit ? 'Aktualisieren' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryFormWithContext;