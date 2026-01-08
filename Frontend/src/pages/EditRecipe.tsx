import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ChefHat,
  Plus,
  Minus,
  Save,
  X,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { useNavigate, useParams } from "react-router-dom";
import { IRecipe } from "@/types/recipe";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RecipeIngredientForm {
  ingredientName: string;
  amount: string;
  unit: string;
}

const EditRecipe = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prepTimeMin: "",
    cookTimeMin: "",
    servings: "",
    difficulty: "",
    cuisine: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [ingredients, setIngredients] = useState<RecipeIngredientForm[]>([
    { ingredientName: "", amount: "", unit: "" }
  ]);
  const [instructions, setInstructions] = useState([""]);
  const [tags, setTags] = useState<string[]>([]);
  const allowedUnits = [
    "gram","kilogram","milliliter","liter","teaspoon(s)","tablespoon(s)","piece(s)","slice(s)"
  ];
  const cuisineOptions = [
    "Mediterranean", "Middle Eastern", "Latin American", "Asian", "African",
    "European", "North American", "Fusion", "Other"
  ];
  const predefinedTags = [
    "Vegan", "Vegetarian", "Gluten-Free", "Low-Carb",
    "High-Protein", "Keto", "Paleo", "Dairy-Free"
  ];
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [unmatchedIngredients, setUnmatchedIngredients] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      try {
        const res = await axios.get<IRecipe>(`http://localhost:8080/recipes/${id}`);
        const recipe = res.data;
        setFormData({
          name: recipe.name || "",
          description: recipe.description || "",
          prepTimeMin: recipe.prepTimeMin ? String(recipe.prepTimeMin) : "",
          cookTimeMin: recipe.cookTimeMin ? String(recipe.cookTimeMin) : "",
          servings: recipe.servings ? String(recipe.servings) : "",
          difficulty: recipe.difficulty || "",
          cuisine: recipe.cuisine || "",
        });
        setIngredients(
          recipe.ingredients && recipe.ingredients.length > 0
            ? recipe.ingredients.map(ing => ({
                ingredientName: ing.ingredient.name,
                amount: ing.amount ? String(ing.amount) : "",
                unit: ing.unit || ""
              }))
            : [{ ingredientName: "", amount: "", unit: "" }]
        );
        setInstructions(recipe.instructions && recipe.instructions.length > 0 ? recipe.instructions : [""]);
        setTags(recipe.tags || []);
        setExistingImage(recipe.image ? `http://localhost:8080/${recipe.image}` : null);
      } catch (err) {
        toast({
          title: "Failed to load recipe",
          description: "Could not fetch recipe data for editing.",
          variant: "destructive",
          duration: 4000
        });
        navigate("/recipes");
      }
    };
    fetchRecipe();
    // eslint-disable-next-line
  }, [id]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value === "" ? "" : value });
  };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setRemoveImage(false);
    } else {
      setSelectedImage(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
    }
  };
  const addIngredient = () => {
    if (ingredients.length < 15) {
      setIngredients([...ingredients, { ingredientName: "", amount: "", unit: "" }]);
    }
  };
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  const updateIngredientField = (index: number, field: keyof RecipeIngredientForm, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };
  const addInstruction = () => {
    if (instructions.length < 15) {
      setInstructions([...instructions, ""]);
    }
  };
  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };
  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };
  const toggleTag = (tagToToggle: string) => {
    if (tags.includes(tagToToggle)) {
      setTags(tags.filter(tag => tag !== tagToToggle));
    } else {
      setTags([...tags, tagToToggle]);
    }
  };
  const handleRemoveImage = () => {
    setRemoveImage(true);
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setExistingImage(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const requiredFields = [
      formData.name,
      formData.description,
      formData.prepTimeMin, // now required
      formData.cookTimeMin, // now required
      formData.servings,
    ];
    if (
      requiredFields.some(field => !field || (typeof field === 'string' && field.trim() === '')) ||
      ingredients.filter(i => i.ingredientName.trim()).length === 0 ||
      instructions.filter(i => i.trim()).length === 0
    ) {
      toast({
        title: "All required fields has to be filled out",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    if (formData.name.length > 100) {
      toast({
        title: "Title is too long (max 100 characters).",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    if (formData.description.length > 1000) {
      toast({
        title: "Description is too long (max 1000 characters).",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    if (ingredients.some(i => i.ingredientName.length > 100)) {
      toast({
        title: "Ingredient name is too long (max 100 characters).",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    if (instructions.some(i => i.length > 1000)) {
      toast({
        title: "Instruction step is too long (max 1000 characters).",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    const servingsNum = parseInt(formData.servings);
    const prepTimeNum = parseInt(formData.prepTimeMin);
    const cookTimeNum = parseInt(formData.cookTimeMin);
    if (
      isNaN(prepTimeNum) || prepTimeNum < 0 ||
      isNaN(cookTimeNum) || cookTimeNum < 0
    ) {
      toast({
        title: "Prep time and cook time must be 0 or greater.",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(servingsNum) || servingsNum <= 0) {
      toast({
        title: "Servings must be a positive number.",
        variant: "destructive",
        duration: 4000
      });
      setIsSubmitting(false);
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    if (formData.prepTimeMin) formDataToSend.append('prepTimeMin', formData.prepTimeMin);
    if (formData.cookTimeMin) formDataToSend.append('cookTimeMin', formData.cookTimeMin);
    formDataToSend.append('servings', String(servingsNum));
    if (formData.difficulty) formDataToSend.append('difficulty', formData.difficulty);
    if (formData.cuisine) formDataToSend.append('cuisine', formData.cuisine);
    formDataToSend.append('instructions', JSON.stringify(instructions.filter(i => i.trim())));
    formDataToSend.append('tags', JSON.stringify(tags));
    const transformedIngredients = ingredients.filter(i => i.ingredientName.trim()).map(ing => ({
        ingredient: ing.ingredientName.trim(),
        amount: ing.amount ? parseFloat(ing.amount) : undefined,
        unit: ing.unit || undefined,
    }));
    formDataToSend.append('ingredients', JSON.stringify(transformedIngredients));
    if (selectedImage) {
        formDataToSend.append('image', selectedImage);
    }
    if (removeImage) {
        formDataToSend.append('removeImage', 'true');
    }
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.put<IRecipe>(`http://localhost:8080/recipes/${id}`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      // Check for missing nutrition data
      const hasAdequateNutritionData = (recipe: any) => {
        // Check if the recipe has meaningful nutrition data
        const nutritionFields = ['calories', 'protein_g', 'carbohydrates_g', 'totalFat_g'];
        return nutritionFields.some(field => 
          typeof recipe[field] === 'number' && recipe[field] > 0
        );
      };

      // Show unmatched ingredients modal if needed
      if (response.data.unmatchedIngredients && Array.isArray(response.data.unmatchedIngredients) && response.data.unmatchedIngredients.length > 0) {
        setUnmatchedIngredients(response.data.unmatchedIngredients);
        setShowUnmatchedModal(true);
      } else if (!hasAdequateNutritionData(response.data)) {
        // Check if nutrition data is missing
        toast({
          title: "Nutrition Data Missing",
          description: "One or more ingredients don't have nutrition data available. Please use different ingredient names or check for typos.",
          variant: "destructive",
          duration: 6000
        });
        setIsSubmitting(false);
        return;
      } else {
        toast({
          title: "Recipe Updated!",
          description: "Your recipe has been successfully updated.",
          variant: "default",
          duration: 4000
        });
        if (response.data && response.data._id) {
          navigate(`/recipes/${response.data._id}`);
        } else {
          navigate("/recipes");
        }
      }
    } catch (error: any) {
      console.error("Error updating recipe:", error.response?.data || error.message);
      toast({
        title: "Failed to Update Recipe",
        description: error.response?.data?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
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
                navigate(`/recipes/`);
              }}
            >
              Continue Anyway
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-1/2" 
              onClick={() => {
                setShowUnmatchedModal(false);
                // Stay on the edit page
              }}
            >
              Keep Editing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <ChefHat className="h-8 w-8 text-emerald-600 mr-3" />
            Edit Recipe
          </h1>
          <p className="text-gray-600">Update your recipe details below</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
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
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter recipe title"
                    className="border-emerald-200 focus:border-emerald-500"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="cuisine">Cuisine Type</Label>
                  <Select value={formData.cuisine} onValueChange={(value) => handleSelectChange("cuisine", value)}>
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
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe your recipe..."
                  className="border-emerald-200 focus:border-emerald-500"
                  maxLength={1000}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="prepTimeMin">Prep Time (min) *</Label>
                  <Input
                    id="prepTimeMin"
                    type="number"
                    value={formData.prepTimeMin}
                    onChange={handleFormChange}
                    placeholder="20"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTimeMin">Cook Time (min) *</Label>
                  <Input
                    id="cookTimeMin"
                    type="number"
                    value={formData.cookTimeMin}
                    onChange={handleFormChange}
                    placeholder="30"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="servings">Servings *</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={handleFormChange}
                    placeholder="4"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => handleSelectChange("difficulty", value)}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Image Upload Section */}
              <div className="mb-4">
                  <Label htmlFor="image-upload" className="block text-gray-700 text-sm font-bold mb-2">
                      Recipe Image
                  </Label>
                  <Input
                      type="file"
                      id="image-upload"
                      name="image"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline border-emerald-200 focus:border-emerald-500"
                  />
                  {/* Show existing image if present and not removed */}
                  {existingImage && !removeImage && !imagePreviewUrl && (
                      <div className="mt-4 flex items-center space-x-2">
                          <img src={existingImage} alt="Current Recipe" className="max-w-[150px] h-auto rounded shadow-md" />
                          <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleRemoveImage}
                              className="text-red-500 hover:text-red-700"
                          >
                              <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                      </div>
                  )}
                  {/* Show preview if new image is selected */}
                  {imagePreviewUrl && (
                      <div className="mt-4 flex items-center space-x-2">
                          <img src={imagePreviewUrl} alt="Image Preview" className="max-w-[150px] h-auto rounded shadow-md" />
                          <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                  setSelectedImage(null);
                                  URL.revokeObjectURL(imagePreviewUrl);
                                  setImagePreviewUrl(null);
                              }}
                              className="text-red-500 hover:text-red-700"
                          >
                              <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                      </div>
                  )}
              </div>
            </CardContent>
          </Card>
          {/* Ingredients */}
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle className="text-emerald-700">Ingredients *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`ingredient-name-${index}`} className="sr-only">Ingredient Name</Label>
                      <Input
                        id={`ingredient-name-${index}`}
                        value={ing.ingredientName}
                        onChange={(e) => updateIngredientField(index, "ingredientName", e.target.value)}
                        placeholder="e.g., Chicken Breast"
                        className="border-emerald-200 focus:border-emerald-500"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`ingredient-amount-${index}`} className="sr-only">Amount</Label>
                      <Input
                        id={`ingredient-amount-${index}`}
                        type="number"
                        value={ing.amount}
                        onChange={(e) => updateIngredientField(index, "amount", e.target.value)}
                        placeholder="e.g., 200"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`ingredient-unit-${index}`} className="sr-only">Unit</Label>
                      <Select
                        value={ing.unit}
                        onValueChange={(value) => updateIngredientField(index, "unit", value)}
                      >
                        <SelectTrigger id={`ingredient-unit-${index}`} className="border-emerald-200 focus:border-emerald-500 min-w-[120px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedUnits.map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="border-red-200 text-red-600 hover:bg-red-50 mb-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addIngredient}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                disabled={ingredients.length >= 15}
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
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-emerald-700 mt-1">
                    {index + 1}
                  </div>
                  <Textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder="Describe this step in detail..."
                    className="flex-1 border-emerald-200 focus:border-emerald-500"
                    rows={2}
                    maxLength={1000}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeInstruction(index)}
                    disabled={instructions.length === 1}
                    className="border-red-200 text-red-600 hover:bg-red-50 mt-1"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addInstruction}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                disabled={instructions.length >= 15}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </CardContent>
          </Card>
          {/* Tags (Predefined Selection) */}
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle className="text-emerald-700">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {predefinedTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant={tags.includes(tag) ? "default" : "secondary"}
                    className={`cursor-pointer ${
                      tags.includes(tag)
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    } transition-colors duration-200`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Recipe'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditRecipe; 