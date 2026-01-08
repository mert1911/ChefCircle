import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Heart, 
  MoreVertical, 
  Trash2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEFAULT_MEALPLAN_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

interface MealPlan {
  _id: string;
  title: string;
  image?: string;
  author?: {
    username: string;
  };
}

interface MealPlanGridProps {
  mealplans: MealPlan[];
  showActions?: boolean; // Whether to show edit/delete actions
  showFavoriteButton?: boolean; // Whether to show favorite/unfavorite button
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateButtonText: string;
  onMealplanClick: (mealplanId: string) => void;
  onEmptyStateClick: () => void;
  onDeleteMealplan?: (mealplan: MealPlan) => void;
  onToggleFavorite?: (mealplan: MealPlan, isFavorited: boolean) => void;
}

const MealPlanGrid = ({
  mealplans,
  showActions = false,
  showFavoriteButton = false,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateButtonText,
  onMealplanClick,
  onEmptyStateClick,
  onDeleteMealplan,
  onToggleFavorite
}: MealPlanGridProps) => {
  if (mealplans.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
      {mealplans.map((plan) => (
        <Card 
          key={plan._id} 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden relative"
        >
          {/* Meal Plan Actions Dropdown - Only show if user owns the meal plan */}
          {showActions && onDeleteMealplan && (
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
                      onMealplanClick(plan._id);
                    }}
                  >
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMealplan(plan);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Meal Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Favorite Button - Only show for favorite meal plans */}
          {showFavoriteButton && onToggleFavorite && (
            <div className="absolute top-3 right-3 flex space-x-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="backdrop-blur-sm bg-white/80 hover:bg-white/90 text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(plan, true); // true means currently favorited, so unfavorite
                }}
              >
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>
          )}

          <div className="relative">
            <img
              src={plan.image ? `http://localhost:8080/${plan.image}` : DEFAULT_MEALPLAN_IMAGE}
              alt={plan.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
              onClick={() => onMealplanClick(plan._id)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <h3 className="font-semibold text-lg mb-1">{plan.title}</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  {plan.author?.username && (
                    <span>by {plan.author.username}</span>
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

export default MealPlanGrid; 