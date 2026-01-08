import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin, 
  Calendar,
  Clock,
  Star,
  Bookmark,
  Grid3X3,
  Users,
  ChefHat,
  UserPlus,
  UserCheck,
  Trash2,
  MoreVertical,
  CircleUser
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { IRecipe } from "@/types/recipe";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { mealplanAPI, templateAPI } from "@/lib/api";
import { getCurrentWeek } from "@/lib/utils";
import { toast } from 'sonner';
import MealPlanPreviewModal from "@/components/MealPlanPreviewModal";

// Interface for user data with followers/following
interface IUserWithSocial {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  subscriptionType: 'free' | 'premium';
  followers: string[];
  following: string[];
  joinedAt?: string;
}

const DEFAULT_RECIPE_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';
const DEFAULT_MEALPLAN_IMAGE = 'http://localhost:8080/default_images/default-recipe-image.jpg';

const UserProfile = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("recipes");
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<IRecipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<IRecipe[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<IRecipe | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Meal plan deletion state
  const [deleteMealplanDialogOpen, setDeleteMealplanDialogOpen] = useState(false);
  const [mealplanToDelete, setMealplanToDelete] = useState<any>(null);
  const [deletingMealplan, setDeletingMealplan] = useState(false);
  
  // Dialog state for followers/following
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  
  // State for user details with followers/following
  const [userDetails, setUserDetails] = useState<{
    followers: string[];
    following: string[];
  } | null>(null);
  
  // State for mapping user IDs to full user data
  const [idToUserData, setIdToUserData] = useState<{[id: string]: IUserWithSocial}>({});
  
  const [favoriteMealplans, setFavoriteMealplans] = useState<any[]>([]);
  // Add state for all mealplans and my mealplans
  const [allMealplans, setAllMealplans] = useState<any[]>([]);
  const [myMealplans, setMyMealplans] = useState<any[]>([]);
  
  // Add new state for MealPlanPreviewModal
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<any>(null);
  const [showFullWeek, setShowFullWeek] = useState(false);
  
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();

  // Create axios instance with automatic token handling
  const api = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: true,
  });

  // Add request interceptor to add token to requests
  api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Fetch user's recipes
  const fetchUserRecipes = async () => {
    try {
      const response = await api.get<IRecipe[]>('/recipes');
      // Filter recipes to only show those created by the current user
      const myRecipes = response.data.filter(recipe => {
        try {
          // Simple check - if author object has username, compare it
          return (recipe.author as any)?.username === user?.username;
        } catch {
          return false;
        }
      });
      
      // Sort recipes by createdAt in descending order (newest first)
      const sortedRecipes = [...myRecipes].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      setUserRecipes(sortedRecipes);
    } catch (error) {
      console.error('Failed to fetch user recipes:', error);
    }
  };

  // Fetch user's favorite recipes
  const fetchFavoriteRecipes = async () => {
    try {
      const response = await api.get<IRecipe[]>('/recipes/favorites');
      setFavoriteRecipes(response.data);
    } catch (error) {
      console.error('Failed to fetch favorite recipes:', error);
    }
  };

  // Fetch user's favorite meal plans
  const fetchFavoriteMealplans = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setFavoriteMealplans([]);
        return;
      }
      const res = await fetch('http://localhost:8080/mealplan/template/favorites', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch favorite meal plans');
      const data = await res.json();
      setFavoriteMealplans(data);
    } catch (error) {
      setFavoriteMealplans([]);
      console.error('Failed to fetch favorite meal plans:', error);
    }
  };

  // Fetch user details including followers/following
  const fetchUserDetails = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get<IUserWithSocial>(`/api/auth/users/${user.id}`);
      const userData = response.data;
      setUserDetails({
        followers: userData.followers || [],
        following: userData.following || [],
      });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // Set empty arrays as fallback
      setUserDetails({
        followers: [],
        following: [],
      });
    }
  };

  // Fetch usernames for follower/following IDs
  useEffect(() => {
    if (!userDetails) return;
    
    const allIds = Array.from(new Set([
      ...userDetails.followers,
      ...userDetails.following,
    ]));

    if (allIds.length === 0) return;

    // Fetch full user data for each ID
    Promise.all(
      allIds.map(id =>
        api.get<IUserWithSocial>(`/api/auth/users/${id}`)
          .then(res => ({ id, userData: res.data }))
          .catch(() => ({ id, userData: { id, username: id, followers: [], following: [], subscriptionType: 'free' as const } })) // fallback if error
      )
    ).then(results => {
      const mapping: {[id: string]: IUserWithSocial} = {};
      results.forEach(({ id, userData }) => {
        mapping[id] = userData;
      });
      setIdToUserData(mapping);
    });
  }, [userDetails]);

  // Delete recipe function
  const handleDeleteRecipe = async (recipe: IRecipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMealplan = (mealplan: any) => {
    setMealplanToDelete(mealplan);
    setDeleteMealplanDialogOpen(true);
  };

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/recipes/${recipeToDelete._id}`);
      
      // Update local state to remove the deleted recipe
      setUserRecipes(prev => prev.filter(recipe => recipe._id !== recipeToDelete._id));
      setFavoriteRecipes(prev => prev.filter(recipe => recipe._id !== recipeToDelete._id));
      
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
      
      // Show success message (you could use a toast here)
      console.log('Recipe deleted successfully');
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      // Handle error (you could show an error toast here)
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteMealplan = async () => {
    if (!mealplanToDelete) return;
    
    setDeletingMealplan(true);
    try {
      // Delete the meal plan template
      await api.delete(`/mealplan/template/${mealplanToDelete._id}`);
      
      // Update local state to remove the deleted meal plan
      setMyMealplans(prev => prev.filter(plan => plan._id !== mealplanToDelete._id));
      setAllMealplans(prev => prev.filter(plan => plan._id !== mealplanToDelete._id));
      setFavoriteMealplans(prev => prev.filter(plan => plan._id !== mealplanToDelete._id));
      
      setDeleteMealplanDialogOpen(false);
      setMealplanToDelete(null);
      
      console.log('Meal plan deleted successfully');
    } catch (error) {
      console.error('Failed to delete meal plan:', error);
      // Handle error (you could show an error toast here)
    } finally {
      setDeletingMealplan(false);
    }
  };

  // Add new handler for importing mealplan
  const handleImportMealPlan = async (mealplan: any) => {
    const currentWeek = getCurrentWeek(); // Get current week in ISO format (YYYY-WXX)
    try {
      // Fetch the user's mealplan for the current week
      let existingMealplan = null;
      try {
        existingMealplan = await mealplanAPI.getMyWeekMealplan(currentWeek);
      } catch (err) {
        // If not found, ignore
        existingMealplan = null;
      }
      
      // If a mealplan exists, delete it using the new endpoint
      if (existingMealplan && existingMealplan._id) {
        try {
          await mealplanAPI.deleteMyWeekMealplan(existingMealplan._id);
        } catch (err) {
          // Ignore error if not found
        }
      }
      
      // Import the new meal plan
      await mealplanAPI.copyMealplanToMyWeek(mealplan._id, currentWeek);
      toast.success(`"${mealplan.title}" has been imported to your current week! Visit My Week to view it.`);
      setPreviewDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to import meal plan.');
    }
  };

  // Add new handler for rating updates
  const handleMealplanUpdate = (updatedMealplan: any) => {
    // Update the mealplan in both arrays if it exists
    setMyMealplans(prev => prev.map(plan => 
      plan._id === updatedMealplan._id ? updatedMealplan : plan
    ));
    setFavoriteMealplans(prev => prev.map(plan => 
      plan._id === updatedMealplan._id ? updatedMealplan : plan
    ));
    setSelectedMealPlan(updatedMealplan);
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      try {
        await Promise.all([
          fetchUserRecipes(),
          fetchFavoriteRecipes(),
          fetchUserDetails(),
          fetchFavoriteMealplans()
        ]);
        // Fetch all mealplans and filter for my mealplans
        const allPlans = await templateAPI.getTemplates();
        setAllMealplans(allPlans);
        setMyMealplans(allPlans.filter((plan: any) => plan.author?._id === user.id));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  // Calculate user stats
  const userStats = {
    recipes: userRecipes.length,
    followers: userDetails?.followers.length || 0,
    following: userDetails?.following.length || 0
  };

  // Format join date
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    
    const firstInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const usernameInitial = user.username ? user.username.charAt(0).toUpperCase() : '';
    
    return firstInitial || usernameInitial || "U";
  };

  // Handle recipe click
  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="border-emerald-100 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-emerald-100">
                  <AvatarImage src={user.profileImage || ''} alt={user.firstName || user.username || 'User'} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-2xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 rounded-full p-2">
                  <ChefHat className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username || 'User'}
                    </h1>
                    <p className="text-emerald-600 font-medium">@{user.username}</p>
                    {user.subscriptionType !== 'free' && (
                      <Badge className="mt-1 bg-emerald-600 text-white">
                        <ChefHat className="h-3 w-3 mr-1" />
                        Premium Chef
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{userStats.recipes}</p>
                    <p className="text-sm text-gray-600">Recipes</p>
                  </div>
                  {/* Followers - clickable */}
                  <div 
                    className="text-center cursor-pointer hover:bg-emerald-50 rounded px-2 py-1 transition"
                    onClick={() => setFollowersDialogOpen(true)}
                  >
                    <p className="text-xl font-bold text-gray-900">{userStats.followers}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                  {/* Following - clickable */}
                  <div 
                    className="text-center cursor-pointer hover:bg-emerald-50 rounded px-2 py-1 transition"
                    onClick={() => setFollowingDialogOpen(true)}
                  >
                    <p className="text-xl font-bold text-gray-900">{userStats.following}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                <p className="text-gray-700 mb-3">{user.bio}</p>
                )}
                
                {/* Join Date */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined recently
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-emerald-50 border border-emerald-100">
            <TabsTrigger value="recipes" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Grid3X3 className="h-4 w-4 mr-2" />
              My Recipes
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Heart className="h-4 w-4 mr-2" />
              Fav. Recipes
            </TabsTrigger>
            <TabsTrigger value="my-mealplans" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              My Mealplans
            </TabsTrigger>
            <TabsTrigger value="meal-plans" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Fav. Mealplans
            </TabsTrigger>
          </TabsList>

          {/* My Recipes Tab */}
          <TabsContent value="recipes" className="mt-6">
            {userRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRecipes.map((recipe) => (
                  <Card 
                    key={recipe._id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden relative"
                  >
                    {/* Recipe Options Dropdown */}
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
                              handleRecipeClick(recipe._id);
                            }}
                          >
                            View Recipe
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecipe(recipe);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Recipe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="relative" onClick={() => handleRecipeClick(recipe._id)}>
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
            ) : (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipes Yet</h3>
                <p className="text-gray-600 mb-4">Start sharing your culinary creations!</p>
                <Button 
                  onClick={() => navigate('/recipes/create')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Create Your First Recipe
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab: Only favorite recipes */}
          <TabsContent value="favorites" className="mt-6">
            {favoriteRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteRecipes.map((recipe) => (
                  <Card 
                    key={recipe._id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden"
                  >
                    <div className="relative">
                      <img
                        src={recipe.image ? `http://localhost:8080/${recipe.image}` : DEFAULT_RECIPE_IMAGE}
                        alt={recipe.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        onClick={() => handleRecipeClick(recipe._id)}
                      />
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`backdrop-blur-sm bg-white/80 hover:bg-white/90 text-red-500 hover:text-red-600`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = getAccessToken();
                              await fetch(`http://localhost:8080/recipes/favorites/${recipe._id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                                credentials: 'include',
                              });
                              setFavoriteRecipes(prev => prev.filter(r => r._id !== recipe._id));
                            } catch (err) {
                              // Optionally show error toast
                            }
                          }}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
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
            ) : (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Favorites Yet</h3>
                <p className="text-gray-600 mb-4">Start favoriting recipes you love!</p>
                <Button 
                  onClick={() => navigate('/browse')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Browse Recipes
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Mealplans Tab */}
          <TabsContent value="my-mealplans" className="mt-6">
            {myMealplans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myMealplans.map((plan) => (
                  <Card key={plan._id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden relative">
                    {/* Meal Plan Options Dropdown */}
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
                              setSelectedMealPlan(plan);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMealplan(plan);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Meal Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div 
                      className="relative"
                      onClick={() => {
                        setSelectedMealPlan(plan);
                        setPreviewDialogOpen(true);
                      }}
                    >
                      <img
                        src={plan.image ? `http://localhost:8080/${plan.image}` : DEFAULT_MEALPLAN_IMAGE}
                        alt={plan.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Meal Plans Yet</h3>
                <p className="text-gray-600 mb-4">Create and publish your first meal plan!</p>
                <Button onClick={() => navigate('/my-week')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create Meal Plan
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Meal Plans Tab: Only favorite mealplans */}
          <TabsContent value="meal-plans" className="mt-6">
            {favoriteMealplans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteMealplans.map((plan) => (
                  <Card key={plan._id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-emerald-100 overflow-hidden">
                    <div 
                      className="relative"
                      onClick={() => {
                        setSelectedMealPlan(plan);
                        setPreviewDialogOpen(true);
                      }}
                    >
                      <img
                        src={plan.image ? `http://localhost:8080/${plan.image}` : DEFAULT_MEALPLAN_IMAGE}
                        alt={plan.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="backdrop-blur-sm bg-white/80 hover:bg-white/90 text-red-500 hover:text-red-600"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = getAccessToken();
                              await fetch(`http://localhost:8080/mealplan/template/favorites/${plan._id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                                credentials: 'include',
                              });
                              setFavoriteMealplans(prev => prev.filter(p => p._id !== plan._id));
                            } catch (err) {
                              // Optionally show error toast
                            }
                          }}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
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
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Favorite Meal Plans Yet</h3>
                <p className="text-gray-600 mb-4">Start favoriting meal plans you love!</p>
                <Button 
                  onClick={() => navigate('/browse?tab=mealplans')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Browse Meal Plans
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Followers Dialog */}
        <AlertDialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Followers</AlertDialogTitle>
              <AlertDialogDescription>
                Users that follow you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-64 overflow-y-auto">
              {userDetails?.followers.length ? (
                userDetails.followers.map((id) => {
                  const userData = idToUserData[id];
                  const initials = userData?.username 
                    ? userData.username[0].toUpperCase() 
                    : id[0].toUpperCase();
                  
                  return (
                    <div key={id} className="py-2 border-b last:border-b-0 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {userData?.profileImage ? (
                          <AvatarImage
                            src={userData.profileImage}
                            alt={userData.username}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-emerald-100 text-emerald-600">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className="text-gray-800 cursor-pointer hover:text-emerald-600 hover:underline"
                        onClick={() => {
                          navigate(`/users/${id}`);
                          setFollowersDialogOpen(false);
                        }}
                      >
                        {userData?.username || id}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No followers yet.</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Following Dialog */}
        <AlertDialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Following</AlertDialogTitle>
              <AlertDialogDescription>
                Users that you are following.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-64 overflow-y-auto">
              {userDetails?.following.length ? (
                userDetails.following.map((id) => {
                  const userData = idToUserData[id];
                  const initials = userData?.username 
                    ? userData.username[0].toUpperCase() 
                    : id[0].toUpperCase();
                  
                  return (
                    <div key={id} className="py-2 border-b last:border-b-0 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {userData?.profileImage ? (
                          <AvatarImage
                            src={userData.profileImage}
                            alt={userData.username}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-emerald-100 text-emerald-600">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className="text-gray-800 cursor-pointer hover:text-emerald-600 hover:underline"
                        onClick={() => {
                          navigate(`/users/${id}`);
                          setFollowingDialogOpen(false);
                        }}
                      >
                        {userData?.username || id}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">Not following anyone yet.</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{recipeToDelete?.name}"? This action cannot be undone and will remove the recipe from all pages including the community feed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteRecipe}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete Recipe"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Meal Plan Delete Dialog */}
        <AlertDialog open={deleteMealplanDialogOpen} onOpenChange={setDeleteMealplanDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meal Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{mealplanToDelete?.title}"? This action cannot be undone and will:
                <br />• Remove the meal plan from Browse page
                <br />• Delete all imported copies from user's My Week pages
                <br />• Remove it from all user favorites
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingMealplan}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteMealplan}
                disabled={deletingMealplan}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingMealplan ? "Deleting..." : "Delete Meal Plan"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add MealPlanPreviewModal */}
        <MealPlanPreviewModal
          open={previewDialogOpen}
          mealPlan={selectedMealPlan}
          isPremium={user?.subscriptionType !== 'free'}
          showFullWeek={showFullWeek}
          onToggleWeekView={() => setShowFullWeek(!showFullWeek)}
          onClose={() => {
            setPreviewDialogOpen(false);
            setSelectedMealPlan(null);
          }}
          onImport={handleImportMealPlan}
          onMealplanUpdate={handleMealplanUpdate}
        />
      </main>
    </div>
  );
};

export default UserProfile;