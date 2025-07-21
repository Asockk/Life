// Sync Service Tests
import syncService from '../syncService';
import { isOnline, queueForSync, requestBackgroundSync } from '../../serviceWorkerRegistrationEnhanced';

// Mock the service worker registration
jest.mock('../../serviceWorkerRegistrationEnhanced', () => ({
  isOnline: jest.fn(() => true),
  queueForSync: jest.fn(() => Promise.resolve(true)),
  requestBackgroundSync: jest.fn(() => Promise.resolve(true))
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Reset sync queue
    syncService.syncQueue = [];
    syncService.isSyncing = false;
  });

  describe('Queue Management', () => {
    test('queues data correctly when online', async () => {
      isOnline.mockReturnValue(true);
      
      const testData = {
        sys: 120,
        dia: 80,
        puls: 70
      };
      
      const id = await syncService.queueData('measurement', testData);
      
      expect(id).toBeTruthy();
      expect(syncService.syncQueue).toHaveLength(1);
      expect(syncService.syncQueue[0]).toMatchObject({
        type: 'measurement',
        data: expect.objectContaining(testData)
      });
    });

    test('queues data and requests background sync when offline', async () => {
      isOnline.mockReturnValue(false);
      
      const testData = {
        sys: 130,
        dia: 85,
        puls: 75
      };
      
      const id = await syncService.queueData('measurement', testData);
      
      expect(id).toBeTruthy();
      expect(queueForSync).toHaveBeenCalled();
      expect(syncService.syncQueue).toHaveLength(1);
    });

    test('saves queue to localStorage', async () => {
      const testData = { test: 'data' };
      
      await syncService.queueData('measurement', testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bp_sync_queue',
        expect.any(String)
      );
    });

    test('loads queue from localStorage', () => {
      const storedQueue = [
        { id: '1', type: 'measurement', data: {} }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedQueue));
      
      syncService.loadQueueFromStorage();
      
      expect(syncService.syncQueue).toEqual(storedQueue);
    });
  });

  describe('Sync Operations', () => {
    test('syncs queued items when online', async () => {
      isOnline.mockReturnValue(true);
      
      // Add items to queue
      syncService.syncQueue = [
        { id: '1', type: 'measurement', data: {}, retries: 0 },
        { id: '2', type: 'measurement', data: {}, retries: 0 }
      ];
      
      await syncService.syncNow();
      
      // Should clear queue after successful sync
      expect(syncService.syncQueue).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('does not sync when offline', async () => {
      isOnline.mockReturnValue(false);
      
      syncService.syncQueue = [
        { id: '1', type: 'measurement', data: {}, retries: 0 }
      ];
      
      const initialQueueLength = syncService.syncQueue.length;
      await syncService.syncNow();
      
      expect(syncService.syncQueue).toHaveLength(initialQueueLength);
    });

    test('handles sync failures with retry logic', async () => {
      isOnline.mockReturnValue(true);
      
      // Mock failed sync
      syncService.simulateServerSync = jest.fn()
        .mockRejectedValueOnce(new Error('Sync failed'))
        .mockResolvedValueOnce({ success: true });
      
      syncService.syncQueue = [
        { id: '1', type: 'measurement', data: {}, retries: 0 }
      ];
      
      await syncService.syncNow();
      
      // Item should still be in queue with increased retry count
      expect(syncService.syncQueue).toHaveLength(1);
      expect(syncService.syncQueue[0].retries).toBe(1);
    });

    test('removes items after max retries', async () => {
      isOnline.mockReturnValue(true);
      
      // Mock always failing sync
      syncService.simulateServerSync = jest.fn()
        .mockRejectedValue(new Error('Sync failed'));
      
      syncService.syncQueue = [
        { id: '1', type: 'measurement', data: {}, retries: 2 }
      ];
      
      await syncService.syncNow();
      
      // Item should be removed after 3rd retry
      expect(syncService.syncQueue).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    test('syncs when coming online', async () => {
      isOnline.mockReturnValue(true);
      const syncNowSpy = jest.spyOn(syncService, 'syncNow');
      
      await syncService.handleOnline();
      
      expect(syncNowSpy).toHaveBeenCalled();
    });

    test('notifies listeners of offline status', () => {
      const listener = jest.fn();
      syncService.addListener(listener);
      
      syncService.handleOffline();
      
      expect(listener).toHaveBeenCalledWith({ type: 'offline' });
    });

    test('handles sync complete from service worker', () => {
      const listener = jest.fn();
      syncService.addListener(listener);
      
      syncService.handleSyncComplete({ syncedCount: 5 });
      
      expect(listener).toHaveBeenCalledWith({
        type: 'sw-sync-complete',
        syncedCount: 5
      });
    });
  });

  describe('Status and Utilities', () => {
    test('returns correct sync status', () => {
      syncService.syncQueue = [
        { id: '1', type: 'measurement' },
        { id: '2', type: 'measurement' }
      ];
      syncService.isSyncing = true;
      
      const status = syncService.getStatus();
      
      expect(status).toEqual({
        online: true,
        syncing: true,
        queueLength: 2,
        queue: expect.any(Array)
      });
    });

    test('clears queue correctly', () => {
      syncService.syncQueue = [
        { id: '1', type: 'measurement' }
      ];
      
      syncService.clearQueue();
      
      expect(syncService.syncQueue).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bp_sync_queue',
        '[]'
      );
    });

    test('retries failed items', async () => {
      syncService.syncQueue = [
        { id: '1', type: 'measurement', data: {}, retries: 2 },
        { id: '2', type: 'measurement', data: {}, retries: 0 }
      ];
      
      await syncService.retryFailed();
      
      // Failed items should have retries reset
      expect(syncService.syncQueue.find(i => i.id === '1').retries).toBe(0);
    });

    test('adds and removes listeners correctly', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      const unsubscribe1 = syncService.addListener(listener1);
      syncService.addListener(listener2);
      
      syncService.notifyListeners({ type: 'test' });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      // Remove listener1
      unsubscribe1();
      
      listener1.mockClear();
      listener2.mockClear();
      
      syncService.notifyListeners({ type: 'test2' });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });
});