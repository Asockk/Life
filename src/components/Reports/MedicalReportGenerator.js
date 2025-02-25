// components/Reports/MedicalReportGenerator.js
import React, { useState } from 'react';
import { FileText, Download, Share2, Calendar, User, Phone, Mail } from 'lucide-react';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { QRCodeCanvas } from 'qrcode.react'; // Korrigierter Import

const MedicalReportGenerator = ({ data, avgValues, bpCategory, minMaxValues, contextFactors }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    birthdate: '',
    doctor: '',
    notes: '',
    email: '',
    phone: ''
  });
  
  // Zeitraum der Daten bestimmen (erster und letzter Eintrag)
  const getDateRange = () => {
    if (!data || data.length === 0) return 'Keine Daten verfügbar';
    
    // Daten nach Datum sortieren
    const sortedData = [...data].sort((a, b) => {
      const aDate = parseDate(a.datum);
      const bDate = parseDate(b.datum);
      return aDate - bDate;
    });
    
    return `${sortedData[0].datum} - ${sortedData[sortedData.length - 1].datum}`;
  };
  
  // Hilfsfunktion zum Parsen des Datums
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    if (dateStr.includes(' ')) {
      const [month, day] = dateStr.split(' ');
      if (months[month] !== undefined) {
        return new Date(2025, months[month], parseInt(day));
      }
    }
    return new Date(0);
  };
  
  // Prozentsatz der Messungen pro Kategorie
  const getCategoryPercentages = () => {
    if (!data || data.length === 0) return {};
    
    const categories = {
      'Optimal': 0,
      'Normal': 0,
      'Hoch normal': 0,
      'Hypertonie Grad 1': 0,
      'Hypertonie Grad 2': 0,
      'Hypertonie Grad 3': 0
    };
    
    let totalMeasurements = 0;
    
    // Morgen und Abend Messungen zählen
    data.forEach(entry => {
      if (entry.morgenSys > 0 && entry.morgenDia > 0) {
        const category = getBloodPressureCategory(entry.morgenSys, entry.morgenDia).category;
        categories[category] = (categories[category] || 0) + 1;
        totalMeasurements++;
      }
      
      if (entry.abendSys > 0 && entry.abendDia > 0) {
        const category = getBloodPressureCategory(entry.abendSys, entry.abendDia).category;
        categories[category] = (categories[category] || 0) + 1;
        totalMeasurements++;
      }
    });
    
    // Prozentsätze berechnen
    const percentages = {};
    for (const category in categories) {
      percentages[category] = totalMeasurements > 0 
        ? Math.round((categories[category] / totalMeasurements) * 100) 
        : 0;
    }
    
    return percentages;
  };
  
  // Durchschnittliche Morgen/Abend-Differenz
  const getMorningEveningDifference = () => {
    if (!data || data.length === 0) return { sys: 0, dia: 0 };
    
    let morningSum = { sys: 0, dia: 0, count: 0 };
    let eveningSum = { sys: 0, dia: 0, count: 0 };
    
    data.forEach(entry => {
      if (entry.morgenSys > 0 && entry.morgenDia > 0) {
        morningSum.sys += entry.morgenSys;
        morningSum.dia += entry.morgenDia;
        morningSum.count++;
      }
      
      if (entry.abendSys > 0 && entry.abendDia > 0) {
        eveningSum.sys += entry.abendSys;
        eveningSum.dia += entry.abendDia;
        eveningSum.count++;
      }
    });
    
    const morningAvg = {
      sys: morningSum.count > 0 ? Math.round(morningSum.sys / morningSum.count) : 0,
      dia: morningSum.count > 0 ? Math.round(morningSum.dia / morningSum.count) : 0
    };
    
    const eveningAvg = {
      sys: eveningSum.count > 0 ? Math.round(eveningSum.sys / eveningSum.count) : 0,
      dia: eveningSum.count > 0 ? Math.round(eveningSum.dia / eveningSum.count) : 0
    };
    
    return {
      sys: eveningAvg.sys - morningAvg.sys,
      dia: eveningAvg.dia - morningAvg.dia
    };
  };
  
  // Durchschnittliche Kontextfaktoren berechnen (für den neuesten Zeitraum)
  const getAverageContextFactors = () => {
    if (!contextFactors || Object.keys(contextFactors).length === 0) {
      return null;
    }
    
    // Sortiere Daten nach Datum (neueste zuerst)
    const sortedDates = Object.keys(contextFactors).sort((a, b) => new Date(b) - new Date(a));
    
    // Nehme die letzten 7 Tage oder alle verfügbaren
    const daysToInclude = Math.min(7, sortedDates.length);
    const recentDates = sortedDates.slice(0, daysToInclude);
    
    // Sammle Faktoren für die Berechnung
    const factorSums = {};
    const factorCounts = {};
    
    recentDates.forEach(date => {
      const dayFactors = contextFactors[date];
      
      Object.entries(dayFactors).forEach(([factor, value]) => {
        // Ignoriere undefined oder null Werte
        if (value === undefined || value === null) return;
        
        // Summiere Werte und zähle Vorkommen
        factorSums[factor] = (factorSums[factor] || 0) + value;
        factorCounts[factor] = (factorCounts[factor] || 0) + 1;
      });
    });
    
    // Berechne Durchschnitte
    const averages = {};
    Object.keys(factorSums).forEach(factor => {
      // Nur Faktoren mit Werten berücksichtigen
      if (factorCounts[factor] > 0) {
        averages[factor] = parseFloat((factorSums[factor] / factorCounts[factor]).toFixed(1));
      }
    });
    
    return averages;
  };
  
  // Korrelation zwischen Faktoren und Blutdruck (vereinfacht)
  const getKeyFactorInsights = () => {
    if (!contextFactors || Object.keys(contextFactors).length === 0) {
      return [];
    }
    
    const insights = [];
    const avgFactors = getAverageContextFactors();
    
    if (!avgFactors) return insights;
    
    // Stress
    if (avgFactors.stress !== undefined) {
      if (avgFactors.stress > 3) {
        insights.push("Hoher Stress korreliert möglicherweise mit erhöhten Blutdruckwerten");
      }
    }
    
    // Schlaf
    if (avgFactors.sleep !== undefined) {
      if (avgFactors.sleep < 3) {
        insights.push("Mangelnder Schlaf könnte zu Blutdruckschwankungen beitragen");
      }
    }
    
    // Salzkonsum
    if (avgFactors.salt !== undefined) {
      if (avgFactors.salt > 3) {
        insights.push("Erhöhter Salzkonsum kann höhere systolische Werte begünstigen");
      }
    }
    
    // Aktivität
    if (avgFactors.activity !== undefined) {
      if (avgFactors.activity < 2) {
        insights.push("Geringe körperliche Aktivität kann langfristig zu höherem Blutdruck führen");
      }
    }
    
    return insights;
  };
  
  // Hilfsfunktion zum Generieren eines QR-Codes mit komprimierten Daten
  const generateQRData = () => {
    // Erstelle zusammengefasste Daten für den QR-Code
    const reportData = {
      patient: patientInfo.name,
      dateRange: getDateRange(),
      averages: {
        sys: avgValues.sys,
        dia: avgValues.dia,
        puls: avgValues.puls,
        category: bpCategory.category
      },
      minMax: minMaxValues,
      measurements: data.length
    };
    
    // Als JSON-String zurückgeben, der in QR-Code codiert wird
    return JSON.stringify(reportData);
  };
  
  // Berichtsdownload als PDF simulieren (würde in echter Anwendung PDF generieren)
  const handleDownload = () => {
    alert('PDF-Bericht wird generiert und heruntergeladen...');
    // In einer echten App würde hier ein PDF generiert werden
  };
  
  // Berichtvorschau anzeigen oder ausblenden
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  // Input-Änderungen verarbeiten
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({ ...prev, [name]: value }));
  };
  
  // Berechnung der Prozentsätze pro Kategorie
  const percentages = getCategoryPercentages();
  
  // Berechnung der Morgen/Abend-Differenz
  const morningEveningDiff = getMorningEveningDifference();
  
  // Durchschnittliche Kontextfaktoren
  const avgContextFactors = getAverageContextFactors();
  
  // Erkenntnisse aus Kontextfaktoren
  const contextInsights = getKeyFactorInsights();
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4">Ärztlicher Bericht</h2>
      
      {!showPreview ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Erstellen Sie einen Bericht für Ihren Arzt mit allen wichtigen Blutdruckdaten.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={patientInfo.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Vorname Nachname"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geburtsdatum
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-500" />
                </div>
                <input
                  type="date"
                  name="birthdate"
                  value={patientInfo.birthdate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Behandelnder Arzt
              </label>
              <input
                type="text"
                name="doctor"
                value={patientInfo.doctor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Dr. Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontakt-E-Mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={patientInfo.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ihre.email@beispiel.de"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={16} className="text-gray-500" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={patientInfo.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notizen für den Arzt
              </label>
              <textarea
                name="notes"
                value={patientInfo.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Relevante Informationen, Medikamente, Symptome..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={togglePreview}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <FileText size={18} className="mr-2" />
              Vorschau anzeigen
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">Blutdruck-Bericht</h3>
                <p className="text-sm">{patientInfo.name || 'Patient'}</p>
                <p className="text-sm text-gray-600">
                  {patientInfo.birthdate ? `Geb.: ${patientInfo.birthdate}` : ''}
                </p>
                <p className="text-sm mt-2">Messzeitraum: {getDateRange()}</p>
                <p className="text-sm">Anzahl der Messungen: {data.length}</p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium">Für: {patientInfo.doctor || 'Behandelnder Arzt'}</p>
                <p className="text-sm text-gray-600">Erstellt am: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium mb-2">Blutdruck-Zusammenfassung</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Durchschnittswerte:</p>
                  <p className="text-lg font-bold">{avgValues.sys}/{avgValues.dia} mmHg</p>
                  <p className="text-sm">Puls: {avgValues.puls} bpm</p>
                  <p className="text-sm">Klassifikation: <span className="font-medium" style={{ color: bpCategory.color }}>{bpCategory.category}</span></p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Min/Max-Werte:</p>
                  <p className="text-sm">Systolisch: <span className="font-medium text-blue-600">{minMaxValues.sysMin}</span> - <span className="font-medium text-red-600">{minMaxValues.sysMax}</span> mmHg</p>
                  <p className="text-sm">Diastolisch: <span className="font-medium text-blue-600">{minMaxValues.diaMin}</span> - <span className="font-medium text-red-600">{minMaxValues.diaMax}</span> mmHg</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Morgen-Abend-Differenz:</p>
                  <p className="text-sm">
                    Systolisch: <span className={morningEveningDiff.sys > 0 ? 'text-red-600' : 'text-blue-600'}>
                      {morningEveningDiff.sys > 0 ? '+' : ''}{morningEveningDiff.sys} mmHg
                    </span>
                  </p>
                  <p className="text-sm">
                    Diastolisch: <span className={morningEveningDiff.dia > 0 ? 'text-red-600' : 'text-blue-600'}>
                      {morningEveningDiff.dia > 0 ? '+' : ''}{morningEveningDiff.dia} mmHg
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Messungsverteilung:</p>
                  <div className="flex mt-1 text-xs">
                    <div className="flex-1">
                      <div 
                        className="bg-green-500 h-4 rounded-l" 
                        style={{ width: `${percentages['Optimal'] + percentages['Normal']}%` }}
                        title={`Optimal/Normal: ${percentages['Optimal'] + percentages['Normal']}%`}
                      />
                    </div>
                    <div className="flex-1">
                      <div 
                        className="bg-yellow-500 h-4" 
                        style={{ width: `${percentages['Hoch normal']}%` }}
                        title={`Hoch normal: ${percentages['Hoch normal']}%`}
                      />
                    </div>
                    <div className="flex-1">
                      <div 
                        className="bg-orange-500 h-4" 
                        style={{ width: `${percentages['Hypertonie Grad 1']}%` }}
                        title={`Hypertonie Grad 1: ${percentages['Hypertonie Grad 1']}%`}
                      />
                    </div>
                    <div className="flex-1">
                      <div 
                        className="bg-red-500 h-4 rounded-r" 
                        style={{ width: `${percentages['Hypertonie Grad 2'] + percentages['Hypertonie Grad 3']}%` }}
                        title={`Hypertonie Grad 2/3: ${percentages['Hypertonie Grad 2'] + percentages['Hypertonie Grad 3']}%`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {avgContextFactors && Object.keys(avgContextFactors).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Einflussfaktoren (Durchschnitt der letzten 7 Tage)</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {avgContextFactors.stress !== undefined && (
                    <div>Stress: <span className="font-medium">{avgContextFactors.stress} / 5</span></div>
                  )}
                  {avgContextFactors.sleep !== undefined && (
                    <div>Schlafqualität: <span className="font-medium">{avgContextFactors.sleep} / 5</span></div>
                  )}
                  {avgContextFactors.activity !== undefined && (
                    <div>Aktivität: <span className="font-medium">{avgContextFactors.activity} / 5</span></div>
                  )}
                  {avgContextFactors.salt !== undefined && (
                    <div>Salzkonsum: <span className="font-medium">{avgContextFactors.salt} / 5</span></div>
                  )}
                  {avgContextFactors.caffeine !== undefined && (
                    <div>Koffein: <span className="font-medium">{avgContextFactors.caffeine} / 3</span></div>
                  )}
                  {avgContextFactors.alcohol !== undefined && (
                    <div>Alkohol: <span className="font-medium">{avgContextFactors.alcohol} / 3</span></div>
                  )}
                </div>
                
                {contextInsights.length > 0 && (
                  <div className="mt-2 bg-blue-50 p-2 rounded-md">
                    <p className="text-sm font-medium text-blue-800 mb-1">Mögliche Einflussfaktoren:</p>
                    <ul className="text-xs text-blue-900 list-disc list-inside">
                      {contextInsights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {patientInfo.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Patientennotizen</h4>
                <p className="text-sm bg-blue-50 p-2 rounded">{patientInfo.notes}</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm">
                <p>Erstellt mit Blutdruck-Tracker App</p>
                <p className="text-xs text-gray-500">Dieser Bericht ersetzt keine ärztliche Diagnose</p>
              </div>
              
              <div className="w-24 h-24">
                <QRCodeCanvas value={generateQRData()} size={96} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={togglePreview}
              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg"
            >
              Bearbeiten
            </button>
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <Download size={18} className="mr-2" />
              PDF herunterladen
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <Share2 size={18} className="mr-2" />
              Mit Arzt teilen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportGenerator;