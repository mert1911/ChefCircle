import { useMemo } from 'react';
import { IRecipe } from '@/hooks/useRecipeFiltering';
import { RecipeFilters } from '@/hooks/useRecipeFiltering';
import { MealplanFilters } from '@/hooks/useMealplanFiltering';
import { checkNutrientRange } from '@/utils/browseUtils';

interface UseBrowseFiltersProps {
  recipes: IRecipe[];
  mealplans: any[];
  recipeFilters: RecipeFilters;
  mealplanFilters: MealplanFilters;
  favorites: string[];
  userPlannedRecipes: string[];
  favoriteMealplans: string[];
  isPremium: boolean;
}

export const useBrowseFilters = ({
  recipes,
  mealplans,
  recipeFilters,
  mealplanFilters,
  favorites,
  userPlannedRecipes,
  favoriteMealplans,
  isPremium,
}: UseBrowseFiltersProps) => {
  const filteredRecipes = useMemo(() => {
    console.log("Fetched recipes:", recipes);
    console.log("Current filters:", recipeFilters);
    let currentRecipes = recipes;

    if (recipeFilters.showOnlyFavorites) {
      currentRecipes = currentRecipes.filter(r => favorites.includes(r._id));
    }
    if (recipeFilters.showOnlyPlanned) {
      currentRecipes = currentRecipes.filter(r => userPlannedRecipes.includes(r._id));
    }

    return currentRecipes.filter(recipe => {
      console.log("Recipe passing filters:", recipe);
      const lowerCaseSearchQuery = recipeFilters.searchQuery.trim().toLowerCase();
      if (lowerCaseSearchQuery &&
        !(recipe.name.toLowerCase().includes(lowerCaseSearchQuery) ||
          recipe.ingredients.some(ing => ing.ingredient.name.toLowerCase().includes(lowerCaseSearchQuery)) ||
          recipe.cuisine?.toLowerCase().includes(lowerCaseSearchQuery) ||
          recipe.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchQuery)))) {
        return false;
      }

      if (recipeFilters.selectedCuisine !== "all" && recipe.cuisine !== recipeFilters.selectedCuisine) return false;
      if (recipeFilters.selectedDifficulty !== "all" && recipe.difficulty?.toLowerCase() !== recipeFilters.selectedDifficulty) return false;

      const checkTimeRange = (time: number | undefined, range: string) => {
        if (time === undefined) return false;
        switch (range) {
          case "quick": return time <= 15;
          case "medium": return time > 15 && time <= 30;
          case "long": return time > 30;
          case "all": return true;
          default: return true;
        }
      };

      if (!checkTimeRange(recipe.prepTimeMin, recipeFilters.selectedPrepTime)) return false;
      if (!checkTimeRange(recipe.cookTimeMin, recipeFilters.selectedCookTime)) return false;

      if (recipeFilters.selectedTags.length > 0 && !(recipe.tags && recipeFilters.selectedTags.every(tag => recipe.tags!.map(t => t.toLowerCase()).includes(tag.toLowerCase())))) return false;

      if (!checkNutrientRange(recipe.calories, recipeFilters.caloriesRange)) return false;
      if (!checkNutrientRange(recipe.protein_g, recipeFilters.proteinRange)) return false;
      if (!checkNutrientRange(recipe.carbohydrates_g, recipeFilters.carbRange)) return false;
      if (!checkNutrientRange(recipe.totalFat_g, recipeFilters.fatRange)) return false;

      return true;
    });
  }, [
    recipes, recipeFilters, favorites, userPlannedRecipes
  ]);

  const filteredMealPlans = useMemo(() => {
    let currentMealplans = mealplans;

    if (mealplanFilters.showOnlyFavorites) {
      currentMealplans = currentMealplans.filter(plan => favoriteMealplans.includes(plan._id));
    }

    return currentMealplans.filter(plan => {
      const lowerCaseSearchQuery = mealplanFilters.searchQuery.trim().toLowerCase();
      if (lowerCaseSearchQuery &&
        !(plan.title.toLowerCase().includes(lowerCaseSearchQuery) ||
          plan.description?.toLowerCase().includes(lowerCaseSearchQuery) ||
          plan.tags?.some((tag: string) => tag.toLowerCase().includes(lowerCaseSearchQuery)))) {
        return false;
      }
      
      if (mealplanFilters.selectedDifficulty !== "all" && plan.difficulty?.toLowerCase() !== mealplanFilters.selectedDifficulty) return false;
      
      // Filter by tags
      if (mealplanFilters.selectedTags.length > 0 && !(plan.tags && mealplanFilters.selectedTags.every(tag => plan.tags!.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())))) return false;

      // Filter by daily nutrition ranges (Premium only)
      if (isPremium) {
        // Calculate daily nutrition for this meal plan
        const calculateDailyNutrition = () => {
          if (!plan.slots || plan.slots.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

          // Group slots by day
          const dayGroups: { [key: string]: any[] } = {};
          plan.slots.forEach((slot: any) => {
            const day = slot.dayOfWeek || slot.date || 'default';
            if (!dayGroups[day]) dayGroups[day] = [];
            dayGroups[day].push(slot);
          });

          // Calculate nutrition for each day and then average across all days
          let totalDailyCalories = 0;
          let totalDailyProtein = 0;
          let totalDailyCarbs = 0;
          let totalDailyFat = 0;
          const numDays = Object.keys(dayGroups).length;

          Object.values(dayGroups).forEach((daySlots: any[]) => {
            let dayCalories = 0;
            let dayProtein = 0;
            let dayCarbs = 0;
            let dayFat = 0;

            daySlots.forEach((slot: any) => {
              if (slot.recipe && typeof slot.recipe === 'object') {
                const recipe = slot.recipe;
                const servings = slot.servings || 1;
                const recipeServings = recipe.servings || 1;
                const multiplier = servings / recipeServings;

                dayCalories += (recipe.calories || 0) * multiplier;
                dayProtein += (recipe.protein_g || 0) * multiplier;
                dayCarbs += (recipe.carbohydrates_g || 0) * multiplier;
                dayFat += (recipe.totalFat_g || 0) * multiplier;
              }
            });

            totalDailyCalories += dayCalories;
            totalDailyProtein += dayProtein;
            totalDailyCarbs += dayCarbs;
            totalDailyFat += dayFat;
          });

          return {
            calories: numDays > 0 ? Math.round(totalDailyCalories / numDays) : 0,
            protein: numDays > 0 ? Math.round(totalDailyProtein / numDays) : 0,
            carbs: numDays > 0 ? Math.round(totalDailyCarbs / numDays) : 0,
            fat: numDays > 0 ? Math.round(totalDailyFat / numDays) : 0,
          };
        };

        const dailyNutrition = calculateDailyNutrition();

        // Helper function to check nutrition ranges
        const checkNutrientRange = (value: number, range: [string, string]) => {
          const min = Number(range[0]);
          const max = Number(range[1]);
          return (range[0] === "" || value >= min) && (range[1] === "" || value <= max);
        };

        // Check each nutrition range
        if (!checkNutrientRange(dailyNutrition.calories, mealplanFilters.dailyCaloriesRange)) return false;
        if (!checkNutrientRange(dailyNutrition.protein, mealplanFilters.dailyProteinRange)) return false;
        if (!checkNutrientRange(dailyNutrition.carbs, mealplanFilters.dailyCarbRange)) return false;
        if (!checkNutrientRange(dailyNutrition.fat, mealplanFilters.dailyFatRange)) return false;
      }

      // Note: Target calories and family size would need additional data in meal plan templates
      // For now, we'll just return true for those filters
      
      return true;
    });
  }, [mealplans, mealplanFilters, favoriteMealplans, isPremium]);

  return {
    filteredRecipes,
    filteredMealPlans,
  };
}; 