// utils/pdfExportUtils.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generiert einen PDF-Bericht mit den Blutdruckdaten
 * @param {Object} data - Die Blutdruckdaten
 * @param {Object} patientInfo - Informationen über den Patienten
 * @param {Object} averages - Durchschnittswerte
 * @param {Object} bpCategory - Blutdruckkategorie
 * @param {Object} minMaxValues - Min/Max-Werte
 * @param {Object} contextFactors - Kontextfaktoren
 */
export const generatePdfReport = (data, patientInfo, averages, bpCategory, minMaxValues, contextFactors) => {
  // Neues PDF im A4-Format erstellen
  const pdf = new jsPDF();
  
  // Größen und Abstände
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  let yPos = 20;
  
  // Titel und Überschrift
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("Blutdruck-Bericht", pageWidth / 2, yPos, { align: "center" });
  
  // Patient und Datum
  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Patient: ${patientInfo.name || 'Unbekannt'}`, margin, yPos);
  if (patientInfo.birthdate) {
    pdf.text(`Geburtsdatum: ${patientInfo.birthdate}`, pageWidth - margin, yPos, { align: "right" });
  }
  
  // Arzt und Datum
  yPos += 8;
  pdf.text(`Für: ${patientInfo.doctor || 'Behandelnder Arzt'}`, margin, yPos);
  const today = new Date().toLocaleDateString('de-DE');
  pdf.text(`Erstellt am: ${today}`, pageWidth - margin, yPos, { align: "right" });
  
  // Zeitraum und Anzahl
  yPos += 8;
  if (data && data.length > 0) {
    const sortedData = [...data].sort((a, b) => {
      // Konvertiere Datumsformat (z.B. "Januar 15" -> Date)
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
        'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      const getDateValue = (dateStr) => {
        if (dateStr && dateStr.includes(' ')) {
          // Format kann "Januar 1" oder "1. Januar" sein
          let month, day;
          if (dateStr.includes('.')) {
            // Format "1. Januar"
            const parts = dateStr.split('. ');
            day = parseInt(parts[0]);
            month = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
          } else {
            // Format "Januar 1"
            const parts = dateStr.split(' ');
            month = parts[0];
            day = parseInt(parts[1]);
          }
          
          return new Date(2025, months[month], day);
        }
        return new Date(0);
      };
      
      return getDateValue(a.datum) - getDateValue(b.datum);
    });
    
    // Konvertiere Datumsformat für die Anzeige
    const formatDateEuropean = (dateStr) => {
      if (!dateStr) return '';
      
      // Konvertiere von "Januar 1" zu "1. Januar 2025"
      if (dateStr.includes(' ') && !dateStr.includes('.')) {
        const [month, day] = dateStr.split(' ');
        return `${parseInt(day)}. ${month} 2025`;
      }
      
      // Wenn es bereits im europäischen Format ist, füge nur Jahr hinzu
      if (dateStr.includes('.')) {
        return dateStr.includes('2025') ? dateStr : `${dateStr} 2025`;
      }
      
      return dateStr;
    };
    
    const firstDate = formatDateEuropean(sortedData[0].datum);
    const lastDate = formatDateEuropean(sortedData[sortedData.length - 1].datum);
    
    pdf.text(`Messzeitraum: ${firstDate} bis ${lastDate}`, margin, yPos);
    pdf.text(`Anzahl der Messungen: ${data.length}`, pageWidth - margin, yPos, { align: "right" });
  }
  
  // Trennlinie
  yPos += 8;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  
  // Blutdruck-Zusammenfassung
  yPos += 10;
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Blutdruck-Zusammenfassung", margin, yPos);
  
  // Durchschnittswerte - Verbesserte Positionierung
  yPos += 8;
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  
  // Linke Spalte
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;
  
  pdf.text(`Durchschnittswerte: ${averages.sys}/${averages.dia} mmHg`, leftCol, yPos);
  pdf.text(`Puls: ${averages.puls} bpm`, rightCol, yPos);
  
  // Kategorie
  yPos += 8;
  pdf.text(`Klassifikation: ${bpCategory.category}`, leftCol, yPos);
  
  // Min/Max-Werte - Neu positioniert, um Überlappung zu vermeiden
  yPos += 12; // Mehr Abstand nach oben
  pdf.text(`Systolisch min/max: ${minMaxValues.sysMin} / ${minMaxValues.sysMax} mmHg`, leftCol, yPos);
  pdf.text(`Diastolisch min/max: ${minMaxValues.diaMin} / ${minMaxValues.diaMax} mmHg`, rightCol, yPos);
  
  // Kontextfaktoren, falls vorhanden (nur einmal anzeigen)
  if (contextFactors && Object.keys(contextFactors).length > 0) {
    yPos += 15;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Einflussfaktoren", margin, yPos);
    
    // Berechne Durchschnittswerte aller Kontextfaktoren
    const factorCounts = {};
    const factorSums = {};
    
    Object.values(contextFactors).forEach(dayFactors => {
      Object.entries(dayFactors).forEach(([factor, value]) => {
        if (value !== undefined && value !== null) {
          factorSums[factor] = (factorSums[factor] || 0) + value;
          factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        }
      });
    });
    
    // Berechne Durchschnitte
    const avgFactors = {};
    Object.keys(factorSums).forEach(factor => {
      if (factorCounts[factor] > 0) {
        avgFactors[factor] = Math.round((factorSums[factor] / factorCounts[factor]) * 10) / 10;
      }
    });
    
    // Faktor-Label-Map für bessere Lesbarkeit
    const factorLabels = {
      'stress': 'Stress', 'sleep': 'Schlafqualität', 'activity': 'Körperliche Aktivität',
      'salt': 'Salzkonsum', 'caffeine': 'Koffein', 'alcohol': 'Alkohol'
    };
    
    // Skalenwerte für die verschiedenen Faktoren (angepasst auf 3 Werte)
    const factorScales = {
      'stress': ['Niedrig', 'Mittel', 'Hoch'],
      'sleep': ['Schlecht', 'Mittel', 'Gut'],
      'activity': ['Niedrig', 'Mittel', 'Hoch'],
      'salt': ['Niedrig', 'Mittel', 'Hoch'],
      'caffeine': ['Niedrig', 'Mittel', 'Hoch'],
      'alcohol': ['Keiner', 'Wenig', 'Viel']
    };
    
    // Zeige Kontextfaktoren in einer Tabelle
    yPos += 8;
    pdf.setFontSize(10);
    
    const factorTableData = Object.entries(avgFactors).map(([key, value]) => {
      const label = factorLabels[key] || key;
      const valueText = factorScales[key] ? 
        `${value.toFixed(1)} (${factorScales[key][Math.round(value)]})` : 
        value.toFixed(1);
      return [label, valueText];
    });
    
    pdf.autoTable({
      startY: yPos,
      head: [['Faktor', 'Durchschnitt']],
      body: factorTableData,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 200] }
    });
    
    yPos = pdf.lastAutoTable.finalY + 10;
  } else {
    // Wenn keine Kontextfaktoren vorhanden, zusätzlichen Abstand einfügen
    yPos += 15;
  }
  
  // Blutdruckmessungen als Tabelle
  if (data && data.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Blutdruckmessungen", margin, yPos);
    
    // Formatiere die Daten für die Tabelle mit europäischem Datumsformat
    const tableData = data.map(entry => {
      // Konvertiere von "Januar 1" zu "1. Januar 2025"
      let formattedDate = entry.datum;
      if (entry.datum.includes(' ') && !entry.datum.includes('.')) {
        const [month, day] = entry.datum.split(' ');
        formattedDate = `${parseInt(day)}. ${month} 2025`;
      }
      
      return [
        entry.tag, 
        formattedDate,
        (entry.morgenSys > 0 && entry.morgenDia > 0) ? `${entry.morgenSys}/${entry.morgenDia}/${entry.morgenPuls || '-'}` : '-',
        (entry.abendSys > 0 && entry.abendDia > 0) ? `${entry.abendSys}/${entry.abendDia}/${entry.abendPuls || '-'}` : '-'
      ];
    });
    
    // Tabelle erstellen
    yPos += 8;
    pdf.autoTable({
      startY: yPos,
      head: [['Tag', 'Datum', 'Morgen (Sys/Dia/Puls)', 'Abend (Sys/Dia/Puls)']],
      body: tableData,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [60, 130, 200] }
    });
    
    yPos = pdf.lastAutoTable.finalY + 10;
  }
  
  // Notizen, falls vorhanden
  if (patientInfo.notes) {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Notizen", margin, yPos);
    
    yPos += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    
    // Umbruch für lange Notizen
    const splitNotes = pdf.splitTextToSize(patientInfo.notes, pageWidth - (2 * margin));
    pdf.text(splitNotes, margin, yPos);
  }
  
  // Fußzeile
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Blutdruck-Tracker Bericht - Seite ${i} von ${pageCount}`, pageWidth / 2, pdf.internal.pageSize.height - 10, { align: "center" });
    pdf.text("Dieser Bericht ersetzt keine ärztliche Diagnose", pageWidth / 2, pdf.internal.pageSize.height - 6, { align: "center" });
  }
  
  // PDF herunterladen
  const fileName = `Blutdruck-Bericht_${patientInfo.name || 'Patient'}_${today.replace(/\./g, '-')}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};