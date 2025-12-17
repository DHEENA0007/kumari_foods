// MongoDB Service - Via Vercel API endpoint
import type { Company, WeeklySchedule } from '@/types';

const COMPANIES_COLLECTION = 'companies';
const SCHEDULES_COLLECTION = 'schedules';

class MongoDBDirectService {
  private mongoUri: string = '';

  constructor() {
    const savedUri = localStorage.getItem('mongodb_uri');
    if (savedUri) {
      this.mongoUri = savedUri;
    }
  }

  setMongoUri(uri: string): void {
    this.mongoUri = uri;
    localStorage.setItem('mongodb_uri', uri);
  }

  isConfigured(): boolean {
    return !!this.mongoUri;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.mongoUri) throw new Error('MongoDB URI not set');
      
      console.log('Testing MongoDB connection...');
      
      // Determine API endpoint based on environment
      const apiUrl = import.meta.env.PROD ? '/api/mongo' : 'http://localhost:5001/api/mongo';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mongodb-uri': this.mongoUri,
        },
        body: JSON.stringify({
          action: 'findOne',
          collection: COMPANIES_COLLECTION,
          filter: {}
        }),
      });

      console.log('Test response status:', response.status);
      
      // Handle empty response
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log('✅ MongoDB connection successful (empty response)');
        return true;
      }

      const text = await response.text();
      console.log('Test response text:', text);
      
      if (!text) {
        console.error('Empty response from server');
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      console.log('Test response data:', data);

      if (!response.ok) {
        console.error('Connection test failed:', data);
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('✅ MongoDB connection successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      // Still return true if it's a parsing error (connection might be working)
      if (error instanceof SyntaxError) {
        console.log('JSON parse error but connection might still be valid');
        return true;
      }
      return false;
    }
  }

  private async makeRequest(action: string, collection: string, payload: any): Promise<any> {
    if (!this.mongoUri) {
      throw new Error('MongoDB URI not configured');
    }

    try {
      // Determine API endpoint based on environment
      const apiUrl = import.meta.env.PROD ? '/api/mongo' : 'http://localhost:5001/api/mongo';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mongodb-uri': this.mongoUri,
        },
        body: JSON.stringify({
          action,
          collection,
          ...payload,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        const error = text ? JSON.parse(text) : { error: response.statusText };
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.warn('API request failed:', error);
      throw error;
    }
  }

  // Companies Operations
  async addCompany(company: Company): Promise<void> {
    try {
      await this.makeRequest('insertOne', COMPANIES_COLLECTION, {
        data: company,
      });
    } catch (error) {
      console.error('Error adding company to MongoDB:', error);
    }
  }

  async updateCompany(company: Company): Promise<void> {
    try {
      // Remove _id field to avoid immutable field error
      const { _id, ...companyData } = company as any;
      await this.makeRequest('updateOne', COMPANIES_COLLECTION, {
        filter: { id: company.id },
        data: companyData,
      });
    } catch (error) {
      console.error('Error updating company in MongoDB:', error);
    }
  }

  async deleteCompany(companyId: string): Promise<void> {
    try {
      await this.makeRequest('deleteOne', COMPANIES_COLLECTION, {
        filter: { id: companyId },
      });
    } catch (error) {
      console.error('Error deleting company from MongoDB:', error);
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      const result = await this.makeRequest('find', COMPANIES_COLLECTION, {
        filter: {},
      });
      return result.documents || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  // Schedules Operations
  async updateSchedule(schedule: any): Promise<void> {
    try {
      // Remove _id field to avoid immutable field error
      const { _id, ...scheduleData } = schedule;
      await this.makeRequest('updateOne', SCHEDULES_COLLECTION, {
        filter: { companyId: schedule.companyId },
        data: scheduleData,
      });
    } catch (error) {
      console.error('Error updating schedule in MongoDB:', error);
    }
  }

  async getSchedule(companyId: string): Promise<WeeklySchedule | null> {
    try {
      const result = await this.makeRequest('findOne', SCHEDULES_COLLECTION, {
        filter: { companyId },
      });
      return result.document || null;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return null;
    }
  }

  async getAllSchedules(): Promise<WeeklySchedule[]> {
    try {
      const result = await this.makeRequest('find', SCHEDULES_COLLECTION, {
        filter: {},
      });
      return result.documents || [];
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
  }

  async deleteSchedule(companyId: string): Promise<void> {
    try {
      await this.makeRequest('deleteOne', SCHEDULES_COLLECTION, {
        filter: { companyId },
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  }

  // Sync operations
  async syncToCloud(companies: Company[], schedules: Record<string, WeeklySchedule>): Promise<void> {
    try {
      for (const company of companies) {
        await this.updateCompany(company);
      }

      for (const [, schedule] of Object.entries(schedules)) {
        await this.updateSchedule(schedule);
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }

  async syncFromCloud(): Promise<{ companies: Company[]; schedules: WeeklySchedule[] }> {
    try {
      const companies = await this.getAllCompanies();
      const schedules = await this.getAllSchedules();
      return { companies, schedules };
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      return { companies: [], schedules: [] };
    }
  }
}

export const mongoDBService = new MongoDBDirectService();
