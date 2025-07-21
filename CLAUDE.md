# CLAUDE.md - Blutdruck Tracker Projekt

## 🏥 Projekt-Übersicht

Der Blutdruck Tracker ist eine hochwertige medizinische Anwendung zur Erfassung und Analyse von Blutdruckdaten. Die App vereint moderne Webtechnologien mit medizinischen Standards und legt besonderen Wert auf Datensicherheit, Benutzerfreundlichkeit und Zuverlässigkeit.

### Kernfunktionen
- **Blutdruckmessung**: Erfassung von Morgen- und Abendwerten (Systolisch, Diastolisch, Puls)
- **Kontextfaktoren**: Tracking von Stress, Schlaf, Bewegung, Alkohol, Stimmung und Wetter
- **Datenvisualisierung**: Interaktive Charts mit Trendanalysen und gleitenden Durchschnitten
- **Offline-First PWA**: Vollständige Funktionalität auch ohne Internetverbindung
- **Datenverschlüsselung**: AES-256-GCM Verschlüsselung für sensible Gesundheitsdaten
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile mit iOS-inspiriertem UI

## 🎯 Kritische Anforderungen

### Medizinische Standards
- **Blutdruckkategorisierung**: Strikt nach ESC/ESH 2018 Guidelines
  - Optimal: <120/80 mmHg
  - Normal: 120-129/80-84 mmHg
  - Hoch-Normal: 130-139/85-89 mmHg
  - Hypertonie Grad 1: 140-159/90-99 mmHg
  - Hypertonie Grad 2: 160-179/100-109 mmHg
  - Hypertonie Grad 3: ≥180/110 mmHg

### Datensicherheit
- **Verschlüsselung**: Alle Gesundheitsdaten müssen verschlüsselt gespeichert werden
- **Datenpersistenz**: Keine Datenverluste bei Abstürzen oder Updates
- **Backup-Strategie**: Automatische Backups vor kritischen Operationen
- **Datenintegrität**: Transaktionale Speicherung mit Rollback-Mechanismen

### Performance
- **Große Datenmengen**: Flüssige Bedienung bei 10.000+ Einträgen
- **Lazy Loading**: Code-Splitting für schnelle Ladezeiten
- **Virtualisierung**: React-Window für effizientes Rendering großer Tabellen
- **Optimierte Berechnungen**: Memoization für rechenintensive Operationen

### Barrierefreiheit
- **WCAG AA Standards**: Vollständige Konformität erforderlich
- **Keyboard Navigation**: Alle Funktionen per Tastatur erreichbar
- **Screen Reader**: Optimiert für Bildschirmlesegeräte
- **Kontraste**: Mindestens 4.5:1 für normalen Text, 3:1 für großen Text

## 🏗️ Architektur-Prinzipien

### 1. Single Source of Truth
```javascript
// Zentrales State Management in useBloodPressureData Hook
const {
  data,           // Alle Messungen
  contextFactors, // Kontextdaten
  ...methods      // CRUD-Operationen
} = useBloodPressureData();
```

### 2. Fail-Safe Design
- Automatische Backups vor Änderungen
- Graceful Degradation bei Fehlern
- Fallback-Mechanismen für alle kritischen Pfade

### 3. Validation First
```javascript
// Eingaben immer validieren vor Verarbeitung
const validation = validateForm(formData);
if (!validation.isValid) {
  showStatusMessage(validation.errors[0], 'error');
  return { success: false, message: validation.errors[0] };
}
```

### 4. Error Boundaries
- Komponentenweise Fehlerbehandlung
- Benutzerfreundliche Fehlermeldungen
- Automatische Fehlerberichte

### 5. Progressive Enhancement
- Basis-Funktionalität ohne JavaScript
- Erweiterte Features bei Verfügbarkeit
- Offline-First Ansatz

## 🚨 Bekannte kritische Probleme

### 1. Race Conditions beim Speichern (KRITISCH)
**Problem**: Gleichzeitige Speichervorgänge können zu Datenverlust führen
**Lösung**: Implementierung echter transaktionaler Speicherung mit Lock-Mechanismus
```javascript
// TODO: Implement proper transaction handling
async function transactionalSave(data) {
  const lock = await acquireLock('storage');
  try {
    await saveData(data);
  } finally {
    releaseLock(lock);
  }
}
```

### 2. Datenverlust durch store.clear() (KRITISCH)
**Problem**: Clear-Operation vor dem Speichern neuer Daten
**Lösung**: Atomic Operations verwenden
```javascript
// FALSCH
await db.clear();
await db.add(newData);

// RICHTIG
const transaction = db.transaction(['store'], 'readwrite');
await transaction.objectStore('store').put(newData);
```

### 3. Inkonsistente Datumsformate (HOCH)
**Problem**: Mischung aus deutschen und englischen Datumsformaten
**Lösung**: Einheitliche ISO-8601 interne Repräsentation

### 4. Memory Leaks (HOCH)
**Problem**: Fehlende Cleanup in useEffect Hooks
**Lösung**: Konsequente Cleanup-Funktionen
```javascript
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // Cleanup!
}, []);
```

## 📂 Projektstruktur

```
src/
├── hooks/
│   └── useBloodPressureData.js    # Zentrales State Management
├── services/
│   ├── storageService.js          # Datenpersistierung
│   ├── cryptoService.js           # Verschlüsselung
│   └── syncService.js             # Offline-Sync
├── components/
│   ├── Dashboard/                 # Hauptansichten
│   ├── Forms/                     # Eingabeformulare
│   ├── Table/                     # Tabellenansichten
│   └── UI/                        # Wiederverwendbare UI-Komponenten
├── utils/
│   ├── bloodPressureUtils.js     # Medizinische Berechnungen
│   ├── validationUtils.js        # Input-Validierung
│   └── dataUtils.js              # Datenverarbeitung
└── styles/                        # CSS und Design-System
```

