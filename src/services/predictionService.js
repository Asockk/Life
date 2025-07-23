// services/predictionService.js
// Smart Input Predictions basierend auf historischen Daten

class PredictionService {
  constructor() {
    this.cache = new Map();
    this.patterns = new Map();
  }

  // Analysiere historische Daten und erstelle Muster
  analyzePatterns(historicalData) {
    if (!historicalData || historicalData.length < 7) return;

    // Gruppiere Daten nach Tageszeit
    const morningData = [];
    const eveningData = [];

    historicalData.forEach(entry => {
      if (entry.morgenSys && entry.morgenDia) {
        morningData.push({
          sys: entry.morgenSys,
          dia: entry.morgenDia,
          pulse: entry.morgenPuls,
          date: new Date(entry.datum),
          dayOfWeek: new Date(entry.datum).getDay(),
          context: entry.context || {}
        });
      }
      if (entry.abendSys && entry.abendDia) {
        eveningData.push({
          sys: entry.abendSys,
          dia: entry.abendDia,
          pulse: entry.abendPuls,
          date: new Date(entry.datum),
          dayOfWeek: new Date(entry.datum).getDay(),
          context: entry.context || {}
        });
      }
    });

    // Berechne Durchschnitte und Trends
    this.patterns.set('morning', this.calculatePatterns(morningData));
    this.patterns.set('evening', this.calculatePatterns(eveningData));
  }

  // Berechne Muster für eine Datenmenge
  calculatePatterns(data) {
    if (data.length === 0) return null;

    // Sortiere nach Datum (neueste zuerst)
    data.sort((a, b) => b.date - a.date);

    // Berechne verschiedene Statistiken
    const recent = data.slice(0, 7); // Letzte 7 Messungen
    const lastMonth = data.slice(0, 30); // Letzte 30 Messungen

    return {
      // Durchschnittswerte
      avgRecent: {
        sys: Math.round(recent.reduce((sum, d) => sum + d.sys, 0) / recent.length),
        dia: Math.round(recent.reduce((sum, d) => sum + d.dia, 0) / recent.length),
        pulse: Math.round(recent.filter(d => d.pulse).reduce((sum, d) => sum + d.pulse, 0) / recent.filter(d => d.pulse).length)
      },
      // Median (robuster gegen Ausreißer)
      median: {
        sys: this.calculateMedian(recent.map(d => d.sys)),
        dia: this.calculateMedian(recent.map(d => d.dia)),
        pulse: this.calculateMedian(recent.filter(d => d.pulse).map(d => d.pulse))
      },
      // Wochentag-spezifische Muster
      byDayOfWeek: this.calculateDayOfWeekPatterns(lastMonth),
      // Trend
      trend: this.calculateTrend(recent),
      // Häufigste Werte
      mostFrequent: {
        sys: this.getMostFrequent(recent.map(d => d.sys)),
        dia: this.getMostFrequent(recent.map(d => d.dia))
      },
      // Kontextbasierte Muster
      contextPatterns: this.analyzeContextPatterns(recent)
    };
  }

  // Vorhersage für neue Eingabe
  getPrediction(timeOfDay = 'morgen', currentContext = {}) {
    const patterns = this.patterns.get(timeOfDay === 'morgen' ? 'morning' : 'evening');
    if (!patterns) return null;

    const now = new Date();
    const dayOfWeek = now.getDay();

    // Basis-Vorhersage
    let prediction = {
      sys: patterns.median.sys,
      dia: patterns.median.dia,
      pulse: patterns.median.pulse,
      confidence: 'medium',
      reason: 'Basierend auf Ihren üblichen Werten'
    };

    // Wochentag-spezifische Anpassung
    if (patterns.byDayOfWeek[dayOfWeek]) {
      const dayPattern = patterns.byDayOfWeek[dayOfWeek];
      prediction.sys = Math.round((prediction.sys + dayPattern.sys) / 2);
      prediction.dia = Math.round((prediction.dia + dayPattern.dia) / 2);
      prediction.reason = `Typisch für ${this.getDayName(dayOfWeek)}`;
    }

    // Trend-Anpassung
    if (patterns.trend) {
      prediction.sys += Math.round(patterns.trend.sys * 2);
      prediction.dia += Math.round(patterns.trend.dia * 2);
      
      if (Math.abs(patterns.trend.sys) > 2) {
        prediction.reason = patterns.trend.sys > 0 
          ? 'Ihre Werte steigen tendenziell' 
          : 'Ihre Werte sinken tendenziell';
        prediction.confidence = 'high';
      }
    }

    // Kontext-basierte Anpassung
    if (currentContext && patterns.contextPatterns) {
      const contextAdjustment = this.getContextAdjustment(currentContext, patterns.contextPatterns);
      if (contextAdjustment) {
        prediction.sys += contextAdjustment.sys;
        prediction.dia += contextAdjustment.dia;
        prediction.reason = contextAdjustment.reason;
      }
    }

    // Anomalie-Erkennung
    prediction.anomalyWarning = this.detectAnomaly(prediction, patterns);

    return prediction;
  }

