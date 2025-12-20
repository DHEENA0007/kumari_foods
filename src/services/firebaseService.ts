// Firebase Service - Firestore Database
import { db } from '@/config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query,
  writeBatch 
} from 'firebase/firestore';
import type { Company, MealSchedule, WeeklySchedule } from '@/types';

const COMPANIES_COLLECTION = 'companies';
const MEAL_SCHEDULES_COLLECTION = 'mealSchedules';
const WEEKLY_SCHEDULES_COLLECTION = 'weeklySchedules';

class FirebaseService {
  isConfigured(): boolean {
    return true; // Firebase is always configured once initialized
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to access Firestore to test connection
      await getDocs(query(collection(db, COMPANIES_COLLECTION)));
      console.log('✅ Firebase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test error:', error);
      return false;
    }
  }

  // Companies Operations
  async addCompany(company: Company): Promise<void> {
    try {
      await setDoc(doc(db, COMPANIES_COLLECTION, company.id), company);
      console.log('Company added to Firebase:', company.id);
    } catch (error) {
      console.error('Error adding company to Firebase:', error);
      throw error;
    }
  }

  async updateCompany(company: Company): Promise<void> {
    try {
      await setDoc(doc(db, COMPANIES_COLLECTION, company.id), company, { merge: true });
      console.log('Company updated in Firebase:', company.id);
    } catch (error) {
      console.error('Error updating company in Firebase:', error);
      throw error;
    }
  }

  async deleteCompany(companyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COMPANIES_COLLECTION, companyId));
      console.log('Company deleted from Firebase:', companyId);
    } catch (error) {
      console.error('Error deleting company from Firebase:', error);
      throw error;
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COMPANIES_COLLECTION));
      const companies: Company[] = [];
      querySnapshot.forEach((docSnapshot) => {
        companies.push(docSnapshot.data() as Company);
      });
      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  // Monthly Meal Schedules Operations
  async getAllMealSchedules(): Promise<Record<string, MealSchedule[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, MEAL_SCHEDULES_COLLECTION));
      const mealSchedules: Record<string, MealSchedule[]> = {};
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        mealSchedules[data.companyId] = data.schedules || [];
      });
      
      return mealSchedules;
    } catch (error) {
      console.error('Error fetching meal schedules:', error);
      return {};
    }
  }

  async saveMealSchedules(companyId: string, schedules: MealSchedule[]): Promise<void> {
    try {
      await setDoc(doc(db, MEAL_SCHEDULES_COLLECTION, companyId), {
        companyId,
        schedules,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Meal schedules saved to Firebase:', companyId);
    } catch (error) {
      console.error('Error saving meal schedules to Firebase:', error);
      throw error;
    }
  }

  async deleteMealSchedules(companyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, MEAL_SCHEDULES_COLLECTION, companyId));
      console.log('Meal schedules deleted from Firebase:', companyId);
    } catch (error) {
      console.error('Error deleting meal schedules from Firebase:', error);
      throw error;
    }
  }

  // Weekly Schedules Operations
  async getAllWeeklySchedules(): Promise<WeeklySchedule[]> {
    try {
      const querySnapshot = await getDocs(collection(db, WEEKLY_SCHEDULES_COLLECTION));
      const weeklySchedules: WeeklySchedule[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        weeklySchedules.push(docSnapshot.data() as WeeklySchedule);
      });
      
      return weeklySchedules;
    } catch (error) {
      console.error('Error fetching weekly schedules:', error);
      return [];
    }
  }

  async saveWeeklySchedule(schedule: WeeklySchedule): Promise<void> {
    try {
      await setDoc(doc(db, WEEKLY_SCHEDULES_COLLECTION, schedule.id), schedule);
      console.log('Weekly schedule saved to Firebase:', schedule.id);
    } catch (error) {
      console.error('Error saving weekly schedule to Firebase:', error);
      throw error;
    }
  }

  async updateWeeklySchedule(schedule: WeeklySchedule): Promise<void> {
    try {
      await setDoc(doc(db, WEEKLY_SCHEDULES_COLLECTION, schedule.id), schedule, { merge: true });
      console.log('Weekly schedule updated in Firebase:', schedule.id);
    } catch (error) {
      console.error('Error updating weekly schedule in Firebase:', error);
      throw error;
    }
  }

  async deleteWeeklySchedule(scheduleId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, WEEKLY_SCHEDULES_COLLECTION, scheduleId));
      console.log('Weekly schedule deleted from Firebase:', scheduleId);
    } catch (error) {
      console.error('Error deleting weekly schedule from Firebase:', error);
      throw error;
    }
  }

  async saveAllData(companies: Company[], mealSchedules: Record<string, MealSchedule[]>): Promise<void> {
    try {
      // Helper to remove undefined values (Firebase doesn't accept undefined)
      const sanitizeData = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) return obj.map(sanitizeData);
        if (typeof obj === 'object') {
          const sanitized: any = {};
          Object.entries(obj).forEach(([key, value]) => {
            if (value !== undefined) {
              sanitized[key] = sanitizeData(value);
            }
          });
          return sanitized;
        }
        return obj;
      };

      const batch = writeBatch(db);

      // Add all companies to batch
      companies.forEach((company) => {
        const companyRef = doc(db, COMPANIES_COLLECTION, company.id);
        const sanitizedCompany = sanitizeData(company);
        batch.set(companyRef, sanitizedCompany);
      });

      // Add all meal schedules to batch
      Object.entries(mealSchedules).forEach(([companyId, schedules]) => {
        const schedulesRef = doc(db, MEAL_SCHEDULES_COLLECTION, companyId);
        const sanitizedSchedules = sanitizeData(schedules);
        batch.set(schedulesRef, {
          companyId,
          schedules: sanitizedSchedules,
          updatedAt: new Date().toISOString()
        });
      });

      // Commit the batch
      await batch.commit();
      console.log('✅ All data synced to Firebase successfully');
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
