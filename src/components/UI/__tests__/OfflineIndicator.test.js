// OfflineIndicator Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfflineIndicator from '../OfflineIndicator';
import syncService from '../../../services/syncService';

// Mock sync service
let mockCallback = null;
jest.mock('../../../services/syncService', () => ({
  __esModule: true,
  default: {
    getStatus: jest.fn(() => ({
      online: true,
      syncing: false,
      queueLength: 0,
      queue: []
    })),
    addListener: jest.fn((callback) => {
      // Store callback for testing
      mockCallback = callback;
      return jest.fn(); // Return unsubscribe function
    }),
    syncNow: jest.fn(() => Promise.resolve()),
    retryFailed: jest.fn(() => Promise.resolve())
  }
}));

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallback = null;
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  test('does not render when online and no pending items', () => {
    const { container } = render(<OfflineIndicator darkMode={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('renders offline indicator when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText(/Keine Internetverbindung/i)).toBeInTheDocument();
  });

  test('renders sync indicator when items are pending', () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: false,
      queueLength: 5,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    expect(screen.getByText('5 ausstehend')).toBeInTheDocument();
  });

  test('shows syncing state', () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: true,
      queueLength: 3,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    expect(screen.getByText('Synchronisiere...')).toBeInTheDocument();
  });

  test('toggles details panel on click', () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: false,
      queueLength: 2,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    const indicator = screen.getByText('2 ausstehend').closest('div');
    fireEvent.click(indicator);
    
    expect(screen.getByText('Synchronisationsstatus')).toBeInTheDocument();
    expect(screen.getByText('Verbindung:')).toBeInTheDocument();
    expect(screen.getByText('Ausstehende Einträge:')).toBeInTheDocument();
  });

  test('handles sync button click', async () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: false,
      queueLength: 3,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    // Open details
    const indicator = screen.getByText('3 ausstehend').closest('div');
    fireEvent.click(indicator);
    
    // Click sync button
    const syncButton = screen.getByText('Jetzt synchronisieren');
    fireEvent.click(syncButton);
    
    await waitFor(() => {
      expect(syncService.syncNow).toHaveBeenCalled();
    });
  });

  test('shows retry button for failed items', async () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: false,
      queueLength: 2,
      queue: [
        { id: '1', retries: 0 },
        { id: '2', retries: 2 }
      ]
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    // Open details
    const indicator = screen.getByText('2 ausstehend').closest('div');
    fireEvent.click(indicator);
    
    // Should show retry button
    const retryButton = screen.getByText('Fehlgeschlagene wiederholen');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(syncService.retryFailed).toHaveBeenCalled();
    });
  });

  test('responds to online/offline events', () => {
    const { rerender } = render(<OfflineIndicator darkMode={false} />);
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));
    
    rerender(<OfflineIndicator darkMode={false} />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
    
    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
    
    rerender(<OfflineIndicator darkMode={false} />);
    
    // Should show "Verbindung wiederhergestellt" message
    expect(screen.getByText('Verbindung wiederhergestellt')).toBeInTheDocument();
  });

  test('responds to sync events', () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: false,
      queueLength: 1,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    // Simulate sync start event
    if (mockCallback) {
      mockCallback({ type: 'sync-start' });
    }
    
    expect(screen.getByText('Synchronisiere...')).toBeInTheDocument();
    
    // Simulate sync complete event
    if (mockCallback) {
      mockCallback({ 
        type: 'sync-complete',
        synced: [{ id: '1' }, { id: '2' }]
      });
    }
    
    expect(screen.getByText('2 Einträge synchronisiert')).toBeInTheDocument();
  });

  test('dark mode styling applied correctly', () => {
    syncService.getStatus.mockReturnValue({
      online: false,
      syncing: false,
      queueLength: 0,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={true} />);
    
    // Open details
    const indicator = screen.getByText('Offline').closest('div');
    fireEvent.click(indicator);
    
    const detailsPanel = screen.getByText('Synchronisationsstatus').closest('div');
    expect(detailsPanel).toHaveClass('bg-gray-900');
  });

  test('closes details panel', () => {
    syncService.getStatus.mockReturnValue({
      online: true,
      syncing: false,
      queueLength: 1,
      queue: []
    });
    
    render(<OfflineIndicator darkMode={false} />);
    
    // Open details
    const indicator = screen.getByText('1 ausstehend').closest('div');
    fireEvent.click(indicator);
    
    expect(screen.getByText('Synchronisationsstatus')).toBeInTheDocument();
    
    // Close details
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Synchronisationsstatus')).not.toBeInTheDocument();
  });
});