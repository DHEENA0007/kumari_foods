import { create } from 'zustand';
import type { AppState, Company, WeeklySchedule, DayOfWeek, MealTime, AccountDetails, MealSchedule, DateBasedMealEntry, WeeklyMealSchedule, MealEntry } from './types';
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
  mealSchedules: {},
  weeklyMealSchedules: {},
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

  updateCompany: async (id: string, name: string, accountDetails?: AccountDetails) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, name, accountDetails } : c
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
    
    // Delete from MongoDB if configured
    if (mongoDBService.isConfigured()) {
      try {
        await mongoDBService.deleteCompany(id);
        await mongoDBService.deleteSchedule(id);
      } catch (error) {
        console.warn('MongoDB delete failed (offline?), data deleted locally:', error);
      }
    }
    
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
    get().saveToStorage();
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
    get().saveToStorage();
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
    get().saveToStorage();
  },

  getMealSchedule: (companyId: string, month: string) => {
    const state = get();
    return (state.mealSchedules[companyId] || []).find(s => s.month === month);
  },

  addWeeklyMealSchedule: (companyId: string, weekNumber: number, meals: MealEntry[], rates?: { morning?: number; Afternoon?: number; night?: number }) => {
    set((state) => {
      const companySchedules = state.weeklyMealSchedules[companyId] || [];
      const existingIndex = companySchedules.findIndex(s => s.weekNumber === weekNumber);
      
      const newSchedule: WeeklyMealSchedule = {
        companyId,
        weekNumber,
        meals,
        rates
      };
      
      if (existingIndex >= 0) {
        companySchedules[existingIndex] = newSchedule;
      } else {
        companySchedules.push(newSchedule);
      }
      
      return {
        weeklyMealSchedules: {
          ...state.weeklyMealSchedules,
          [companyId]: companySchedules
        }
      };
    });
    get().saveToStorage();
  },

  updateWeeklyMealSchedule: (companyId: string, weekNumber: number, meals: MealEntry[], rates?: { morning?: number; Afternoon?: number; night?: number }) => {
    set((state) => {
      const companySchedules = state.weeklyMealSchedules[companyId] || [];
      const existingIndex = companySchedules.findIndex(s => s.weekNumber === weekNumber);
      
      if (existingIndex >= 0) {
        companySchedules[existingIndex] = {
          ...companySchedules[existingIndex],
          meals,
          rates
        };
      } else {
        companySchedules.push({
          companyId,
          weekNumber,
          meals,
          rates
        });
      }
      
      return {
        weeklyMealSchedules: {
          ...state.weeklyMealSchedules,
          [companyId]: companySchedules
        }
      };
    });
    get().saveToStorage();
  },

  getWeeklyMealSchedule: (companyId: string, weekNumber: number) => {
    const state = get();
    return (state.weeklyMealSchedules[companyId] || []).find(s => s.weekNumber === weekNumber);
  },

  loadFromStorage: async () => {
    try {
      const companies = await storageService.getAllCompanies();
      const schedules = await storageService.getAllSchedules();
      const selectedId = localStorage.getItem(SELECTED_COMPANY_KEY);

      // Load meal schedules from localStorage
      const mealSchedulesStr = localStorage.getItem('mealSchedules');
      const mealSchedules = mealSchedulesStr ? JSON.parse(mealSchedulesStr) : {};

      // Load weekly meal schedules from localStorage
      const weeklyMealSchedulesStr = localStorage.getItem('weeklyMealSchedules');
      let weeklyMealSchedules = weeklyMealSchedulesStr ? JSON.parse(weeklyMealSchedulesStr) : {};

      // Migration: Convert old per-company localStorage keys to new centralized format
      if (companies.length > 0 && Object.keys(weeklyMealSchedules).length === 0) {
        for (const company of companies) {
          const oldScheduleStr = localStorage.getItem(`weeklySchedule_${company.id}`);
          const oldRatesStr = localStorage.getItem(`weeklyRates_${company.id}`);
          
          if (oldScheduleStr || oldRatesStr) {
            const oldSchedules = oldScheduleStr ? JSON.parse(oldScheduleStr) : {};
            const oldRates = oldRatesStr ? JSON.parse(oldRatesStr) : {};
            
            // Convert to new format
            const companyWeeklySchedules: WeeklyMealSchedule[] = [];
            const weekNumbers = new Set([...Object.keys(oldSchedules), ...Object.keys(oldRates)].map(Number));
            
            weekNumbers.forEach(weekNumber => {
              companyWeeklySchedules.push({
                companyId: company.id,
                weekNumber,
                meals: oldSchedules[weekNumber] || [],
                rates: oldRates[weekNumber] || {}
              });
            });
            
            if (companyWeeklySchedules.length > 0) {
              weeklyMealSchedules[company.id] = companyWeeklySchedules;
            }
            
            // Clean up old keys
            localStorage.removeItem(`weeklySchedule_${company.id}`);
            localStorage.removeItem(`weeklyRates_${company.id}`);
          }
        }
        
        // Save migrated data
        if (Object.keys(weeklyMealSchedules).length > 0) {
          localStorage.setItem('weeklyMealSchedules', JSON.stringify(weeklyMealSchedules));
        }
      }

      set({
        companies,
        schedules,
        mealSchedules,
        weeklyMealSchedules,
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

      // Save meal schedules to localStorage
      localStorage.setItem('mealSchedules', JSON.stringify(state.mealSchedules));

      // Save weekly meal schedules to localStorage
      localStorage.setItem('weeklyMealSchedules', JSON.stringify(state.weeklyMealSchedules));

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