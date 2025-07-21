// components/Forms/EntryFormWithContext.js
import React, { useState, useEffect, Fragment } from 'react';
import { X, Check, Calendar, Heart, Moon, Activity, Utensils, Coffee, Wine, ChevronDown, ChevronUp } from 'lucide-react';
import { validateBloodPressure, validateForm, getWeekdayFromDate } from '../../utils/validationUtils';
import './EntryFormWithContext.css';

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
    const validation = validateForm(formData);
    
    // Convert validation errors array to object format for form errors
    const errorObj = {};
    if (!validation.isValid) {
      validation.errors.forEach((error, index) => {
        errorObj[`error_${index}`] = error;
      });
    }
    
    // Also validate blood pressure specific errors
    const bpErrors = validateBloodPressure(formData);
    Object.assign(errorObj, bpErrors);
    
    setFormErrors(errorObj);
    
    // If no errors, submit the form (with context factors)
    if (validation.isValid && Object.keys(bpErrors).length === 0) {
      // Send context factors as they are - empty ones have already been removed
      // by the toggle behavior of updateFactor
      const result = onSubmit(
        isEdit ? entry.id : undefined, 
        formData, 
        Object.keys(contextFactors).length > 0 ? contextFactors : null
      );
      
      if (result && !result.success && !result.duplicate) {
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
    <div className="ios-modal-backdrop">
      <div className="ios-modal ios-modal-fullscreen">
        {/* iOS Style Navigation Bar */}
        <div className="ios-modal-header">
          <button 
            onClick={onCancel}
            className="ios-modal-action text-[var(--ios-blue)]"
          >
            Abbrechen
          </button>
          <h2 className="ios-modal-title">
            {isEdit ? 'Eintrag bearbeiten' : 'Neue Messung'}
          </h2>
          <button
            onClick={handleSubmit}
            className="ios-modal-action text-[var(--ios-blue)] font-semibold"
          >
            {isEdit ? 'Fertig' : 'Sichern'}
          </button>
        </div>
        
        {/* iOS Style Segmented Control */}
        <div className="px-4 py-3">
          <div className="ios-segmented-control">
            <button
              type="button"
              className={`ios-segmented-item ${activeSection === 'measurements' ? 'active' : ''}`}
              onClick={() => setActiveSection('measurements')}
            >
              Messungen
            </button>
            <button
              type="button"
              className={`ios-segmented-item ${activeSection === 'context' ? 'active' : ''}`}
              onClick={() => setActiveSection('context')}
            >
              Faktoren
            </button>
          </div>
        </div>
        
        {/* Form content - scrollable */}
        <div className="flex-1 overflow-y-auto bg-[var(--ios-bg-secondary)]">
          {activeSection === 'measurements' ? (
            /* MEASUREMENTS SECTION */
            <form className="p-4" onSubmit={handleSubmit}>
              {/* Display general form errors */}
              {Object.keys(formErrors).filter(key => key.startsWith('error_')).length > 0 && (
                <div className="ios-card mb-4" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)' }}>
                  {Object.entries(formErrors)
                    .filter(([key]) => key.startsWith('error_'))
                    .map(([key, error]) => (
                      <p key={key} className="text-sm" style={{ color: 'var(--ios-red)' }}>{error}</p>
                    ))
                  }
                </div>
              )}
              {/* Date and Day Selection */}
              <div className="ios-card mb-4">
                <div className="ios-list-item">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Calendar size={20} className="mr-3" style={{ color: 'var(--ios-blue)' }} />
                      <span>Datum</span>
                    </div>
                    <input 
                      type="date"
                      name="datum"
                      value={formData.datum}
                      onChange={handleInputChange}
                      className="ios-input-inline"
                      required
                    />
                  </div>
                </div>
                <div className="ios-list-divider" />
                <div className="ios-list-item">
                  <div className="flex items-center justify-between w-full">
                    <span>Wochentag</span>
                    <select 
                      name="tag"
                      value={formData.tag}
                      onChange={handleInputChange}
                      className="ios-select-inline"
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
                  </div>
                </div>
              </div>

              {/* Morgen-Messung - iOS Card style */}
              <div className="ios-card mb-4">
                <h4 className="text-center font-semibold mb-4" style={{ color: 'var(--ios-text-primary)' }}>
                  Morgen-Messung
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Systolic */}
                  <div>
                    <label className="block text-center text-xs mb-1" style={{ color: 'var(--ios-text-secondary)' }}>
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
                      className={`ios-input-number ${formErrors.morgenSys ? 'error' : ''}`}
                      placeholder="120"
                    />
                    {formErrors.morgenSys && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.morgenSys}</p>
                    )}
                  </div>
                  
                  {/* Diastolic */}
                  <div>
                    <label className="block text-center text-xs mb-1" style={{ color: 'var(--ios-text-secondary)' }}>
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
                      className={`ios-input-number ${formErrors.morgenDia ? 'error' : ''}`}
                      placeholder="80"
                    />
                    {formErrors.morgenDia && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.morgenDia}</p>
                    )}
                  </div>
                  
                  {/* Pulse */}
                  <div>
                    <label className="block text-center text-xs mb-1" style={{ color: 'var(--ios-text-secondary)' }}>
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
                      className={`ios-input-number ${formErrors.morgenPuls ? 'error' : ''}`}
                      placeholder="70"
                    />
                    {formErrors.morgenPuls && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.morgenPuls}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Abend-Messung - iOS Card style */}
              <div className="ios-card mb-4">
                <h4 className="text-center font-semibold mb-4" style={{ color: 'var(--ios-text-primary)' }}>
                  Abend-Messung
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Systolic */}
                  <div>
                    <label className="block text-center text-xs mb-1" style={{ color: 'var(--ios-text-secondary)' }}>
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
                      className={`ios-input-number ${formErrors.abendSys ? 'error' : ''}`}
                      placeholder="120"
                    />
                    {formErrors.abendSys && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.abendSys}</p>
                    )}
                  </div>
                  
                  {/* Diastolic */}
                  <div>
                    <label className="block text-center text-xs mb-1" style={{ color: 'var(--ios-text-secondary)' }}>
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
                      className={`ios-input-number ${formErrors.abendDia ? 'error' : ''}`}
                      placeholder="80"
                    />
                    {formErrors.abendDia && (
                      <p className="mt-1 text-xs text-center text-red-500">{formErrors.abendDia}</p>
                    )}
                  </div>
                  
                  {/* Pulse */}
                  <div>
                    <label className="block text-center text-xs mb-1" style={{ color: 'var(--ios-text-secondary)' }}>
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
                      className={`ios-input-number ${formErrors.abendPuls ? 'error' : ''}`}
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
            /* CONTEXT FACTORS SECTION - Minimalist slider approach */
            <div className="p-3 h-full flex flex-col">
              {/* Compact list with sliders */}
              <div className="flex-1 space-y-3">
                {factorComponents.map((factor) => {
                  const factorColors = {
                    stress: 'var(--ios-red)',
                    sleep: 'var(--ios-purple)', 
                    activity: 'var(--ios-green)',
                    salt: 'var(--ios-orange)',
                    caffeine: 'var(--ios-pink)',
                    alcohol: 'var(--ios-blue)'
                  };
                  
                  const currentValue = contextFactors[factor.name];
                  const hasValue = currentValue !== undefined;
                  
                  return (
                    <div key={factor.name} className={`ios-factor-row ${hasValue ? 'active' : ''}`}>
                      {/* Icon and Label Row */}
                      <div className="flex items-center mb-2">
                        <span className="mr-2" style={{ color: hasValue ? factorColors[factor.name] : 'var(--ios-text-tertiary)' }}>
                          {React.cloneElement(factor.icon, { size: 18 })}
                        </span>
                        <span className="text-sm font-medium flex-1" style={{ 
                          color: hasValue ? 'var(--ios-text-primary)' : 'var(--ios-text-secondary)' 
                        }}>
                          {factor.label}
                        </span>
                        {hasValue && (
                          <span className="text-xs font-medium" style={{ color: factorColors[factor.name] }}>
                            {factor.options[currentValue]?.label}
                          </span>
                        )}
                      </div>
                      
                      {/* iOS-style slider track */}
                      <div className="ios-factor-slider">
                        <div className="ios-slider-track">
                          {factor.options.map((option, index) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateFactor(factor.name, option.value)}
                              className={`ios-slider-stop ${currentValue === option.value ? 'active' : ''}`}
                              style={{
                                left: `${(index / (factor.options.length - 1)) * 100}%`,
                                backgroundColor: currentValue === option.value ? factorColors[factor.name] : 'var(--ios-separator)'
                              }}
                            >
                              <span className="ios-slider-label">
                                {option.label.charAt(0)}
                              </span>
                            </button>
                          ))}
                          {hasValue && (
                            <div 
                              className="ios-slider-fill" 
                              style={{
                                width: `${(currentValue / (factor.options.length - 1)) * 100}%`,
                                backgroundColor: factorColors[factor.name]
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Ultra minimal summary */}
              {Object.keys(contextFactors).length > 0 && (
                <div className="flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor: 'var(--ios-separator)' }}>
                  <div className="flex items-center gap-2">
                    {Object.keys(contextFactors).map((key, index) => {
                      const factor = factorComponents.find(f => f.name === key);
                      const color = {
                        stress: 'var(--ios-red)',
                        sleep: 'var(--ios-purple)', 
                        activity: 'var(--ios-green)',
                        salt: 'var(--ios-orange)',
                        caffeine: 'var(--ios-pink)',
                        alcohol: 'var(--ios-blue)'
                      }[key];
                      
                      return (
                        <span key={key} style={{ color, fontSize: '10px' }}>
                          {React.cloneElement(factor.icon, { size: 12 })}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setContextFactors({})}
                    className="text-xs" 
                    style={{ color: 'var(--ios-text-tertiary)' }}
                  >
                    Alle löschen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default EntryFormWithContext;