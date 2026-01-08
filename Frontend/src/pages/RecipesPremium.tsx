import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Heart, Clock, Star, Search, Filter, BookmarkPlus, Users, Crown, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";

const RecipesPremium = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [proteinMin, setProteinMin] = useState([25]);
  const [carbsMax, setCarbsMax] = useState([20]);
  const [calorieRange, setCalorieRange] = useState([300, 500]);
  const [prepTimeMax, setPrepTimeMax] = useState([30]);
  
  const recipes = [
    {
      id: 1,
      title: "High-Protein Grilled Chicken Bowl",
      description: "Lean grilled chicken with quinoa and steamed vegetables - perfect for fitness goals",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      prepTime: "25 min",
      difficulty: "Easy",
      rating: 4.9,
      reviews: 342,
      calories: 420,
      protein: "32g",
      carbs: "18g",
      fat: "12g",
      isLiked: true,
      author: "Chef Marcus",
      tags: ["High Protein", "Low Carb", "Fitness", "Grilled"],
      cuisine: "Modern",
      cookingMethod: "Grill",
      allergens: [],
      isPremium: true
    },
    {
      id: 2,
      title: "One-Pot Mediterranean Cod",
      description: "Flaky cod with olives, tomatoes, and herbs in a single pot",
      image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      prepTime: "28 min",
      difficulty: "Medium",
      rating: 4.8,
      reviews: 189,
      calories: 385,
      protein: "28g",
      carbs: "15g",
      fat: "22g",
      isLiked: false,
      author: "Chef Elena",
      tags: ["One-Pot", "Mediterranean", "Fish", "Low Carb"],
      cuisine: "Mediterranean",
      cookingMethod: "One-Pot",
      allergens: [],
      isPremium: true
    },
    {
      id: 3,
      title: "Beef Stir-Fry Power Bowl",
      description: "Lean beef strips with colorful vegetables and cauliflower rice",
      image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2775&q=80",
      prepTime: "20 min",
      difficulty: "Easy",
      rating: 4.7,
      reviews: 256,
      calories: 450,
      protein: "35g",
      carbs: "12g",
      fat: "28g",
      isLiked: true,
      author: "Chef David",
      tags: ["High Protein", "Keto-Friendly", "Quick", "Stir-Fry"],
      cuisine: "Asian",
      cookingMethod: "Stir-Fry",
      allergens: [],
      isPremium: true
    },
    {
      id: 4,
      title: "Grilled Salmon with Asparagus",
      description: "Omega-3 rich salmon with perfectly grilled asparagus spears",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2680&q=80",
      prepTime: "22 min",
      difficulty: "Easy",
      rating: 4.9,
      reviews: 178,
      calories: 395,
      protein: "30g",
      carbs: "8g",
      fat: "26g",
      isLiked: false,
      author: "Chef Sarah",
      tags: ["Omega-3", "Anti-Inflammatory", "Grilled", "Keto"],
      cuisine: "Modern",
      cookingMethod: "Grill",
      allergens: [],
      isPremium: true
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              Premium Features
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Recipe Discovery</h1>
          <p className="text-gray-600">Find recipes tailored to your exact fitness and dietary goals with precision filters</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by ingredients, nutrients, or cooking methods..."
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
              Advanced Filters
              <Zap className="h-4 w-4 ml-2 text-yellow-500" />
            </Button>
          </div>

          {/* Premium Filter Panel */}
          {showFilters && (
            <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-yellow-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                  Premium Nutrition & Fitness Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nutrition Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Min Protein: {proteinMin[0]}g per serving
                    </Label>
                    <Slider
                      value={proteinMin}
                      onValueChange={setProteinMin}
                      max={50}
                      min={15}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Max Carbs: {carbsMax[0]}g per serving
                    </Label>
                    <Slider
                      value={carbsMax}
                      onValueChange={setCarbsMax}
                      max={50}
                      min={5}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Max Prep Time: {prepTimeMax[0]} minutes
                    </Label>
                    <Slider
                      value={prepTimeMax}
                      onValueChange={setPrepTimeMax}
                      max={60}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Calorie Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Calorie Range: {calorieRange[0]} - {calorieRange[1]} kcal
                  </Label>
                  <Slider
                    value={calorieRange}
                    onValueChange={setCalorieRange}
                    max={800}
                    min={200}
                    step={25}
                    className="w-full"
                  />
                </div>

                {/* Cooking Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Cooking Method</Label>
                    <Select>
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Any method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any method</SelectItem>
                        <SelectItem value="grill">Grill</SelectItem>
                        <SelectItem value="one-pot">One-Pot</SelectItem>
                        <SelectItem value="stir-fry">Stir-Fry</SelectItem>
                        <SelectItem value="bake">Bake</SelectItem>
                        <SelectItem value="steam">Steam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</Label>
                    <Select>
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Any cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any cuisine</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="asian">Asian</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="mexican">Mexican</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</Label>
                    <Select>
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
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goals</Label>
                    <Select>
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                        <SelectItem value="weight-loss">Weight Loss</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Allergen Exclusions */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-3">Allergen Exclusions</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {["Dairy", "Gluten", "Nuts", "Soy", "Eggs", "Shellfish"].map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox id={allergen.toLowerCase()} />
                        <Label htmlFor={allergen.toLowerCase()} className="text-sm text-gray-700">
                          No {allergen}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dietary Preferences */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-3">Dietary Preferences</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Keto", "Paleo", "Vegetarian", "Vegan", "Low-Carb", "High-Protein", "Anti-Inflammatory", "Whole30"].map((diet) => (
                      <div key={diet} className="flex items-center space-x-2">
                        <Checkbox id={diet.toLowerCase().replace("-", "")} />
                        <Label htmlFor={diet.toLowerCase().replace("-", "")} className="text-sm text-gray-700">
                          {diet}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="border-emerald-100 hover:shadow-lg transition-all duration-300 hover:border-emerald-300 group relative">
              {recipe.isPremium && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
              
              <div className="relative">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-t-lg bg-emerald-100"
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`backdrop-blur-sm bg-white/80 hover:bg-white/90 ${
                      recipe.isLiked ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${recipe.isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="backdrop-blur-sm bg-white/80 hover:bg-white/90 text-gray-600 hover:text-emerald-600"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                </div>
                <Badge className={`absolute bottom-3 left-3 ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </Badge>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {recipe.title}
                  </CardTitle>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{recipe.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{recipe.description}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.prepTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.reviews} reviews</span>
                  </div>
                </div>
                
                {/* Premium Nutrition Info */}
                <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-emerald-700">{recipe.calories}</div>
                      <div className="text-gray-600">kcal</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">{recipe.protein}</div>
                      <div className="text-gray-600">protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-700">{recipe.carbs}</div>
                      <div className="text-gray-600">carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-700">{recipe.fat}</div>
                      <div className="text-gray-600">fat</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">by {recipe.author}</span>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    View Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8">
            Load More Premium Recipes
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RecipesPremium;
