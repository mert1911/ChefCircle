import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, ChefHat, Search, Filter, Star, Calendar, Plus, Upload, ArrowLeft } from "lucide-react";

interface MealPlan {
  _id: string;
  title: string;
  description: string;
  image: string;
  difficulty: string;
  tags: string[];
  averageRating?: number;
  ratings?: any[];
  author?: {
    username: string;
  };
  slots?: any[];
}

interface MealplanSelectorProps {
  onSelectMealplan: (mealplan: MealPlan) => void;
  onCreateManually: () => void;
  onCancel: () => void;
}

const DEFAULT_MEALPLAN_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

const MealplanSelector = ({ onSelectMealplan, onCreateManually, onCancel }: MealplanSelectorProps) => {
  const [selectedMealplan, setSelectedMealplan] = useState<MealPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    keto: false,
    paleo: false
  });
  const [mealplans, setMealplans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullWeek, setShowFullWeek] = useState(false);
  
  // Fetch meal plan templates from the API
  useEffect(() => {
    const fetchMealplans = async () => {
      try {
        const response = await fetch('http://localhost:8080/mealplan/template');
        if (response.ok) {
          const data = await response.json();
          setMealplans(data);
        }
      } catch (error) {
        console.error('Failed to fetch meal plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealplans();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
      case "beginner":
        return "bg-green-100 text-green-800";
      case "medium":
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelectMealplan = (mealplan: MealPlan) => {
    setSelectedMealplan(mealplan);
  };

  const handleGoBack = () => {
    setSelectedMealplan(null);
  };

  const handleConfirmSelection = () => {
    if (selectedMealplan) {
      onSelectMealplan(selectedMealplan);
    }
  };

  const filteredMealplans = mealplans.filter((plan) => {
    const matchesSearch = searchQuery === "" || 
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = difficultyFilter === "all" || 
      plan.difficulty?.toLowerCase() === difficultyFilter;

    const matchesDietary = Object.entries(dietaryFilters).every(([key, enabled]) => {
      if (!enabled) return true;
      return plan.tags?.some(tag => tag.toLowerCase().includes(key.replace(/([A-Z])/g, '-$1').toLowerCase()));
    });

    return matchesSearch && matchesDifficulty && matchesDietary;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading meal plans...</p>
        </div>
      </div>
    );
  }

  if (selectedMealplan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to meal plan list</span>
          </Button>
          <h3 className="text-lg font-semibold text-emerald-700">Selected Meal Plan</h3>
        </div>

        {/* Enhanced Plan Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative group">
              <img 
                src={selectedMealplan.image ? `http://localhost:8080/${selectedMealplan.image}` : DEFAULT_MEALPLAN_IMAGE} 
                alt={selectedMealplan.title}
                className="w-full h-64 object-cover rounded-xl shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_MEALPLAN_IMAGE; }}
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
              <p className="text-gray-600 leading-relaxed">{selectedMealplan.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-gray-500">Difficulty Level</span>
                <p className="font-semibold text-lg">{selectedMealplan.difficulty ? selectedMealplan.difficulty.charAt(0).toUpperCase() + selectedMealplan.difficulty.slice(1) : 'Medium'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Daily Calories</span>
                <p className="font-semibold text-lg">
                  {(() => {
                    if (!selectedMealplan.slots || selectedMealplan.slots.length === 0) return 'N/A';
                    
                    // Calculate daily nutrition for this meal plan
                    const dayGroups: { [key: string]: any[] } = {};
                    selectedMealplan.slots.forEach((slot: any) => {
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
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-lg">{selectedMealplan.averageRating?.toFixed(1) || '4.5'}</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Author</span>
                <p className="font-semibold text-lg">{selectedMealplan.author?.username || 'Unknown'}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-500 block mb-2">Features</span>
              <div className="flex flex-wrap gap-2">
                {(selectedMealplan.tags || ['Healthy', 'Balanced']).map((tag: string, index: number) => (
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
              onClick={() => setShowFullWeek(!showFullWeek)}
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
              // Get slots for this specific day
              const daySlots = selectedMealplan.slots ? selectedMealplan.slots.filter((slot: any) => 
                (slot.dayOfWeek && slot.dayOfWeek.toLowerCase() === day.toLowerCase()) ||
                (slot.date && new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long' }) === day)
              ) : [];
              
              // Group slots by meal type
              const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
              const mealColors = {
                breakfast: { bg: 'from-orange-100 to-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', text: 'text-orange-800', content: 'text-orange-700', kcal: 'text-orange-600' },
                lunch: { bg: 'from-blue-100 to-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', text: 'text-blue-800', content: 'text-blue-700', kcal: 'text-blue-600' },
                dinner: { bg: 'from-purple-100 to-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', text: 'text-purple-800', content: 'text-purple-700', kcal: 'text-purple-600' },
                snack: { bg: 'from-green-100 to-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-800', content: 'text-green-700', kcal: 'text-green-600' }
              };
              
              // Calculate total calories for the day
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
                        // Show empty slot
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
                        {dayTotalCalories > 0 ? `~${Math.round(dayTotalCalories)} kcal total` : 'No meals planned'}
                      </p>
                      {dayTotalCalories > 0 && (
                        <p className="text-xs text-gray-500">
                          {daySlots.length} meal{daySlots.length !== 1 ? 's' : ''} planned
                        </p>
                      )}
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

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import This Plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Manually Option */}
      <div className="mb-6">
        <Button 
          onClick={onCreateManually}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Manually
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search meal plans, tags, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any level</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
                  <div className="space-y-2">
                    {Object.entries(dietaryFilters).map(([key, checked]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={checked}
                          onChange={(e) => setDietaryFilters(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor={key} className="text-sm text-gray-700 capitalize">
                          {key === 'glutenFree' ? 'Gluten-Free' : key}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <h3 className="text-lg font-semibold text-emerald-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-5 w-5" />
          <span>Select a Meal Plan ({filteredMealplans.length} found)</span>
        </div>
      </h3>
      
      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {filteredMealplans.map((plan) => (
          <Card 
            key={plan._id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 hover:border-emerald-200"
            onClick={() => handleSelectMealplan(plan)}
          >
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="relative">
                  <img
                    src={plan.image ? `http://localhost:8080/${plan.image}` : DEFAULT_MEALPLAN_IMAGE}
                    alt={plan.title}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_MEALPLAN_IMAGE; }}
                  />
                  <Badge className={`absolute -top-1 -right-1 text-xs ${getDifficultyColor(plan.difficulty)}`}>
                    {plan.difficulty || 'medium'}
                  </Badge>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{plan.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{plan.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>7 days</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{plan.ratings?.length || 0} reviews</span>
                      </span>
                      {plan.averageRating && (
                        <span className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{plan.averageRating.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-600">
                        {(() => {
                          if (!plan.slots || plan.slots.length === 0) return 'N/A kcal/day';
                          
                          // Calculate average daily calories
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
                      </span>
                      <span className="text-emerald-600 font-medium">by {plan.author?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {plan.tags?.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  

                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredMealplans.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No meal plans found matching your criteria.</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default MealplanSelector; 