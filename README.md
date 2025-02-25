# Blutdruck-Tracker

Eine React-Anwendung zur Erfassung und Visualisierung von Blutdruckwerten.

## Projektstruktur

Die Anwendung wurde in folgende Module aufgeteilt:

```
src/
├── utils/                # Hilfs- und Dienstprogramme
│   ├── bloodPressureUtils.js  # Blutdruck-spezifische Funktionen
│   ├── dataUtils.js           # Datenverarbeitung und -transformation
│   └── validationUtils.js     # Validierungsfunktionen
├── hooks/                # Custom React Hooks
│   └── useBloodPressureData.js  # Zentrale Datenverwaltung
├── components/           # React-Komponenten
│   ├── Dashboard/        # Dashboard-Komponenten
│   │   ├── BloodPressureSummary.js      # Zusammenfassung
│   │   ├── BloodPressureChart.js        # Diagramm
│   │   └── BloodPressureCategoryLegend.js  # Kategorien-Legende
│   ├── Table/            # Tabellen-Komponenten
│   │   └── BloodPressureTable.js        # Daten-Tabelle
│   ├── Forms/            # Formular-Komponenten
│   │   ├── AddEntryForm.js              # Formular für neue Einträge
│   │   ├── EditEntryForm.js             # Formular zum Bearbeiten
│   │   └── ImportModal.js               # Import-Dialog
│   └── UI/               # UI-Komponenten
│       ├── StatusMessage.js             # Statusnachrichten
│       └── ToggleViewButtons.js         # Ansichtsumschaltung
└── App.js                # Hauptkomponente
```

## Komponentenbeschreibungen

### Utils

**bloodPressureUtils.js**
- Enthält Funktionen zur Klassifizierung von Blutdruckwerten in medizinische Kategorien
- Berechnet Durchschnittswerte und formatiert Tabellenwerte

**dataUtils.js**
- Verarbeitet und transformiert Daten für die Anzeige
- Enthält Funktionen zum Parsen von CSV-Dateien
- Bereitet Daten für Diagramme mit gleitenden Durchschnitten und Trendlinien vor

**validationUtils.js**
- Validierungsfunktionen für Formulareingaben
- Prüft Blutdruckwerte auf medizinische Plausibilität
- Konvertiert und formatiert Datumsformate

### Hooks

**useBloodPressureData.js**
- Zentralisiert die Datenverwaltung und -verarbeitung
- Stellt CRUD-Operationen für Blutdruckeinträge bereit
- Berechnet abgeleitete Daten wie Durchschnitte und Kategorien

### Komponenten

#### Dashboard

**BloodPressureSummary.js**
- Zeigt Zusammenfassung der Blutdruckdaten
- Visualisiert Durchschnittswerte und Kategorien
- Zeigt Min/Max-Werte und Trends

**BloodPressureChart.js**
- Visualisiert Blutdruckdaten als interaktives Liniendiagramm
- Unterstützt Morgen- und Abend-Ansichten
- Zeigt gleitende Durchschnitte und Referenzlinien an

**BloodPressureCategoryLegend.js**
- Erklärt die verschiedenen Blutdruckkategorien
- Zeigt Farbkodierung und Richtwerte an

#### Table

**BloodPressureTable.js**
- Tabellarische Ansicht aller Blutdruckeinträge
- Farbkodierung je nach Blutdruckkategorie
- Aktionen zum Bearbeiten und Löschen von Einträgen

#### Forms

**AddEntryForm.js**
- Formular zum Hinzufügen neuer Blutdruckeinträge
- Validiert Eingaben auf medizinische Plausibilität
- Automatische Aktualisierung des Wochentags basierend auf dem Datum

**EditEntryForm.js**
- Formular zum Bearbeiten bestehender Einträge
- Vorausgefüllt mit den bestehenden Werten
- Validierung wie bei AddEntryForm

**ImportModal.js**
- Dialog zum Importieren von CSV-Dateien
- Zeigt Vorschau der zu importierenden Daten
- Meldet erkannte Probleme und behandelt fehlende Werte

#### UI

**StatusMessage.js**
- Zeigt temporäre Erfolgs-, Fehler- und Infomeldungen
- Verschiedene Stile je nach Meldungstyp

**ToggleViewButtons.js**
- Schalter zum Umschalten zwischen Morgen- und Abendansicht

## Verwendete Bibliotheken

- React mit Hooks für die UI
- Recharts für interaktive Diagramme
- Lucide React für Symbole und Icons
- Tailwind CSS für das Styling

## Funktionen

- Erfassung von Blutdruckwerten (systolisch, diastolisch, Puls)
- Separate Erfassung von Morgen- und Abendwerten
- Automatische Kategorisierung nach medizinischen Standards
- Visualisierung als Liniendiagramm mit gleitenden Durchschnitten
- Berechnung von Durchschnittswerten und Trends
- Import von Daten aus CSV-Dateien
- Responsive Design für verschiedene Bildschirmgrößen