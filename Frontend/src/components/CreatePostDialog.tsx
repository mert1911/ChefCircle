import React, { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Camera, Plus, Minus, Search } from "lucide-react";
import { useAPIWithAuth } from "@/hooks/useAPIWithAuth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ICommunityRecipe, BaseRecipe, transformToCommunityRecipe } from "@/types/unified";

interface RecipeIngredientForm {
  ingredientName: string;
  amount: string;
  unit: string;
}

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  recipes: ICommunityRecipe[];
  setRecipes: React.Dispatch<React.SetStateAction<ICommunityRecipe[]>>;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  recipes,
  setRecipes
}) => {
  const api = useAPIWithAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  
  // Post content
  const [postText, setPostText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Selected existing recipe
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  
  // Recipe search
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  
  // New recipe form state
  const [recipeData, setRecipeData] = useState({
    name: "",
    description: "",
    prepTimeMin: "",
    cookTimeMin: "",
    servings: "",
    difficulty: "",
    cuisine: "",
  });
  
  const [ingredients, setIngredients] = useState<RecipeIngredientForm[]>([
    { ingredientName: "", amount: "", unit: "" },
  ]);
  
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);

  // Unmatched ingredients modal state
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [unmatchedIngredients, setUnmatchedIngredients] = useState<string[]>([]);
  const [createdRecipeId, setCreatedRecipeId] = useState<string | null>(null);

  // Constants
  const predefinedTags = [
    "Vegan", "Vegetarian", "Gluten-Free", "Low-Carb",
    "High-Protein", "Keto", "Paleo", "Dairy-Free",
  ];
  
  const cuisineOptions = [
    "Mediterranean", "Middle Eastern", "Latin American", "Asian", "African",
    "European", "North American", "Fusion", "Other",
  ];
  
  const allowedUnits = [
    "gram", "kilogram", "milliliter", "liter", "tablespoon(s)", "teaspoon(s)",
    "piece(s)", "slice(s)"
  ];

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!recipeSearchQuery.trim()) {
      return recipes;
    }
    
    const query = recipeSearchQuery.toLowerCase();
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [recipes, recipeSearchQuery]);

  // Form helpers
  const handleRecipeField = (k: string, v: string) =>
    setRecipeData(d => ({ ...d, [k]: v }));

  const addIngredient = () => {
    if (ingredients.length < 15) {
      setIngredients(arr => [...arr, { ingredientName: "", amount: "", unit: "" }]);
    }
  };

  const removeIngredient = (i: number) =>
    setIngredients(arr => arr.filter((_, idx) => idx !== i));

  const updateIngredient = (i: number, field: keyof RecipeIngredientForm, v: string) => {
    setIngredients(arr => {
      const copy = [...arr];
      copy[i] = { ...copy[i], [field]: v };
      return copy;
    });
  };

  const addInstruction = () => {
    if (instructions.length < 15) {
      setInstructions(arr => [...arr, ""]);
    }
  };

  const removeInstruction = (i: number) =>
    setInstructions(arr => arr.filter((_, idx) => idx !== i));

  const updateInstruction = (i: number, v: string) => {
    setInstructions(arr => {
      const c = [...arr];
      c[i] = v;
      return c;
    });
  };

  const toggleTag = (tag: string) =>
    setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);

  // Submit new recipe - now returns the recipe ID
  const submitNewRecipe = async (): Promise<string | null> => {
    // Validation
    if (
      !recipeData.name.trim() ||
      !recipeData.description.trim() ||
      !recipeData.prepTimeMin.trim() ||
      !recipeData.cookTimeMin.trim() ||
      !recipeData.servings.trim() ||
      ingredients.filter(i => i.ingredientName.trim()).length === 0 ||
      instructions.filter(i => i.trim()).length === 0
    ) {
      toast({
        title: "All required fields must be filled out",
        variant: "destructive",
        duration: 4000
      });
      return null;
    }

    // Number validation
    const prepTimeNum = parseInt(recipeData.prepTimeMin);
    const cookTimeNum = parseInt(recipeData.cookTimeMin);
    const servingsNum = parseInt(recipeData.servings);
    
    if (isNaN(prepTimeNum) || prepTimeNum < 0 || isNaN(cookTimeNum) || cookTimeNum < 0) {
      toast({
        title: "Prep time and cook time must be 0 or greater.",
        variant: "destructive",
        duration: 4000
      });
      return null;
    }
    
    if (isNaN(servingsNum) || servingsNum <= 0) {
      toast({
        title: "Servings must be a positive number.",
        variant: "destructive",
        duration: 4000
      });
      return null;
    }

    // Create FormData
    const form = new FormData();
    form.append("name", recipeData.name.trim());
    form.append("description", recipeData.description.trim());
    form.append("prepTimeMin", prepTimeNum.toString());
    form.append("cookTimeMin", cookTimeNum.toString());
    form.append("servings", servingsNum.toString());
    form.append("difficulty", recipeData.difficulty || "easy");
    form.append("cuisine", recipeData.cuisine || "Other");

    // Add ingredients as JSON string (matching CreateRecipe.tsx format)
    const validIngredients = ingredients.filter(i => i.ingredientName.trim());
    const formattedIngredients = validIngredients.map(ing => ({
      ingredient: ing.ingredientName.trim(),  // Field name should be "ingredient"
      amount: ing.amount.trim() ? parseFloat(ing.amount.trim()) : undefined,  // Should be number
      unit: ing.unit.trim() || undefined
    }));
    form.append("ingredients", JSON.stringify(formattedIngredients));

    // Add instructions as JSON string
    const validInstructions = instructions.filter(i => i.trim());
    form.append("instructions", JSON.stringify(validInstructions));

    // Add tags as JSON string
    form.append("tags", JSON.stringify(tags));

    // Add image if selected
    if (imageFile) {
      form.append("image", imageFile);
    }

    // Debug logging
    console.log("Sending recipe data:", {
      name: recipeData.name.trim(),
      ingredients: formattedIngredients,
      instructions: validInstructions,
      tags: tags,
      prepTimeMin: prepTimeNum,
      cookTimeMin: cookTimeNum,
      servings: servingsNum,
      hasImage: !!imageFile
    });

    try {
      const res = await api.post<BaseRecipe>("/recipes", form);
      console.log("Recipe created successfully with ID:", res.data._id);
      
      // Store the created recipe ID
      if (res.data && res.data._id) {
        setCreatedRecipeId(res.data._id);
      }

      // Check for missing nutrition data
      const hasAdequateNutritionData = (recipe: any) => {
        // Check if the recipe has meaningful nutrition data
        const nutritionFields = ['calories', 'protein_g', 'carbohydrates_g', 'totalFat_g'];
        return nutritionFields.some(field => 
          typeof recipe[field] === 'number' && recipe[field] > 0
        );
      };

      // Check for unmatched ingredients
      if (res.data.unmatchedIngredients && Array.isArray(res.data.unmatchedIngredients) && res.data.unmatchedIngredients.length > 0) {
        setUnmatchedIngredients(res.data.unmatchedIngredients);
        setShowUnmatchedModal(true);
        return res.data._id; // Return the recipe ID but don't proceed with post creation yet
      } else if (!hasAdequateNutritionData(res.data)) {
        // Check if nutrition data is missing
        toast({
          title: "Nutrition Data Missing",
          description: "One or more ingredients don't have nutrition data available. Please use different ingredient names or check for typos.",
          variant: "destructive",
          duration: 6000
        });
        return null; // Return null to indicate failure
      } else {
        const communityRecipe = transformToCommunityRecipe(res.data);
        setRecipes(r => [communityRecipe, ...r]);
        setSelectedRecipeId(res.data._id);
        setActiveTab("existing");
        toast({
          title: "Recipe created successfully!",
          variant: "default",
          duration: 4000
        });
        return res.data._id; // Return the recipe ID
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to create recipe:", error.response?.data || error.message);
      toast({
        title: "Failed to create recipe",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
        duration: 4000
      });
      return null;
    }
  };

  // Share post
  const sharePost = async () => {
    // Validation
    if (!postText.trim()) {
      toast({
        title: "Post content is required.",
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    if (activeTab === "new") {
      // For new recipes, require all fields
      if (
        !recipeData.name.trim() ||
        !recipeData.description.trim() ||
        !recipeData.prepTimeMin.trim() ||
        !recipeData.cookTimeMin.trim() ||
        !recipeData.servings.trim() ||
        ingredients.filter(i => i.ingredientName.trim()).length === 0 ||
        instructions.filter(i => i.trim()).length === 0
      ) {
        toast({
          title: "All required fields must be filled out",
          variant: "destructive",
          duration: 4000
        });
        return;
      }
      
      // Number validation for new recipe
      const prepTimeNum = parseInt(recipeData.prepTimeMin);
      const cookTimeNum = parseInt(recipeData.cookTimeMin);
      const servingsNum = parseInt(recipeData.servings);
      
      if (isNaN(prepTimeNum) || prepTimeNum < 0 || isNaN(cookTimeNum) || cookTimeNum < 0) {
        toast({
          title: "Prep time and cook time must be 0 or greater.",
          variant: "destructive",
          duration: 4000
        });
        return;
      }
      
      if (isNaN(servingsNum) || servingsNum <= 0) {
        toast({
          title: "Servings must be a positive number.",
          variant: "destructive",
          duration: 4000
        });
        return;
      }
    } else {
      // For existing recipes, require selected recipe
      if (!selectedRecipeId) {
        toast({
          title: "Please select a recipe.",
          variant: "destructive",
          duration: 4000
        });
        return;
      }
    }

    if (!user?.id) {
      toast({
        title: "You must be logged in to share a post",
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    let recipeId = selectedRecipeId;

    // If creating new recipe, submit it first
    if (activeTab === "new") {
      const newRecipeId = await submitNewRecipe();
      if (!newRecipeId) {
        // Recipe creation failed, don't proceed with post creation
        return;
      }
      recipeId = newRecipeId;
    }

    // Create post FormData
    const postForm = new FormData();
    postForm.append("content", postText.trim());
    
    if (imageFile) {
      postForm.append("image", imageFile);
    }
    
    if (recipeId) {
      postForm.append("recipe", recipeId);
    }

    try {
      console.log("Creating post with recipe ID:", recipeId);
      await api.post("/api/posts", postForm);
      toast({
        title: "Post shared successfully!",
        description: recipeId ? "Recipe added to browse collection" : undefined,
        variant: "default",
        duration: 4000
      });
      
      onPostCreated();
      handleClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("sharePost error:", error.response?.data || error.message);
      toast({
        title: "Failed to share post",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
        duration: 4000
      });
    }
  };

  const handleClose = () => {
    // Reset all form data
    setPostText("");
    setImageFile(null);
    setSelectedRecipeId(null);
    setRecipeSearchQuery("");
    setRecipeData({
      name: "", description: "", prepTimeMin: "", cookTimeMin: "",
      servings: "", difficulty: "", cuisine: ""
    });
    setIngredients([{ ingredientName: "", amount: "", unit: "" }]);
    setInstructions([""]);
    setTags([]);
    setActiveTab("new");
    onClose();
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-6 space-y-6">
          {/* Post Text */}
          <Textarea
            placeholder="Share your culinary creation..."
            value={postText}
            onChange={e => setPostText(e.target.value)}
            className="w-full"
          />

          {/* Image Upload */}
          <div
            className="border-2 border-dashed p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mx-auto mb-2 w-8 h-8 text-emerald-400" />
            <p className="text-gray-600 mb-1">
              {imageFile ? `Selected: ${imageFile.name}` : "Click to upload a photo of your dish"}
            </p>
            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Recipe Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "new" | "existing")}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="new">Create New Recipe</TabsTrigger>
              <TabsTrigger value="existing">Use Existing Recipe</TabsTrigger>
            </TabsList>

            {/* New Recipe Form */}
            <TabsContent value="new" className="space-y-6">
              {/* Basic Info */}
              <Card className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-emerald-700">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Recipe Title *</Label>
                      <Input
                        id="name"
                        value={recipeData.name}
                        onChange={e => handleRecipeField("name", e.target.value)}
                        placeholder="Enter recipe title"
                        className="border-emerald-200 focus:border-emerald-500"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="servings">Servings *</Label>
                      <Input
                        id="servings"
                        type="number"
                        min="1"
                        max="20"
                        value={recipeData.servings}
                        onChange={e => handleRecipeField("servings", e.target.value)}
                        placeholder="e.g., 4"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={recipeData.description}
                      onChange={e => handleRecipeField("description", e.target.value)}
                      placeholder="Describe your recipe..."
                      className="border-emerald-200 focus:border-emerald-500"
                      maxLength={500}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="prepTimeMin">Prep Time (min) *</Label>
                      <Input
                        id="prepTimeMin"
                        type="number"
                        min="0"
                        max="480"
                        value={recipeData.prepTimeMin}
                        onChange={e => handleRecipeField("prepTimeMin", e.target.value)}
                        placeholder="e.g., 15"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cookTimeMin">Cook Time (min) *</Label>
                      <Input
                        id="cookTimeMin"
                        type="number"
                        min="0"
                        max="480"
                        value={recipeData.cookTimeMin}
                        onChange={e => handleRecipeField("cookTimeMin", e.target.value)}
                        placeholder="e.g., 30"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select value={recipeData.difficulty} onValueChange={v => handleRecipeField("difficulty", v)}>
                        <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cuisine">Cuisine</Label>
                      <Select value={recipeData.cuisine} onValueChange={v => handleRecipeField("cuisine", v)}>
                        <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                        <SelectContent>
                          {cuisineOptions.map(cuisine => (
                            <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-emerald-700">Ingredients *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ingredients.map((ingredient, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Ingredient name"
                          value={ingredient.ingredientName}
                          onChange={e => updateIngredient(i, "ingredientName", e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          placeholder="Amount"
                          value={ingredient.amount}
                          onChange={e => updateIngredient(i, "amount", e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                        />
                      </div>
                      <div className="w-32">
                        <Select
                          value={ingredient.unit}
                          onValueChange={v => updateIngredient(i, "unit", v)}
                        >
                          <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeIngredient(i)}
                        disabled={ingredients.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addIngredient}
                    disabled={ingredients.length >= 15}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-emerald-700">Instructions *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {instructions.map((instruction, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-emerald-600 mt-1">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder={`Step ${i + 1} instructions...`}
                          value={instruction}
                          onChange={e => updateInstruction(i, e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeInstruction(i)}
                        disabled={instructions.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInstruction}
                    disabled={instructions.length >= 15}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-emerald-700">Dietary Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map(tag => (
                      <Badge
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`cursor-pointer transition-colors duration-200 ${
                          tags.includes(tag)
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Existing Recipe Selection */}
            <TabsContent value="existing" className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search recipes by name, description, or tags..."
                  value={recipeSearchQuery}
                  onChange={(e) => setRecipeSearchQuery(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500"
                />
              </div>

              {/* Recipe List */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {recipes.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No recipes available. Create one first!
                  </p>
                ) : filteredRecipes.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No recipes found matching "{recipeSearchQuery}"
                  </p>
                ) : (
                  filteredRecipes.map(recipe => (
                    <Card
                      key={recipe._id}
                      className={`cursor-pointer transition-colors ${
                        selectedRecipeId === recipe._id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                      onClick={() => setSelectedRecipeId(recipe._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          {/* Recipe Image */}
                          <div className="flex-shrink-0 w-16 h-16 bg-emerald-100 rounded-lg overflow-hidden">
                            {recipe.image ? (
                              <img
                                src={`http://localhost:8080/${recipe.image}`}
                                alt={recipe.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera className="h-6 w-6 text-emerald-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Recipe Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{recipe.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {recipe.description}
                            </p>
                            
                            {/* Recipe Meta */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              {recipe.prepTimeMin && (
                                <span>Prep: {recipe.prepTimeMin}m</span>
                              )}
                              {recipe.cookTimeMin && (
                                <span>Cook: {recipe.cookTimeMin}m</span>
                              )}
                              {recipe.servings && (
                                <span>Serves: {recipe.servings}</span>
                              )}
                            </div>

                            {/* Tags */}
                            {recipe.tags && recipe.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {recipe.tags.slice(0, 3).map((tag, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs bg-emerald-100 text-emerald-700"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {recipe.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    +{recipe.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={sharePost}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Share Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Unmatched Ingredients Modal */}
    <Dialog open={showUnmatchedModal} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Some ingredients could not be identified
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-gray-700">
          The following ingredients could not be identified. Check for typos or try a different name:
          <ul className="list-disc list-inside mt-2">
            {unmatchedIngredients.map((ing, idx) => (
              <li key={idx}>{ing}</li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="w-1/2" 
            onClick={() => {
              setShowUnmatchedModal(false);
              // Continue with post creation anyway
              if (createdRecipeId) {
                // Add the recipe to the list and proceed
                setSelectedRecipeId(createdRecipeId);
                setActiveTab("existing");
                toast({
                  title: "Recipe created successfully!",
                  description: "Continuing with unmatched ingredients.",
                  variant: "default",
                  duration: 4000
                });
              }
            }}
          >
            Continue Anyway
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-1/2" 
            onClick={() => {
              setShowUnmatchedModal(false);
              // Stay in the form to allow editing
              toast({
                title: "Please check your ingredients",
                description: "Review and fix any typos in your ingredient names.",
                variant: "default",
                duration: 4000
              });
            }}
          >
            Edit Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CreatePostDialog; 