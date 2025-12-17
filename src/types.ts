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

export interface WeeklySchedule {
  companyId: string;
  meals: MealEntry[];
}

export interface AppState {
  companies: Company[];
  schedules: Record<string, WeeklySchedule>;
  mealSchedules: Record<string, MealSchedule[]>; // companyId -> array of MealSchedules
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
  loadFromStorage: () => void;
  saveToStorage: () => void;
  syncFromCloud: () => Promise<void>;
}