  // Berechne Median
  calculateMedian(values) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  // Finde häufigsten Wert
  getMostFrequent(values) {
    const frequency = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mostFrequent = values[0];
    
    Object.entries(frequency).forEach(([val, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostFrequent = parseInt(val);
      }
    });
    
    return mostFrequent;
  }

  // Berechne Wochentag-Muster
  calculateDayOfWeekPatterns(data) {
    const patterns = {};
    
    for (let day = 0; day < 7; day++) {
      const dayData = data.filter(d => d.dayOfWeek === day);
      if (dayData.length >= 2) {
        patterns[day] = {
          sys: Math.round(dayData.reduce((sum, d) => sum + d.sys, 0) / dayData.length),
          dia: Math.round(dayData.reduce((sum, d) => sum + d.dia, 0) / dayData.length),
          count: dayData.length
        };
      }
    }
    
    return patterns;
  }

  // Berechne Trend
  calculateTrend(recentData) {
    if (recentData.length < 3) return null;

    // Einfache lineare Regression
    const n = recentData.length;
    let sumX = 0, sumY_sys = 0, sumY_dia = 0, sumXY_sys = 0, sumXY_dia = 0, sumX2 = 0;

    recentData.forEach((d, i) => {
      sumX += i;
      sumY_sys += d.sys;
      sumY_dia += d.dia;
      sumXY_sys += i * d.sys;
      sumXY_dia += i * d.dia;
      sumX2 += i * i;
    });

    const slope_sys = (n * sumXY_sys - sumX * sumY_sys) / (n * sumX2 - sumX * sumX);
    const slope_dia = (n * sumXY_dia - sumX * sumY_dia) / (n * sumX2 - sumX * sumX);

    return {
      sys: slope_sys,
      dia: slope_dia
    };
  }

  // Analysiere Kontext-Muster
  analyzeContextPatterns(data) {
    const patterns = {
      stress: { high: [], low: [] },
      sleep: { good: [], bad: [] },
      activity: { high: [], low: [] }
    };

    data.forEach(d => {
      if (!d.context) return;

      // Stress
      if (d.context.stress >= 4) {
        patterns.stress.high.push({ sys: d.sys, dia: d.dia });
      } else if (d.context.stress <= 2) {
        patterns.stress.low.push({ sys: d.sys, dia: d.dia });
      }

      // Schlaf
      if (d.context.schlaf >= 4) {
        patterns.sleep.good.push({ sys: d.sys, dia: d.dia });
      } else if (d.context.schlaf <= 2) {
        patterns.sleep.bad.push({ sys: d.sys, dia: d.dia });
      }
    });

    return patterns;
  }

  // Kontext-basierte Anpassung
  getContextAdjustment(currentContext, patterns) {
    let adjustment = { sys: 0, dia: 0, reason: '' };

    // Stress-Einfluss
    if (currentContext.stress >= 4 && patterns.stress.high.length >= 3) {
      const avgHigh = this.calculateAverage(patterns.stress.high);
      const avgLow = this.calculateAverage(patterns.stress.low);
      if (avgHigh && avgLow) {
        adjustment.sys += Math.round((avgHigh.sys - avgLow.sys) * 0.5);
        adjustment.dia += Math.round((avgHigh.dia - avgLow.dia) * 0.5);
        adjustment.reason = 'Erhöhter Stress kann Werte beeinflussen';
      }
    }

    return adjustment.sys !== 0 || adjustment.dia !== 0 ? adjustment : null;
  }

  // Berechne Durchschnitt
  calculateAverage(data) {
    if (data.length === 0) return null;
    return {
      sys: Math.round(data.reduce((sum, d) => sum + d.sys, 0) / data.length),
      dia: Math.round(data.reduce((sum, d) => sum + d.dia, 0) / data.length)
    };
  }

  // Anomalie-Erkennung
  detectAnomaly(prediction, patterns) {
    const threshold = {
      sys: 20,
      dia: 15
    };

    const diffSys = Math.abs(prediction.sys - patterns.median.sys);
    const diffDia = Math.abs(prediction.dia - patterns.median.dia);

    if (diffSys > threshold.sys || diffDia > threshold.dia) {
      return {
        detected: true,
        message: 'Diese Werte weichen stark von Ihrem Durchschnitt ab',
        severity: diffSys > threshold.sys * 1.5 || diffDia > threshold.dia * 1.5 ? 'high' : 'medium'
      };
    }

    return null;
  }

  // Hilfsfunktion für Wochentag-Namen
  getDayName(day) {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[day];
  }

  // Cache-Verwaltung
  clearCache() {
    this.cache.clear();
  }
}

// Singleton Instance
const predictionService = new PredictionService();

export default predictionService;