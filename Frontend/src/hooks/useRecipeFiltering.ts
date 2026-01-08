import { useMemo } from 'react';

// Recipe Filter Types
export interface RecipeFilters {
  searchQuery: string;
  selectedCuisine: string;
  selectedPrepTime: string;
  selectedCookTime: string;
  selectedDifficulty: string;
  selectedTags: string[];
  showOnlyFavorites: boolean;
  showOnlyPlanned: boolean;
  caloriesRange: [string, string];
  fatRange: [string, string];
  proteinRange: [string, string];
  carbRange: [string, string];
}

// Recipe interface (matching your existing recipe structure)
export interface IRecipe {
  _id: string;
  id: string;
  name: string;
  description: string;
  tags?: string[];
  rating?: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  isPublic?: boolean;
  ingredients: {
    ingredient: { name: string };
    amount: number;
    unit: string;
  }[];
  author?: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  image?: string;
  reviews?: number;
  isLiked?: boolean;
  instructions?: string[];
  calories?: number;
  protein_g?: number;
  carbohydrates_g?: number;
  totalFat_g?: number;
  saturatedFat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  fiber_g?: number;
  sugars_g?: number;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  totalRatings?: number;
}

// Default filter values
export const defaultRecipeFilters: RecipeFilters = {
  searchQuery: "",
  selectedCuisine: "all",
  selectedPrepTime: "all",
  selectedCookTime: "all",
  selectedDifficulty: "all",
  selectedTags: [],
  showOnlyFavorites: false,
  showOnlyPlanned: false,
  caloriesRange: ["", ""],
  fatRange: ["", ""],
  proteinRange: ["", ""],
  carbRange: ["", ""],
};

// Hook for recipe filtering
export const useRecipeFiltering = (
  recipes: IRecipe[],
  filters: RecipeFilters,
  favorites: string[] = [],
  userPlannedRecipes: string[] = []
) => {
  const filteredRecipes = useMemo(() => {
    let currentRecipes = recipes;

    // Apply favorites and planned filters first
    if (filters.showOnlyFavorites) {
      currentRecipes = currentRecipes.filter(r => favorites.includes(r._id));
    }
    if (filters.showOnlyPlanned) {
      currentRecipes = currentRecipes.filter(r => userPlannedRecipes.includes(r._id));
    }

    return currentRecipes.filter(recipe => {
      // Search filter
      const lowerCaseSearchQuery = filters.searchQuery.trim().toLowerCase();
      if (lowerCaseSearchQuery &&
        !(recipe.name.toLowerCase().includes(lowerCaseSearchQuery) ||
          recipe.ingredients.some(ing => ing.ingredient?.name?.toLowerCase().includes(lowerCaseSearchQuery)) ||
          recipe.cuisine?.toLowerCase().includes(lowerCaseSearchQuery) ||
          recipe.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchQuery)))) {
        return false;
      }

      // Cuisine filter
      if (filters.selectedCuisine !== "all" && recipe.cuisine?.toLowerCase() !== filters.selectedCuisine) {
        return false;
      }

      // Difficulty filter
      if (filters.selectedDifficulty !== "all" && recipe.difficulty?.toLowerCase() !== filters.selectedDifficulty) {
        return false;
      }

      // Time filters helper
      const checkTimeRange = (time: number | undefined, range: string) => {
        if (time === undefined) return range === "all";
        switch (range) {
          case "quick": return time <= 15;
          case "medium": return time > 15 && time <= 30;
          case "long": return time > 30;
          case "all": return true;
          default: return true;
        }
      };

      // Prep time filter
      if (!checkTimeRange(recipe.prepTimeMin, filters.selectedPrepTime)) {
        return false;
      }

      // Cook time filter
      if (!checkTimeRange(recipe.cookTimeMin, filters.selectedCookTime)) {
        return false;
      }

      // Tags filter
      if (filters.selectedTags.length > 0 && 
          !(recipe.tags && filters.selectedTags.every(tag => 
            recipe.tags!.map(t => t.toLowerCase()).includes(tag.toLowerCase())))) {
        return false;
      }

      // Nutrition filters (if provided)
      if (filters.caloriesRange[0] !== "" && (recipe.calories || 0) < Number(filters.caloriesRange[0])) {
        return false;
      }
      if (filters.caloriesRange[1] !== "" && (recipe.calories || 0) > Number(filters.caloriesRange[1])) {
        return false;
      }

      if (filters.fatRange[0] !== "" && (recipe.totalFat_g || 0) < Number(filters.fatRange[0])) {
        return false;
      }
      if (filters.fatRange[1] !== "" && (recipe.totalFat_g || 0) > Number(filters.fatRange[1])) {
        return false;
      }

      if (filters.proteinRange[0] !== "" && (recipe.protein_g || 0) < Number(filters.proteinRange[0])) {
        return false;
      }
      if (filters.proteinRange[1] !== "" && (recipe.protein_g || 0) > Number(filters.proteinRange[1])) {
        return false;
      }

      if (filters.carbRange[0] !== "" && (recipe.carbohydrates_g || 0) < Number(filters.carbRange[0])) {
        return false;
      }
      if (filters.carbRange[1] !== "" && (recipe.carbohydrates_g || 0) > Number(filters.carbRange[1])) {
        return false;
      }

      return true;
    });
  }, [recipes, filters, favorites, userPlannedRecipes]);

  // Helper function to check if any filter is active
  const isAnyFilterActive = useMemo(() => (
    filters.selectedCuisine !== "all" ||
    filters.selectedPrepTime !== "all" ||
    filters.selectedCookTime !== "all" ||
    filters.selectedDifficulty !== "all" ||
    filters.selectedTags.length > 0 ||
    filters.caloriesRange[0] !== "" || filters.caloriesRange[1] !== "" ||
    filters.fatRange[0] !== "" || filters.fatRange[1] !== "" ||
    filters.proteinRange[0] !== "" || filters.proteinRange[1] !== "" ||
    filters.carbRange[0] !== "" || filters.carbRange[1] !== ""
  ), [filters]);

  // Helper function to reset all filters
  const resetFilters = (): RecipeFilters => ({
    ...defaultRecipeFilters
  });

  return {
    filteredRecipes,
    isAnyFilterActive,
    resetFilters
  };
}; 