// IndexedDB Storage Service for Permanent Data Persistence
const DB_NAME = 'KumariFoodsDB';
const DB_VERSION = 1;
const COMPANIES_STORE = 'companies';
const SCHEDULES_STORE = 'schedules';

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(COMPANIES_STORE)) {
          db.createObjectStore(COMPANIES_STORE, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(SCHEDULES_STORE)) {
          db.createObjectStore(SCHEDULES_STORE, { keyPath: 'companyId' });
        }
      };
    });

    return this.initPromise;
  }

  private async getTransaction(
    storeName: string,
    mode: 'readonly' | 'readwrite' = 'readonly'
  ): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Companies Operations
  async getAllCompanies(): Promise<any[]> {
    try {
      const store = await this.getTransaction(COMPANIES_STORE);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting companies:', error);
      return [];
    }
  }

  async addCompany(company: any): Promise<void> {
    try {
      const store = await this.getTransaction(COMPANIES_STORE, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.add(company);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error adding company:', error);
    }
  }

  async updateCompany(company: any): Promise<void> {
    try {
      const store = await this.getTransaction(COMPANIES_STORE, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(company);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error updating company:', error);
    }
  }

  async deleteCompany(companyId: string): Promise<void> {
    try {
      const store = await this.getTransaction(COMPANIES_STORE, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(companyId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  }

  // Schedules Operations
  async getSchedule(companyId: string): Promise<any | null> {
    try {
      const store = await this.getTransaction(SCHEDULES_STORE);
      return new Promise((resolve, reject) => {
        const request = store.get(companyId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting schedule:', error);
      return null;
    }
  }

  async getAllSchedules(): Promise<Record<string, any>> {
    try {
      const store = await this.getTransaction(SCHEDULES_STORE);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const schedules: Record<string, any> = {};
          request.result.forEach((schedule) => {
            schedules[schedule.companyId] = schedule;
          });
          resolve(schedules);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting schedules:', error);
      return {};
    }
  }

  async updateSchedule(schedule: any): Promise<void> {
    try {
      const store = await this.getTransaction(SCHEDULES_STORE, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(schedule);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  }

  async deleteSchedule(companyId: string): Promise<void> {
    try {
      const store = await this.getTransaction(SCHEDULES_STORE, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(companyId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearStore(COMPANIES_STORE),
        this.clearStore(SCHEDULES_STORE)
      ]);
    } catch (error) {
      console.error('Error clearing database:', error);
    }
  }

  private async clearStore(storeName: string): Promise<void> {
    try {
      const store = await this.getTransaction(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
    }
  }

  // Export data
  async exportData(): Promise<{ companies: any[]; schedules: any[] }> {
    const companies = await this.getAllCompanies();
    const schedules = await this.getAllSchedules();
    return { companies, schedules: Object.values(schedules) };
  }

  // Import data
  async importData(data: { companies: any[]; schedules: any[] }): Promise<void> {
    await this.clearAll();
    
    for (const company of data.companies) {
      await this.addCompany(company);
    }
    
    for (const schedule of data.schedules) {
      await this.updateSchedule(schedule);
    }
  }

  // Check if data exists
  async hasData(): Promise<boolean> {
    const companies = await this.getAllCompanies();
    return companies.length > 0;
  }
}

export const storageService = new StorageService();
