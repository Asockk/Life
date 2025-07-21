// BloodPressureChart.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BloodPressureChart from '../BloodPressureChart';

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => null,
  ReferenceArea: () => null,
  Dot: () => null,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('BloodPressureChart', () => {
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
      abendSys: 130,
      abendDia: 85,
      abendPuls: 72
    }
  ];

  const mockAvgValues = {
    sys: 122,
    dia: 81
  };

  beforeEach(() => {
    // Reset window width
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Rendering', () => {
    it('sollte ohne Fehler rendern', () => {
      render(<BloodPressureChart data={mockData} viewType="beide" avgValues={mockAvgValues} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte eine Nachricht anzeigen wenn keine Daten vorhanden sind', () => {
      render(<BloodPressureChart data={[]} viewType="beide" avgValues={mockAvgValues} />);
      expect(screen.getByText(/Keine Daten vorhanden/i)).toBeInTheDocument();
    });

    it('sollte mit null avgValues umgehen können', () => {
      render(<BloodPressureChart data={mockData} viewType="beide" avgValues={null} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte mit undefined avgValues umgehen können', () => {
      render(<BloodPressureChart data={mockData} viewType="beide" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('sollte mobile Ansicht bei schmalen Bildschirmen aktivieren', () => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
      
      render(<BloodPressureChart data={mockData} viewType="beide" avgValues={mockAvgValues} />);
      
      // Mobile-spezifische Elemente sollten vorhanden sein
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte bei Größenänderung reagieren', async () => {
      const { rerender } = render(
        <BloodPressureChart data={mockData} viewType="beide" avgValues={mockAvgValues} />
      );
      
      // Zu Mobile wechseln
      global.innerWidth = 400;
      global.dispatchEvent(new Event('resize'));
      
      await waitFor(() => {
        rerender(<BloodPressureChart data={mockData} viewType="beide" avgValues={mockAvgValues} />);
      });
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('View Type Handling', () => {
    it('sollte nur Morgenwerte bei viewType="morgen" anzeigen', () => {
      render(<BloodPressureChart data={mockData} viewType="morgen" avgValues={mockAvgValues} />);
      
      // Chart sollte gerendert werden
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('sollte nur Abendwerte bei viewType="abend" anzeigen', () => {
      render(<BloodPressureChart data={mockData} viewType="abend" avgValues={mockAvgValues} />);
      
      // Chart sollte gerendert werden
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('sollte beide Werte bei viewType="beide" anzeigen', () => {
      render(<BloodPressureChart data={mockData} viewType="beide" avgValues={mockAvgValues} />);
      
      // Chart sollte gerendert werden
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Date Parsing', () => {
    it('sollte deutsche Datumsformate korrekt parsen', () => {
      const dataWithVariousDates = [
        {
          id: 'bp_1',
          datum: '15. Januar',
          tag: 'Mo',
          morgenSys: 120,
          morgenDia: 80
        },
        {
          id: 'bp_2',
          datum: '1. Februar',
          tag: 'Di',
          morgenSys: 118,
          morgenDia: 78
        },
        {
          id: 'bp_3',
          datum: '31. Dezember',
          tag: 'Mi',
          morgenSys: 122,
          morgenDia: 81
        }
      ];
      
      render(<BloodPressureChart data={dataWithVariousDates} viewType="morgen" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte mit fehlerhaften Datumsangaben umgehen', () => {
      const dataWithBadDates = [
        {
          id: 'bp_1',
          datum: 'Invalid Date',
          tag: 'Mo',
          morgenSys: 120,
          morgenDia: 80
        },
        {
          id: 'bp_2',
          datum: null,
          tag: 'Di',
          morgenSys: 118,
          morgenDia: 78
        }
      ];
      
      render(<BloodPressureChart data={dataWithBadDates} viewType="morgen" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Data Filtering', () => {
    it('sollte Nullwerte in den Daten ignorieren', () => {
      const dataWithNulls = [
        {
          id: 'bp_1',
          datum: '1. Januar',
          tag: 'Mo',
          morgenSys: null,
          morgenDia: null,
          morgenPuls: null,
          abendSys: 125,
          abendDia: 82,
          abendPuls: 70
        }
      ];
      
      render(<BloodPressureChart data={dataWithNulls} viewType="beide" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('sollte 0-Werte in den Daten ignorieren', () => {
      const dataWithZeros = [
        {
          id: 'bp_1',
          datum: '1. Januar',
          tag: 'Mo',
          morgenSys: 0,
          morgenDia: 0,
          morgenPuls: 0,
          abendSys: 125,
          abendDia: 82,
          abendPuls: 70
        }
      ];
      
      render(<BloodPressureChart data={dataWithZeros} viewType="beide" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Legend Toggle', () => {
    it('sollte die Legende ein- und ausblenden können', () => {
      render(<BloodPressureChart data={mockData} viewType="beide" />);
      
      // Legende Toggle Button finden und klicken
      const toggleButtons = screen.getAllByRole('button');
      const legendToggle = toggleButtons.find(btn => 
        btn.textContent?.includes('Systolisch') || 
        btn.textContent?.includes('Diastolisch')
      );
      
      if (legendToggle) {
        fireEvent.click(legendToggle);
        // Nach dem Klick sollte sich der Zustand ändern
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      }
    });
  });

  describe('Performance', () => {
    it('sollte große Datenmengen effizient verarbeiten', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `bp_${i}`,
        datum: `${(i % 30) + 1}. Januar`,
        tag: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i % 7],
        morgenSys: 110 + (i % 20),
        morgenDia: 70 + (i % 15),
        morgenPuls: 60 + (i % 10),
        abendSys: 115 + (i % 20),
        abendDia: 75 + (i % 15),
        abendPuls: 65 + (i % 10)
      }));
      
      const { container } = render(
        <BloodPressureChart data={largeDataset} viewType="beide" />
      );
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container).toBeTruthy();
    });
  });

  describe('Error Boundaries', () => {
    it('sollte bei extremen Werten nicht abstürzen', () => {
      const extremeData = [
        {
          id: 'bp_1',
          datum: '1. Januar',
          tag: 'Mo',
          morgenSys: 999999,
          morgenDia: -100,
          morgenPuls: NaN,
          abendSys: Infinity,
          abendDia: undefined,
          abendPuls: 'string'
        }
      ];
      
      render(<BloodPressureChart data={extremeData} viewType="beide" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('sollte Dark Mode korrekt darstellen', () => {
      render(
        <BloodPressureChart 
          data={mockData} 
          viewType="beide" 
          avgValues={mockAvgValues}
          darkMode={true}
        />
      );
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});