export type MealTime = "morning" | "Afternoon" | "night";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type MealType = "Tiffen" | "Lunch" | "Dinner";

export interface AccountDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  accountDetails?: AccountDetails;
}

export interface MealEntry {
  day: DayOfWeek;
  mealTime: MealTime;
  foodName: string;
}

export interface DateBasedMealEntry {
  date: string; // Format: DD-MM-YYYY
  tiffen?: number | string;
  lunch?: number | string;
  dinner?: number | string;
}

export interface MealSchedule {
  companyId: string;
  month: string; // Format: MMMM YYYY (e.g., "May 2025")
  entries: DateBasedMealEntry[];
  rates?: {
    tiffen?: number;
    lunch?: number;
    dinner?: number;
  };
}

export interface WeeklyMealEntry {
  day: DayOfWeek;
  tiffen?: number | string;
  lunch?: number | string;
  dinner?: number | string;
}

export interface WeeklySchedule {
  id: string;
  companyId: string;
  weekStartDate: string; // Format: DD-MM-YYYY
  weekEndDate: string; // Format: DD-MM-YYYY
  entries: WeeklyMealEntry[];
  rates?: {
    tiffen?: number;
    lunch?: number;
    dinner?: number;
  };
  notes?: {
    tiffen?: string;
    lunch?: string;
    dinner?: string;
  };
  createdAt: string;
}

export interface AppState {
  companies: Company[];
  schedules: Record<string, any>; // Legacy, not used anymore
  mealSchedules: Record<string, MealSchedule[]>; // companyId -> array of MealSchedules (Monthly)
  weeklySchedules: WeeklySchedule[]; // All weekly schedules
  selectedCompanyId: string | null;
  
  // Actions
  addCompany: (name: string, accountDetails?: AccountDetails) => void;
  updateCompany: (id: string, name: string, accountDetails?: AccountDetails) => void;
  deleteCompany: (id: string) => void;
  selectCompany: (id: string | null) => void;
  updateMeal: (companyId: string, day: DayOfWeek, mealTime: MealTime, foodName: string) => void;
  addMealSchedule: (companyId: string, schedule: MealSchedule) => void;
  updateMealSchedule: (companyId: string, scheduleMonth: string, entries: DateBasedMealEntry[]) => void;
  updateMealScheduleRates: (companyId: string, scheduleMonth: string, rates: { tiffen?: number; lunch?: number; dinner?: number }) => void;
  getMealSchedule: (companyId: string, month: string) => MealSchedule | undefined;
  
  // Weekly Schedule Actions
  addWeeklySchedule: (schedule: WeeklySchedule) => void;
  updateWeeklySchedule: (scheduleId: string, entries: WeeklyMealEntry[]) => void;
  updateWeeklyScheduleRates: (scheduleId: string, rates: { tiffen?: number; lunch?: number; dinner?: number }) => void;
  updateWeeklyScheduleNotes: (scheduleId: string, notes: { tiffen?: string; lunch?: string; dinner?: string }) => void;
  deleteWeeklySchedule: (scheduleId: string) => void;
  getWeeklySchedulesByCompany: (companyId: string) => WeeklySchedule[];
  
  loadFromStorage: () => void;
  saveToStorage: () => void;
  syncFromCloud: () => Promise<void>;
}