## 🔧 Entwicklungs-Workflow

### Vor jeder Änderung
```bash
# Tests ausführen
npm test

# Lint prüfen
npm run lint

# Type-Check (wenn TypeScript)
npm run typecheck
```

### Während der Entwicklung
- Browser DevTools → Performance Tab für Leistungsanalyse
- React DevTools → Profiler für Render-Optimierung
- Lighthouse für Accessibility und PWA-Checks

### Code-Standards
```javascript
// IMMER: Aussagekräftige Variablennamen
const bloodPressureCategory = getCategory(systolic, diastolic);

// NIEMALS: Magische Zahlen
if (systolic > 140) {} // FALSCH
if (systolic > HYPERTENSION_THRESHOLD) {} // RICHTIG

// IMMER: Error Handling
try {
  await saveData(measurements);
} catch (error) {
  console.error('Speichern fehlgeschlagen:', error);
  showUserNotification('Daten konnten nicht gespeichert werden');
}
```

## 🧪 Testing-Checkliste

### Kritische Test-Szenarien
- [ ] Dateneingabe mit Extremwerten (0, negative, >300)
- [ ] Gleichzeitige Bearbeitung mehrerer Einträge
- [ ] Import von beschädigten Dateien
- [ ] Offline → Online Synchronisation
- [ ] Verschlüsselung mit falschen Passwörtern
- [ ] Performance mit 10.000+ Einträgen
- [ ] Dark Mode Kontraste (WCAG AA)
- [ ] Keyboard-Only Navigation
- [ ] Screen Reader Kompatibilität

### Automatisierte Tests
```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Accessibility Tests
npm run test:a11y
```

## 🚀 Deployment

### Build-Prozess
```bash
# Web Build
npm run build

# Electron Desktop Build
npm run electron:build

# PWA Build mit Service Worker
npm run build:pwa
```

### Deployment-Checkliste
- [ ] Alle Tests grün
- [ ] Keine Console-Logs im Production-Code
- [ ] Service Worker Cache-Busting
- [ ] CSP Headers konfiguriert
- [ ] SSL/TLS aktiviert
- [ ] Error Tracking eingerichtet

## 🔐 Sicherheits-Richtlinien

### Datenverschlüsselung
- **Algorithmus**: AES-256-GCM
- **Key Derivation**: PBKDF2 mit 100.000 Iterationen
- **Salz**: Zufällig generiert, 16 Bytes
- **IV**: Zufällig generiert, 12 Bytes

### Input-Validierung
```javascript
// Alle Eingaben validieren
const sanitizedInput = DOMPurify.sanitize(userInput);
const validatedData = validateBloodPressure(sanitizedInput);
```

### Sichere Speicherung
- Keine Passwörter im Klartext
- Verschlüsselte localStorage/IndexedDB
- Automatisches Session-Timeout

## 📊 Performance-Optimierung

### React-Optimierungen
```javascript
// Memoization für teure Berechnungen
const averageValues = useMemo(() => 
  calculateAverages(data), [data]
);

// Component Memoization
const Chart = React.memo(BloodPressureChart);

// Callback Memoization
const handleSave = useCallback((data) => {
  saveData(data);
}, []);
```

### Bundle-Optimierung
- Code Splitting mit React.lazy()
- Tree Shaking für ungenutzten Code
- Webpack Bundle Analyzer einsetzen

## 🆘 Troubleshooting

### Häufige Probleme

#### "Speichern fehlgeschlagen"
1. Browser-Konsole auf Fehler prüfen
2. IndexedDB-Quota überprüfen
3. localStorage-Limit erreicht?

#### Performance-Probleme
1. React Profiler aktivieren
2. Unnötige Re-Renders identifizieren
3. Virtualisierung für große Listen

#### Sync-Probleme
1. Service Worker Status prüfen
2. Offline-Queue inspizieren
3. Network Tab für fehlgeschlagene Requests

## 📈 Metriken und Monitoring

### Wichtige Metriken
- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.8s
- **Bundle Size**: < 300KB (gzipped)
- **Lighthouse Score**: > 90

### Error Tracking
```javascript
window.addEventListener('error', (event) => {
  // An Error Tracking Service senden
  trackError({
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  });
});
```

## 🤝 Contribution Guidelines

### Code Review Checkliste
- [ ] Medizinische Berechnungen korrekt?
- [ ] Fehlerbehandlung vollständig?
- [ ] Tests vorhanden und grün?
- [ ] Accessibility gewährleistet?
- [ ] Performance-Impact akzeptabel?
- [ ] Dokumentation aktualisiert?

### Commit-Konventionen
```
feat: Neue Funktion
fix: Fehlerbehebung
perf: Performance-Verbesserung
docs: Dokumentation
test: Tests
refactor: Code-Refactoring
style: Formatierung
chore: Wartungsarbeiten
```

## 📞 Support und Kontakt

Bei kritischen medizinischen Berechnungsfragen:
- Immer konservativ implementieren
- Medizinische Standards dokumentieren
- Peer Review durch Fachpersonal

---

**Letzte Aktualisierung**: Januar 2025
**Version**: 2.0.0
**Maintainer**: Blutdruck Tracker Team