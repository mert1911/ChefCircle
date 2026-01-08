import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Grid3X3, 
  Heart, 
  Calendar, 
  Users 
} from "lucide-react";
import RecipeGrid from "./RecipeGrid";
import MealPlanGrid from "./MealPlanGrid";
import { IRecipe } from "@/types/recipe";
import { useNavigate } from "react-router-dom";

interface MealPlan {
  _id: string;
  title: string;
  image?: string;
  author?: {
    username: string;
    _id: string;
  };
}

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRecipes: IRecipe[];
  favoriteRecipes: IRecipe[];
  myMealplans: MealPlan[];
  favoriteMealplans: MealPlan[];
  currentUserId?: string;
  onDeleteRecipe: (recipe: IRecipe) => void;
  onDeleteMealplan: (mealplan: MealPlan) => void;
  onToggleFavoriteRecipe: (recipe: IRecipe, isFavorited: boolean) => void;
  onToggleFavoriteMealplan: (mealplan: MealPlan, isFavorited: boolean) => void;
}

const ProfileTabs = ({
  activeTab,
  setActiveTab,
  userRecipes,
  favoriteRecipes,
  myMealplans,
  favoriteMealplans,
  currentUserId,
  onDeleteRecipe,
  onDeleteMealplan,
  onToggleFavoriteRecipe,
  onToggleFavoriteMealplan
}: ProfileTabsProps) => {
  const navigate = useNavigate();

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleMealplanClick = (mealplanId: string) => {
    navigate(`/mealplans/${mealplanId}`);
  };

  return (
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
        <RecipeGrid
          recipes={userRecipes}
          showActions={true}
          showFavoriteButton={false}
          emptyStateTitle="No Recipes Yet"
          emptyStateDescription="Start sharing your culinary creations!"
          emptyStateButtonText="Create Your First Recipe"
          onRecipeClick={handleRecipeClick}
          onEmptyStateClick={() => navigate('/recipes/create')}
          onDeleteRecipe={onDeleteRecipe}
        />
      </TabsContent>

      {/* Favorites Tab: Only favorite recipes */}
      <TabsContent value="favorites" className="mt-6">
        <RecipeGrid
          recipes={favoriteRecipes}
          showActions={false}
          showFavoriteButton={true}
          emptyStateTitle="No Favorites Yet"
          emptyStateDescription="Start favoriting recipes you love!"
          emptyStateButtonText="Browse Recipes"
          onRecipeClick={handleRecipeClick}
          onEmptyStateClick={() => navigate('/browse')}
          onToggleFavorite={onToggleFavoriteRecipe}
        />
      </TabsContent>

      {/* My Mealplans Tab */}
      <TabsContent value="my-mealplans" className="mt-6">
        <MealPlanGrid
          mealplans={myMealplans}
          showActions={true}
          showFavoriteButton={false}
          emptyStateTitle="No Meal Plans Yet"
          emptyStateDescription="Create and publish your first meal plan!"
          emptyStateButtonText="Create Meal Plan"
          onMealplanClick={handleMealplanClick}
          onEmptyStateClick={() => navigate('/my-week')}
          onDeleteMealplan={onDeleteMealplan}
        />
      </TabsContent>

      {/* Meal Plans Tab: Only favorite mealplans */}
      <TabsContent value="meal-plans" className="mt-6">
        <MealPlanGrid
          mealplans={favoriteMealplans}
          showActions={false}
          showFavoriteButton={true}
          emptyStateTitle="No Favorite Meal Plans Yet"
          emptyStateDescription="Start favoriting meal plans you love!"
          emptyStateButtonText="Browse Meal Plans"
          onMealplanClick={handleMealplanClick}
          onEmptyStateClick={() => navigate('/browse?tab=mealplans')}
          onToggleFavorite={onToggleFavoriteMealplan}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs; 