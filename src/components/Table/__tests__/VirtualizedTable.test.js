import React from 'react';
import { render, screen } from '@testing-library/react';
import VirtualizedTable from '../VirtualizedTable';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize, height }) => (
    <div data-testid="virtual-list" style={{ height }}>
      {Array.from({ length: Math.min(10, itemCount) }).map((_, index) => 
        children({ index, style: { height: itemSize, top: index * itemSize } })
      )}
    </div>
  )
}));

describe('VirtualizedTable Performance Tests', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  // Generate test data
  const generateTestData = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `test-${i}`,
      datum: `${(i % 30) + 1}. Januar 2024`,
      tag: 'Mo',
      wochentag: 'Mo',
      morgenSys: 120 + (i % 20),
      morgenDia: 80 + (i % 10),
      morgenPuls: 70 + (i % 15),
      abendSys: 125 + (i % 20),
      abendDia: 82 + (i % 10),
      abendPuls: 72 + (i % 15),
      notizen: `Test note ${i}`
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  test('renders without performance issues with 1000 entries', () => {
    const bigData = generateTestData(1000);
    const startTime = performance.now();
    
    const { container } = render(
      <VirtualizedTable
        data={bigData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        darkMode={false}
      />
    );
    
    const renderTime = performance.now() - startTime;
    
    // Should render in less than 100ms even with 1000 entries
    expect(renderTime).toBeLessThan(100);
    
    // Should only render visible items (not all 1000)
    const renderedRows = container.querySelectorAll('[style*="height"]');
    expect(renderedRows.length).toBeLessThan(20); // Only visible rows
    
    // Should show count
    expect(screen.getByText('1000 von 1000 Einträgen')).toBeInTheDocument();
  });

  test('filters data efficiently', () => {
    const data = generateTestData(100);
    
    const { rerender } = render(
      <VirtualizedTable
        data={data}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        darkMode={false}
        searchQuery=""
      />
    );
    
    // Apply search filter
    const startTime = performance.now();
    rerender(
      <VirtualizedTable
        data={data}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        darkMode={false}
        searchQuery="Test note 5"
      />
    );
    const filterTime = performance.now() - startTime;
    
    // Filtering should be fast
    expect(filterTime).toBeLessThan(50);
    
    // Should show filtered count
    expect(screen.getByText(/von 100 Einträgen/)).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    render(
      <VirtualizedTable
        data={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        darkMode={false}
      />
    );
    
    expect(screen.getByText('Noch keine Einträge vorhanden')).toBeInTheDocument();
  });

  test('handles mobile dimensions', () => {
    // Set mobile dimensions
    window.innerWidth = 375;
    window.innerHeight = 667;
    
    const data = generateTestData(50);
    
    render(
      <VirtualizedTable
        data={data}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        darkMode={true}
      />
    );
    
    // Should render successfully on mobile
    expect(screen.getByText('50 von 50 Einträgen')).toBeInTheDocument();
  });
});