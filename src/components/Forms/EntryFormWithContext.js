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
  onCancel,
  darkMode = false
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

  // State for expanded factor in accordion view
  const [expandedFactor, setExpandedFactor] = useState(null);
  
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
    if (e) e.preventDefault();
    
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

  // Toggle accordion for context factors
  const toggleFactor = (factorName) => {
    setExpandedFactor(expandedFactor === factorName ? null : factorName);
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
  
  // Component list for each factor with correct icons
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-md sm:rounded-xl shadow-xl flex flex-col overflow-hidden ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}
      >
        {/* Form header with close button only */}
        <div className={`sticky top-0 flex justify-end items-center px-4 py-3 z-10 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <button 
            onClick={onCancel}
            className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${
              darkMode ? 'text-gray-300' : 'text-gray-500'
            }`}
            aria-label="Schließen"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Tab navigation */}
        <div className={`flex ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            type="button"
            className={`flex-1 py-4 text-center font-medium ${
              activeSection === 'measurements'
                ? darkMode 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-blue-600 border-b-2 border-blue-500 bg-gray-50'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300 border-b border-gray-700'
                  : 'text-gray-500 hover:text-gray-700 border-b border-gray-200'
            }`}
            onClick={() => setActiveSection('measurements')}
          >
            Messungen
          </button>
          <button
            type="button"
            className={`flex-1 py-4 text-center font-medium ${
              activeSection === 'context'
                ? darkMode 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-blue-600 border-b-2 border-blue-500 bg-gray-50'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300 border-b border-gray-700'
                  : 'text-gray-500 hover:text-gray-700 border-b border-gray-200'
            }`}
            onClick={() => setActiveSection('context')}
          >
            Faktoren
          </button>
        </div>
        
        {/* Form content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === 'measurements' ? (
            /* MEASUREMENTS SECTION */
            <form className="p-4 pt-2" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Datum input - Optimized for mobile */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Datum
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none ${
                      darkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <Calendar size={18} />
                    </div>
                    <input 
                      type="date"
                      name="datum"
                      value={formData.datum}
                      onChange={handleInputChange}
                      className={`w-full p-3 pl-9 rounded-lg text-base ${
                        formErrors.datum 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-700' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-700 text-white'
                            : 'border border-gray-300 bg-white'
                      }`}
                      required
                    />
                  </div>
                  {formErrors.datum && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.datum}</p>
                  )}
                </div>

                {/* Wochentag select - Easier mobile selection */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Wochentag
                  </label>
                  <select 
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg text-base appearance-none ${
                      formErrors.tag 
                        ? darkMode 
                          ? 'border-red-500 bg-gray-700' 
                          : 'border-red-500 bg-white'
                        : darkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border border-gray-300 bg-white'
                    }`}
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
                    <p className="mt-1 text-xs text-red-500">{formErrors.tag}</p>
                  )}
                </div>
              </div>

              {/* Morgen-Messung - Card style for better grouping */}
              <div className={`p-4 mb-4 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-3 text-center ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>Morgen-Messung</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Systolic */}
                  <div>
                    <label className={`block text-center text-xs mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Systolisch
                    </label>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="80"
                      max="220"
                      name="morgenSys"
                      value={formData.morgenSys}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg text-center text-lg font-semibold ${
                        formErrors.morgenSys 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-600' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-600'
                            : 'border border-gray-300 bg-white'
                      }`}
                      placeholder="120"
                    />
                    {formErrors.morgenSys && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.morgenSys}</p>
                    )}
                  </div>
                  
                  {/* Diastolic */}
                  <div>
                    <label className={`block text-center text-xs mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Diastolisch
                    </label>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="40"
                      max="120"
                      name="morgenDia"
                      value={formData.morgenDia}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg text-center text-lg font-semibold ${
                        formErrors.morgenDia 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-600' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-600'
                            : 'border border-gray-300 bg-white'
                      }`}
                      placeholder="80"
                    />
                    {formErrors.morgenDia && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.morgenDia}</p>
                    )}
                  </div>
                  
                  {/* Pulse */}
                  <div>
                    <label className={`block text-center text-xs mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Puls
                    </label>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="40"
                      max="200"
                      name="morgenPuls"
                      value={formData.morgenPuls}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg text-center text-lg font-semibold ${
                        formErrors.morgenPuls 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-600' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-600'
                            : 'border border-gray-300 bg-white'
                      }`}
                      placeholder="70"
                    />
                    {formErrors.morgenPuls && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.morgenPuls}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Abend-Messung - Card style for better grouping */}
              <div className={`p-4 mb-4 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-3 text-center ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>Abend-Messung</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Systolic */}
                  <div>
                    <label className={`block text-center text-xs mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Systolisch
                    </label>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="80"
                      max="220"
                      name="abendSys"
                      value={formData.abendSys}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg text-center text-lg font-semibold ${
                        formErrors.abendSys 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-600' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-600'
                            : 'border border-gray-300 bg-white'
                      }`}
                      placeholder="120"
                    />
                    {formErrors.abendSys && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.abendSys}</p>
                    )}
                  </div>
                  
                  {/* Diastolic */}
                  <div>
                    <label className={`block text-center text-xs mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Diastolisch
                    </label>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="40"
                      max="120"
                      name="abendDia"
                      value={formData.abendDia}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg text-center text-lg font-semibold ${
                        formErrors.abendDia 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-600' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-600'
                            : 'border border-gray-300 bg-white'
                      }`}
                      placeholder="80"
                    />
                    {formErrors.abendDia && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.abendDia}</p>
                    )}
                  </div>
                  
                  {/* Pulse */}
                  <div>
                    <label className={`block text-center text-xs mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Puls
                    </label>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="40"
                      max="200"
                      name="abendPuls"
                      value={formData.abendPuls}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg text-center text-lg font-semibold ${
                        formErrors.abendPuls 
                          ? darkMode 
                            ? 'border-red-500 bg-gray-600' 
                            : 'border-red-500 bg-white'
                          : darkMode
                            ? 'border-gray-600 bg-gray-600'
                            : 'border border-gray-300 bg-white'
                      }`}
                      placeholder="70"
                    />
                    {formErrors.abendPuls && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.abendPuls}</p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* CONTEXT FACTORS SECTION - Compact grid layout */
            <div className="p-3">
              {/* Short instruction text */}
              <p className={`text-xs mb-3 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Diese Faktoren können Ihren Blutdruck beeinflussen:
              </p>
              
              {/* Grid of factor cards - showing all at once */}
              <div className="grid grid-cols-2 gap-2">
                {factorComponents.map((factor) => (
                  <div 
                    key={factor.name} 
                    className={`p-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    } ${
                      contextFactors[factor.name] !== undefined
                        ? darkMode
                          ? 'border-l-4 border-indigo-500'
                          : 'border-l-4 border-indigo-500'
                        : ''
                    }`}
                  >
                    {/* Factor header */}
                    <div className="flex items-center mb-1.5">
                      <span className={`flex-shrink-0 mr-2 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-500'
                      }`}>
                        {factor.icon}
                      </span>
                      <span className={`text-sm font-medium ${
                        contextFactors[factor.name] !== undefined
                          ? darkMode ? 'text-white' : 'text-gray-800'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {factor.label}
                      </span>
                    </div>
                    
                    {/* Options buttons */}
                    <div className="grid grid-cols-3 gap-1">
                      {factor.options.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => updateFactor(factor.name, option.value)}
                          className={`py-2 rounded text-center text-xs truncate ${
                            contextFactors[factor.name] === option.value
                              ? darkMode
                                ? 'bg-indigo-600 text-white font-medium shadow-inner'
                                : 'bg-indigo-500 text-white font-medium shadow-inner'
                              : darkMode
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Selected factors summary */}
              <div className={`mt-3 p-2 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-xs font-medium mb-1">Ausgewählt:</div>
                {Object.keys(contextFactors).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(contextFactors).map(([factor, value]) => {
                      const factorInfo = factorComponents.find(f => f.name === factor);
                      const option = factorInfo?.options.find(o => o.value === value);
                      
                      return (
                        <div 
                          key={factor} 
                          className={`px-2 py-1 text-xs rounded-full flex items-center ${
                            darkMode ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
                          }`}
                          onClick={() => clearFactor(factor)}
                        >
                          {factorInfo?.label}: {option?.label}
                          <X size={14} className="ml-1 cursor-pointer" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Keine Faktoren ausgewählt
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Form footer with actions - fixed at bottom */}
        <div className={`p-3 ${
          darkMode 
            ? 'bg-gray-800'
            : 'bg-white'
        }`}>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className={`w-full py-3 px-4 rounded-lg text-base font-medium flex items-center justify-center ${
                darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Check size={20} className="mr-2" />
              {isEdit ? 'Aktualisieren' : 'Speichern'}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className={`w-full py-3 px-4 rounded-lg text-base font-medium ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryFormWithContext;