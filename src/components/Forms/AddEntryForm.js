// components/Forms/AddEntryForm.js
import React, { useState, useEffect } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { validateBloodPressure, validateForm, getWeekdayFromDate } from '../../utils/validationUtils';

const AddEntryForm = ({ onSubmit, onCancel }) => {
  // Initialer State mit heutigem Datum
  const today = new Date();
  const initialFormData = {
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
    
    // Wenn keine Fehler, sende das Formular ab
    if (Object.keys(errors).length === 0) {
      const result = onSubmit(formData);
      if (!result.success) {
        setFormErrors(result.errors || {});
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Neuen Eintrag hinzufügen</h3>
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
          
          <div className="mb-6 border-t border-gray-200 pt-4">
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
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryForm;