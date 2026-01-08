import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Users, Eye, Download } from "lucide-react";
import { getDifficultyColor, capitalizeFirstLetter } from '@/utils/browseUtils';

const DEFAULT_MEALPLAN_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

interface MealPlanCardProps {
  plan: any;
  isFavorite: boolean;
  isPremium: boolean;
  onToggleFavorite: (e: React.MouseEvent, mealplanId: string, isCurrentlyLiked: boolean) => void;
  onPreview: (plan: any) => void;
  onImport: (plan: any) => void;
}

const MealPlanCard: React.FC<MealPlanCardProps> = ({
  plan,
  isFavorite,
  isPremium,
  onToggleFavorite,
  onPreview,
  onImport,
}) => {
  return (
    <Card className="border-emerald-100 hover:shadow-lg transition-all duration-300 hover:border-emerald-300 group">
      <div className="relative">
        <img
          src={plan.image ? `http://localhost:8080/${plan.image}` : DEFAULT_MEALPLAN_IMAGE}
          alt={plan.title}
          className="w-full h-48 object-cover rounded-t-lg bg-emerald-100"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_MEALPLAN_IMAGE; }}
        />
        <div className="absolute top-3 right-3 flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`backdrop-blur-sm bg-white/80 hover:bg-white/90 ${
              isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
            }`}
            onClick={e => onToggleFavorite(e, plan._id, isFavorite)}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
          <Badge variant="secondary" className="bg-white/90 text-gray-700 pointer-events-none">
            7 days
          </Badge>
        </div>
        {plan.difficulty && (
          <Badge className={`absolute top-3 left-3 ${getDifficultyColor(plan.difficulty)}`}>
            {capitalizeFirstLetter(plan.difficulty)}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
            {plan.title}
          </CardTitle>
          {typeof plan.averageRating === 'number' && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{plan.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">{plan.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{plan.ratings ? plan.ratings.length : 0} reviews</span>
          </div>
          <div className="text-right">
            <div className="text-emerald-600 font-medium">
              {(() => {
                if (!plan.slots || plan.slots.length === 0) return 'N/A cal/day';
                const dayGroups: { [key: string]: any[] } = {};
                plan.slots.forEach((slot: any) => {
                  const day = slot.dayOfWeek || slot.date || 'default';
                  if (!dayGroups[day]) dayGroups[day] = [];
                  dayGroups[day].push(slot);
                });
                let totalDailyCalories = 0;
                const numDays = Object.keys(dayGroups).length;
                Object.values(dayGroups).forEach((daySlots: any[]) => {
                  let dayCalories = 0;
                  daySlots.forEach((slot: any) => {
                    if (slot.recipe && typeof slot.recipe === 'object') {
                      const recipe = slot.recipe;
                      const servings = slot.servings || 1;
                      const recipeServings = recipe.servings || 1;
                      const multiplier = servings / recipeServings;
                      dayCalories += (recipe.calories || 0) * multiplier;
                    }
                  });
                  totalDailyCalories += dayCalories;
                });
                const avgCalories = numDays > 0 ? Math.round(totalDailyCalories / numDays) : 0;
                return avgCalories > 0 ? `~${avgCalories} kcal/day` : 'N/A kcal/day';
              })()}
            </div>
            {isPremium && (
              <div className="text-xs text-gray-500 mt-1">
                {(() => {
                  if (!plan.slots || plan.slots.length === 0) return 'N/A nutrition';
                  const dayGroups: { [key: string]: any[] } = {};
                  plan.slots.forEach((slot: any) => {
                    const day = slot.dayOfWeek || slot.date || 'default';
                    if (!dayGroups[day]) dayGroups[day] = [];
                    dayGroups[day].push(slot);
                  });
                  let totalDailyProtein = 0;
                  let totalDailyCarbs = 0;
                  let totalDailyFat = 0;
                  const numDays = Object.keys(dayGroups).length;
                  Object.values(dayGroups).forEach((daySlots: any[]) => {
                    let dayProtein = 0;
                    let dayCarbs = 0;
                    let dayFat = 0;
                    daySlots.forEach((slot: any) => {
                      if (slot.recipe && typeof slot.recipe === 'object') {
                        const recipe = slot.recipe;
                        const servings = slot.servings || 1;
                        const recipeServings = recipe.servings || 1;
                        const multiplier = servings / recipeServings;
                        dayProtein += (recipe.protein_g || 0) * multiplier;
                        dayCarbs += (recipe.carbohydrates_g || 0) * multiplier;
                        dayFat += (recipe.totalFat_g || 0) * multiplier;
                      }
                    });
                    totalDailyProtein += dayProtein;
                    totalDailyCarbs += dayCarbs;
                    totalDailyFat += dayFat;
                  });
                  const avgProtein = numDays > 0 ? Math.round(totalDailyProtein / numDays) : 0;
                  const avgCarbs = numDays > 0 ? Math.round(totalDailyCarbs / numDays) : 0;
                  const avgFat = numDays > 0 ? Math.round(totalDailyFat / numDays) : 0;
                  return (
                    <span>
                      <span className="text-blue-600">P: {avgProtein}g</span> • <span className="text-orange-600">C: {avgCarbs}g</span> • <span className="text-purple-600">F: {avgFat}g</span>
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {plan.tags && plan.tags.length > 0 && plan.tags.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">by {plan.author?.username || 'Unknown'}</span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            onClick={() => onPreview(plan)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={e => {
              e.stopPropagation();
              onImport(plan);
            }}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Import to Planner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MealPlanCard; 