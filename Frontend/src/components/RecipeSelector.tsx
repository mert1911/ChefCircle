
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, ArrowLeft, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import RecipeSearchAndFilters from "./RecipeSearchAndFilters";

interface Recipe {
  _id: string;
  name: string;
  description: string;
  image: string;
  prepTimeMin?: number;  // Fixed field name to match API
  cookTimeMin?: number;  // Fixed field name to match API
  servings: number;
  difficulty: string;
  cuisine: string;
  rating?: number;
  reviewCount?: number;
  calories?: number;
  protein_g?: number;
  carbohydrates_g?: number;
  totalFat_g?: number;
  tags: string[];
  ingredients: any[];
  instructions: string[];
}

interface RecipeSelectorProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onCancel: () => void;
}

interface RecipeFilters {
  searchQuery: string;
  selectedCuisine: string;
  selectedPrepTime: string;
  selectedCookTime: string;
  selectedDifficulty: string;
  selectedTags: string[];
  showOnlyFavorites: boolean;
  showOnlyPlanned: boolean;
  caloriesRange: [string, string];
  fatRange: [string, string];
  proteinRange: [string, string];
  carbRange: [string, string];
}

const RecipeSelector = ({ onSelectRecipe, onCancel }: RecipeSelectorProps) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userPlannedRecipes, setUserPlannedRecipes] = useState<string[]>([]);
  
  // Use the exact same filter state as Browse page
  const [filters, setFilters] = useState<RecipeFilters>({
    searchQuery: "",
    selectedCuisine: "all",
    selectedPrepTime: "all",
    selectedCookTime: "all",
    selectedDifficulty: "all",
    selectedTags: [],
    showOnlyFavorites: false,
    showOnlyPlanned: false,
    caloriesRange: ["", ""],
    fatRange: ["", ""],
    proteinRange: ["", ""],
    carbRange: ["", ""],
  });

  const { getAccessToken, user } = useAuth();
  const isPremium = user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active';
  
  // Fetch recipes and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAccessToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const [recipesRes, favoritesRes, plannedRes] = await Promise.all([
          fetch('http://localhost:8080/recipes'),
          fetch('http://localhost:8080/recipes/favorites', {
            headers,
            credentials: 'include',
          }),
          fetch('http://localhost:8080/user/planned-recipes', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (recipesRes.ok) {
          const recipesData = await recipesRes.json();
          console.log('RecipeSelector: Fetched recipes:', recipesData.length, recipesData);
          setRecipes(recipesData);
        }

        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json();
          const favoriteIds = favoritesData.map((r: any) => r._id);
          setFavorites(favoriteIds);
        }

        if (plannedRes.ok) {
          const plannedData = await plannedRes.json();
          setUserPlannedRecipes((plannedData.plannedRecipes || []).map((r: any) => (typeof r === 'string' ? r : r._id)));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAccessToken]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleConfirmSelection = () => {
    if (selectedRecipe) {
      onSelectRecipe(selectedRecipe);
    }
  };

  const handleGoBack = () => {
    setSelectedRecipe(null);
  };

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

  // Use the exact same filtering logic as Browse page
  const filteredRecipes = recipes.filter((recipe) => {
    // Search filter
    const lowerCaseSearchQuery = filters.searchQuery.trim().toLowerCase();
    if (lowerCaseSearchQuery &&
      !(recipe.name.toLowerCase().includes(lowerCaseSearchQuery) ||
        recipe.ingredients.some((ing: any) => ing.ingredient?.name?.toLowerCase().includes(lowerCaseSearchQuery)) ||
        recipe.cuisine?.toLowerCase().includes(lowerCaseSearchQuery) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchQuery)))) {
      return false;
    }

    // Favorites and planned filters
    if (filters.showOnlyFavorites && !favorites.includes(recipe._id)) return false;
    if (filters.showOnlyPlanned && !userPlannedRecipes.includes(recipe._id)) return false;

    // Cuisine filter
    if (filters.selectedCuisine !== "all" && recipe.cuisine?.toLowerCase() !== filters.selectedCuisine) return false;
    
    // Difficulty filter
    if (filters.selectedDifficulty !== "all" && recipe.difficulty?.toLowerCase() !== filters.selectedDifficulty) return false;

         // Time filters
     const checkTimeRange = (time: number | undefined, range: string) => {
       if (time === undefined) return range === "all"; // Allow undefined times when "all" is selected
       switch (range) {
         case "quick": return time <= 15;
         case "medium": return time > 15 && time <= 30;
         case "long": return time > 30;
         case "all": return true;
         default: return true;
       }
     };

     if (!checkTimeRange(recipe.prepTimeMin, filters.selectedPrepTime)) return false;
     if (!checkTimeRange(recipe.cookTimeMin, filters.selectedCookTime)) return false;

    // Tags filter
    if (filters.selectedTags.length > 0 && !(recipe.tags && filters.selectedTags.every(tag => recipe.tags!.map(t => t.toLowerCase()).includes(tag.toLowerCase())))) return false;

         // Nutrition filters (premium only)
     if (isPremium) {
       const checkNutrientRange = (value: number | undefined, range: [string, string]) => {
         // If range is empty (both values are ""), allow all recipes including those without data
         if (range[0] === "" && range[1] === "") return true;
         // If recipe doesn't have nutrition data but range is specified, exclude it
         if (value === undefined) return false;
         const min = Number(range[0]);
         const max = Number(range[1]);
         return (range[0] === "" || value >= min) && (range[1] === "" || value <= max);
       };

       if (!checkNutrientRange(recipe.calories, filters.caloriesRange)) return false;
       if (!checkNutrientRange(recipe.protein_g, filters.proteinRange)) return false;
       if (!checkNutrientRange(recipe.carbohydrates_g, filters.carbRange)) return false;
       if (!checkNutrientRange(recipe.totalFat_g, filters.fatRange)) return false;
     }

    return true;
  });

  console.log('RecipeSelector: Total recipes:', recipes.length, 'Filtered recipes:', filteredRecipes.length, 'Current filters:', filters);

  if (loading) {
    return <div className="text-center py-8">Loading recipes...</div>;
  }

  // Recipe detail view
  if (selectedRecipe) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Selection
            </Button>
          </div>
        </div>

        <Card className="border-emerald-100">
          <div className="relative">
            <img
              src={selectedRecipe.image ? `http://localhost:8080/${selectedRecipe.image}` : 'http://localhost:8080/default_images/default-recipe-image.jpg'}
              alt={selectedRecipe.name}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            <div className="absolute top-4 right-4">
              <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                {selectedRecipe.difficulty}
              </Badge>
            </div>
          </div>
          
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {selectedRecipe.name}
            </CardTitle>
                         <div className="flex items-center space-x-4 text-sm text-gray-600">
               <div className="flex items-center space-x-1">
                 <Clock className="h-4 w-4" />
                 <span>{(selectedRecipe.prepTimeMin || 0) + (selectedRecipe.cookTimeMin || 0)} min total</span>
               </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{selectedRecipe.servings} servings</span>
              </div>
              <div className="flex items-center space-x-1">
                <ChefHat className="h-4 w-4" />
                <span>{selectedRecipe.cuisine}</span>
              </div>
              {selectedRecipe.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span>{selectedRecipe.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-600 mb-6">{selectedRecipe.description}</p>
            
            {/* Nutrition info */}
            {(selectedRecipe.calories || selectedRecipe.protein_g) && (
              <div className="bg-emerald-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-emerald-800 mb-2">Nutrition (per serving)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {selectedRecipe.calories && (
                    <div>
                      <span className="text-gray-600">Calories</span>
                      <p className="font-medium">{selectedRecipe.calories}</p>
                    </div>
                  )}
                  {selectedRecipe.protein_g && (
                    <div>
                      <span className="text-gray-600">Protein</span>
                      <p className="font-medium">{selectedRecipe.protein_g}g</p>
                    </div>
                  )}
                  {selectedRecipe.carbohydrates_g && (
                    <div>
                      <span className="text-gray-600">Carbs</span>
                      <p className="font-medium">{selectedRecipe.carbohydrates_g}g</p>
                    </div>
                  )}
                  {selectedRecipe.totalFat_g && (
                    <div>
                      <span className="text-gray-600">Fat</span>
                      <p className="font-medium">{selectedRecipe.totalFat_g}g</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Recipe list view with identical filters to Browse page
  return (
    <div className="space-y-6">
      {/* Use the exact same filter component as Browse page */}
      <RecipeSearchAndFilters
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        isPremium={isPremium}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
        </h3>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filteredRecipes.map((recipe) => (
          <Card 
            key={recipe._id}
            className="border-emerald-100 hover:shadow-lg transition-all duration-300 hover:border-emerald-300 group cursor-pointer"
            onClick={() => handleSelectRecipe(recipe)}
          >
            <div className="relative">
              <img
                src={recipe.image ? `http://localhost:8080/${recipe.image}` : 'http://localhost:8080/default_images/default-recipe-image.jpg'}
                alt={recipe.name}
                className="w-full h-32 object-cover rounded-t-lg"
              />
              <div className="absolute top-2 right-2">
                <Badge className={getDifficultyColor(recipe.difficulty)}>
                  {recipe.difficulty}
                </Badge>
              </div>
              {favorites.includes(recipe._id) && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-100 text-red-600">♥</Badge>
                </div>
              )}
              {userPlannedRecipes.includes(recipe._id) && (
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-blue-100 text-blue-600">Planned</Badge>
                </div>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {recipe.name}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
                             <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                 <div className="flex items-center space-x-1">
                   <Clock className="h-3 w-3" />
                   <span>{(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)}m</span>
                 </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{recipe.servings}</span>
                </div>
                {recipe.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span>{recipe.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {recipe.calories ? `${recipe.calories} cal` : 'No cal data'}
                {recipe.protein_g && ` • ${recipe.protein_g}g protein`}
              </div>

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      +{recipe.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No recipes found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default RecipeSelector;
