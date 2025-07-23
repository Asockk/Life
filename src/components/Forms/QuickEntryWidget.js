// components/Forms/QuickEntryWidget.js
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, X, Activity, Heart, Clock } from 'lucide-react';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';

const QuickEntryWidget = ({ onSave, lastMeasurement, darkMode, isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [values, setValues] = useState({
    sys: '',
    dia: '',
    pulse: '',
    type: 'morgen'
  });
  const [activeField, setActiveField] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const sysRef = useRef(null);
  const diaRef = useRef(null);
  const pulseRef = useRef(null);

  // Automatisch nächstes Feld fokussieren
  const handleValueChange = (field, value) => {
    // Nur Zahlen erlauben
    if (value && !/^\d+$/.test(value)) return;
    
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Auto-advance to next field
    if (value.length >= 3) {
      if (field === 'sys' && diaRef.current) {
        diaRef.current.focus();
      } else if (field === 'dia' && pulseRef.current) {
        pulseRef.current.focus();
      }
    }
  };

  const handleQuickSave = async () => {
    if (!values.sys || !values.dia) return;
    
    const measurement = {
      [`${values.type}Sys`]: parseInt(values.sys),
      [`${values.type}Dia`]: parseInt(values.dia),
      [`${values.type}Puls`]: values.pulse ? parseInt(values.pulse) : null
    };
    
    const success = await onSave(measurement);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsExpanded(false);
        setValues({ sys: '', dia: '', pulse: '', type: 'morgen' });
      }, 1500);
    }
  };

  const handleNumPadClick = (number) => {
    if (!activeField) return;
    
    const currentValue = values[activeField] || '';
    if (currentValue.length < 3) {
      handleValueChange(activeField, currentValue + number);
    }
  };

  const handleBackspace = () => {
    if (!activeField) return;
    const currentValue = values[activeField] || '';
    handleValueChange(activeField, currentValue.slice(0, -1));
  };

  // Blutdruckkategorie für visuelles Feedback
  const category = values.sys && values.dia 
    ? getBloodPressureCategory(parseInt(values.sys), parseInt(values.dia))
    : null;

  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => sysRef.current?.focus(), 100);
        }}
        className={`
          fixed bottom-24 right-4 z-40
          w-14 h-14 rounded-full shadow-lg
          bg-gradient-to-br from-blue-500 to-purple-500
          flex items-center justify-center
          transform transition-all duration-300
          hover:scale-110 active:scale-95
          ${darkMode ? 'shadow-black/50' : 'shadow-gray-400/50'}
        `}
        style={{ touchAction: 'manipulation' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className={`
      fixed inset-x-0 bottom-0 z-50
      ${darkMode ? 'bg-gray-900' : 'bg-white'}
      rounded-t-2xl shadow-2xl
      transform transition-all duration-300 ease-out
      ${isExpanded ? 'translate-y-0' : 'translate-y-full'}
      pb-safe
      max-h-[70vh] overflow-y-auto
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Schnelleingabe
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setValues(prev => ({ ...prev, type: prev.type === 'morgen' ? 'abend' : 'morgen' }))}
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${values.type === 'morgen' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              }
            `}
          >
            {values.type === 'morgen' ? '🌅 Morgen' : '🌙 Abend'}
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      {/* Value Display */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Systolisch */}
          <div 
            onClick={() => {
              setActiveField('sys');
              sysRef.current?.focus();
            }}
            className={`
              relative rounded-xl p-3 text-center cursor-pointer
              transition-all duration-200 transform
              ${activeField === 'sys' 
                ? 'scale-105 ring-2 ring-blue-500' 
                : 'hover:scale-102'
              }
              ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
            `}
          >
            <Activity size={18} className="mx-auto mb-1 text-blue-500" />
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">SYS</div>
            <input
              ref={sysRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={values.sys}
              onChange={(e) => handleValueChange('sys', e.target.value)}
              onFocus={() => setActiveField('sys')}
              placeholder="120"
              maxLength={3}
              className={`
                w-full text-xl font-bold text-center bg-transparent outline-none
                ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}
              `}
            />
            <div className="text-xs text-gray-500 mt-1">mmHg</div>
          </div>

          {/* Diastolisch */}
          <div 
            onClick={() => {
              setActiveField('dia');
              diaRef.current?.focus();
            }}
            className={`
              relative rounded-xl p-3 text-center cursor-pointer
              transition-all duration-200 transform
              ${activeField === 'dia' 
                ? 'scale-105 ring-2 ring-purple-500' 
                : 'hover:scale-102'
              }
              ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
            `}
          >
            <Activity size={18} className="mx-auto mb-1 text-purple-500" />
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">DIA</div>
            <input
              ref={diaRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={values.dia}
              onChange={(e) => handleValueChange('dia', e.target.value)}
              onFocus={() => setActiveField('dia')}
              placeholder="80"
              maxLength={3}
              className={`
                w-full text-xl font-bold text-center bg-transparent outline-none
                ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}
              `}
            />
            <div className="text-xs text-gray-500 mt-1">mmHg</div>
          </div>

          {/* Puls */}
          <div 
            onClick={() => {
              setActiveField('pulse');
              pulseRef.current?.focus();
            }}
            className={`
              relative rounded-xl p-3 text-center cursor-pointer
              transition-all duration-200 transform
              ${activeField === 'pulse' 
                ? 'scale-105 ring-2 ring-red-500' 
                : 'hover:scale-102'
              }
              ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
            `}
          >
            <Heart size={18} className="mx-auto mb-1 text-red-500" />
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">PULS</div>
            <input
              ref={pulseRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={values.pulse}
              onChange={(e) => handleValueChange('pulse', e.target.value)}
              onFocus={() => setActiveField('pulse')}
              placeholder="70"
              maxLength={3}
              className={`
                w-full text-xl font-bold text-center bg-transparent outline-none
                ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}
              `}
            />
            <div className="text-xs text-gray-500 mt-1">bpm</div>
          </div>
        </div>

        {/* Kategorie-Feedback */}
        {category && (
          <div 
            className="mb-4 p-3 rounded-xl text-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-sm font-medium" style={{ color: category.color }}>
              {category.name}
            </span>
          </div>
        )}

        {/* NumPad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'back'].map((num) => (
            <button
              key={num}
              onClick={() => {
                if (num === 'clear') {
                  if (activeField) handleValueChange(activeField, '');
                } else if (num === 'back') {
                  handleBackspace();
                } else {
                  handleNumPadClick(num);
                }
              }}
              className={`
                h-12 rounded-lg font-semibold text-base
                transition-all duration-150 transform active:scale-95
                ${num === 'clear' || num === 'back'
                  ? darkMode 
                    ? 'bg-gray-800 text-gray-400 active:bg-gray-700'
                    : 'bg-gray-200 text-gray-600 active:bg-gray-300'
                  : darkMode
                    ? 'bg-gray-800 text-white active:bg-gray-700'
                    : 'bg-gray-100 text-gray-900 active:bg-gray-200'
                }
              `}
              style={{ touchAction: 'manipulation' }}
            >
              {num === 'clear' ? 'C' : num === 'back' ? '←' : num}
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={handleQuickSave}
          disabled={!values.sys || !values.dia}
          className={`
            w-full h-12 rounded-lg font-semibold text-white
            transition-all duration-300 transform
            ${values.sys && values.dia
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 active:scale-95'
              : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }
            ${showSuccess ? 'scale-95' : ''}
          `}
          style={{ touchAction: 'manipulation' }}
        >
          {showSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={20} />
              Gespeichert!
            </span>
          ) : (
            'Speichern'
          )}
        </button>

        {/* Letzter Wert */}
        {lastMeasurement && (
          <div className={`
            mt-4 p-3 rounded-xl text-center text-sm
            ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}
          `}>
            <Clock size={14} className="inline mr-1" />
            Letzter Wert: {lastMeasurement.sys}/{lastMeasurement.dia} 
            {lastMeasurement.pulse && ` - ${lastMeasurement.pulse} bpm`}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickEntryWidget;