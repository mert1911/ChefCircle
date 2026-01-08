import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date and week utilities
export const getCurrentWeek = (): string => {
  const now = new Date();
  // Convert to Central European Time (CET/CEST)
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const year = berlinTime.getFullYear();
  
  // Get ISO week number
  const getISOWeek = (date: Date) => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNum;
  };
  
  const weekNum = getISOWeek(berlinTime);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
};

// New: Get ISO week string for any date in CET/CEST
export const getISOWeekForDateCET = (date: Date): string => {
  const berlinTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const year = berlinTime.getFullYear();
  const getISOWeek = (date: Date) => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNum;
  };
  const weekNum = getISOWeek(berlinTime);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
};

export const getToday = (): string => {
  const now = new Date();
  // Convert to Central European Time (CET/CEST)
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  return berlinTime.toISOString().slice(0, 10); // YYYY-MM-DD format
};

export const getDayOfWeek = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Berlin' });
};

// Helper: Get Monday of ISO week (ISO 8601)
function getMondayOfISOWeek(year: number, week: number): Date {
  // ISO week 1 is the week with the first Thursday of the year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayUTC = new Date(jan4);
  mondayUTC.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  // Convert to CET for all calculations
  return new Date(mondayUTC.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
}

export const getDateForDayOfWeek = (week: string, dayOfWeek: string): string => {
  const [year, weekNum] = week.split('-W').map(Number);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const offset = days.indexOf(dayOfWeek);
  const monday = getMondayOfISOWeek(year, weekNum);
  const date = new Date(monday);
  date.setDate(monday.getDate() + offset);
  return date.toISOString().slice(0,10);
};

// Nutrition analysis utilities
export const calculateDailyNutrition = (slots: any[]): { [key: string]: { calories: number; protein: number; carbs: number; fat: number } } => {
  const dailyNutrition: { [key: string]: { calories: number; protein: number; carbs: number; fat: number } } = {};
  
  // Initialize all days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  daysOfWeek.forEach(day => {
    dailyNutrition[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  });

  // Calculate nutrition for each slot
  slots.forEach(slot => {
    if (slot.recipe && slot.dayOfWeek) {
      const recipe = slot.recipe;
      const servings = slot.servings || 1;
      const recipeServings = recipe.servings || 1;
      const multiplier = servings / recipeServings;

      const day = slot.dayOfWeek;
      if (dailyNutrition[day]) {
        dailyNutrition[day].calories += (recipe.calories || 0) * multiplier;
        dailyNutrition[day].protein += (recipe.protein_g || 0) * multiplier;
        dailyNutrition[day].carbs += (recipe.carbohydrates_g || 0) * multiplier;
        dailyNutrition[day].fat += (recipe.totalFat_g || 0) * multiplier;
      }
    }
  });

  return dailyNutrition;
};

export const getTodaysMeals = (slots: any[]): { [key: string]: any } => {
  const today = getToday();
  const todaySlots = slots.filter(slot => slot.date === today);
  
  const meals: { [key: string]: any } = {};
  todaySlots.forEach(slot => {
    if (slot.recipe) {
      meals[slot.mealType] = {
        recipe: slot.recipe,
        servings: slot.servings || 1,
        calories: (slot.recipe.calories || 0) * (slot.servings || 1) / (slot.recipe.servings || 1),
        protein: (slot.recipe.protein_g || 0) * (slot.servings || 1) / (slot.recipe.servings || 1)
      };
    }
  });

  return meals;
};

// Format nutrition values
export const formatNutrition = (value: number): string => {
  return Math.round(value).toString();
};

// Get meal type display name
export const getMealTypeDisplay = (mealType: string): string => {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
};

// Get all dates and day names for a given ISO week (Monday–Sunday)
export const getDatesForISOWeek = (week: string): { date: string; day: string }[] => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayAbbr = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return days.map((day, i) => ({
    date: getDateForDayOfWeek(week, day),
    day: dayAbbr[i],
  }));
};
