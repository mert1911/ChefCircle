import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Calendar, Users, TrendingUp, Heart, Clock, Star, Plus, Utensils, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import ShoppingList from "@/components/ShoppingList";
import NutritionChart from "@/components/NutritionChart";
import { mealplanAPI, recipeAPI, shoppingListAPI } from "@/lib/api";
import { 
  getCurrentWeek, 
  getToday, 
  getTodaysMeals, 
  calculateDailyNutrition,
  formatNutrition,
  getMealTypeDisplay
} from "@/lib/utils";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const displayName = user?.firstName || user?.username || "Chef";

  // State for data
  const [currentWeek, setCurrentWeek] = useState<string>(getCurrentWeek());
  const [currentWeekMealplan, setCurrentWeekMealplan] = useState<any>(null);
  const [newestRecipes, setNewestRecipes] = useState<any[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<any>({});
  const [nutritionData, setNutritionData] = useState<Record<string, {calories:number, protein:number, carbs:number, fat:number}>>({});
  const [recipeCount, setRecipeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data only when authenticated
  useEffect(() => {
    const loadDashboardData = async () => {
      // Don't load data if still loading auth or not authenticated
      if (isLoading || !isAuthenticated) {
        return;
      }
      
      try {
        setLoading(true);
        console.log('Dashboard: Starting to load data for authenticated user');
        const week = getCurrentWeek();
        setCurrentWeek(week);
        console.log('Current week:', week);
        
        // Load current week mealplan
        const mealplan = await mealplanAPI.getMyWeekMealplan(week);
        console.log('Mealplan data:', mealplan);
        setCurrentWeekMealplan(mealplan);
        
        // Calculate today's meals
        const todaysMealsData = getTodaysMeals(mealplan.slots || []);
        console.log('Today\'s meals:', todaysMealsData);
        setTodaysMeals(todaysMealsData);
        
        // Fetch nutrition data from backend
        const nutritionData = await mealplanAPI.getWeeklyNutrition(week);
        console.log('Nutrition data:', nutritionData);
        setNutritionData(nutritionData);
        
        // Load newest recipes
        const recipes = await recipeAPI.getNewestRecipes(3);
        console.log('Newest recipes:', recipes);
        setNewestRecipes(recipes);
        
        // Load total recipe count
        const count = await recipeAPI.getRecipeCount();
        console.log('Recipe count:', count);
        setRecipeCount(count);
        
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, isLoading]); // Only run when auth state changes

  // Calculate stats from real data
  const calculateStats = () => {
    const totalMealsPlanned = currentWeekMealplan?.slots?.length || 0;
    const nutritionValues = Object.values(nutritionData || {}) as {calories:number}[];
    const totalCalories = nutritionValues.reduce((sum, day) => sum + (typeof day.calories === 'number' ? day.calories : 0), 0);
    const avgCaloriesPerDay = Number.isFinite(totalCalories) ? totalCalories / 7 : 0;

    return [
      { 
        label: "Recipes Available", 
        value: recipeCount.toString(), 
        icon: <ChefHat className="h-5 w-5 text-emerald-600" /> 
      },
      { 
        label: "Meals Planned", 
        value: totalMealsPlanned.toString(), 
        icon: <Calendar className="h-5 w-5 text-emerald-600" /> 
      },
      { 
        label: "Avg Daily Calories", 
        value: Math.round(avgCaloriesPerDay).toString(), 
        icon: <TrendingUp className="h-5 w-5 text-emerald-600" /> 
      },
      { 
        label: "Shopping Items", 
        value: "View List", 
        icon: <ShoppingCart className="h-5 w-5 text-emerald-600" /> 
      }
    ];
  };

  const stats = calculateStats();

  // Show loading while auth is loading or dashboard data is loading
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isLoading ? "Authenticating..." : "Loading your dashboard..."}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !currentWeekMealplan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">No mealplan found for this week</h2>
            <p className="text-gray-600 mb-6">Create a mealplan to get started with your recipes and nutrition tracking!</p>
            <Link to="/my-week">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-3">Create Mealplan</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {displayName}! 🍳
          </h1>
          <p className="text-gray-600">
            Today is {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="border-emerald-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                switch (index) {
                  case 0: // Recipes Available
                    window.location.href = '/browse';
                    break;
                  case 1: // Meals Planned
                    window.location.href = '/my-week';
                    break;
                  case 2: // Avg Daily Calories
                    document.getElementById('nutrition-chart')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                  case 3: // Shopping Items
                    document.getElementById('shopping-list')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-full">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Newest Recipes */}
          <div className="lg:col-span-2">
            <Card className="border-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Latest Recipes
                </CardTitle>
                <Link to="/browse">
                  <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {newestRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {newestRecipes.map((recipe) => (
                      <div key={recipe._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center">
                          {recipe.image ? (
                            <img
                              src={`http://localhost:8080/${recipe.image}`}
                              alt={recipe.name}
                              className="w-full h-full rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-2xl">🍽️</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                          <p className="text-sm text-gray-600">by {recipe.author?.username || 'Unknown'}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {recipe.prepTimeMin + (recipe.cookTimeMin ? ` + ${recipe.cookTimeMin}` : '')} min
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{typeof recipe.averageRating === 'number' ? recipe.averageRating.toFixed(1) : 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Utensils className="h-4 w-4 text-gray-400" />
                              {(() => {
                                const nutritionKeys = [
                                  'calories', 'protein_g', 'totalFat_g', 'saturatedFat_g', 'cholesterol_mg',
                                  'sodium_mg', 'carbohydrates_g', 'fiber_g', 'sugars_g'
                                ];
                                const hasNutrition = nutritionKeys.some(key => typeof recipe[key] === 'number' && Number(recipe[key]) > 0);
                                if (!hasNutrition) {
                                  return <span className="text-sm text-gray-400">No nutrition data</span>;
                                }
                                return <span className="text-sm text-gray-600">{recipe.calories} kcal</span>;
                              })()}
                            </div>
                          </div>
                        </div>
                        <Link to={`/recipes/${recipe._id}`}>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipes yet</h3>
                    <p className="text-gray-600 mb-4">Let's create some delicious recipes!</p>
                    <Link to="/create-recipe">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Create Your First Recipe
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Meal Plan */}
          <div>
            <Card className="border-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Today's Plan
                </CardTitle>
                <Link to="/my-week">
                  <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {Object.keys(todaysMeals).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(todaysMeals).map(([mealType, mealData]: [string, any]) => (
                      <div key={mealType} className="p-3 bg-emerald-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-emerald-800 capitalize">{getMealTypeDisplay(mealType)}</span>
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                            {Math.round(mealData.calories)} kcal
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{mealData.recipe.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(mealData.protein)}g protein • {mealData.servings} serving{mealData.servings > 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">No meals planned for today</p>
                  </div>
                )}
                <Link to="/my-week">
                  <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Plan Your Week
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Shopping List */}
        <div id="shopping-list" className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shopping List</h2>
          <ShoppingList />
        </div>

        {/* Nutrition Chart */}
        <div id="nutrition-chart" className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nutrition Overview</h2>
          <NutritionChart nutritionData={nutritionData} week={currentWeekMealplan?.week || currentWeek} />
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
