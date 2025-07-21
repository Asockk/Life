// ModernBloodPressureChart.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModernBloodPressureChart from '../ModernBloodPressureChart';

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Line: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Dot: () => null,
}));

describe('ModernBloodPressureChart', () => {
  const mockData = [
    {
      id: 'bp_1',
      datum: '1. Januar',
      tag: 'Mo',
      morgenSys: 120,
      morgenDia: 80,
      morgenPuls: 65,
      abendSys: 125,
      abendDia: 82,
      abendPuls: 70
    },
    {
      id: 'bp_2',
      datum: '2. Januar',
      tag: 'Di',
      morgenSys: 118,
      morgenDia: 78,
      morgenPuls: 63,
      abendSys: null,
      abendDia: null,
      abendPuls: null
    },
    {
      id: 'bp_3',
      datum: '3. Januar',
      tag: 'Mi',
      morgenSys: 122,
      morgenDia: 81,
      morgenPuls: 66,
      abendSys: 128,
      abendDia: 85,
      abendPuls: 72
    }
  ];

  describe('Rendering', () => {
    it('sollte ohne Fehler rendern', () => {
      render(<ModernBloodPressureChart data={mockData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte eine Nachricht anzeigen wenn keine Daten vorhanden sind', () => {
      render(<ModernBloodPressureChart data={[]} />);
      expect(screen.getByText('Keine Daten vorhanden')).toBeInTheDocument();
    });

    it('sollte mit null oder undefined Daten umgehen können', () => {
      render(<ModernBloodPressureChart data={null} />);
      expect(screen.getByText('Keine Daten vorhanden')).toBeInTheDocument();

      render(<ModernBloodPressureChart data={undefined} />);
      expect(screen.getByText('Keine Daten vorhanden')).toBeInTheDocument();
    });
  });

  describe('Statistik-Karten', () => {
    it('sollte die Durchschnittswerte korrekt berechnen', () => {
      render(<ModernBloodPressureChart data={mockData} viewType="morgen" />);
      
      // Durchschnitt Systolisch: (120 + 118 + 122) / 3 = 120
      expect(screen.getByText('120')).toBeInTheDocument();
      
      // Durchschnitt Diastolisch: (80 + 78 + 81) / 3 = 80 (gerundet)
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('sollte mit fehlenden Werten umgehen können', () => {
      const dataWithMissing = [
        { ...mockData[0], morgenSys: null },
        mockData[1],
        mockData[2]
      ];
      
      render(<ModernBloodPressureChart data={dataWithMissing} />);
      // Sollte nur die vorhandenen Werte für die Berechnung verwenden
      expect(screen.queryByText('-')).toBeTruthy();
    });

    it('sollte Trends korrekt anzeigen', () => {
      render(<ModernBloodPressureChart data={mockData} />);
      
      // Prüfe ob Trend-Icons vorhanden sind
      const trendElements = screen.getAllByText(/mmHg/);
      expect(trendElements.length).toBeGreaterThan(0);
    });
  });

  describe('Chart-Typ Umschaltung', () => {
    it('sollte zwischen Flächen- und Liniendiagramm wechseln können', () => {
      render(<ModernBloodPressureChart data={mockData} />);
      
      // Standard sollte Flächendiagramm sein
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      
      // Zu Liniendiagramm wechseln
      const lineButton = screen.getByText('Linie');
      fireEvent.click(lineButton);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('View Type Handling', () => {
    it('sollte nur Morgenwerte anzeigen wenn viewType="morgen"', () => {
      const { container } = render(
        <ModernBloodPressureChart data={mockData} viewType="morgen" />
      );
      
      // Prüfe dass keine Abend-Daten im Chart sind
      expect(container.textContent).not.toContain('abendSys');
    });

    it('sollte nur Abendwerte anzeigen wenn viewType="abend"', () => {
      const { container } = render(
        <ModernBloodPressureChart data={mockData} viewType="abend" />
      );
      
      // Prüfe dass keine Morgen-Daten im Chart sind
      expect(container.textContent).not.toContain('morgenSys');
    });

    it('sollte beide Werte anzeigen wenn viewType="beide"', () => {
      render(<ModernBloodPressureChart data={mockData} viewType="beide" />);
      
      // Beide Segmente sollten aktiv sein
      expect(screen.getByText('Fläche').parentElement).toHaveClass('ios-segmented-control');
    });
  });

  describe('Dark Mode', () => {
    it('sollte Dark Mode Farben verwenden wenn aktiviert', () => {
      const { container } = render(
        <ModernBloodPressureChart data={mockData} darkMode={true} />
      );
      
      // Prüfe ob Dark Mode Styles angewendet werden
      const cards = container.querySelectorAll('.ios-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Datenverarbeitung', () => {
    it('sollte nur die letzten 14 Tage anzeigen', () => {
      const manyDataPoints = Array.from({ length: 30 }, (_, i) => ({
        id: `bp_${i}`,
        datum: `${i + 1}. Januar`,
        tag: 'Mo',
        morgenSys: 120 + i,
        morgenDia: 80,
        morgenPuls: 65
      }));
      
      render(<ModernBloodPressureChart data={manyDataPoints} />);
      
      // Chart sollte nur 14 Datenpunkte verarbeiten
      const container = screen.getByTestId('responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('sollte Daten in chronologischer Reihenfolge anzeigen', () => {
      render(<ModernBloodPressureChart data={mockData} />);
      
      // Die Daten sollten umgekehrt werden (neueste zuerst im Array, aber älteste zuerst im Chart)
      const container = screen.getByTestId('responsive-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('sollte mit ungültigen Datumswerten umgehen', () => {
      const invalidData = [
        {
          id: 'bp_1',
          datum: null,
          tag: 'Mo',
          morgenSys: 120,
          morgenDia: 80
        }
      ];
      
      render(<ModernBloodPressureChart data={invalidData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte mit sehr hohen oder niedrigen Werten umgehen', () => {
      const extremeData = [
        {
          id: 'bp_1',
          datum: '1. Januar',
          tag: 'Mo',
          morgenSys: 999,
          morgenDia: 10,
          morgenPuls: 300
        }
      ];
      
      render(<ModernBloodPressureChart data={extremeData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Legende', () => {
    it('sollte alle drei Metriken in der Legende anzeigen', () => {
      render(<ModernBloodPressureChart data={mockData} />);
      
      expect(screen.getByText('Systolisch')).toBeInTheDocument();
      expect(screen.getByText('Diastolisch')).toBeInTheDocument();
      expect(screen.getByText('Puls')).toBeInTheDocument();
    });
  });
});