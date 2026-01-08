import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { templateAPI, mealplanAPI } from '@/lib/api';
import { getCurrentWeek } from '@/lib/utils';
import { IRecipe } from '@/hooks/useRecipeFiltering';
import { saveScrollPosition } from '@/utils/browseStorage';
import axios from 'axios';

interface UseBrowseDataProps {
  tab: string;
  visibleRecipeCount: number;
}

export const useBrowseData = ({ tab, visibleRecipeCount }: UseBrowseDataProps) => {
  const { getAccessToken, user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active';

  // Recipe state
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userPlannedRecipes, setUserPlannedRecipes] = useState<string[]>([]);

  // Meal plan state
  const [mealplans, setMealplans] = useState<any[]>([]);
  const [mealplansLoading, setMealplansLoading] = useState<boolean>(false);
  const [mealplansError, setMealplansError] = useState<string | null>(null);
  const [favoriteMealplans, setFavoriteMealplans] = useState<string[]>([]);

  // Dialog state for meal plan preview
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<any>(null);

  const fetchAllRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [recipesRes, favoritesRes] = await Promise.all([
        fetch('http://localhost:8080/recipes'),
        fetch('http://localhost:8080/recipes/favorites', {
          headers,
          credentials: 'include',
        })
      ]);

      if (!recipesRes.ok) throw new Error('Failed to fetch recipes');
      if (!favoritesRes.ok) throw new Error('Failed to fetch favorites');

      const data: IRecipe[] = await recipesRes.json();
      const favoriteRecipes: IRecipe[] = await favoritesRes.json();
      const favoriteIds = favoriteRecipes.map(r => r._id);
      setFavorites(favoriteIds);

      const mappedData = data.map(recipe => ({ ...recipe, id: recipe._id, isLiked: favoriteIds.includes(recipe._id) }));
      const sortedData = [...mappedData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecipes(sortedData);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes. Please try again later.');
      toast.error(err.message || 'Failed to load recipes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const fetchUserPlannedRecipes = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUserPlannedRecipes([]);
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/user/planned-recipes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch planned recipes');
      const data = await res.json();
      setUserPlannedRecipes((data.plannedRecipes || []).map((r: any) => (typeof r === 'string' ? r : r._id)));
    } catch (err) {
      console.error("Failed to fetch planned recipes:", err);
      setUserPlannedRecipes([]);
    }
  }, [getAccessToken]);

  const fetchFavoriteMealplans = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setFavoriteMealplans([]);
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/mealplan/template/favorites', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch favorite meal plans');
      const favoritePlans = await res.json();
      const favoriteIds = favoritePlans.map((plan: any) => plan._id);
      setFavoriteMealplans(favoriteIds);
    } catch (err) {
      console.error("Failed to fetch favorite meal plans:", err);
      setFavoriteMealplans([]);
    }
  }, [getAccessToken]);

  // Fetch data based on active tab
  useEffect(() => {
    if (tab === 'recipes') {
      fetchAllRecipes();
      fetchUserPlannedRecipes();
    } else if (tab === 'mealplans') {
      setMealplansLoading(true);
      setMealplansError(null);
      Promise.all([
        templateAPI.getTemplates(),
        fetchFavoriteMealplans()
      ])
        .then(([data]) => {
          setMealplans(data);
        })
        .catch((err) => {
          setMealplansError(err.message || 'Failed to load mealplans.');
        })
        .finally(() => setMealplansLoading(false));
    }
  }, [tab, fetchAllRecipes, fetchUserPlannedRecipes, fetchFavoriteMealplans]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent, recipeId: string, isCurrentlyLiked: boolean) => {
    e.stopPropagation();
    const token = getAccessToken();
    if (!token) {
      toast.info('You must be logged in to save favorites.');
      return;
    }
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      if (!isCurrentlyLiked) {
        await axios.post(`http://localhost:8080/recipes/favorites/${recipeId}`, {}, {
          headers,
          withCredentials: true,
        });
        setFavorites(prev => [...prev, recipeId]);
        setRecipes(prev => prev.map(r => r._id === recipeId ? { ...r, isLiked: true } : r));
        toast.success("Added to favorites!");
      } else {
        await axios.delete(`http://localhost:8080/recipes/favorites/${recipeId}`, {
          headers,
          withCredentials: true,
        });
        setFavorites(prev => prev.filter(id => id !== recipeId));
        setRecipes(prev => prev.map(r => r._id === recipeId ? { ...r, isLiked: false } : r));
        toast.info("Removed from favorites!");
      }
    } catch (err) {
      toast.error('Failed to update favorites.');
      console.error("Favorite toggle error:", err);
    }
  }, [getAccessToken]);

  const handleToggleMealplan = useCallback(async (e: React.MouseEvent, recipeId: string, isInPlanned: boolean) => {
    e.stopPropagation();
    const token = getAccessToken();
    if (!token) {
      toast.info('You must be logged in to use meal planning.');
      return;
    }
    try {
      if (!isInPlanned) {
        const res = await fetch('http://localhost:8080/user/planned-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ recipeId })
        });
        if (!res.ok) throw new Error('Failed to add to planned recipes');
        toast.success("Added to meal plan!");
      } else {
        const res = await fetch(`http://localhost:8080/user/planned-recipes/${recipeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to remove from planned recipes');
        toast.info("Removed from meal plan!");
      }
      await fetchUserPlannedRecipes();
    } catch (err) {
      toast.error('Failed to update planned recipes.');
      console.error("Meal plan toggle error:", err);
    }
  }, [getAccessToken, fetchUserPlannedRecipes]);

  const handleToggleFavoriteMealplan = useCallback(async (e: React.MouseEvent, mealplanId: string, isCurrentlyLiked: boolean) => {
    e.stopPropagation();
    const token = getAccessToken();
    if (!token) {
      toast.info('You must be logged in to save favorites.');
      return;
    }
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      if (!isCurrentlyLiked) {
        await axios.post(`http://localhost:8080/mealplan/template/favorites/${mealplanId}`, {}, {
          headers,
          withCredentials: true,
        });
        setFavoriteMealplans(prev => [...prev, mealplanId]);
        toast.success("Added to favorites!");
      } else {
        await axios.delete(`http://localhost:8080/mealplan/template/favorites/${mealplanId}`, {
          headers,
          withCredentials: true,
        });
        setFavoriteMealplans(prev => prev.filter(id => id !== mealplanId));
        toast.info("Removed from favorites!");
      }
    } catch (err) {
      toast.error('Failed to update favorites.');
      console.error("Favorite meal plan toggle error:", err);
    }
      }, [getAccessToken]);

  const handleRecipeNavigation = useCallback((recipeId: string) => {
    // Save current scroll position and visible recipe count before navigating
    saveScrollPosition(visibleRecipeCount);
    navigate(`/recipes/${recipeId}`);
  }, [navigate, visibleRecipeCount]);

  const handleImportMealPlan = useCallback(async (mealPlan: any) => {
    const currentWeek = getCurrentWeek(); // Get current week in ISO format (YYYY-WXX)
    try {
      // Fetch the user's mealplan for the current week
      let existingMealplan = null;
      try {
        existingMealplan = await mealplanAPI.getMyWeekMealplan(currentWeek);
      } catch (err) {
        // If not found, ignore
        existingMealplan = null;
      }
      // If a mealplan exists, delete it using the new endpoint
      if (existingMealplan && existingMealplan._id) {
        try {
          await mealplanAPI.deleteMyWeekMealplan(existingMealplan._id);
        } catch (err) {
          // Ignore error if not found
        }
      }
      // Import the new meal plan
      await mealplanAPI.copyMealplanToMyWeek(mealPlan._id, currentWeek);
      toast.success(`"${mealPlan.title}" has been imported to your current week! Visit My Week to view it.`);
      setPreviewDialogOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to import mealplan template.');
    }
  }, []);

  return {
    // State
    recipes,
    mealplans,
    loading,
    mealplansLoading,
    error,
    mealplansError,
    favorites,
    userPlannedRecipes,
    favoriteMealplans,
    previewDialogOpen,
    selectedMealPlan,
    isPremium,

    // Actions
    handleToggleFavorite,
    handleToggleMealplan,
    handleToggleFavoriteMealplan,
    handleRecipeNavigation,
    handleImportMealPlan,
    setPreviewDialogOpen,
    setSelectedMealPlan,
  };
}; 