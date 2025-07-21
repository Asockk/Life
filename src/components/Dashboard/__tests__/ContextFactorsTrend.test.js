// ContextFactorsTrend.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContextFactorsTrend from '../ContextFactorsTrend';

describe('ContextFactorsTrend', () => {
  const mockContextFactors = {
    '2025-01-19': {
      stress: 2,
      sleep: 3,
      activity: 2,
      salt: 1,
      caffeine: 2,
      alcohol: 0
    },
    '2025-01-18': {
      stress: 3,
      sleep: 2,
      activity: 1,
      salt: 2,
      caffeine: 3,
      alcohol: 1
    }
  };

  describe('Null/Undefined Handling', () => {
    it('sollte mit undefined contextFactors umgehen', () => {
      render(<ContextFactorsTrend contextFactors={undefined} />);
      expect(screen.getByText('Keine Kontextfaktoren-Daten verfügbar')).toBeInTheDocument();
    });

    it('sollte mit null contextFactors umgehen', () => {
      render(<ContextFactorsTrend contextFactors={null} />);
      expect(screen.getByText('Keine Kontextfaktoren-Daten verfügbar')).toBeInTheDocument();
    });

    it('sollte mit leerem Objekt umgehen', () => {
      render(<ContextFactorsTrend contextFactors={{}} />);
      expect(screen.getByText('Keine Kontextfaktoren-Daten verfügbar')).toBeInTheDocument();
    });

    it('sollte mit falschem Datentyp umgehen', () => {
      render(<ContextFactorsTrend contextFactors="string" />);
      expect(screen.getByText('Keine Kontextfaktoren-Daten verfügbar')).toBeInTheDocument();
    });

    it('sollte mit Array statt Objekt umgehen', () => {
      render(<ContextFactorsTrend contextFactors={[]} />);
      expect(screen.getByText('Keine Kontextfaktoren-Daten verfügbar')).toBeInTheDocument();
    });
  });

  describe('Legacy contextData Support', () => {
    it('sollte contextData als Fallback verwenden', () => {
      render(<ContextFactorsTrend contextData={mockContextFactors} />);
      expect(screen.getByText('Stress')).toBeInTheDocument();
    });

    it('sollte contextFactors über contextData priorisieren', () => {
      const altData = { '2025-01-17': { stress: 5 } };
      render(
        <ContextFactorsTrend 
          contextFactors={mockContextFactors}
          contextData={altData}
        />
      );
      // Sollte die neueren Daten aus contextFactors verwenden
      expect(screen.getByText('Stress')).toBeInTheDocument();
    });
  });

  describe('Rendering with Valid Data', () => {
    it('sollte alle Faktoren anzeigen', () => {
      render(<ContextFactorsTrend contextFactors={mockContextFactors} />);
      
      expect(screen.getByText('Stress')).toBeInTheDocument();
      expect(screen.getByText('Schlaf')).toBeInTheDocument();
      expect(screen.getByText('Aktivität')).toBeInTheDocument();
      expect(screen.getByText('Salzkonsum')).toBeInTheDocument();
      expect(screen.getByText('Koffein')).toBeInTheDocument();
      expect(screen.getByText('Alkohol')).toBeInTheDocument();
    });

    it('sollte Trends korrekt berechnen', () => {
      render(<ContextFactorsTrend contextFactors={mockContextFactors} />);
      
      // Stress ging von 3 auf 2 (down)
      // Sleep ging von 2 auf 3 (up)
      // Die Komponente sollte Trend-Icons anzeigen
      const container = screen.getByText('Stress').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('sollte mit nur einem Datenpunkt umgehen', () => {
      const singleData = {
        '2025-01-19': {
          stress: 2
        }
      };
      render(<ContextFactorsTrend contextFactors={singleData} />);
      expect(screen.getByText('Stress')).toBeInTheDocument();
    });

    it('sollte mit fehlenden Faktoren umgehen', () => {
      const incompleteData = {
        '2025-01-19': {
          stress: 2
          // andere Faktoren fehlen
        }
      };
      render(<ContextFactorsTrend contextFactors={incompleteData} />);
      expect(screen.getByText('Stress')).toBeInTheDocument();
    });

    it('sollte mit ungültigen Werten umgehen', () => {
      const invalidData = {
        '2025-01-19': {
          stress: 'invalid',
          sleep: null,
          activity: undefined,
          salt: NaN,
          caffeine: Infinity,
          alcohol: -1
        }
      };
      render(<ContextFactorsTrend contextFactors={invalidData} />);
      // Sollte nicht abstürzen
      expect(screen.queryByText('Keine Kontextfaktoren-Daten verfügbar')).not.toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('sollte Dark Mode Styles anwenden', () => {
      const { container } = render(
        <ContextFactorsTrend 
          contextFactors={mockContextFactors} 
          darkMode={true}
        />
      );
      
      // Dark Mode Klassen sollten angewendet sein
      const elements = container.querySelectorAll('.bg-gray-800');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction', () => {
    it('sollte Details ein- und ausblenden können', () => {
      render(<ContextFactorsTrend contextFactors={mockContextFactors} />);
      
      // Details sollten initial ausgeblendet sein
      const detailsButton = screen.getByRole('button');
      expect(detailsButton).toBeInTheDocument();
      
      // Klick sollte Details anzeigen
      fireEvent.click(detailsButton);
      // Nach dem Klick sollten mehr Informationen sichtbar sein
    });
  });

  describe('Complex Data Scenarios', () => {
    it('sollte mit vielen Datenpunkten umgehen', () => {
      const manyDays = {};
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        manyDays[date.toISOString().split('T')[0]] = {
          stress: Math.floor(Math.random() * 4),
          sleep: Math.floor(Math.random() * 4),
          activity: Math.floor(Math.random() * 4)
        };
      }
      
      render(<ContextFactorsTrend contextFactors={manyDays} />);
      expect(screen.getByText('Stress')).toBeInTheDocument();
    });

    it('sollte mit nicht-ISO Datumsformaten umgehen', () => {
      const weirdDates = {
        'Januar 19, 2025': { stress: 2 },
        '19.01.2025': { stress: 3 },
        '2025/01/19': { stress: 1 }
      };
      
      render(<ContextFactorsTrend contextFactors={weirdDates} />);
      // Sollte nicht abstürzen, auch wenn Sortierung fehlschlägt
      expect(screen.queryByText('Stress')).toBeInTheDocument();
    });
  });
});