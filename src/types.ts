export type MealTime = "morning" | "evening" | "night";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface MealEntry {
  day: DayOfWeek;
  mealTime: MealTime;
  foodName: string;
}

export interface WeeklySchedule {
  companyId: string;
  meals: MealEntry[];
}

export interface AppState {
  companies: Company[];
  schedules: Record<string, WeeklySchedule>;
  selectedCompanyId: string | null;
  
  // Actions
  addCompany: (name: string) => void;
  updateCompany: (id: string, name: string) => void;
  deleteCompany: (id: string) => void;
  selectCompany: (id: string | null) => void;
  updateMeal: (companyId: string, day: DayOfWeek, mealTime: MealTime, foodName: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  syncFromCloud: () => Promise<void>;
}