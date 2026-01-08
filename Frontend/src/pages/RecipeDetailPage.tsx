import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Star,
  Users,
  Calendar,
  ChefHat,
  Globe,
  Tag,
  CircleUser,
  Heart,
  Star as StarIcon
} from "lucide-react";
import Navigation from "@/components/Navigation";
import axios from 'axios';
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// --- NEW/UPDATED INTERFACES FOR AUTHOR DISPLAY ---
// This interface defines the shape of the author object when populated by the backend
interface IAuthorForDisplay {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

// Define the shape of the data expected from your backend API
// Updated 'author' field to be the IAuthorForDisplay interface
interface Recipe {
  _id: string;
  id: string; // Mapped from _id for consistency in frontend
  
  name: string;
  description: string;
  tags?: string[];
  rating?: number; // Made optional, as it has a default in schema
  prepTimeMin?: number;
  cookTimeMin?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;

  ingredients: {
    ingredient: { name: string };
    amount: number;
    unit: string;
  }[];

  author?: IAuthorForDisplay; // CRUCIAL CHANGE: Author is now an object with user details
  image?: string;
  reviews?: number;
  isLiked?: boolean;
  instructions?: string[];
  
  calories?: number;
  protein_g?: number;
  totalFat_g?: number;
  saturatedFat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  carbohydrates_g?: number;
  fiber_g?: number;
  sugars_g?: number;
  
