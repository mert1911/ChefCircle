import { useState, useEffect } from 'react';
import { saveToStorage, loadFromStorage, restoreScrollPosition } from '@/utils/browseStorage';

const defaultRecipeFilters = {
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
const defaultMealplanFilters = {
  searchQuery: "",
  selectedDifficulty: "all",
  selectedTags: [],
  showOnlyFavorites: false,
  dailyCaloriesRange: ["", ""],
  dailyProteinRange: ["", ""],
  dailyCarbRange: ["", ""],
  dailyFatRange: ["", ""],
};

// --- Synchronous filter reset on first load ---
if (!sessionStorage.getItem('browseFiltersReset')) {
  saveToStorage('recipeFilters', defaultRecipeFilters);
  saveToStorage('mealplanFilters', defaultMealplanFilters);
  saveToStorage('showRecipeFilters', false);
  saveToStorage('showMealplanFilters', false);
  sessionStorage.removeItem('browsePageScrollPosition');
  sessionStorage.removeItem('browsePageVisibleRecipeCount');
  sessionStorage.setItem('browseFiltersReset', 'true');
}

export function useBrowseState() {
  // Recipe Filters
  const [recipeFilters, setRecipeFilters] = useState(() =>
    loadFromStorage('recipeFilters', defaultRecipeFilters)
  );

  // Mealplan Filters
  const [mealplanFilters, setMealplanFilters] = useState(() =>
    loadFromStorage('mealplanFilters', defaultMealplanFilters)
  );

  // Filter UI state
  const [showRecipeFilters, setShowRecipeFilters] = useState(() =>
    loadFromStorage('showRecipeFilters', false)
  );
  const [showMealplanFilters, setShowMealplanFilters] = useState(() =>
    loadFromStorage('showMealplanFilters', false)
  );

  // Visible recipe count
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(() => {
    return restoreScrollPosition();
  });

  // Save state to localStorage whenever filters or UI state changes
  useEffect(() => {
    saveToStorage('recipeFilters', recipeFilters);
  }, [recipeFilters]);

  useEffect(() => {
    saveToStorage('mealplanFilters', mealplanFilters);
  }, [mealplanFilters]);

  useEffect(() => {
    saveToStorage('showRecipeFilters', showRecipeFilters);
  }, [showRecipeFilters]);

  useEffect(() => {
    saveToStorage('showMealplanFilters', showMealplanFilters);
  }, [showMealplanFilters]);

  // Scroll position and recipe count management
  useEffect(() => {
    // Save scroll position and visible recipe count before page unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem('browsePageScrollPosition', window.scrollY.toString());
      sessionStorage.setItem('browsePageVisibleRecipeCount', visibleRecipeCount.toString());
    };
    // Save scroll position and visible recipe count on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sessionStorage.setItem('browsePageScrollPosition', window.scrollY.toString());
        sessionStorage.setItem('browsePageVisibleRecipeCount', visibleRecipeCount.toString());
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [visibleRecipeCount]);

  return {
    recipeFilters,
    setRecipeFilters,
    mealplanFilters,
    setMealplanFilters,
    showRecipeFilters,
    setShowRecipeFilters,
    showMealplanFilters,
    setShowMealplanFilters,
    visibleRecipeCount,
    setVisibleRecipeCount,
  };
} 