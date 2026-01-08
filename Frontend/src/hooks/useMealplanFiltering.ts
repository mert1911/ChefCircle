import { useMemo } from 'react';

// Meal Plan Filter Types
export interface MealplanFilters {
  searchQuery: string;
  selectedDifficulty: string;
  selectedTags: string[];
  showOnlyFavorites: boolean;
  dailyCaloriesRange: [string, string];
  dailyProteinRange: [string, string];
  dailyCarbRange: [string, string];
  dailyFatRange: [string, string];
}

// Meal plan interface
export interface IMealplan {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  difficulty?: string;
  tags?: string[];
  averageRating?: number;
  ratings?: any[];
  author?: {
    username: string;
    _id: string;
  };
  slots?: any[];
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
}

// Default filter values
export const defaultMealplanFilters: MealplanFilters = {
  searchQuery: "",
  selectedDifficulty: "all",
  selectedTags: [],
  showOnlyFavorites: false,
  dailyCaloriesRange: ["", ""],
  dailyProteinRange: ["", ""],
  dailyCarbRange: ["", ""],
  dailyFatRange: ["", ""],
};

// Hook for meal plan filtering
export const useMealplanFiltering = (
  mealplans: IMealplan[],
  filters: MealplanFilters,
  favoriteMealplans: string[] = []
) => {
  const filteredMealplans = useMemo(() => {
    let currentMealplans = mealplans;

    // Apply favorites filter first
    if (filters.showOnlyFavorites) {
      currentMealplans = currentMealplans.filter(plan => favoriteMealplans.includes(plan._id));
    }

    return currentMealplans.filter(plan => {
      // Search filter
      const lowerCaseSearchQuery = filters.searchQuery.trim().toLowerCase();
      if (lowerCaseSearchQuery &&
        !(plan.title.toLowerCase().includes(lowerCaseSearchQuery) ||
          plan.description?.toLowerCase().includes(lowerCaseSearchQuery) ||
          plan.tags?.some((tag: string) => tag.toLowerCase().includes(lowerCaseSearchQuery)))) {
        return false;
      }

      // Difficulty filter
      if (filters.selectedDifficulty !== "all" && plan.difficulty?.toLowerCase() !== filters.selectedDifficulty) {
        return false;
      }

      // Tags filter
      if (filters.selectedTags.length > 0 && 
          !(plan.tags && filters.selectedTags.every(tag => 
            plan.tags!.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())))) {
        return false;
      }

      // Nutrition filters (if provided)
      if (filters.dailyCaloriesRange[0] !== "" && (plan.dailyCalories || 0) < Number(filters.dailyCaloriesRange[0])) {
        return false;
      }
      if (filters.dailyCaloriesRange[1] !== "" && (plan.dailyCalories || 0) > Number(filters.dailyCaloriesRange[1])) {
        return false;
      }

      if (filters.dailyProteinRange[0] !== "" && (plan.dailyProtein || 0) < Number(filters.dailyProteinRange[0])) {
        return false;
      }
      if (filters.dailyProteinRange[1] !== "" && (plan.dailyProtein || 0) > Number(filters.dailyProteinRange[1])) {
        return false;
      }

      if (filters.dailyCarbRange[0] !== "" && (plan.dailyCarbs || 0) < Number(filters.dailyCarbRange[0])) {
        return false;
      }
      if (filters.dailyCarbRange[1] !== "" && (plan.dailyCarbs || 0) > Number(filters.dailyCarbRange[1])) {
        return false;
      }

      if (filters.dailyFatRange[0] !== "" && (plan.dailyFat || 0) < Number(filters.dailyFatRange[0])) {
        return false;
      }
      if (filters.dailyFatRange[1] !== "" && (plan.dailyFat || 0) > Number(filters.dailyFatRange[1])) {
        return false;
      }

      return true;
    });
  }, [mealplans, filters, favoriteMealplans]);

  // Helper function to check if any filter is active
  const isAnyFilterActive = useMemo(() => (
    filters.selectedDifficulty !== "all" ||
    filters.selectedTags.length > 0 ||
    filters.dailyCaloriesRange[0] !== "" || filters.dailyCaloriesRange[1] !== "" ||
    filters.dailyProteinRange[0] !== "" || filters.dailyProteinRange[1] !== "" ||
    filters.dailyCarbRange[0] !== "" || filters.dailyCarbRange[1] !== "" ||
    filters.dailyFatRange[0] !== "" || filters.dailyFatRange[1] !== ""
  ), [filters]);

  // Helper function to reset all filters
  const resetFilters = (): MealplanFilters => ({
    ...defaultMealplanFilters
  });

  return {
    filteredMealplans,
    isAnyFilterActive,
    resetFilters
  };
}; 