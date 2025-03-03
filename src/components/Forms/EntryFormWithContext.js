// components/Forms/EntryFormWithContext.js
import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Heart, Moon, Activity, Utensils, Coffee, Wine, ChevronDown, ChevronUp } from 'lucide-react';
import { validateBloodPressure, validateForm, getWeekdayFromDate } from '../../utils/validationUtils';

// Helper function for date conversion
const parseDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Case 1: Format "Januar 15" or "Januar 15 2024" (Standard format)
  if (dateStr.includes(' ') && !dateStr.includes('.')) {
    const parts = dateStr.split(' ');
    let monthName = parts[0];
    let day = parts[1];
    let year = parts.length > 2 ? parts[2] : new Date().getFullYear();
    
    // If comma in second part (e.g. "Januar 15, 2024")
    if (day.includes(',')) {
      day = day.replace(',', '');
      year = parts[2] || new Date().getFullYear();
    }
    
    // Convert month names to numbers
    const months = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    const month = months[monthName] || '01';
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }
  
  // Case 2: Format "1. Januar" or "1. Januar 2024" (European format)
  if (dateStr.includes('.') && dateStr.includes(' ')) {
    const parts = dateStr.split('. ');
    let day = parts[0];
    
    // Second part could be "Januar 2024" or just "Januar"
    const monthParts = parts[1].split(' ');
    let month = monthParts[0];
    let year = monthParts.length > 1 ? monthParts[1] : new Date().getFullYear();
    
    // Convert month names to numbers
    const months = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    const monthNum = months[month] || '01';
    return `${year}-${monthNum}-${day.padStart(2, '0')}`;
  }
  
  // Case 3: Already in ISO format (YYYY-MM-DD)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // If format is not recognized, return current date
  console.warn('Unknown date format:', dateStr);
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
  // Initial state with today's date or entry data if available
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
  const [activeSection, setActiveSection] = useState('measurements'); // 'measurements' or 'context'
  
  // State for context factors
  const [contextFactors, setContextFactors] = useState(
    // When editing an entry use existing context data
    contextData || 
    // For a new entry start with empty context factors
    {}
  );
  
  // Update weekday when date changes
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
    
    // Validate form
    const errors = validateForm(formData, validateBloodPressure);
    setFormErrors(errors);
    
    // If no errors, submit the form (with context factors)
    if (Object.keys(errors).length === 0) {
      // Send context factors as they are - empty ones have already been removed
      // by the toggle behavior of updateFactor
      const result = onSubmit(
        isEdit ? entry.id : undefined, 
        formData, 
        Object.keys(contextFactors).length > 0 ? contextFactors : null
      );
      
      if (!result.success && !result.duplicate) {
        setFormErrors(result.errors || {});
      }
    }
  };
  
  // Update a factor
  const updateFactor = (factor, value) => {
    // If same value is clicked again, remove the factor (toggle behavior)
    if (contextFactors[factor] === value) {
      setContextFactors(prev => {
        const newFactors = { ...prev };
        delete newFactors[factor];
        return newFactors;
      });
    } else {
      // Otherwise set the new value
      setContextFactors(prev => ({
        ...prev,
        [factor]: value
      }));
    }
  };
  
  // Clear a factor
  const clearFactor = (factor) => {
    setContextFactors(prev => {
      const newFactors = { ...prev };
      delete newFactors[factor];
      return newFactors;
    });
  };
  
  // Component list for each factor with correct icons, name and shortened options (only 3 per factor)
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
  
  // Render measurements form
  const renderMeasurementsForm = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wochentag
          </label>
          <select 
            name="tag"
            value={formData.tag}
            onChange={handleInputChange}
            className={`w-full p-3 border ${formErrors.tag ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              <Calendar size={18} className="text-gray-500" />
            </div>
            <input 
              type="date"
              name="datum"
              value={formData.datum}
              onChange={handleInputChange}
              className={`w-full p-3 pl-10 border ${formErrors.datum ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="80"
              max="220"
              name="morgenSys"
              value={formData.morgenSys}
              onChange={handleInputChange}
              className={`w-full p-3 border ${formErrors.morgenSys ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="40"
              max="120"
              name="morgenDia"
              value={formData.morgenDia}
              onChange={handleInputChange}
              className={`w-full p-3 border ${formErrors.morgenDia ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="40"
              max="200"
              name="morgenPuls"
              value={formData.morgenPuls}
              onChange={handleInputChange}
              className={`w-full p-3 border ${formErrors.morgenPuls ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="80"
              max="220"
              name="abendSys"
              value={formData.abendSys}
              onChange={handleInputChange}
              className={`w-full p-3 border ${formErrors.abendSys ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="40"
              max="120"
              name="abendDia"
              value={formData.abendDia}
              onChange={handleInputChange}
              className={`w-full p-3 border ${formErrors.abendDia ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="40"
              max="200"
              name="abendPuls"
              value={formData.abendPuls}
              onChange={handleInputChange}
              className={`w-full p-3 border ${formErrors.abendPuls ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base`}
              placeholder="z.B. 70"
            />
            {formErrors.abendPuls && (
              <p className="text-red-500 text-xs mt-1">{formErrors.abendPuls}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
  
  // Render context factors form
  const renderContextFactorsForm = () => (
    <div className="pt-2">
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Diese Faktoren können Ihren Blutdruck beeinflussen (Tippen Sie auf eine Option, um sie auszuwählen; erneutes Tippen hebt die Auswahl auf):
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {factorComponents.map((factor) => (
          <div 
            key={factor.name} 
            className="bg-gray-50 p-3 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-indigo-500 mr-2 flex-shrink-0">{factor.icon}</span>
                <span className="font-medium">{factor.label}</span>
              </div>
              {contextFactors[factor.name] !== undefined && (
                <button 
                  type="button"
                  onClick={() => clearFactor(factor.name)}
                  className="text-xs text-gray-400 hover:text-red-500 p-1"
                  title="Auswahl zurücksetzen"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {factor.options.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => updateFactor(factor.name, option.value)}
                  className={`flex-1 py-2 px-1 rounded-md text-sm ${
                    contextFactors[factor.name] === option.value
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Selection status display - mobile optimized */}
            <div className="mt-2 text-sm text-center">
              {contextFactors[factor.name] !== undefined 
                ? <span className="text-green-600">✓ {factor.options.find(o => o.value === contextFactors[factor.name])?.label}</span>
                : <span className="text-gray-400">Nicht ausgewählt</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-md sm:rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Form header with title and close button */}
        <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white z-10">
          <h3 className="text-lg font-medium">
            {isEdit ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 p-1"
            aria-label="Schließen"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeSection === 'measurements'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveSection('measurements')}
          >
            Messungen
          </button>
          <button
            type="button"
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeSection === 'context'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveSection('context')}
          >
            Kontextfaktoren
          </button>
        </div>
        
        {/* Form content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit}>
            {/* Different content based on active section */}
            {activeSection === 'measurements' ? renderMeasurementsForm() : renderContextFactorsForm()}
          </form>
        </div>
        
        {/* Form footer with actions - fixed at bottom */}
        <div className="sticky bottom-0 border-t border-gray-200 p-4 bg-white flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 flex items-center"
          >
            <Check size={18} className="mr-2" />
            {isEdit ? 'Aktualisieren' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryFormWithContext;