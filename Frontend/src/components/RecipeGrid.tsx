import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Heart, 
  MoreVertical, 
  Trash2, 
  ChefHat 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IRecipe } from "@/types/recipe";

const DEFAULT_RECIPE_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

interface RecipeGridProps {
  recipes: IRecipe[];
  showActions?: boolean; // Whether to show edit/delete actions
  showFavoriteButton?: boolean; // Whether to show favorite/unfavorite button
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateButtonText: string;
  onRecipeClick: (recipeId: string) => void;
  onEmptyStateClick: () => void;
  onDeleteRecipe?: (recipe: IRecipe) => void;
  onToggleFavorite?: (recipe: IRecipe, isFavorited: boolean) => void;
}

const RecipeGrid = ({
  recipes,
  showActions = false,
  showFavoriteButton = false,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateButtonText,
  onRecipeClick,
  onEmptyStateClick,
  onDeleteRecipe,
  onToggleFavorite
}: RecipeGridProps) => {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyStateTitle}</h3>
        <p className="text-gray-600 mb-4">{emptyStateDescription}</p>
        <Button 
          onClick={onEmptyStateClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {emptyStateButtonText}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <Card 
          key={recipe._id} 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden relative"
        >
          {/* Recipe Actions Dropdown - Only show if user owns the recipe */}
          {showActions && onDeleteRecipe && (
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecipeClick(recipe._id);
                    }}
                  >
                    View Recipe
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecipe(recipe);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Recipe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Favorite Button - Only show for favorite recipes */}
          {showFavoriteButton && onToggleFavorite && (
            <div className="absolute top-3 right-3 flex space-x-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="backdrop-blur-sm bg-white/80 hover:bg-white/90 text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(recipe, true); // true means currently favorited, so unfavorite
                }}
              >
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>
          )}

          <div className="relative" onClick={() => onRecipeClick(recipe._id)}>
            <img
              src={recipe.image ? `http://localhost:8080/${recipe.image}` : DEFAULT_RECIPE_IMAGE}
              alt={recipe.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <h3 className="font-semibold text-lg mb-1">{recipe.name}</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  {recipe.prepTimeMin && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {recipe.prepTimeMin} min
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RecipeGrid; 