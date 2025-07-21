// Fixed Modern Entry Form with proper component structure
import React, { useState, useEffect, memo } from 'react';
import { 
  Activity, Check, X, 
  Sunrise, Moon, Coffee, Pill, Dumbbell, 
  Wine, AlertCircle
} from 'lucide-react';

// FloatingInput component defined outside to prevent re-creation
const FloatingInput = memo(({ 
  label, 
  value, 
  onChange, 
  error, 
  icon: Icon, 
  type = 'number',
  name,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined && value !== null;

  return (
    <div className="relative">
      <div className={`
        relative rounded-xl border-2 transition-all duration-300
        ${error ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
        ${isFocused ? 'shadow-lg shadow-blue-500/20' : ''}
      `}>
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-3 bg-transparent outline-none
            ${hasValue || isFocused ? 'pt-6' : ''}
            text-gray-800 dark:text-gray-200
          `}
          inputMode={type === 'number' ? 'numeric' : 'text'}
          {...props}
        />
        <label className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${hasValue || isFocused 
            ? 'top-1 text-xs text-gray-500 dark:text-gray-400' 
            : 'top-3.5 text-gray-500 dark:text-gray-400'}
        `}>
          {label}
        </label>
        {Icon && (
          <Icon size={20} className={`
            absolute right-3 top-3.5 transition-colors duration-200
            ${isFocused ? 'text-blue-500' : 'text-gray-400'}
          `} />
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
});

// Context toggle button
const ContextToggle = memo(({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 tap-scale
        ${active 
          ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20` 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
      `}
    >
      <Icon size={20} className={`
        mx-auto mb-0.5 sm:mb-1 transition-colors duration-200
        ${active ? `text-blue-600 dark:text-blue-400` : 'text-gray-500 dark:text-gray-400'}
      `} />
      <span className={`
        text-xs font-medium block
        ${active ? `text-blue-700 dark:text-blue-300` : 'text-gray-600 dark:text-gray-400'}
      `}>
        {label}
      </span>
      {active && (
        <div className="absolute top-1 right-1">
          <Check size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
      )}
    </button>
  );
});

const FixedModernEntryForm = ({ 
  isEdit = false, 
  entry = null, 
  contextData = {},
  onSubmit, 
  onCancel,
  darkMode = false,
  previousContext = {}
}) => {
  // Form state
  const [formData, setFormData] = useState({
    datum: entry?.datum || '',
    tag: entry?.tag || '',
    wochentag: entry?.wochentag || entry?.tag || '',
    morgenSys: entry?.morgenSys || '',
    morgenDia: entry?.morgenDia || '',
    morgenPuls: entry?.morgenPuls || '',
    abendSys: entry?.abendSys || '',
    abendDia: entry?.abendDia || '',
    abendPuls: entry?.abendPuls || '',
    notizen: entry?.notizen || ''
  });

  // Context state
  const [context, setContext] = useState({
    medication: contextData?.medication || previousContext?.medication || false,
    exercise: contextData?.exercise || previousContext?.exercise || false,
    stress: contextData?.stress || previousContext?.stress || 0,
    sleep: contextData?.sleep || previousContext?.sleep || 0,
    alcohol: contextData?.alcohol || previousContext?.alcohol || false,
    caffeine: contextData?.caffeine || previousContext?.caffeine || false,
    smoking: contextData?.smoking || previousContext?.smoking || false,
    notes: contextData?.notes || ''
  });

  const [activeTimeSlot, setActiveTimeSlot] = useState('morgen');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Debug log entry data when editing
  useEffect(() => {
    if (isEdit && entry) {
      console.log('[FixedModernEntryForm] Edit mode - entry data:', entry);
      console.log('[FixedModernEntryForm] Edit mode - formData:', formData);
    }
  }, [isEdit, entry, formData]);

  // Auto-fill today's date
  useEffect(() => {
    if (!isEdit && !formData.datum) {
      const today = new Date();
      const germanDate = today.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Get weekday in short format (Mo, Di, Mi, etc.)
      const weekdayMap = {
        'So': 'So', 'Sun': 'So',
        'Mo': 'Mo', 'Mon': 'Mo',
        'Di': 'Di', 'Tue': 'Di',
        'Mi': 'Mi', 'Wed': 'Mi',
        'Do': 'Do', 'Thu': 'Do',
        'Fr': 'Fr', 'Fri': 'Fr',
        'Sa': 'Sa', 'Sat': 'Sa'
      };
      
      const weekdayLong = today.toLocaleDateString('de-DE', { weekday: 'short' });
      const weekdayShort = weekdayMap[weekdayLong.substring(0, 2)] || 'Mo';
      
      setFormData(prev => ({ 
        ...prev, 
        datum: germanDate,
        tag: weekdayShort,
        wochentag: weekdayShort
      }));
    }
  }, [isEdit, formData.datum]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    const isoDate = e.target.value;
    if (isoDate) {
      const date = new Date(isoDate);
      const germanDate = date.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Get weekday in short format (Mo, Di, Mi, etc.)
      const weekdayMap = {
        'So': 'So', 'Sun': 'So',
        'Mo': 'Mo', 'Mon': 'Mo',
        'Di': 'Di', 'Tue': 'Di',
        'Mi': 'Mi', 'Wed': 'Mi',
        'Do': 'Do', 'Thu': 'Do',
        'Fr': 'Fr', 'Fri': 'Fr',
        'Sa': 'Sa', 'Sat': 'Sa'
      };
      
      const weekdayLong = date.toLocaleDateString('de-DE', { weekday: 'short' });
      const weekdayShort = weekdayMap[weekdayLong.substring(0, 2)] || 'Mo';
      
      setFormData(prev => ({ 
        ...prev, 
        datum: germanDate,
        tag: weekdayShort,
        wochentag: weekdayShort
      }));
    }
  };

  // Convert German date to ISO for date input
  const germanDateToISO = (germanDate) => {
    if (!germanDate) return '';
    
    const months = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    // Verbesserte Regex um Jahr immer zu erfassen
    const match = germanDate.match(/(\d+)\.\s*(\w+)\s*(\d{4})?/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[2];
      const year = match[3] || new Date().getFullYear().toString();
      const month = months[monthName];
      
      if (month) {
        const result = `${year}-${month}-${day}`;
        console.log(`[germanDateToISO] Converting: "${germanDate}" => "${result}"`);
        return result;
      }
    }
    
    console.warn(`[germanDateToISO] Failed to parse date: "${germanDate}"`);
    return '';
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.datum) {
      newErrors.datum = 'Datum erforderlich';
    }

    // At least one measurement required
    const hasMorning = formData.morgenSys || formData.morgenDia;
    const hasEvening = formData.abendSys || formData.abendDia;
    
    if (!hasMorning && !hasEvening) {
      newErrors.general = 'Mindestens eine Messung erforderlich';
    }

    // Validate ranges
    const validateBP = (sys, dia, prefix) => {
      if (sys && (sys < 50 || sys > 250)) {
        newErrors[`${prefix}Sys`] = 'Ungültiger Wert';
      }
      if (dia && (dia < 30 || dia > 150)) {
        newErrors[`${prefix}Dia`] = 'Ungültiger Wert';
      }
      if (sys && dia && parseInt(sys) <= parseInt(dia)) {
        newErrors[`${prefix}Sys`] = 'Sys muss > Dia sein';
      }
    };

    if (hasMorning) validateBP(formData.morgenSys, formData.morgenDia, 'morgen');
    if (hasEvening) validateBP(formData.abendSys, formData.abendDia, 'abend');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[FixedModernEntryForm] Submit clicked');
    console.log('[FixedModernEntryForm] Form data:', formData);
    
    // Ensure we have tag/wochentag
    const weekdayMap = {
      'So': 'So', 'Sun': 'So',
      'Mo': 'Mo', 'Mon': 'Mo',
      'Di': 'Di', 'Tue': 'Di',
      'Mi': 'Mi', 'Wed': 'Mi',
      'Do': 'Do', 'Thu': 'Do',
      'Fr': 'Fr', 'Fri': 'Fr',
      'Sa': 'Sa', 'Sat': 'Sa'
    };
    
    const fallbackWeekday = new Date().toLocaleDateString('de-DE', { weekday: 'short' });
    const fallbackShort = weekdayMap[fallbackWeekday.substring(0, 2)] || 'Mo';
    
    // Ensure datum is in the correct format
    let finalDatum = formData.datum;
    if (!finalDatum) {
      // Use today's date in German format if no date is set
      const today = new Date();
      finalDatum = today.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    const finalFormData = {
      ...formData,
      datum: finalDatum,
      tag: formData.tag || formData.wochentag || fallbackShort,
      wochentag: formData.wochentag || formData.tag || fallbackShort,
      // Konvertiere Strings zu Zahlen für Blutdruckwerte
      morgenSys: formData.morgenSys ? Number(formData.morgenSys) : null,
      morgenDia: formData.morgenDia ? Number(formData.morgenDia) : null,
      morgenPuls: formData.morgenPuls ? Number(formData.morgenPuls) : null,
      abendSys: formData.abendSys ? Number(formData.abendSys) : null,
      abendDia: formData.abendDia ? Number(formData.abendDia) : null,
      abendPuls: formData.abendPuls ? Number(formData.abendPuls) : null
    };
    console.log('[FixedModernEntryForm] Final form data with tag:', finalFormData);
    console.log('[FixedModernEntryForm] Context data:', context);
    console.log('[FixedModernEntryForm] Date value:', formData.datum);
    console.log('[FixedModernEntryForm] Weekday value:', formData.tag || formData.wochentag);
    
    if (!validateForm()) {
      console.log('[FixedModernEntryForm] Validation failed');
      console.log('[FixedModernEntryForm] Form errors:', errors);
      return;
    }

    setIsSubmitting(true);
    console.log('[FixedModernEntryForm] Calling onSubmit...');
    
    try {
      const result = onSubmit(entry?.id, finalFormData, context);
      console.log('[FixedModernEntryForm] onSubmit result:', result);
      
      // Handle both synchronous and asynchronous results
      if (result && typeof result.then === 'function') {
        // Handle Promise
        result.then(res => {
          console.log('[FixedModernEntryForm] Async result:', res);
          if (res && res.success) {
            setShowSuccess(true);
            setTimeout(() => {
              onCancel();
            }, 1500);
          } else {
            console.error('[FixedModernEntryForm] Async submit failed:', res);
            alert('Speichern fehlgeschlagen: ' + (res?.message || res?.error || 'Unbekannter Fehler'));
          }
          setIsSubmitting(false);
        }).catch(error => {
          console.error('[FixedModernEntryForm] Async submit error:', error);
          alert('Fehler beim Speichern: ' + error.message);
          setIsSubmitting(false);
        });
        return; // Exit early for async
      }
      
      // Handle synchronous result
      if (result && result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onCancel();
        }, 1500);
      } else {
        console.error('[FixedModernEntryForm] Submit failed:', result);
        alert('Speichern fehlgeschlagen: ' + (result?.message || result?.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('[FixedModernEntryForm] Submit error:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
          darkMode 
            ? 'bg-gray-900 text-gray-100' 
            : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`sticky top-0 z-10 rounded-t-xl p-6 border-b ${
            darkMode 
              ? 'bg-gray-800/90 backdrop-blur-md border-gray-700' 
              : 'bg-white/90 backdrop-blur-md border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {isEdit ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h2>
              <button
                onClick={onCancel}
                className={`p-2 rounded-full transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                type="button"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date Input */}
            <div className="relative">
              <div className={`
                relative rounded-xl border-2 transition-all duration-300
                ${errors.datum ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 focus-within:border-blue-500'}
                focus-within:shadow-lg focus-within:shadow-blue-500/20
              `}>
                <input
                  type="date"
                  value={germanDateToISO(formData.datum)}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 pt-6 bg-transparent outline-none text-gray-800 dark:text-gray-200"
                  max={new Date().toISOString().split('T')[0]}
                />
                <label className="absolute left-4 top-1 text-xs text-gray-500 dark:text-gray-400">
                  Datum
                </label>
              </div>
              {errors.datum && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.datum}
                </p>
              )}
            </div>

            {/* Time Slot Selector */}
            <div className={`flex gap-2 p-1 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTimeSlot('morgen')}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300
                  ${activeTimeSlot === 'morgen' 
                    ? darkMode 
                      ? 'bg-gray-700 shadow-md text-blue-400' 
                      : 'bg-white shadow-md text-blue-600'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                <Sunrise size={20} className="inline mr-2" />
                Morgen
              </button>
              <button
                type="button"
                onClick={() => setActiveTimeSlot('abend')}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300
                  ${activeTimeSlot === 'abend' 
                    ? darkMode
                      ? 'bg-gray-700 shadow-md text-purple-400'
                      : 'bg-white shadow-md text-purple-600'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                <Moon size={20} className="inline mr-2" />
                Abend
              </button>
            </div>

            {/* Morning Values */}
            <div className={`space-y-4 transition-all duration-500 ${
              activeTimeSlot === 'morgen' ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sunrise size={20} className="text-orange-500" />
                Morgenwerte
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <FloatingInput
                  label="Systolisch"
                  name="morgenSys"
                  value={formData.morgenSys}
                  onChange={handleInputChange}
                  error={errors.morgenSys}
                  min="50"
                  max="250"
                />
                <FloatingInput
                  label="Diastolisch"
                  name="morgenDia"
                  value={formData.morgenDia}
                  onChange={handleInputChange}
                  error={errors.morgenDia}
                  min="30"
                  max="150"
                />
                <FloatingInput
                  label="Puls"
                  name="morgenPuls"
                  value={formData.morgenPuls}
                  onChange={handleInputChange}
                  icon={Activity}
                  min="30"
                  max="200"
                />
              </div>
            </div>

            {/* Evening Values */}
            <div className={`space-y-4 transition-all duration-500 ${
              activeTimeSlot === 'abend' ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Moon size={20} className="text-purple-500" />
                Abendwerte
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <FloatingInput
                  label="Systolisch"
                  name="abendSys"
                  value={formData.abendSys}
                  onChange={handleInputChange}
                  error={errors.abendSys}
                  min="50"
                  max="250"
                />
                <FloatingInput
                  label="Diastolisch"
                  name="abendDia"
                  value={formData.abendDia}
                  onChange={handleInputChange}
                  error={errors.abendDia}
                  min="30"
                  max="150"
                />
                <FloatingInput
                  label="Puls"
                  name="abendPuls"
                  value={formData.abendPuls}
                  onChange={handleInputChange}
                  icon={Activity}
                  min="30"
                  max="200"
                />
              </div>
            </div>

            {/* Context Factors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Kontext
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <ContextToggle
                  icon={Pill}
                  label="Medizin"
                  active={context.medication}
                  onClick={() => setContext(prev => ({ ...prev, medication: !prev.medication }))}
                />
                <ContextToggle
                  icon={Dumbbell}
                  label="Sport"
                  active={context.exercise}
                  onClick={() => setContext(prev => ({ ...prev, exercise: !prev.exercise }))}
                />
                <ContextToggle
                  icon={Coffee}
                  label="Koffein"
                  active={context.caffeine}
                  onClick={() => setContext(prev => ({ ...prev, caffeine: !prev.caffeine }))}
                />
                <ContextToggle
                  icon={Wine}
                  label="Alkohol"
                  active={context.alcohol}
                  onClick={() => setContext(prev => ({ ...prev, alcohol: !prev.alcohol }))}
                />
              </div>

              {/* Stress and Sleep Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Stress: {context.stress}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={context.stress}
                    onChange={(e) => setContext(prev => ({ ...prev, stress: parseInt(e.target.value) }))}
                    className="w-full accent-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Schlaf: {context.sleep}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={context.sleep}
                    onChange={(e) => setContext(prev => ({ ...prev, sleep: parseInt(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {errors.general}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 
                         font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                         dark:hover:bg-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 
                         text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                ) : (
                  isEdit ? 'Aktualisieren' : 'Speichern'
                )}
              </button>
            </div>
          </form>

          {/* Success Animation */}
          {showSuccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-xl">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 
                              flex items-center justify-center animate-bounce">
                  <Check size={40} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Erfolgreich gespeichert!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedModernEntryForm;