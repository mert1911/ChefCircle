import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Clock, Star, Search, Filter, BookmarkPlus, Users, Plus, Globe, ChefHat, Tag, CircleUser, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";

// Import new hooks
import { useRecipeFiltering, defaultRecipeFilters, RecipeFilters, IRecipe } from '@/hooks/useRecipeFiltering';
import { useFavorites } from '@/hooks/useFavorites';
import { useAPIWithAuth } from '@/hooks/useAPIWithAuth';

// Author interface
export interface IAuthorForDisplay {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

// Define the path to your default image
const DEFAULT_RECIPE_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

const Recipes: React.FC = () => {
  const navigate = useNavigate();
  const { getAccessToken, user } = useAuth();
  const api = useAPIWithAuth();
  
  // Use new hooks
  const { favorites, handleToggleFavorite } = useFavorites();
  
  // State to hold fetched recipes
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for Load More functionality
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(9);

  // State for user's planned recipes
  const [userPlannedRecipes, setUserPlannedRecipes] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<RecipeFilters>(defaultRecipeFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Use filtering hook
  const { filteredRecipes, isAnyFilterActive, resetFilters } = useRecipeFiltering(
    recipes, 
    filters, 
    favorites, 
    userPlannedRecipes
  );

  // Check if user is premium
  const isPremium = user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active';

  // Predefined options
  const predefinedCuisines = [
    "Mediterranean", "Middle Eastern", "Latin American", "Asian", "African",
    "European", "North American", "Fusion", "Other"
  ];
  const predefinedTags = [
    "Vegan", "Vegetarian", "Gluten-Free", "Low-Carb",
    "High-Protein", "Keto", "Paleo", "Dairy-Free"
  ];

  // Helper functions
  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag) 
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    setFilters(prev => ({ ...prev, selectedTags: newTags }));
  };

  const capitalizeFirstLetter = (str: string | undefined): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getDifficultyColor = (difficulty: string | undefined) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch recipes and user's planned recipes on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const recipesRes = await fetch('http://localhost:8080/recipes');
        if (!recipesRes.ok) throw new Error('Failed to fetch recipes');

        const data: IRecipe[] = await recipesRes.json();
        
        // Mark isLiked for each recipe
        const mappedData = data.map(recipe => ({ 
          ...recipe, 
          id: recipe._id, 
          isLiked: favorites.includes(recipe._id) 
        }));
        
