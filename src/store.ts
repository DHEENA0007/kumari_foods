import { create } from 'zustand';
import type { AppState, Company, DayOfWeek, MealTime, AccountDetails, MealSchedule, DateBasedMealEntry } from './types';
import { firebaseService } from '@/services/firebaseService';

export const useStore = create<AppState>((set, get) => ({
  companies: [],
  schedules: {}, // Legacy, not used
  mealSchedules: {},
  selectedCompanyId: null,

  addCompany: async (name: string, accountDetails?: AccountDetails) => {
    const newCompany: Company = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      accountDetails
    };
    
    set((state) => ({
      companies: [...state.companies, newCompany],
      selectedCompanyId: newCompany.id
    }));
    
    // Save to Firebase immediately
    try {
      await firebaseService.addCompany(newCompany);
      console.log('✅ Company added to Firebase');
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      throw error;
    }
  },

  updateCompany: async (id: string, name: string, accountDetails?: AccountDetails) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, name, accountDetails } : c
      )
    }));
    
    const state = get();
    const company = state.companies.find(c => c.id === id);
    if (company) {
      try {
        await firebaseService.updateCompany(company);
        console.log('✅ Company updated in Firebase');
      } catch (error) {
        console.error('Error updating Firebase:', error);
        throw error;
      }
    }
  },

  deleteCompany: async (id: string) => {
    set((state) => {
      const newMealSchedules = { ...state.mealSchedules };
      delete newMealSchedules[id];
      
      return {
        companies: state.companies.filter((c) => c.id !== id),
        mealSchedules: newMealSchedules,
        selectedCompanyId: state.selectedCompanyId === id ? null : state.selectedCompanyId
      };
    });
    
    // Delete from Firebase
    try {
      await firebaseService.deleteCompany(id);
      console.log('✅ Company deleted from Firebase');
    } catch (error) {
      console.error('Error deleting from Firebase:', error);
      throw error;
    }
  },

  selectCompany: (id: string | null) => {
    set({ selectedCompanyId: id });
  },

  updateMeal: (_companyId: string, _day: DayOfWeek, _mealTime: MealTime, _foodName: string) => {
    // This method is deprecated - only monthly schedules are used now
    console.log('updateMeal is deprecated, use monthly schedules instead');
  },

  addMealSchedule: async (companyId: string, schedule: MealSchedule) => {
    set((state) => {
      const existingSchedules = state.mealSchedules[companyId] || [];
      // Remove if schedule for same month already exists
      const filtered = existingSchedules.filter(s => s.month !== schedule.month);
      return {
        mealSchedules: {
          ...state.mealSchedules,
          [companyId]: [...filtered, schedule]
        }
      };
    });
    // Data updated in state only, will be saved when user clicks Save button
  },

  updateMealSchedule: async (companyId: string, scheduleMonth: string, entries: DateBasedMealEntry[]) => {
    set((state) => {
      const existingSchedules = state.mealSchedules[companyId] || [];
      const updated = existingSchedules.map(s =>
        s.month === scheduleMonth ? { ...s, entries } : s
      );
      return {
        mealSchedules: {
          ...state.mealSchedules,
          [companyId]: updated
        }
      };
    });
    // Data updated in state only, will be saved when user clicks Save button
  },

  updateMealScheduleRates: async (companyId: string, scheduleMonth: string, rates: { tiffen?: number; lunch?: number; dinner?: number }) => {
    set((state) => {
      const existingSchedules = state.mealSchedules[companyId] || [];
      const updated = existingSchedules.map(s =>
        s.month === scheduleMonth ? { ...s, rates } : s
      );
      return {
        mealSchedules: {
          ...state.mealSchedules,
          [companyId]: updated
        }
      };
    });
    // Data updated in state only, will be saved when user clicks Save button
  },

  getMealSchedule: (companyId: string, month: string) => {
    const state = get();
    return (state.mealSchedules[companyId] || []).find(s => s.month === month);
  },

  loadFromStorage: async () => {
    try {
      console.log('📥 Loading data from Firebase...');
      
      // Load companies and monthly meal schedules from Firebase
      const companies = await firebaseService.getAllCompanies();
      const mealSchedules = await firebaseService.getAllMealSchedules();

      set({
        companies,
        schedules: {}, // Legacy, not used
        mealSchedules,
        selectedCompanyId: companies.length > 0 ? companies[0].id : null
      });
      
      console.log(`✅ Loaded ${companies.length} companies and ${Object.keys(mealSchedules).length} meal schedules from Firebase`);
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      // Initialize with empty state if Firebase fails
      set({
        companies: [],
        schedules: {},
        mealSchedules: {},
        selectedCompanyId: null
      });
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      
      console.log('💾 Saving data to Firebase...');
      
      // Save companies and monthly meal schedules to Firebase
      await firebaseService.saveAllData(state.companies, state.mealSchedules);
      
      console.log('✅ Data saved to Firebase successfully!');
    } catch (error) {
      console.error('❌ Failed to save to Firebase:', error);
      throw error;
    }
  },

  // Method to manually sync/reload from Firebase
  syncFromCloud: async () => {
    await get().loadFromStorage();
  }
}));
