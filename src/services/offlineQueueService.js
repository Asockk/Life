// services/offlineQueueService.js
// Offline-First Queue System für Datensynchronisation

import { openDB } from 'idb';

class OfflineQueueService {
  constructor() {
    this.dbName = 'blutdruck-offline-queue';
    this.storeName = 'pending-operations';
    this.db = null;
    this.syncInProgress = false;
    this.listeners = new Set();
  }

  // Initialisiere die IndexedDB für die Queue
  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending-operations')) {
          const store = db.createObjectStore('pending-operations', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
          store.createIndex('status', 'status');
        }
      }
    });

    return this.db;
  }

  // Füge eine Operation zur Queue hinzu
  async addToQueue(operation) {
    const db = await this.initDB();
    
    const queueItem = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      lastError: null
    };

    await db.add(this.storeName, queueItem);
    this.notifyListeners('added', queueItem);
    
    // Versuche sofort zu synchronisieren wenn online
    if (navigator.onLine) {
      this.processPendingOperations();
    }

    return queueItem;
  }

  // Hole alle ausstehenden Operationen
  async getPendingOperations() {
    const db = await this.initDB();
    const operations = await db.getAllFromIndex(
      this.storeName, 
      'status', 
      'pending'
    );
    return operations.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  }

  // Verarbeite alle ausstehenden Operationen
  async processPendingOperations() {
    if (this.syncInProgress || !navigator.onLine) return;
    
    this.syncInProgress = true;
    this.notifyListeners('sync-start');

    try {
      const operations = await this.getPendingOperations();
      
      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          await this.markAsCompleted(operation.id);
        } catch (error) {
          await this.handleOperationError(operation, error);
        }
      }
    } finally {
      this.syncInProgress = false;
      this.notifyListeners('sync-complete');
    }
  }

  // Verarbeite eine einzelne Operation
  async processOperation(operation) {
    switch (operation.type) {
      case 'add-entry':
        return await this.syncAddEntry(operation.data);
      case 'update-entry':
        return await this.syncUpdateEntry(operation.data);
      case 'delete-entry':
        return await this.syncDeleteEntry(operation.data);
      default:
        throw new Error(`Unbekannter Operationstyp: ${operation.type}`);
    }
  }

  // Synchronisiere Add-Entry Operation
  async syncAddEntry(data) {
    // Hier würde die tatsächliche Server-Synchronisation stattfinden
    // Für jetzt simulieren wir nur eine erfolgreiche Operation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Syncing add entry:', data);
        resolve({ success: true });
      }, 500);
    });
  }

  // Synchronisiere Update-Entry Operation
  async syncUpdateEntry(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Syncing update entry:', data);
        resolve({ success: true });
      }, 500);
    });
  }

  // Synchronisiere Delete-Entry Operation
  async syncDeleteEntry(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Syncing delete entry:', data);
        resolve({ success: true });
      }, 500);
    });
  }

  // Markiere Operation als abgeschlossen
  async markAsCompleted(operationId) {
    const db = await this.initDB();
    const operation = await db.get(this.storeName, operationId);
    
    if (operation) {
      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      await db.put(this.storeName, operation);
      this.notifyListeners('completed', operation);
    }
  }

  // Handle Fehler bei der Operation
  async handleOperationError(operation, error) {
    const db = await this.initDB();
    
    operation.retryCount++;
    operation.lastError = error.message;
    operation.lastRetryAt = new Date().toISOString();
    
    // Nach 3 Versuchen als fehlgeschlagen markieren
    if (operation.retryCount >= 3) {
      operation.status = 'failed';
    }
    
    await db.put(this.storeName, operation);
    this.notifyListeners('error', operation);
  }

  // Hole Anzahl der ausstehenden Operationen
  async getPendingCount() {
    const operations = await this.getPendingOperations();
    return operations.length;
  }

  // Lösche abgeschlossene Operationen (Cleanup)
  async cleanupCompleted(olderThanDays = 7) {
    const db = await this.initDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const operations = await db.getAll(this.storeName);
    
    for (const op of operations) {
      if (op.status === 'completed' && 
          new Date(op.completedAt) < cutoffDate) {
        await db.delete(this.storeName, op.id);
      }
    }
  }

  // Event Listener Management
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      callback({ event, data });
    });
  }

  // Netzwerk-Status Listener
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Wieder online - starte Synchronisation');
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('Offline - Operationen werden in Queue gespeichert');
    });
  }
}

// Singleton Instance
const offlineQueueService = new OfflineQueueService();
offlineQueueService.setupNetworkListeners();

export default offlineQueueService;