        // Sort recipes by createdAt in descending order (newest first)
        const sortedData = [...mappedData].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setRecipes(sortedData);

      } catch (err: any) {
        setError(err.message || 'Failed to load recipes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [favorites]);

  // Fetch user's planned recipes
  useEffect(() => {
    const fetchPlannedRecipes = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const res = await fetch('http://localhost:8080/user/planned-recipes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserPlannedRecipes((data.plannedRecipes || []).map((r: any) => 
            typeof r === 'string' ? r : r._id
          ));
        }
      } catch (err) {
        console.error('Failed to fetch planned recipes:', err);
      }
    };

    fetchPlannedRecipes();
  }, [getAccessToken]);

  // Add/remove recipe to/from mealplan collection
  const handleToggleMealplan = async (e: React.MouseEvent, recipeId: string, isInPlanned: boolean) => {
    e.stopPropagation();
    const token = getAccessToken();
    if (!token) return alert('You must be logged in to use meal planning.');
    
    try {
      if (!isInPlanned) {
        const res = await api.post('/user/planned-recipes', { recipeId });
        if (!res.status.toString().startsWith('2')) throw new Error('Failed to add to planned recipes');
      } else {
        const res = await api.delete(`/user/planned-recipes/${recipeId}`);
        if (!res.status.toString().startsWith('2')) throw new Error('Failed to remove from planned recipes');
      }
      
             // Re-fetch planned recipes
       const res = await api.get<{ plannedRecipes: Array<string | { _id: string }> }>('/user/planned-recipes');
       setUserPlannedRecipes((res.data.plannedRecipes || []).map((r: any) => 
         typeof r === 'string' ? r : r._id
       ));
    } catch (err) {
      alert('Failed to update planned recipes.');
    }
  };

  // Function to handle "Load More" button click
  const handleLoadMore = () => {
    setVisibleRecipeCount(prevCount => prevCount + 9);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters(resetFilters());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center flex-col">
        <p className="text-red-600 text-lg mb-4">Error: {error}</p>
        <Button onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700">
          Go Home
        </Button>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg mb-4">No recipes found. Try creating one!</p>
          <Button onClick={() => navigate('/recipes/create')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Create First Recipe
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Recipes</h1>
              <p className="text-gray-600">Find your next favorite dish</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/recipes/create')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Recipe
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search recipes by name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10 border-emerald-200 focus:border-emerald-500 pr-10"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: "" }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {isAnyFilterActive && (
                <Badge className="ml-2 bg-emerald-600 text-white">
                  Active
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="border-emerald-100 bg-emerald-50/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Cuisine Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
                    <Select 
                      value={filters.selectedCuisine} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, selectedCuisine: value }))}
                    >
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Any cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any cuisine</SelectItem>
                        {predefinedCuisines.map(cuisine => (
                          <SelectItem key={cuisine} value={cuisine}>
                            {cuisine.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <Select 
                      value={filters.selectedDifficulty} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, selectedDifficulty: value }))}
                    >
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

                                     {/* Prep Time Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time</label>
                     <Select 
                       value={filters.selectedPrepTime} 
                       onValueChange={(value) => setFilters(prev => ({ ...prev, selectedPrepTime: value }))}
                     >
                       <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                         <SelectValue placeholder="Any time" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Any time</SelectItem>
                         <SelectItem value="quick">Quick (≤15 min)</SelectItem>
                         <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                         <SelectItem value="long">Long (&gt;30 min)</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                                     {/* Cook Time Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Cook Time</label>
                     <Select 
                       value={filters.selectedCookTime} 
                       onValueChange={(value) => setFilters(prev => ({ ...prev, selectedCookTime: value }))}
                     >
                       <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                         <SelectValue placeholder="Any time" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Any time</SelectItem>
                         <SelectItem value="quick">Quick (≤15 min)</SelectItem>
                         <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                         <SelectItem value="long">Long (&gt;30 min)</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>

                {/* Quick Filters */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.showOnlyFavorites ? 'default' : 'outline'}
                      className={filters.showOnlyFavorites ? 'bg-red-100 text-red-600 border-red-300' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'}
                      onClick={() => setFilters(prev => ({ ...prev, showOnlyFavorites: !prev.showOnlyFavorites }))}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Favorites
                    </Button>
                    <Button
                      variant={filters.showOnlyPlanned ? 'default' : 'outline'}
                      className={filters.showOnlyPlanned ? 'bg-blue-100 text-blue-600 border-blue-300' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'}
                      onClick={() => setFilters(prev => ({ ...prev, showOnlyPlanned: !prev.showOnlyPlanned }))}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Planned
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map(tag => (
                      <Button
                        key={tag}
                        variant={filters.selectedTags.includes(tag) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className={filters.selectedTags.includes(tag) 
                          ? 'bg-emerald-600 text-white' 
                          : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                        }
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {isAnyFilterActive && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="text-emerald-600 hover:bg-emerald-50"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recipe Results */}
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Showing {Math.min(visibleRecipeCount, filteredRecipes.length)} of {filteredRecipes.length} recipes
          </p>
          
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              {isAnyFilterActive && (
                <Button onClick={handleClearFilters} className="bg-emerald-600 hover:bg-emerald-700">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.slice(0, visibleRecipeCount).map((recipe) => (
                  <Card
                    key={recipe._id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden"
                    onClick={() => navigate(`/recipes/${recipe._id}`)}
                  >
                    <div className="relative">
                      <img
                        src={recipe.image || DEFAULT_RECIPE_IMAGE}
                        alt={recipe.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_RECIPE_IMAGE;
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => handleToggleFavorite(e, recipe._id, recipe.isLiked)}
                          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                            recipe.isLiked || favorites.includes(recipe._id)
                              ? 'bg-red-100 text-red-600'
                              : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${
                            recipe.isLiked || favorites.includes(recipe._id) ? 'fill-current' : ''
                          }`} />
                        </button>
                        <button
                          onClick={(e) => handleToggleMealplan(e, recipe._id, userPlannedRecipes.includes(recipe._id))}
                          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                            userPlannedRecipes.includes(recipe._id)
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          <BookmarkPlus className={`h-4 w-4 ${
                            userPlannedRecipes.includes(recipe._id) ? 'fill-current' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 transition-colors">
                        {recipe.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {recipe.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {((recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0))} min
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {recipe.servings || 1}
                          </div>
                        </div>
                        {recipe.difficulty && (
                          <Badge className={getDifficultyColor(recipe.difficulty)}>
                            {capitalizeFirstLetter(recipe.difficulty)}
                          </Badge>
                        )}
                      </div>
                      
                      {recipe.tags && recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {recipe.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-emerald-200 text-emerald-600">
                              {tag}
                            </Badge>
                          ))}
                          {recipe.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                              +{recipe.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {recipe.author && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CircleUser className="h-4 w-4 mr-1" />
                          {recipe.author.firstName || recipe.author.username}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Load More Button */}
              {visibleRecipeCount < filteredRecipes.length && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    Load More Recipes
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Recipes;
