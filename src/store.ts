import { create } from 'zustand';
import type { AppState, Company, WeeklySchedule, DayOfWeek, MealTime } from './types';
import { storageService } from '@/services/storageService';
import { mongoDBService } from '@/services/mongoDBDataAPI';

const SELECTED_COMPANY_KEY = 'kumari_foods_selected_company';

const createEmptySchedule = (companyId: string): WeeklySchedule => ({
  companyId,
  meals: []
});

export const useStore = create<AppState>((set, get) => ({
  companies: [],
  schedules: {},
  selectedCompanyId: null,

  addCompany: async (name: string) => {
    const newCompany: Company = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString()
    };
    
    set((state) => ({
      companies: [...state.companies, newCompany],
      schedules: {
        ...state.schedules,
        [newCompany.id]: createEmptySchedule(newCompany.id)
      },
      selectedCompanyId: newCompany.id
    }));
    
    // Save to IndexedDB
    await storageService.addCompany(newCompany);
    await storageService.updateSchedule(createEmptySchedule(newCompany.id));
    get().saveToStorage();
  },

  updateCompany: async (id: string, name: string) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, name } : c
      )
    }));
    
    const state = get();
    const company = state.companies.find(c => c.id === id);
    if (company) {
      await storageService.updateCompany(company);
    }
    get().saveToStorage();
  },

  deleteCompany: async (id: string) => {
    set((state) => {
      const newSchedules = { ...state.schedules };
      delete newSchedules[id];
      
      return {
        companies: state.companies.filter((c) => c.id !== id),
        schedules: newSchedules,
        selectedCompanyId: state.selectedCompanyId === id ? null : state.selectedCompanyId
      };
    });
    
    // Delete from IndexedDB
    await storageService.deleteCompany(id);
    await storageService.deleteSchedule(id);
    get().saveToStorage();
  },

  selectCompany: (id: string | null) => {
    set({ selectedCompanyId: id });
    localStorage.setItem(SELECTED_COMPANY_KEY, id || '');
  },

  updateMeal: (companyId: string, day: DayOfWeek, mealTime: MealTime, foodName: string) => {
    set((state) => {
      const schedule = state.schedules[companyId] || createEmptySchedule(companyId);
      const existingMealIndex = schedule.meals.findIndex(
        (m) => m.day === day && m.mealTime === mealTime
      );

      let updatedMeals;
      if (existingMealIndex >= 0) {
        updatedMeals = [...schedule.meals];
        if (foodName.trim()) {
          updatedMeals[existingMealIndex] = { day, mealTime, foodName };
        } else {
          updatedMeals.splice(existingMealIndex, 1);
        }
      } else if (foodName.trim()) {
        updatedMeals = [...schedule.meals, { day, mealTime, foodName }];
      } else {
        updatedMeals = schedule.meals;
      }

      return {
        schedules: {
          ...state.schedules,
          [companyId]: {
            ...schedule,
            meals: updatedMeals
          }
        }
      };
    });
    
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const companies = await storageService.getAllCompanies();
      const schedules = await storageService.getAllSchedules();
      const selectedId = localStorage.getItem(SELECTED_COMPANY_KEY);

      set({
        companies,
        schedules,
        selectedCompanyId: selectedId || null
      });
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      
      // Save to local IndexedDB
      for (const company of state.companies) {
        await storageService.updateCompany(company);
      }
      
      for (const [companyId, schedule] of Object.entries(state.schedules)) {
        await storageService.updateSchedule({
          ...schedule,
          companyId
        });
      }

      // Try to sync to MongoDB if API is configured
      if (mongoDBService.isConfigured()) {
        try {
          await mongoDBService.syncToCloud(state.companies, state.schedules);
        } catch (error) {
          console.warn('MongoDB sync failed (offline?), data saved locally:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },

  // New method to sync from MongoDB
  syncFromCloud: async () => {
    try {
      if (!mongoDBService.isConfigured()) {
        console.log('MongoDB not configured');
        return;
      }

      const { companies, schedules } = await mongoDBService.syncFromCloud();
      
      const schedulesMap: Record<string, WeeklySchedule> = {};
      schedules.forEach((schedule) => {
        schedulesMap[schedule.companyId] = schedule;
      });

      set({
        companies,
        schedules: schedulesMap,
      });

      // Save to local IndexedDB as well
      for (const company of companies) {
        await storageService.updateCompany(company);
      }
      for (const schedule of schedules) {
        await storageService.updateSchedule(schedule);
      }
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
    }
  }
}));