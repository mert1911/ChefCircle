import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookmarkPlus, Star, Users, Clock } from "lucide-react";
import { getDifficultyColor, capitalizeFirstLetter } from '@/utils/browseUtils';

const DEFAULT_RECIPE_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

interface RecipeCardProps {
  recipe: any;
  isLiked: boolean;
  isPlanned: boolean;
  onToggleFavorite: (e: React.MouseEvent, recipeId: string, isCurrentlyLiked: boolean) => void;
  onToggleMealplan: (e: React.MouseEvent, recipeId: string, isInPlanned: boolean) => void;
  onNavigate: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isLiked,
  isPlanned,
  onToggleFavorite,
  onToggleMealplan,
  onNavigate,
}) => {
  return (
    <Card 
      className="border-emerald-100 hover:shadow-lg transition-all duration-300 hover:border-emerald-300 group cursor-pointer"
      onClick={() => onNavigate(recipe._id)}
    >
      <div className="relative">
        <img
          src={recipe.image ? `http://localhost:8080/${recipe.image}` : DEFAULT_RECIPE_IMAGE}
          alt={recipe.name}
          className="w-full h-48 object-cover rounded-t-lg bg-emerald-100"
        />
        <div className="absolute top-3 right-3 flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`backdrop-blur-sm bg-white/80 hover:bg-white/90 ${
              isLiked ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
            }`}
            onClick={e => onToggleFavorite(e, recipe._id, isLiked)}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`backdrop-blur-sm bg-white/80 hover:bg-white/90 ${
              isPlanned ? "text-emerald-600 hover:text-emerald-700" : "text-gray-400 hover:text-emerald-600"
            }`}
            title={isPlanned ? "In Mealplan" : "Add to Mealplan"}
            onClick={e => onToggleMealplan(e, recipe._id, isPlanned)}
          >
            <BookmarkPlus className={`h-4 w-4 ${isPlanned ? "fill-current" : ""}`} />
          </Button>
        </div>
        {recipe.difficulty && (
          <Badge className={`absolute top-3 left-3 ${getDifficultyColor(recipe.difficulty)}`}>
            {capitalizeFirstLetter(recipe.difficulty)}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
            {recipe.name}
          </CardTitle>
          {typeof recipe.averageRating === 'number' && (
            <div className="flex items-center space-x-1 text-sm text-gray-500 flex-shrink-0 ml-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{recipe.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">{recipe.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.prepTimeMin ? `${recipe.prepTimeMin} min` : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{recipe.totalRatings || 0} reviews</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600">{recipe.calories ? `${recipe.calories} kcal` : 'No cal data'}</span>
          <span className="text-emerald-600 font-medium">{recipe.protein_g ? `${recipe.protein_g}g protein` : 'No protein data'}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags && recipe.tags.length > 0 && recipe.tags.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          {recipe.author && <span className="text-sm text-gray-500">by {recipe.author.username}</span>}
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={e => {
              e.stopPropagation();
              onNavigate(recipe._id);
            }}
          >
            View Recipe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard; 