  createdAt: string;
  updatedAt: string;
  isPublic: boolean; // Added isPublic field
  averageRating?: number; // Added averageRating field
  ratings?: { user: string; value: number }[]; // Added ratings field
  totalRatings?: number; // <-- Add this line
}

const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [userPlannedRecipes, setUserPlannedRecipes] = useState<string[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Fetch user's planned recipes on mount
  useEffect(() => {
    const fetchUserPlannedRecipes = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8080/user/planned-recipes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch planned recipes');
        const data = await res.json();
        setUserPlannedRecipes((data.plannedRecipes || []).map((r: any) => (typeof r === 'string' ? r : r._id)));
      } catch (err) {
        setUserPlannedRecipes([]);
      }
    };
    fetchUserPlannedRecipes();
  }, []);
  const { getAccessToken, user } = useAuth();

  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);
      try {
        // The backend now populates the 'author' field
        const response = await fetch(`http://localhost:8080/recipes/${id}`); 

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        const data: Recipe = await response.json();
        setRecipe({ ...data, id: data._id });
        // --- NEW: Find user's rating if available ---
        if (data.ratings && user && user.id) {
          const found = data.ratings.find((r: any) => r.user === user.id || r.user?._id === user.id);
          setUserRating(found ? found.value : null);
        } else {
          setUserRating(null);
        }
        console.log("Fetched Recipe Data (Frontend Console):", data);
        
        // Check if this recipe is in favorites
        const token = getAccessToken();
        if (token) {
          const headers = {
            'Authorization': `Bearer ${token}`,
          };

          const [favRes, mealplanRes] = await Promise.all([
            fetch('http://localhost:8080/recipes/favorites', {
              headers,
              credentials: 'include',
            }),
            fetch('http://localhost:8080/mealplan/', {
              headers,
              credentials: 'include',
            })
          ]);

          if (favRes.ok) {
            const favs: Recipe[] = await favRes.json();
            setIsLiked(favs.some(r => r._id === data._id));
          }
          if (mealplanRes.ok) {
            const mealplan = await mealplanRes.json();
            // This logic is no longer needed as userPlannedRecipes is the source of truth
            // setIsInMealplan(
            //   mealplan.plannedRecipes
            //     .map((r: any) => (typeof r === 'string' ? r : r._id))
            //     .includes(data._id)
            // );
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch recipe:", err);
        setError(err.message || "Failed to load recipe. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id, getAccessToken, user]);

  // Toggle favorite status
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recipe) return;
    const token = getAccessToken();
    if (!token) return alert('You must be logged in to save favorites.');

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      if (!isLiked) {
        await axios.post(`http://localhost:8080/recipes/favorites/${recipe._id}`, {}, {
          headers,
          withCredentials: true,
        });
        setIsLiked(true);
      } else {
        await axios.delete(`http://localhost:8080/recipes/favorites/${recipe._id}`, {
          headers,
          withCredentials: true,
        });
        setIsLiked(false);
      }
    } catch (err) {
      alert('Failed to update favorites.');
    }
  };

  // Add/remove recipe to/from mealplan collection (user-global)
  const handleToggleMealplan = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recipe) return;
    const token = getAccessToken();
    if (!token) return alert('You must be logged in to use meal planning.');
    try {
      if (!userPlannedRecipes.includes(recipe._id)) {
        const res = await fetch('http://localhost:8080/user/planned-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ recipeId: recipe._id })
        });
        if (!res.ok) throw new Error('Failed to add to planned recipes');
      } else {
        const res = await fetch(`http://localhost:8080/user/planned-recipes/${recipe._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to remove from planned recipes');
      }
      // Re-fetch planned recipes
      const res = await fetch('http://localhost:8080/user/planned-recipes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUserPlannedRecipes((data.plannedRecipes || []).map((r: any) => (typeof r === 'string' ? r : r._id)));
    } catch (err) {
      alert('Failed to update planned recipes.');
    }
  };

  // --- NEW: Handle rating submission ---
  const handleRate = async (value: number) => {
    if (!recipe) return;
    const token = getAccessToken();
    if (!token) return alert('You must be logged in to rate.');
    try {
      const res = await fetch('http://localhost:8080/recipes/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipeId: recipe._id, value })
      });
      if (!res.ok) throw new Error('Failed to rate recipe');
      
      // Update user rating immediately
      setUserRating(value);
      
      // Refetch the recipe to update averageRating and totalRatings
      const recipeRes = await fetch(`http://localhost:8080/recipes/${recipe._id}`);
      if (!recipeRes.ok) throw new Error('Failed to fetch updated recipe');
      const updatedRecipe = await recipeRes.json();
      
      // Update recipe data but preserve user rating
      setRecipe(r => {
        if (!r) return r;
        const newRecipe = { ...updatedRecipe, id: updatedRecipe._id };
        
        // Re-find user's rating in the updated data to ensure consistency
        if (newRecipe.ratings && user && user.id) {
          const found = newRecipe.ratings.find((rating: any) => {
            const ratingUserId = typeof rating.user === 'string' ? rating.user : rating.user?._id || rating.user;
            return ratingUserId === user.id;
          });
          if (found) {
            // Only update userRating if it's different from the current value
            if (found.value !== value) {
              setUserRating(found.value);
            }
          } else {
            // If no rating found, keep the current userRating (the one they just submitted)
            console.log("No rating found in updated data, keeping current userRating:", value);
          }
        }
        
        return newRecipe;
      });
    } catch (err) {
      alert('Failed to submit rating.');
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "N/A";
    }
  };

  const capitalizeFirstLetter = (str: string | undefined): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading recipe details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center flex-col">
        <p className="text-red-600 text-lg mb-4">Error: {error}</p>
      </div>
    );
  }

  if (!loading && recipe && recipe.isPublic === false) {
    return (
      <>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-4">Ouh, seems like this recipe was deleted.</h2>
          <p className="mb-6">The recipe you are looking for is no longer available.</p>
          <Button
            onClick={() => navigate('/recipes')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Search for other recipes
          </Button>
        </div>
      </>
    );
  }

  if (!recipe) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg mb-4">Recipe not found.</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-end mb-6">
          {/* Update/Delete Buttons: Only show if user is the author */}
          {recipe.author && user && recipe.author._id === user.id && (
            <div className="flex gap-2">
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate(`/recipes/${recipe._id}/edit`)}
              >
                Edit Recipe
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Delete Recipe
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete it?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50 hover:text-emerald-700">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={async () => {
                        try {
                          const token = getAccessToken();
                          await axios.delete(`http://localhost:8080/recipes/${recipe._id}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                            withCredentials: true,
                          });
                          navigate('/recipes');
                        } catch (err) {
                          alert('Failed to delete recipe.');
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <Card className="border-emerald-100 shadow-lg">
          <CardHeader className="pb-4 relative">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              {recipe.name}
              <Button
                variant="ghost"
                size="sm"
                className={`ml-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                onClick={handleToggleFavorite}
                aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`ml-2 ${userPlannedRecipes.includes(recipe._id) ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-emerald-600'}`}
                onClick={handleToggleMealplan}
                aria-label={userPlannedRecipes.includes(recipe._id) ? 'Remove from mealplan' : 'Add to mealplan'}
                title={userPlannedRecipes.includes(recipe._id) ? 'In Mealplan' : 'Add to Mealplan'}
              >
                <Calendar className={`h-6 w-6 ${userPlannedRecipes.includes(recipe._id) ? 'fill-current' : ''}`} />
              </Button>
            </CardTitle>
            {/* --- NEW: Interactive Star Rating --- */}
            <div className="flex items-center gap-2 mt-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  className="focus:outline-none"
                >
                  <StarIcon
                    className={`h-6 w-6 transition-colors duration-150 ${
                      (hoverRating !== null ? star <= hoverRating : userRating !== null ? star <= userRating : false)
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                    fill={(hoverRating !== null ? star <= hoverRating : userRating !== null ? star <= userRating : false) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {userRating ? `Your rating: ${userRating}` : 'Rate this recipe'}
              </span>
              {/* Remove the average rating display from here */}
            </div>
            {/* --- END: Interactive Star Rating --- */}
            <p className="text-gray-700 text-lg">{recipe.description}</p>
            {recipe.author && (
              <Link
                to={`/users/${recipe.author._id}`}
                className="absolute top-4 right-4 flex items-center space-x-1 text-gray-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                title={`View profile of ${recipe.author.username}`}
              >
                <CircleUser className="h-5 w-5" />
                <span className="font-semibold text-sm">{recipe.author.username}</span>
              </Link>
            )}
            <div className="flex flex-wrap items-center space-x-4 mt-2 text-gray-600">
              {typeof recipe.prepTimeMin === 'number' && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.prepTimeMin} min preparation</span>
                </div>
              )}
              {typeof recipe.cookTimeMin === 'number' && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.cookTimeMin} min cooking</span>
                </div>
              )}
              {typeof recipe.servings === 'number' && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} serving(s)</span>
                </div>
              )}
              {/* Replace the old rating display with the actual averageRating */}
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-gray-400" />
                <span>{typeof recipe.averageRating === 'number' ? recipe.averageRating.toFixed(1) : 'N/A'}</span>
                <span className="text-gray-400">({typeof recipe.totalRatings === 'number' ? recipe.totalRatings : 0})</span>
              </div>
              {recipe.cuisine && (
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>{capitalizeFirstLetter(recipe.cuisine)}</span>
                </div>
              )}
              {recipe.difficulty && (
                <div className="flex items-center space-x-1">
                  <ChefHat className="h-4 w-4" />
                  <span>{capitalizeFirstLetter(recipe.difficulty)}</span>
                </div>
              )}
            </div>
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap items-center space-x-2 mt-4">
                {recipe.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700 flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {recipe.image && (
              <img
                src={`http://localhost:8080/${recipe.image}`}
                alt={recipe.name}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">Ingredients</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {recipe.ingredients.map((item, index) => (
                  <li key={index}>
                    {item.amount} {item.unit} {item.ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Instructions</h2>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}
            {/* Nutrition Facts Section */}
            {(() => {
              const nutritionKeys = [
                'calories', 'protein_g', 'totalFat_g', 'saturatedFat_g', 'cholesterol_mg',
                'sodium_mg', 'carbohydrates_g', 'fiber_g', 'sugars_g'
              ];
              const hasNutrition = nutritionKeys.some(key => typeof recipe[key as keyof typeof recipe] === 'number' && Number(recipe[key as keyof typeof recipe]) > 0);
              if (!hasNutrition) {
                return (
                  <div className="mb-6 border-t pt-4">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">Nutrition Facts </h2>
                    <div className="text-gray-500 text-base">No nutrition data available</div>
                  </div>
                );
              }
              return (
                <div className="mb-6 border-t pt-4">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-3">Nutrition Facts </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-700">
                    {typeof recipe.calories === 'number' && Number(recipe.calories) > 0 && <p><strong>Calories:</strong> {recipe.calories} kcal</p>}
                    {typeof recipe.protein_g === 'number' && Number(recipe.protein_g) > 0 && <p><strong>Protein:</strong> {recipe.protein_g} g</p>}
                    {typeof recipe.totalFat_g === 'number' && Number(recipe.totalFat_g) > 0 && <p><strong>Total Fat:</strong> {recipe.totalFat_g} g</p>}
                    {typeof recipe.saturatedFat_g === 'number' && Number(recipe.saturatedFat_g) > 0 && <p><strong>Saturated Fat:</strong> {recipe.saturatedFat_g} g</p>}
                    {typeof recipe.cholesterol_mg === 'number' && Number(recipe.cholesterol_mg) > 0 && <p><strong>Cholesterol:</strong> {recipe.cholesterol_mg} mg</p>}
                    {typeof recipe.sodium_mg === 'number' && Number(recipe.sodium_mg) > 0 && <p><strong>Sodium:</strong> {recipe.sodium_mg} mg</p>}
                    {typeof recipe.carbohydrates_g === 'number' && Number(recipe.carbohydrates_g) > 0 && <p><strong>Carbohydrates:</strong> {recipe.carbohydrates_g} g</p>}
                    {typeof recipe.fiber_g === 'number' && Number(recipe.fiber_g) > 0 && <p><strong>Fiber:</strong> {recipe.fiber_g} g</p>}
                    {typeof recipe.sugars_g === 'number' && Number(recipe.sugars_g) > 0 && <p><strong>Sugars:</strong> {recipe.sugars_g} g</p>}
                  </div>
                </div>
              );
            })()}
            <div className="text-gray-500 text-sm border-t pt-4">
              <span>Uploaded: {formatDate(recipe.createdAt)}</span>
              {/* Remove the 'Last updated' display entirely */}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default RecipeDetailPage;