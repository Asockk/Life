// Modern Entry Form with Advanced UX
import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Activity, Clock, Calendar, Check, X, 
  Sunrise, Moon, Coffee, Pill, Dumbbell, 
  Cigarette, Wine, Zap, AlertCircle
} from 'lucide-react';

const ModernEntryForm = ({ 
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
    morgenSys: entry?.morgenSys || '',
    morgenDia: entry?.morgenDia || '',
    morgenPuls: entry?.morgenPuls || '',
    abendSys: entry?.abendSys || '',
    abendDia: entry?.abendDia || '',
    abendPuls: entry?.abendPuls || ''
  });

  // Context state with visual icons
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

  // Refs for smooth scrolling
  const morgenRef = useRef(null);
  const abendRef = useRef(null);

  // Auto-fill today's date
  useEffect(() => {
    if (!isEdit && !formData.datum) {
      const today = new Date();
      const germanDate = today.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      setFormData(prev => ({ ...prev, datum: germanDate }));
    }
  }, [isEdit, formData.datum]);

  // Parse German date to ISO format for date input
  const parseGermanDateToISO = (germanDate) => {
    if (!germanDate) return '';
    
    const months = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    // Try to parse "15. Januar 2024" format
    const match = germanDate.match(/(\d+)\.?\s*(\w+)\s*(\d{4})?/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[2];
      const year = match[3] || new Date().getFullYear();
      const month = months[monthName];
      
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  // Convert ISO date to German format
  const formatISOToGerman = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Shake animation
      document.getElementById('entry-form').classList.add('animate-shake');
      setTimeout(() => {
        document.getElementById('entry-form').classList.remove('animate-shake');
      }, 500);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate processing
    setTimeout(() => {
      const result = onSubmit(entry?.id, formData, context);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onCancel();
        }, 1500);
      }
      
      setIsSubmitting(false);
    }, 500);
  };

  // Input component with floating label
  const FloatingInput = ({ label, value, onChange, error, icon: Icon, type = 'number', ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);
    const hasValue = value !== '';

    return (
      <div className="relative">
        <div className={`
          relative rounded-xl border-2 transition-all duration-300
          ${error ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
          ${isFocused ? 'shadow-lg shadow-blue-500/20' : ''}
        `}>
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full px-4 py-3 bg-transparent outline-none
              ${hasValue || isFocused ? 'pt-6' : ''}
              text-gray-800 dark:text-gray-200
            `}
            inputMode={type === 'number' ? 'numeric' : 'text'}
            pattern={type === 'number' ? '[0-9]*' : undefined}
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
  };

  // Context toggle button
  const ContextToggle = ({ icon: Icon, label, active, onClick, color = 'blue' }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 tap-scale
          ${active 
            ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20` 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
        `}
      >
        <Icon size={20} className={`
          mx-auto mb-0.5 sm:mb-1 transition-colors duration-200
          ${active ? `text-${color}-600 dark:text-${color}-400` : 'text-gray-500 dark:text-gray-400'}
        `} />
        <span className={`
          text-xs font-medium block
          ${active ? `text-${color}-700 dark:text-${color}-300` : 'text-gray-600 dark:text-gray-400'}
        `}>
          {label}
        </span>
        {active && (
          <div className="absolute top-1 right-1">
            <Check size={16} className={`text-${color}-600 dark:text-${color}-400`} />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          id="entry-form"
          className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-card rounded-t-xl p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold gradient-text">
                {isEdit ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h2>
              <button
                onClick={onCancel}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date Input - Native Date Picker */}
            <div className="relative">
              <div className={`
                relative rounded-xl border-2 transition-all duration-300
                ${errors.datum ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 focus-within:border-blue-500'}
                focus-within:shadow-lg focus-within:shadow-blue-500/20
              `}>
                <input
                  type="date"
                  value={parseGermanDateToISO(formData.datum)}
                  onChange={(e) => {
                    const germanDate = formatISOToGerman(e.target.value);
                    setFormData({...formData, datum: germanDate});
                  }}
                  className="w-full px-4 py-3 pt-6 bg-transparent outline-none text-gray-800 dark:text-gray-200"
                  max={new Date().toISOString().split('T')[0]}
                />
                <label className="absolute left-4 top-1 text-xs text-gray-500 dark:text-gray-400">
                  Datum
                </label>
                <Calendar size={20} className="absolute right-3 top-3.5 text-gray-400" />
              </div>
              {errors.datum && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.datum}
                </p>
              )}
            </div>

            {/* Time Slot Selector */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTimeSlot('morgen')}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300
                  ${activeTimeSlot === 'morgen' 
                    ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400'}
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
                    ? 'bg-white dark:bg-gray-700 shadow-md text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400'}
                `}
              >
                <Moon size={20} className="inline mr-2" />
                Abend
              </button>
            </div>

            {/* Morning Values */}
            <div 
              ref={morgenRef}
              className={`space-y-4 transition-all duration-500 ${
                activeTimeSlot === 'morgen' ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sunrise size={20} className="text-orange-500" />
                Morgenwerte
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <FloatingInput
                  label="Systolisch"
                  value={formData.morgenSys}
                  onChange={(e) => setFormData(prev => ({...prev, morgenSys: e.target.value}))}
                  error={errors.morgenSys}
                  min="50"
                  max="250"
                />
                <FloatingInput
                  label="Diastolisch"
                  value={formData.morgenDia}
                  onChange={(e) => setFormData(prev => ({...prev, morgenDia: e.target.value}))}
                  error={errors.morgenDia}
                  min="30"
                  max="150"
                />
                <FloatingInput
                  label="Puls"
                  value={formData.morgenPuls}
                  onChange={(e) => setFormData(prev => ({...prev, morgenPuls: e.target.value}))}
                  icon={Activity}
                  min="30"
                  max="200"
                />
              </div>
            </div>

            {/* Evening Values */}
            <div 
              ref={abendRef}
              className={`space-y-4 transition-all duration-500 ${
                activeTimeSlot === 'abend' ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Moon size={20} className="text-purple-500" />
                Abendwerte
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <FloatingInput
                  label="Systolisch"
                  value={formData.abendSys}
                  onChange={(e) => setFormData(prev => ({...prev, abendSys: e.target.value}))}
                  error={errors.abendSys}
                  min="50"
                  max="250"
                />
                <FloatingInput
                  label="Diastolisch"
                  value={formData.abendDia}
                  onChange={(e) => setFormData(prev => ({...prev, abendDia: e.target.value}))}
                  error={errors.abendDia}
                  min="30"
                  max="150"
                />
                <FloatingInput
                  label="Puls"
                  value={formData.abendPuls}
                  onChange={(e) => setFormData(prev => ({...prev, abendPuls: e.target.value}))}
                  icon={Activity}
                  min="30"
                  max="200"
                />
              </div>
            </div>

            {/* Context Factors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Kontextfaktoren
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <ContextToggle
                  icon={Pill}
                  label="Medizin"
                  active={context.medication}
                  onClick={() => setContext({...context, medication: !context.medication})}
                  color="blue"
                />
                <ContextToggle
                  icon={Dumbbell}
                  label="Sport"
                  active={context.exercise}
                  onClick={() => setContext({...context, exercise: !context.exercise})}
                  color="green"
                />
                <ContextToggle
                  icon={Coffee}
                  label="Koffein"
                  active={context.caffeine}
                  onClick={() => setContext({...context, caffeine: !context.caffeine})}
                  color="yellow"
                />
                <ContextToggle
                  icon={Wine}
                  label="Alkohol"
                  active={context.alcohol}
                  onClick={() => setContext({...context, alcohol: !context.alcohol})}
                  color="red"
                />
              </div>

              {/* Stress and Sleep Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Stress Level: {context.stress}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={context.stress}
                    onChange={(e) => setContext({...context, stress: parseInt(e.target.value)})}
                    className="w-full accent-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Schlafqualität: {context.sleep}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={context.sleep}
                    onChange={(e) => setContext({...context, sleep: parseInt(e.target.value)})}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Notizen
                </label>
                <textarea
                  value={context.notes}
                  onChange={(e) => setContext({...context, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 
                           bg-transparent outline-none focus:border-blue-500 transition-colors
                           text-gray-800 dark:text-gray-200"
                  placeholder="Zusätzliche Beobachtungen..."
                />
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
                         liquid-button"
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

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ModernEntryForm;