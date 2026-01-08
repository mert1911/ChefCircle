import { useCallback } from 'react';
import { Recipe } from '@/types/chatbot';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useAPIWithAuth } from '@/hooks/useAPIWithAuth';

interface UseRecipeActionsReturn {
  saveRecipe: (recipe: Recipe) => Promise<void>;
  isSaving: boolean;
}

export const useRecipeActions = (): UseRecipeActionsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useAPIWithAuth();

  const saveRecipe = useCallback(async (recipe: Recipe) => {
    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save recipes to your favorites",
          variant: "destructive"
        });
        return;
      }

      await api.post(`/recipes/favorites/${recipe.id}`, {});

      toast({
        title: "Recipe Saved!",
        description: `"${recipe.title}" has been added to your favorites`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error saving recipe:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already in favorites')) {
        toast({
          title: "Already in Favorites",
          description: `"${recipe.title}" is already saved to your favorites`,
          variant: "default"
        });
      } else {
        toast({
          title: "Failed to Save Recipe",
          description: error.response?.data?.message || error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  }, [user, api, toast]);

  return {
    saveRecipe,
    isSaving: false // Could be extended to include loading state if needed
  };
}; 