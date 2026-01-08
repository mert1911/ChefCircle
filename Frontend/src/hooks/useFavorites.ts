import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useAPIWithAuth } from './useAPIWithAuth';
import { toast } from 'sonner';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { getAccessToken, user } = useAuth();
  const api = useAPIWithAuth();

  // Fetch user's favorite recipes
  const fetchFavorites = useCallback(async () => {
    if (!user || !getAccessToken()) return;
    
    setLoading(true);
    try {
      const res = await api.get<Array<{ _id: string }>>('/recipes/favorites');
      const favoriteIds = res.data.map((recipe) => recipe._id);
      setFavorites(favoriteIds);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setFavorites([]); // Not logged in, just clear favorites
      } else {
        console.error('Failed to fetch favorites', err);
        toast.error('Failed to load favorites');
      }
    } finally {
      setLoading(false);
    }
  }, [user, getAccessToken]);

  // Toggle favorite status for a recipe
  const toggleFavorite = useCallback(async (recipeId: string, isCurrentlyLiked?: boolean) => {
    const token = getAccessToken();
    if (!token) {
      toast.info('You must be logged in to save favorites.');
      return false;
    }

    // If isCurrentlyLiked is not provided, determine it from current favorites
    const currentlyLiked = isCurrentlyLiked ?? favorites.includes(recipeId);

    try {
      if (!currentlyLiked) {
        // Add to favorites
        await api.post(`/recipes/favorites/${recipeId}`);
        setFavorites(prev => [...prev, recipeId]);
        toast.success("Added to favorites!");
        return true;
      } else {
        // Remove from favorites
        await api.delete(`/recipes/favorites/${recipeId}`);
        setFavorites(prev => prev.filter(id => id !== recipeId));
        toast.info("Removed from favorites!");
        return false;
      }
    } catch (err) {
      toast.error('Failed to update favorites.');
      console.error("Favorite toggle error:", err);
      return currentlyLiked; // Return original state on error
    }
  }, [favorites, getAccessToken, api]);

  // Check if a recipe is favorited
  const isFavorite = useCallback((recipeId: string) => {
    return favorites.includes(recipeId);
  }, [favorites]);

  // Handle favorite toggle with event prevention (for clickable cards)
  const handleToggleFavorite = useCallback(async (
    e: React.MouseEvent, 
    recipeId: string, 
    isCurrentlyLiked?: boolean
  ) => {
    e.stopPropagation();
    return await toggleFavorite(recipeId, isCurrentlyLiked);
  }, [toggleFavorite]);

  // Load favorites when user is available
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    fetchFavorites,
    toggleFavorite,
    handleToggleFavorite,
    isFavorite,
  };
}; 