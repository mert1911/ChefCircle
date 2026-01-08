import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ChefHat } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import RecipeSearchAndFilters from '@/components/RecipeSearchAndFilters';
import MealplanSearchAndFilters from '@/components/MealplanSearchAndFilters';
import MealPlanPreviewModal from '@/components/MealPlanPreviewModal';
import RecipeCard from '@/components/RecipeCard';
import MealPlanCard from '@/components/MealPlanCard';
import { useBrowseState } from '@/hooks/useBrowseState';

// Import new hooks
import { useBrowseData } from '@/hooks/useBrowseData';
import { useBrowseFilters } from '@/hooks/useBrowseFilters';
import { useBrowseNavigation } from '@/hooks/useBrowseNavigation';



// Import centralized storage utilities
import { saveToStorage, saveScrollPosition, restoreScrollPosition } from '@/utils/browseStorage';

export default function Browse() {
  // Always clear the session flag so filters reset on every navigation
  useEffect(() => {
    sessionStorage.removeItem('browseFiltersReset');
  }, []);

  const navigate = useNavigate();

  // Use custom hook for filter and UI state
  const {
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
  } = useBrowseState();

  // Use centralized navigation hook first
  const { tab, handleTabClick, handleCreateRecipe, handleCreateMealPlan } = useBrowseNavigation();

  // Use centralized data fetching hook
  const {
    recipes, loading, error, favorites, userPlannedRecipes,
    mealplans, mealplansLoading, mealplansError, favoriteMealplans,
    previewDialogOpen, selectedMealPlan, isPremium,
    handleToggleFavorite, handleToggleMealplan, handleToggleFavoriteMealplan,
    handleRecipeNavigation, handleImportMealPlan,
    setPreviewDialogOpen, setSelectedMealPlan
  } = useBrowseData({ tab, visibleRecipeCount });

  // Local state for UI
  const [showFullWeek, setShowFullWeek] = useState(false);

  const { getAccessToken, user } = useAuth();

  // Consolidated localStorage saving for all state changes
  useEffect(() => {
    saveToStorage('recipeFilters', recipeFilters);
    saveToStorage('mealplanFilters', mealplanFilters);
    saveToStorage('showRecipeFilters', showRecipeFilters);
    saveToStorage('showMealplanFilters', showMealplanFilters);
    saveToStorage('activeTab', tab);
  }, [recipeFilters, mealplanFilters, showRecipeFilters, showMealplanFilters, tab]);



  // Scroll position and recipe count management
  useEffect(() => {
    // Restore scroll position and recipe count on mount
    const restoredCount = restoreScrollPosition();
    if (restoredCount !== 9) { // Only update if we got a saved value
      setVisibleRecipeCount(restoredCount);
    }

    // Save scroll position and visible recipe count before page unload (handles browser navigation)
    const handleBeforeUnload = () => {
      saveScrollPosition(visibleRecipeCount);
    };

    // Save scroll position and visible recipe count on visibility change (handles tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveScrollPosition(visibleRecipeCount);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [visibleRecipeCount]); // Add visibleRecipeCount as dependency

  // Function to handle recipe navigation with scroll position and recipe count saving


  const handleLoadMore = useCallback(() => {
    setVisibleRecipeCount(prevCount => prevCount + 9);
  }, []);

  // Use centralized filtering hook
  const { filteredRecipes, filteredMealPlans } = useBrowseFilters({
    recipes,
    mealplans,
    recipeFilters,
    mealplanFilters,
    favorites,
    userPlannedRecipes,
    favoriteMealplans,
    isPremium,
  });



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse & Discover</h1>
              <p className="text-gray-600">Find recipes and meal plans from our curated collection</p>
          </div>
            <Button 
              onClick={handleCreateRecipe}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Recipe
            </Button>
        </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={tab} onValueChange={handleTabClick} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="mealplans">Meal Plans</TabsTrigger>
          </TabsList>

          {/* Recipes Tab */}
          <TabsContent value="recipes">
            <RecipeSearchAndFilters
              filters={recipeFilters}
              onFiltersChange={(newFilters) => setRecipeFilters(prev => ({ ...prev, ...newFilters }))}
              showFilters={showRecipeFilters}
              onToggleFilters={() => setShowRecipeFilters(!showRecipeFilters)}
              isPremium={isPremium}
            />
            {loading ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading recipes...</p>
                </div>
              </div>
            ) : error ? (
              <div className="min-h-[40vh] flex items-center justify-center flex-col">
                <p className="text-red-600 text-lg mb-4">Error: {error}</p>
                <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
                  Reload
                </Button>
              </div>
            ) : recipes.length === 0 ? (
              <div className="min-h-[40vh] flex items-center justify-center flex-col">
                <p className="text-gray-600 text-lg mb-4">No recipes found. Try creating one!</p>
                <Button onClick={() => navigate('/recipes/create')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Recipe
                </Button>
              </div>
            ) : (
              <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.slice(0, visibleRecipeCount).map((recipe) => (
                      <RecipeCard
                        key={recipe._id}
                        recipe={recipe}
                        isLiked={!!recipe.isLiked}
                        isPlanned={userPlannedRecipes.includes(recipe._id)}
                        onToggleFavorite={handleToggleFavorite}
                        onToggleMealplan={handleToggleMealplan}
                        onNavigate={handleRecipeNavigation}
                      />
                    ))}
                  </div>
                
                  {visibleRecipeCount < filteredRecipes.length && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={handleLoadMore} className="bg-emerald-600 hover:bg-emerald-700">
                        Load More Recipes
                      </Button>
                    </div>
                  )}
                
                  {filteredRecipes.length === 0 && (recipeFilters.searchQuery || recipeFilters.showOnlyFavorites || recipeFilters.showOnlyPlanned) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No recipes found matching your criteria.</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </>
              )}
          </TabsContent>

          {/* Meal Plans Tab */}
          <TabsContent value="mealplans">
            <MealplanSearchAndFilters
              filters={mealplanFilters}
              onFiltersChange={(newFilters) => setMealplanFilters(prev => ({ ...prev, ...newFilters }))}
              showFilters={showMealplanFilters}
              onToggleFilters={() => setShowMealplanFilters(!showMealplanFilters)}
              isPremium={isPremium}
            />
              {mealplansLoading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading meal plans...</p>
                  </div>
                </div>
              ) : mealplansError ? (
                <div className="min-h-[40vh] flex items-center justify-center flex-col">
                  <p className="text-red-600 text-lg mb-4">Error: {mealplansError}</p>
                  <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
                    Reload
                  </Button>
                </div>
              ) : mealplans.length === 0 ? (
                <div className="min-h-[40vh] flex items-center justify-center flex-col">
                <p className="text-gray-600 text-lg mb-4">No published meal plans found. Try creating one!</p>
                  <Button 
                    onClick={handleCreateMealPlan}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Meal Plan
                  </Button>
                </div>
              ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMealPlans.map((plan) => (
                    <MealPlanCard
                      key={plan._id}
                      plan={plan}
                      isFavorite={favoriteMealplans.includes(plan._id)}
                      isPremium={isPremium}
                      onToggleFavorite={handleToggleFavoriteMealplan}
                      onPreview={(plan) => {
                        setSelectedMealPlan(plan);
                        setPreviewDialogOpen(true);
                      }}
                      onImport={handleImportMealPlan}
                    />
                  ))}
                </div>

                {filteredMealPlans.length === 0 && (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <ChefHat className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-xl font-medium mb-2">No meal plans found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search or filters to discover more meal plans.</p>
                    </div>
                </div>
              )}


            </>
          )}
          </TabsContent>
        </Tabs>
      </main>
      <MealPlanPreviewModal
        open={previewDialogOpen}
        mealPlan={selectedMealPlan}
        isPremium={isPremium}
        showFullWeek={showFullWeek}
        onToggleWeekView={() => setShowFullWeek(v => !v)}
        onClose={() => setPreviewDialogOpen(false)}
        onImport={handleImportMealPlan}
      />
    </div>
  );
}