import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat, Calendar, Download, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_MEALPLAN_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

interface MealPlanPreviewModalProps {
  open: boolean;
  mealPlan: any;
  isPremium: boolean;
  showFullWeek: boolean;
  onToggleWeekView: () => void;
  onClose: () => void;
  onImport: (mealPlan: any) => void;
  onMealplanUpdate?: (mealPlan: any) => void;
}

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealColors = {
  breakfast: { bg: 'from-orange-100 to-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', text: 'text-orange-800', content: 'text-orange-700', kcal: 'text-orange-600' },
  lunch: { bg: 'from-blue-100 to-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', text: 'text-blue-800', content: 'text-blue-700', kcal: 'text-blue-600' },
  dinner: { bg: 'from-purple-100 to-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', text: 'text-purple-800', content: 'text-purple-700', kcal: 'text-purple-600' },
  snack: { bg: 'from-green-100 to-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-800', content: 'text-green-700', kcal: 'text-green-600' }
};

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const MealPlanPreviewModal: React.FC<MealPlanPreviewModalProps> = ({
  open,
  mealPlan,
  isPremium,
  showFullWeek,
  onToggleWeekView,
  onClose,
  onImport,
  onMealplanUpdate,
}) => {
  const { user, getAccessToken } = useAuth();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [localMealPlan, setLocalMealPlan] = useState(mealPlan);

  // Update localMealPlan when mealPlan prop changes
  React.useEffect(() => {
    setLocalMealPlan(mealPlan);
  }, [mealPlan]);

  // Find user's rating when mealplan changes
  React.useEffect(() => {
    if (localMealPlan?.ratings && user?.id) {
      const found = localMealPlan.ratings.find((r: any) => r.user === user.id || r.user?._id === user.id);
      setUserRating(found ? found.value : null);
    } else {
      setUserRating(null);
    }
  }, [localMealPlan, user]);

  const handleRating = async (value: number) => {
    if (!user) {
      alert('You must be logged in to rate meal plans.');
      return;
    }

    try {
      const token = getAccessToken();
      const res = await fetch('http://localhost:8080/mealplan/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mealplanId: localMealPlan._id, value })
      });

      if (!res.ok) throw new Error('Failed to rate meal plan');
      
      const data = await res.json();
      // Update the local state with new rating data
      const updatedMealPlan = {
        ...localMealPlan,
        ratings: data.ratings,
        averageRating: data.averageRating,
        totalRatings: data.totalRatings
      };
      setLocalMealPlan(updatedMealPlan);
      setUserRating(value);
      
      // Call the onMealplanUpdate prop if provided
      if (onMealplanUpdate) {
        onMealplanUpdate(updatedMealPlan);
      }
    } catch (err) {
      alert('Failed to submit rating.');
    }
  };

  if (!localMealPlan) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <ChefHat className="h-6 w-6 text-emerald-600" />
            <span>{localMealPlan.title}</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete meal plan overview and weekly schedule
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-8">
          {/* Enhanced Plan Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative group">
                <img 
                  src={localMealPlan.image ? `http://localhost:8080/${localMealPlan.image}` : DEFAULT_MEALPLAN_IMAGE} 
                  alt={localMealPlan.title}
                  className="w-full h-64 object-cover rounded-xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl"></div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg text-center w-full">
                <div className="text-2xl font-bold text-emerald-600">7</div>
                <div className="text-sm text-emerald-700">Days</div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Plan</h3>
                <p className="text-gray-600 leading-relaxed">{localMealPlan.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-sm text-gray-500">Difficulty Level</span>
                  <p className="font-semibold text-lg">{capitalizeFirstLetter(localMealPlan.difficulty || 'Medium')}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Daily Calories</span>
                  <p className="font-semibold text-lg">
                    {(() => {
                      if (!localMealPlan.slots || localMealPlan.slots.length === 0) return 'N/A';
                      const dayGroups: { [key: string]: any[] } = {};
                      localMealPlan.slots.forEach((slot: any) => {
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
                      return avgCalories > 0 ? `~${avgCalories} kcal` : 'N/A';
                    })()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Rating</span>
                  <div className="space-y-2">
                    {/* Interactive rating stars */}
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (userRating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    {/* Average rating display */}
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-gray-400 stroke-2" />
                      <span className="text-sm text-gray-600">
                        ({localMealPlan.averageRating?.toFixed(1) || '0.0'}) • {localMealPlan.ratings?.length || 0} ratings
                      </span>
                    </div>
                  </div>
                </div>
                {isPremium ? (
                  <div>
                    <span className="text-sm text-gray-500">Daily Nutrition</span>
                    <div className="space-y-1">
                      {(() => {
                        if (!localMealPlan.slots || localMealPlan.slots.length === 0) return <p className="font-semibold text-lg">N/A</p>;
                        const dayGroups: { [key: string]: any[] } = {};
                        localMealPlan.slots.forEach((slot: any) => {
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
                          <div className="text-sm space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-violet-600">Protein:</span>
                              <span className="font-medium">~{avgProtein}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-600">Carbs:</span>
                              <span className="font-medium">~{avgCarbs}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-600">Fat:</span>
                              <span className="font-medium">~{avgFat}g</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm text-gray-500">Daily Nutrition</span>
                    <p className="font-semibold text-lg text-gray-400">Premium Feature</p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-2">Features</span>
                <div className="flex flex-wrap gap-2">
                  {(localMealPlan.tags || ['Healthy', 'Balanced']).map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700 px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Weekly Calendar */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-emerald-600" />
                <span>Weekly Schedule</span>
              </h3>
              <Button
                variant="outline"
                onClick={onToggleWeekView}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                {showFullWeek ? 'Show Sample Day' : 'Show Full Week'}
              </Button>
            </div>
            <div className={`grid gap-4 grid-cols-1`}>
              {(showFullWeek ? 
                ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : 
                ['Monday']
              ).map((day, dayIndex) => {
                const daySlots = localMealPlan.slots ? localMealPlan.slots.filter((slot: any) => 
                  (slot.dayOfWeek && slot.dayOfWeek.toLowerCase() === day.toLowerCase()) ||
                  (slot.date && new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long' }) === day)
                ) : [];
                return (
                  <div key={day} className="border-2 border-emerald-100 rounded-xl p-4 bg-gradient-to-b from-emerald-50/50 to-white hover:shadow-lg transition-shadow">
                    <h4 className="font-semibold text-emerald-800 text-center mb-4 text-lg">{day}</h4>
                    {!showFullWeek && (
                      <p className="text-center text-sm text-emerald-600 mb-4 italic">Sample day preview</p>
                    )}
                    <div className="space-y-3">
                      {mealTypes.map(mealType => {
                        // Find slot where mealType matches, normalizing both to singular and lowercase
                        const slot = daySlots.find((s: any) => {
                          if (!s.mealType) return false;
                          // Normalize: remove trailing 's' for plural, lowercase
                          const backendType = s.mealType.toLowerCase().replace(/s$/, '');
                          const frontendType = mealType.toLowerCase();
                          return backendType === frontendType;
                        });
                        const colors = mealColors[mealType as keyof typeof mealColors];
                        if (!slot || !slot.recipe) {
                          return (
                            <div key={mealType} className={`bg-gradient-to-r ${colors.bg} p-3 rounded-lg border ${colors.border} opacity-50`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                                <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>{mealType}</span>
                              </div>
                              <p className={`text-sm ${colors.content} font-medium`}>No meal planned</p>
                              <p className={`text-xs ${colors.kcal} mt-1`}>0 kcal</p>
                            </div>
                          );
                        }
                        const recipe = slot.recipe;
                        const servings = slot.servings || 1;
                        const recipeServings = recipe.servings || 1;
                        const multiplier = servings / recipeServings;
                        const calories = Math.round((recipe.calories || 0) * multiplier);
                        return (
                          <div key={mealType} className={`bg-gradient-to-r ${colors.bg} p-3 rounded-lg border ${colors.border}`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                              <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>{mealType}</span>
                            </div>
                            <p className={`text-sm ${colors.content} font-medium`}>{recipe.name || 'Unknown Recipe'}</p>
                            <p className={`text-xs ${colors.kcal} mt-1`}>~{calories} cal {servings > 1 ? `(${servings} servings)` : ''}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-100">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">
                          {(() => {
                            const dayTotalCalories = daySlots.reduce((total: number, slot: any) => {
                              if (slot.recipe && typeof slot.recipe === 'object') {
                                const recipe = slot.recipe;
                                const servings = slot.servings || 1;
                                const recipeServings = recipe.servings || 1;
                                const multiplier = servings / recipeServings;
                                return total + ((recipe.calories || 0) * multiplier);
                              }
                              return total;
                            }, 0);
                            return dayTotalCalories > 0 ? `~${Math.round(dayTotalCalories)} kcal total` : 'No meals planned';
                          })()}
                        </p>
                        {(() => {
                          const count = daySlots.length;
                          const dayTotalCalories = daySlots.reduce((total: number, slot: any) => {
                            if (slot.recipe && typeof slot.recipe === 'object') {
                              const recipe = slot.recipe;
                              const servings = slot.servings || 1;
                              const recipeServings = recipe.servings || 1;
                              const multiplier = servings / recipeServings;
                              return total + ((recipe.calories || 0) * multiplier);
                            }
                            return total;
                          }, 0);
                          return dayTotalCalories > 0 ? (
                            <p className="text-xs text-gray-500">
                              {count} meal{count !== 1 ? 's' : ''} planned
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!showFullWeek && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">Click "Show Full Week" to see the complete 7-day schedule</p>
              </div>
            )}
          </div>
          {/* Import Action Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-emerald-100">
            <Button 
              onClick={e => {
                e.stopPropagation();
                onImport(localMealPlan);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
            >
              <Download className="h-4 w-4 mr-2" />
              Import to Planner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealPlanPreviewModal; 