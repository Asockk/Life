// Sync Service for Offline-First Functionality
import { queueForSync, requestBackgroundSync, isOnline } from '../serviceWorkerRegistrationEnhanced';

class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.listeners = new Set();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Listen for sync complete events
    window.addEventListener('swSyncComplete', (event) => {
      this.handleSyncComplete(event.detail);
    });
  }

  // Add a listener for sync events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => callback(event));
  }

  // Queue data for sync
  async queueData(type, data) {
    const syncItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: {
        ...data,
        lastModified: Date.now(),
        offline: !isOnline()
      },
      timestamp: Date.now(),
      retries: 0
    };

    // Add to local queue
    this.syncQueue.push(syncItem);
    
    // Save to localStorage as backup
    this.saveQueueToStorage();
    
    // If online, try to sync immediately
    if (isOnline()) {
      await this.syncNow();
    } else {
      // Queue for background sync
      await queueForSync(syncItem);
      this.notifyListeners({
        type: 'queued',
        item: syncItem
      });
    }
    
    return syncItem.id;
  }

  // Save queue to localStorage
  saveQueueToStorage() {
    try {
      localStorage.setItem('bp_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Load queue from localStorage
  loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('bp_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Sync now (when online)
  async syncNow() {
    if (this.isSyncing || !isOnline()) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync-start' });

    try {
      // Load any queued items from storage
      this.loadQueueFromStorage();
      
      const itemsToSync = [...this.syncQueue];
      const syncedItems = [];
      const failedItems = [];

      for (const item of itemsToSync) {
        try {
          // In a real app, this would sync to a server
          // For now, we'll just simulate success
          await this.simulateServerSync(item);
          
          syncedItems.push(item);
          
          // Remove from queue
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        } catch (error) {
          console.error('Sync failed for item:', item.id, error);
          
          item.retries++;
          if (item.retries >= 3) {
            failedItems.push(item);
            this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          }
        }
      }

      // Save updated queue
      this.saveQueueToStorage();

      // Request background sync if items remain
      if (this.syncQueue.length > 0) {
        await requestBackgroundSync();
      }

      this.notifyListeners({
        type: 'sync-complete',
        synced: syncedItems,
        failed: failedItems,
        remaining: this.syncQueue.length
      });

    } finally {
      this.isSyncing = false;
    }
  }

  // Simulate server sync (in real app, this would be an API call)
  async simulateServerSync(item) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve({ success: true, id: item.id });
        } else {
          reject(new Error('Simulated sync failure'));
        }
      }, 500);
    });
  }

  // Handle coming online
  async handleOnline() {
    console.log('App is online, syncing...');
    this.notifyListeners({ type: 'online' });
    await this.syncNow();
  }

  // Handle going offline
  handleOffline() {
    console.log('App is offline');
    this.notifyListeners({ type: 'offline' });
  }

  // Handle sync complete from service worker
  handleSyncComplete(detail) {
    console.log('Service worker sync complete:', detail);
    
    // Reload queue from storage in case SW synced items
    this.loadQueueFromStorage();
    
    this.notifyListeners({
      type: 'sw-sync-complete',
      ...detail
    });
  }

  // Get sync status
  getStatus() {
    return {
      online: isOnline(),
      syncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      queue: [...this.syncQueue]
    };
  }

  // Clear sync queue (use with caution)
  clearQueue() {
    this.syncQueue = [];
    this.saveQueueToStorage();
    this.notifyListeners({ type: 'queue-cleared' });
  }

  // Retry failed items
  async retryFailed() {
    const failed = this.syncQueue.filter(item => item.retries > 0);
    failed.forEach(item => item.retries = 0);
    await this.syncNow();
  }
}

// Singleton instance
const syncService = new SyncService();

// Auto-sync when app loads if online
if (isOnline()) {
  syncService.syncNow();
}

export default syncService;