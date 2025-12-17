import type { DayOfWeek, MealTime, WeeklySchedule } from './types';

export const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
export const MEAL_TIMES: MealTime[] = ['morning', 'evening', 'night'];

export const formatDayName = (day: DayOfWeek): string => {
  return day.charAt(0).toUpperCase() + day.slice(1);
};

export const formatMealTime = (time: MealTime): string => {
  return time.charAt(0).toUpperCase() + time.slice(1);
};

export const getMealValue = (schedule: WeeklySchedule | undefined, day: DayOfWeek, mealTime: MealTime): string => {
  if (!schedule) return '';
  const meal = schedule.meals.find((m) => m.day === day && m.mealTime === mealTime);
  return meal?.foodName || '';
};