import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, ChefHat, Lock, Target, Trash, Upload, X, Search, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import RecipeSelector from "@/components/RecipeSelector";
import MealplanSelector from "@/components/MealplanSelector";
import { Link, useNavigate } from "react-router-dom";
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { mealplanAPI, templateAPI } from '@/lib/api';
import { useAuth } from "@/hooks/use-auth";
import { getDatesForISOWeek, getCurrentWeek } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];

// --- Week navigation helpers (from MyWeek) ---
const getISOWeek = (date: Date) => {
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
  const yearStart = new Date(temp.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${temp.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};
const getWeekOffset = (base: string, offset: number) => {
  const [year, week] = base.split('-W').map(Number);
  const d = new Date(year, 0, 1 + (week - 1) * 7);
  d.setDate(d.getDate() + offset * 7);
  return getISOWeek(d);
};

const getWeekDiff = (weekA: string, weekB: string) => {
  // Returns the number of weeks between weekA and weekB (weekA - weekB)
  const [yearA, weekNumA] = weekA.split('-W').map(Number);
  const [yearB, weekNumB] = weekB.split('-W').map(Number);
  return (yearA - yearB) * 52 + (weekNumA - weekNumB);
};

const MyWeek = () => {
  // --- Week navigation state ---
  const navigate = useNavigate();
  const todayISOWeek = getCurrentWeek();
  // Print today's date and day of week in CET
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const todayDate = berlinTime.toISOString().slice(0, 10);
  const todayDay = berlinTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Berlin' });
  console.log('[MyWeek] todayISOWeek:', todayISOWeek, '| todayDate:', todayDate, '| todayDay:', todayDay);
  const [currentWeek, setCurrentWeek] = useState(todayISOWeek);
  console.log('[MyWeek] currentWeek state:', currentWeek);
  const minWeek = getWeekOffset(todayISOWeek, -2); // Only 2 weeks back now
  const maxWeek = getWeekOffset(todayISOWeek, 2);
  const isPrevDisabled = getWeekDiff(currentWeek, minWeek) <= 0;
  const isNextDisabled = getWeekDiff(maxWeek, currentWeek) <= 0;
  const isCurrentWeek = currentWeek === todayISOWeek;
  const handlePrevWeek = () => setCurrentWeek(getWeekOffset(currentWeek, -1));
  const handleNextWeek = () => setCurrentWeek(getWeekOffset(currentWeek, 1));

  // --- Mealplan state and logic (from MealPlanning) ---
  const [mealplan, setMealplan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [recipeMap, setRecipeMap] = useState({});
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishTags, setPublishTags] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [userPlannedRecipes, setUserPlannedRecipes] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{day: string, date: string, mealType: string} | null>(null);
  const [publishDifficulty, setPublishDifficulty] = useState('');
  const [publishImage, setPublishImage] = useState<File | null>(null);
  const [publishImagePreview, setPublishImagePreview] = useState<string | null>(null);

  // Deleted template detection
  const [showDeletedTemplateModal, setShowDeletedTemplateModal] = useState(false);
  const [deletedTemplateName, setDeletedTemplateName] = useState("");

  const { getAccessToken, user } = useAuth();
  const { toast } = useToast();

  // Check if user is premium
  const isPremium = user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active';

  // Calculate weekly nutrition from mealplan slots
  const calculateWeeklyNutrition = () => {
    if (!mealplan || !mealplan.slots) {
      return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let mealCount = 0;

    mealplan.slots.forEach((slot: any) => {
      if (slot.recipe) {
        const recipe = typeof slot.recipe === 'object' ? slot.recipe : recipeMap[slot.recipe];
        if (recipe) {
          const servings = slot.servings || 1;
          const recipeServings = recipe.servings || 1;
          const multiplier = servings / recipeServings;
          totalCalories += (recipe.calories || 0) * multiplier;
          totalProtein += (recipe.protein_g || 0) * multiplier;
          totalCarbs += (recipe.carbohydrates_g || 0) * multiplier;
          totalFat += (recipe.totalFat_g || 0) * multiplier;
          mealCount++;
        }
      }
    });

    return {
      avgCalories: mealCount > 0 ? Math.round(totalCalories / 7) : 0,
      avgProtein: mealCount > 0 ? Math.round(totalProtein / 7) : 0,
      avgCarbs: mealCount > 0 ? Math.round(totalCarbs / 7) : 0,
      avgFat: mealCount > 0 ? Math.round(totalFat / 7) : 0,
    };
  };

  // Calculate daily nutrition for a specific date
  const calculateDailyNutrition = (date: string) => {
    if (!mealplan || !mealplan.slots) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    mealplan.slots.forEach((slot: any) => {
      if (slot.date === date && slot.recipe) {
        const recipe = typeof slot.recipe === 'object' ? slot.recipe : recipeMap[slot.recipe];
        if (recipe) {
          const servings = slot.servings || 1;
          const recipeServings = recipe.servings || 1;
          const multiplier = servings / recipeServings;
          totalCalories += (recipe.calories || 0) * multiplier;
          totalProtein += (recipe.protein_g || 0) * multiplier;
          totalCarbs += (recipe.carbohydrates_g || 0) * multiplier;
          totalFat += (recipe.totalFat_g || 0) * multiplier;
        }
      }
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  };

  const weeklyNutrition = calculateWeeklyNutrition();

  // Predefined tags (same as CreateRecipe)
  const predefinedTags = [
    "Vegan", "Vegetarian", "Gluten-Free", "Low-Carb",
    "High-Protein", "Keto", "Paleo", "Dairy-Free"
  ];

  // Fetch user's planned recipes on mount and when changed
  const fetchUserPlannedRecipes = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8080/user/planned-recipes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch planned recipes');
      const data = await res.json();
      setUserPlannedRecipes(data.plannedRecipes || []);
    } catch (err) {
      setUserPlannedRecipes([]);
    }
  };

  useEffect(() => {
    fetchUserPlannedRecipes();
  }, []);

  // Fetch mealplan for the current week
  useEffect(() => {
    const fetchMealplan = async () => {
    setLoading(true);
    setError(null);
    try {
      const mealplanData = await mealplanAPI.getMyWeekMealplan(currentWeek);
      setMealplan(mealplanData);
      
      // Check if this meal plan was created from a template that no longer exists
      if (mealplanData && mealplanData.template) {
        try {
          const response = await fetch(`http://localhost:8080/mealplan/template/${mealplanData.template}`);
          if (!response.ok) {
            // Template was deleted
            if (currentWeek === todayISOWeek) {
              // Current week - show alert
              setDeletedTemplateName("Unknown Meal Plan");
              setShowDeletedTemplateModal(true);
            } else {
              // Previous week - silently delete without alert
              console.log(`[MyWeek] Silently deleting meal plan for previous week ${currentWeek} due to deleted template`);
              await mealplanAPI.deleteMyWeekMealplan(mealplanData._id);
              setMealplan(null);
            }
          }
        } catch (templateErr) {
          // Template was deleted or API error
          if (currentWeek === todayISOWeek) {
            // Current week - show alert
            setDeletedTemplateName("Unknown Meal Plan");
            setShowDeletedTemplateModal(true);
          } else {
            // Previous week - silently delete without alert
            console.log(`[MyWeek] Silently deleting meal plan for previous week ${currentWeek} due to deleted template`);
            try {
              await mealplanAPI.deleteMyWeekMealplan(mealplanData._id);
              setMealplan(null);
            } catch (deleteErr) {
              console.error(`[MyWeek] Failed to delete meal plan for week ${currentWeek}:`, deleteErr);
            }
          }
        }
      }
      } catch (err: any) {
        setError(err.message || 'Failed to load mealplan.');
      setMealplan(null);
    } finally {
      setLoading(false);
    }
  };
    fetchMealplan();
  }, [currentWeek]);



  // Helper to fetch mealplan for the current week
  const fetchMealplanForCurrentWeek = async () => {
    setLoading(true);
    setError(null);
    try {
      const mealplanData = await mealplanAPI.getMyWeekMealplan(currentWeek);
      setMealplan(mealplanData);
    } catch (err: any) {
      setError(err.message || 'Failed to load mealplan.');
      setMealplan(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new mealplan for week
  const handleCreateMealplan = async () => {
    try {
      await mealplanAPI.createMyWeekMealplan({ week: currentWeek, slots: [] });
      setShowAddModal(false);
      await fetchMealplanForCurrentWeek();
    } catch (err: any) {
      alert(err.message || 'Failed to create mealplan.');
    }
  };

  // Copy published mealplan (import template)
  const handleCopyMealplan = async (templateId: string) => {
    try {
      await mealplanAPI.copyMealplanToMyWeek(templateId, currentWeek);
      setShowAddModal(false);
      await fetchMealplanForCurrentWeek();
    } catch (err: any) {
      alert(err.message || 'Failed to import mealplan template.');
    }
  };

  // Delete mealplan for current week
  const handleDelete = async () => {
    if (!mealplan) return;
    setDeleting(true);
    try {
      await mealplanAPI.deleteMyWeekMealplan(mealplan._id);
      setMealplan(null);
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete mealplan.');
    } finally {
      setDeleting(false);
    }
  };

  // Handle deleted template - clear current week and redirect to browse
  const handleChooseNewPlan = async () => {
    try {
      // Clear the current week since the template was deleted
      if (mealplan) {
        await mealplanAPI.deleteMyWeekMealplan(mealplan._id);
        setMealplan(null);
      }
      setShowDeletedTemplateModal(false);
      // Navigate to Browse page to select a new meal plan
      navigate('/browse');
    } catch (err: any) {
      alert(err.message || 'Failed to clear current meal plan.');
    }
  };

  // Publish mealplan as template
  const handlePublish = async () => {
    if (!mealplan) return;
    if (!publishTitle || !publishDescription) {
      toast({
        title: "All required fields must be filled out",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('week', currentWeek);
      formData.append('title', publishTitle);
      formData.append('description', publishDescription);
      formData.append('tags', JSON.stringify(publishTags));
      if (publishDifficulty) formData.append('difficulty', publishDifficulty);
      if (publishImage) formData.append('image', publishImage);
      await templateAPI.createTemplate(formData);
      setShowPublishModal(false);
      await fetchMealplanForCurrentWeek();
    } catch (err: any) {
      toast({
        title: "Failed to publish mealplan.",
        description: err.message || undefined,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setPublishing(false);
    }
  };

  // Helper: Get slot for a given day and mealType
  const getSlot = (date: string, mealType: string) => {
    if (!mealplan) return null;
    return mealplan.slots.find((slot: any) => slot.date === date && slot.mealType === mealType);
  };

  // Simplify getRecipeName:
  const getRecipeName = (slot: any) => {
    if (!slot) return "";
    if (typeof slot.recipe === 'object' && slot.recipe?.name) return slot.recipe.name;
    if (typeof slot.recipe === 'string' && recipeMap[slot.recipe]?.name) return recipeMap[slot.recipe].name;
    return "";
  };

  // Remove recipe from plannedRecipes (user-global)
  const handleRemovePlannedRecipe = async (recipeId: string) => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8080/user/planned-recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove from planned recipes');
      await fetchUserPlannedRecipes();
    } catch (err) {
      alert('Failed to remove recipe from planned recipes.');
    }
  };

  // Modal open/close handlers
  const openRecipeModal = async (recipe: any) => {
    // Always resolve the recipe ID
    const recipeId = typeof recipe === 'string' ? recipe : recipe._id || recipe.id;
      try {
      const res = await fetch(`http://localhost:8080/recipes/${recipeId}`);
        if (!res.ok) throw new Error('Failed to fetch recipe details');
        const data = await res.json();
        setSelectedRecipe(data);
      } catch (err) {
        setSelectedRecipe({ name: 'Error loading recipe', description: '', ingredients: [], instructions: [] });
    }
    setShowModal(true);
  };
  const closeRecipeModal = () => {
    setShowModal(false);
    setSelectedRecipe(null);
  };

  // Recipe selector handlers
  const handleSelectMealSlot = (day: string, date: string, mealType: string) => {
    setSelectedSlot({ day, date, mealType });
    setShowRecipeSelector(true);
  };

  const handleRecipeSelect = async (recipe: any) => {
    if (selectedSlot) {
      console.log('[MyWeek] handleRecipeSelect slot assignment:', { date: selectedSlot.date, mealType: selectedSlot.mealType, recipeId: recipe._id });
      try {
        // Update the slot in the mealplan
        const updatedSlots = [
          // Remove any existing slot for this date/mealType
          ...(mealplan.slots.filter((slot: any) => !(slot.date === selectedSlot.date && slot.mealType === selectedSlot.mealType))),
          // Add the new slot
          { date: selectedSlot.date, mealType: selectedSlot.mealType, recipe: recipe._id, servings: 1 },
        ];
        
        await mealplanAPI.updateMyWeekMealplan(mealplan._id, {
          slots: updatedSlots,
          shoppingListState: mealplan.shoppingListState,
        });
        // Update local state instead of refetching to preserve scroll position
        setMealplan(prev => ({
          ...prev,
          slots: updatedSlots
        }));
      } catch (err: any) {
        alert(err.message || 'Failed to assign recipe to slot.');
      }
    }
    setShowRecipeSelector(false);
    setSelectedSlot(null);
  };

  const handleCancelRecipeSelection = () => {
    setShowRecipeSelector(false);
    setSelectedSlot(null);
  };

  // Handle drag end for DnD
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { droppableId } = result.destination;
    const { draggableId } = result;
    // droppableId format: slot-<YYYY>-<MM>-<DD>-<mealType>
    if (droppableId.startsWith('slot-')) {
      const parts = droppableId.split('-');
      const date = parts.slice(1, 4).join('-'); // YYYY-MM-DD
      const mealType = parts.slice(4).join('-'); // mealType (handles dashes in mealType)
      const recipeId = draggableId; // This is always a string
      console.log('[MyWeek] handleDragEnd slot assignment:', { date, mealType, recipeId });
      if (!recipeId || typeof recipeId !== 'string') {
        alert('Invalid recipe ID for drag-and-drop!');
        return;
      }
      // Update the slot in the mealplan in state
      const updatedSlots = [
        // Remove any existing slot for this date/mealType
        ...(mealplan.slots.filter((slot: any) => !(slot.date === date && slot.mealType === mealType))),
        // Add the new slot
        { date, mealType, recipe: recipeId, servings: 1 },
      ];
      try {
        await mealplanAPI.updateMyWeekMealplan(mealplan._id, {
          slots: updatedSlots,
          shoppingListState: mealplan.shoppingListState,
        });
        // Update local state instead of refetching to preserve scroll position
        setMealplan(prev => ({
          ...prev,
          slots: updatedSlots
        }));
      } catch (err: any) {
        alert(err.message || 'Failed to assign recipe to slot.');
      }
    }
  };

  // Remove recipe from a slot
  const handleRemoveSlot = async (date: string, mealType: string) => {
    // Remove the slot from the mealplan in state
    const updatedSlots = mealplan.slots.filter((slot: any) => !(slot.date === date && slot.mealType === mealType));
    try {
      await mealplanAPI.updateMyWeekMealplan(mealplan._id, {
        slots: updatedSlots,
        shoppingListState: mealplan.shoppingListState,
      });
      // Update local state instead of refetching to preserve scroll position
      setMealplan(prev => ({
        ...prev,
        slots: updatedSlots
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to remove recipe from slot.');
    }
  };

  // Update servings for a slot
  const handleUpdateServings = async (date: string, mealType: string, newServings: number) => {
    if (newServings < 1) return;
    if (!mealplan) return;
    // Find the slot and update servings
    const updatedSlots = mealplan.slots.map((slot: any) => {
      if (slot.date === date && slot.mealType === mealType) {
        return { ...slot, servings: newServings };
      }
      return slot;
    });
    try {
      await mealplanAPI.updateMyWeekMealplan(mealplan._id, {
        slots: updatedSlots,
        shoppingListState: mealplan.shoppingListState,
      });
      // Update local state instead of refetching to preserve scroll position
      setMealplan(prev => ({
        ...prev,
        slots: updatedSlots
      }));
    } catch (err) {
      alert('Failed to update servings.');
    }
  };

  const weekDates = getDatesForISOWeek(currentWeek);
  console.log('[MyWeek] weekDates:', weekDates);

  useEffect(() => {
    const fetchAllRecipes = async () => {
      // Collect all unique recipe IDs from userPlannedRecipes and mealplan.slots
      const ids = new Set<string>();
      if (userPlannedRecipes) {
        userPlannedRecipes.forEach((r) => {
          if (typeof r === 'string') ids.add(r);
          else if (r?._id) ids.add(r._id);
        });
      }
      if (mealplan && mealplan.slots) {
        mealplan.slots.forEach((slot) => {
          if (typeof slot.recipe === 'string') ids.add(slot.recipe);
          else if (slot.recipe?._id) ids.add(slot.recipe._id);
        });
      }
      // Only fetch recipes not already in recipeMap
      const missingIds = Array.from(ids).filter((id: string) => !(id in recipeMap));
      if (missingIds.length === 0) return;
      const newMap = { ...recipeMap };
      await Promise.all(missingIds.map(async (id: string) => {
        try {
          const res = await fetch(`http://localhost:8080/recipes/${id}`);
          if (res.ok) {
            const data = await res.json();
            newMap[String(id)] = data;
          }
        } catch {}
      }));
      setRecipeMap(newMap);
    };
    fetchAllRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPlannedRecipes, mealplan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading mealplan...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (!mealplan) {
    // Show Add Meal Plan menu
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[70vh] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center w-full max-w-2xl mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">My Week</h1>
            <p className="text-gray-600 mb-6 text-center">Plan your weekly meals and track nutrition goals</p>
            <div className="flex items-center space-x-3 mb-2">
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={handlePrevWeek} disabled={isPrevDisabled}>
                &lt; Prev Week
              </Button>
              <span className="text-lg font-semibold text-gray-700">{currentWeek}</span>
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={handleNextWeek} disabled={isNextDisabled}>
                Next Week &gt;
              </Button>
            </div>
          </div>
          <Button className="bg-emerald-600 text-white px-8 py-3 text-lg rounded" onClick={() => setShowAddModal(true)}>
            Add Meal Plan
          </Button>
          {/* Meal Plan Selector Modal */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <ChefHat className="h-5 w-5 text-emerald-600" />
                  <span>Start a Meal Plan</span>
                </DialogTitle>
              </DialogHeader>
              <MealplanSelector 
                onSelectMealplan={(plan) => handleCopyMealplan(plan._id)}
                onCreateManually={handleCreateMealplan}
                onCancel={() => setShowAddModal(false)}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    );
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
  
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with week navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Week</h1>
              <p className="text-gray-600">Plan your weekly meals and track nutrition goals</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0 items-center">
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={handlePrevWeek} disabled={isPrevDisabled}>
                &lt; Prev Week
              </Button>
              <span className="text-lg font-semibold text-gray-700">{currentWeek}</span>
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={handleNextWeek} disabled={isNextDisabled}>
                Next Week &gt;
              </Button>

              {/* Delete and Publish buttons */}
              {mealplan && (
                <>
                  <Button className="ml-2 bg-emerald-600 text-white flex items-center" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
                    <Trash className="h-4 w-4 mr-1" /> {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button className="ml-2 bg-emerald-600 text-white flex items-center" onClick={() => setShowPublishModal(true)}>
                    <Upload className="h-4 w-4 mr-1" /> Publish
                  </Button>
                </>
              )}
            </div>
          </div>
    
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8"> {/* This div wraps the main plan and the editor panel */}
              {/* Weekly Meal Plan */}
              <div className="lg:col-span-3">
                <Card className="border-emerald-100">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ChefHat className="h-5 w-5 text-emerald-600" />
                      <span>Weekly Meal Plan</span>
                      {isCurrentWeek && (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Current Week</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {daysOfWeek.map((day, i) => (
                        <Card key={day} className="border-emerald-100 bg-emerald-50/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900">{day}</h3>
                              {/* Daily nutrition summary - Premium only */}
                              {isPremium && (() => {
                                const dailyNutrition = calculateDailyNutrition(weekDates[i].date);
                                return (
                                  <div className="text-xs space-y-0.5">
                                    <div className="flex justify-between gap-3">
                                       <span className="text-gray-700">Cal: <span className="font-medium text-emerald-700">{dailyNutrition.calories} kcal</span>/<span className="text-emerald-600">{user?.dailyCalories ? Math.round(user.dailyCalories) : 2000}</span></span>
                                       <span className="text-gray-700">Carbs: <span className="font-medium text-orange-600">{dailyNutrition.carbs}g</span>/<span className="text-orange-500">{user?.dailyCarbs ? Math.round(user.dailyCarbs) : 250}g</span></span>
                                     </div>
                                     <div className="flex justify-between gap-3">
                                       <span className="text-gray-700">Protein: <span className="font-medium text-blue-600">{dailyNutrition.protein}g</span>/<span className="text-blue-500">{user?.dailyProteins ? Math.round(user.dailyProteins) : 150}g</span></span>
                                       <span className="text-gray-700">Fat: <span className="font-medium text-purple-600">{dailyNutrition.fat}g</span>/<span className="text-purple-500">{user?.dailyFats ? Math.round(user.dailyFats) : 65}g</span></span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              {mealTypes.map(mealType => {
                                const date = weekDates[i].date;
                                const slot = getSlot(date, mealType);
                                return (
                                  <Droppable key={mealType} droppableId={`slot-${date}-${mealType}`}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`bg-white p-3 rounded-lg border border-emerald-100 min-h-[100px] flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all transform hover:scale-102 ${snapshot.isDraggingOver ? 'bg-emerald-100' : ''}`}
                                        onClick={() => handleSelectMealSlot(day, date, mealType)}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                                            {mealType}
                                          </span>
                                          <div className="flex items-center space-x-1">
                                            {/* Search icon for all slots */}
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (slot && slot.recipe) {
                                                  openRecipeModal(slot.recipe);
                                                }
                                              }}
                                            >
                                              <Search className="h-3 w-3" />
                                            </Button>
                                            {/* Remove button for filled slot */}
                                            {slot && slot.recipe && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Remove from slot"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveSlot(date, mealType);
                                                }}
                                              >
                                                ×
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                          {getRecipeName(slot) || <span className="text-gray-400">Empty</span>}
                                        </p>
                                        {/* Nutritional information - Premium only */}
                                        {slot && slot.recipe && isPremium && (() => {
                                          const recipe = typeof slot.recipe === 'object' ? slot.recipe : recipeMap[slot.recipe];
                                          const servings = slot.servings || 1;
                                          if (!recipe) return null;
                                          
                                          const recipeServings = recipe.servings || 1;
                                          const multiplier = servings / recipeServings;
                                          
                                          return (
                                            <div className="space-y-1 text-xs text-gray-500 mb-2">
                                              <div className="flex justify-between">
                                                <span>Calories:</span>
                                                <span className="font-medium">{Math.round((recipe.calories || 0) * multiplier)} kcal</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Protein:</span>
                                                <span className="text-blue-600 font-medium">{Math.round((recipe.protein_g || 0) * multiplier)}g</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Carbohydrates:</span>
                                                <span className="text-orange-600 font-medium">{Math.round((recipe.carbohydrates_g || 0) * multiplier)}g</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Fats:</span>
                                                <span className="text-purple-600 font-medium">{Math.round((recipe.totalFat_g || 0) * multiplier)}g</span>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                        {/* Servings controls for filled slot */}
                                        {slot && slot.recipe && (
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-500">Servings:</span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                className="w-6 h-6 p-0 text-emerald-600 border-emerald-200"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateServings(date, mealType, (slot.servings || 1) - 1);
                                                }}
                                                disabled={(slot.servings || 1) <= 1}
                                                title="Decrease servings"
                                              >
                                                -
                                              </Button>
                                              <span className="mx-2 text-sm font-semibold text-gray-800">{slot.servings || 1}</span>
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                className="w-6 h-6 p-0 text-emerald-600 border-emerald-200"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateServings(date, mealType, (slot.servings || 1) + 1);
                                                }}
                                                title="Increase servings"
                                              >
                                                +
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Droppable>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Right sidebar: always present on large screens */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-emerald-100">
                    {/* Planned Recipes Scrollable List */}
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        <span>Meal Plan Recipes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId="plannedRecipes">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="max-h-64 overflow-y-auto space-y-2">
                            {userPlannedRecipes && userPlannedRecipes.length > 0 ? (
                              userPlannedRecipes.map((recipe: any, idx: number) => {
                                let recipeId = typeof recipe === 'string' ? recipe : recipe._id;
                                return (
                                  <Draggable key={String(recipeId)} draggableId={String(recipeId)} index={idx}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`flex items-center bg-emerald-50 rounded p-2 mb-1 hover:bg-emerald-100 transition cursor-pointer group ${snapshot.isDragging ? 'ring-2 ring-emerald-400' : ''}`}
                                      >
                                        <img
                                          src={recipeMap[recipeId]?.image ? `http://localhost:8080/${recipeMap[recipeId].image}` : 'http://localhost:8080/default_images/default-recipe-image.jpg'}
                                          alt={recipeMap[recipeId]?.name || ''}
                                          className="w-10 h-10 object-cover rounded mr-3 border border-emerald-200"
                                          onClick={() => openRecipeModal(recipe)}
                                        />
                                        <span className="flex-1 text-sm text-gray-800 font-medium truncate" onClick={() => openRecipeModal(recipe)}>{recipeMap[recipeId]?.name || ''}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-gray-400 hover:text-red-600 p-1 ml-2"
                                          title="Remove from Mealplan"
                                          onClick={e => { e.stopPropagation(); handleRemovePlannedRecipe(recipeId); }}
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })
                            ) : (
                              <div className="text-gray-400 text-sm">No recipes in mealplan yet.</div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                {/* Nutrition Summary */}
                <Card className="border-emerald-100 relative">
                  {/* Premium overlay for non-premium users */}
                  {!isPremium && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
                      <Lock className="h-8 w-8 text-emerald-600 mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Premium Feature</p>
                      <p className="text-xs text-gray-500 mb-3 text-center px-4">
                        Unlock detailed nutrition tracking with our premium plan
                      </p>
                      <Link to="/premium">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      <span>Weekly Nutrition</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPremium ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Daily Average</span>
                          <span className="font-semibold text-gray-900">{weeklyNutrition.avgCalories} kcal</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Protein</span>
                              <span className="text-sm font-medium text-blue-600">{weeklyNutrition.avgProtein}g</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, user?.dailyProteins ? (weeklyNutrition.avgProtein / user.dailyProteins) * 100 : 85)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Carbs</span>
                              <span className="text-sm font-medium text-orange-600">{weeklyNutrition.avgCarbs}g</span>
                            </div>
                            <div className="w-full bg-orange-100 rounded-full h-2">
                              <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(100, user?.dailyCarbs ? (weeklyNutrition.avgCarbs / user.dailyCarbs) * 100 : 75)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Fats</span>
                              <span className="text-sm font-medium text-purple-600">{weeklyNutrition.avgFat}g</span>
                            </div>
                            <div className="w-full bg-purple-100 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, user?.dailyFats ? (weeklyNutrition.avgFat / user.dailyFats) * 100 : 68)}%` }}></div>
                            </div>
                          </div>
                        </div>
                        {/* Add More Insights Button */}
                        <div className="mt-6 text-center">
                          <Link to="/nutrition-analysis">
                            <Button 
                              variant="outline" 
                              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              More Insights
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Daily Average</span>
                          <span className="font-semibold text-gray-900">{weeklyNutrition.avgCalories} kcal</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Protein</span>
                              <span className="text-sm font-medium text-blue-600">{weeklyNutrition.avgProtein}g</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, user?.dailyProteins ? (weeklyNutrition.avgProtein / user.dailyProteins) * 100 : 85)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Carbs</span>
                              <span className="text-sm font-medium text-orange-600">{weeklyNutrition.avgCarbs}g</span>
                            </div>
                            <div className="w-full bg-orange-100 rounded-full h-2">
                              <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(100, user?.dailyCarbs ? (weeklyNutrition.avgCarbs / user.dailyCarbs) * 100 : 75)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Fats</span>
                              <span className="text-sm font-medium text-purple-600">{weeklyNutrition.avgFat}g</span>
                            </div>
                            <div className="w-full bg-purple-100 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, user?.dailyFats ? (weeklyNutrition.avgFat / user.dailyFats) * 100 : 68)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div> {/* Closes the grid div that holds the meal plan and editor panel */}
          </DragDropContext>
    
          {/* Modal for Recipe Details */}
          {showModal && (
            <HeadlessDialog open={showModal} onClose={closeRecipeModal} className="fixed z-50 inset-0 overflow-y-auto">
              <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" onClick={closeRecipeModal} />
              <div className="flex items-center justify-center min-h-screen px-4">
                <HeadlessDialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto z-50 p-6">
                  {selectedRecipe && (
                    <>
                      <HeadlessDialog.Title className="text-2xl font-bold mb-2">{selectedRecipe?.name || 'No name'}</HeadlessDialog.Title>
                      {selectedRecipe?.image && (
                        <img
                          src={`http://localhost:8080/${selectedRecipe.image}`}
                          alt={selectedRecipe?.name || ''}
                          className="w-full h-48 object-cover rounded mb-4"
                        />
                      )}
                      <div className="mb-2 text-gray-700">{selectedRecipe?.description || 'No description'}</div>
                      <div className="mb-2">
                        <span className="font-semibold">Ingredients:</span>
                        <ul className="list-disc list-inside ml-4">
                          {selectedRecipe?.ingredients?.length
                            ? selectedRecipe.ingredients.map((item: any, idx: number) => (
                                <li key={idx}>
                                  {item.amount} {item.unit} {typeof item.ingredient === 'object' && item.ingredient?.name ? item.ingredient.name : 'Unknown ingredient'}
                                </li>
                              ))
                            : <li>No ingredients</li>
                          }
                        </ul>
                      </div>
                      {selectedRecipe?.instructions?.length ? (
                        <div className="mb-2">
                          <span className="font-semibold">Instructions:</span>
                          <ol className="list-decimal list-inside ml-4">
                            {selectedRecipe.instructions.map((step: string, idx: number) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                      <Button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={closeRecipeModal}>Close</Button>
                    </>
                  )}
                </HeadlessDialog.Panel>
              </div>
            </HeadlessDialog>
          )}
    
          {/* Publish Modal */}
          {showPublishModal && (
            <HeadlessDialog open={showPublishModal} onClose={() => setShowPublishModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
              <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" onClick={() => setShowPublishModal(false)} />
              <div className="flex items-center justify-center min-h-screen">
                <HeadlessDialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-50 p-6">
                  <HeadlessDialog.Title className="text-2xl font-bold mb-4">Publish Mealplan as Template</HeadlessDialog.Title>
                  <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); handlePublish(); }}>
                    <div>
                      <Label htmlFor="publish-title" className="mb-1 block">
                        Title <span className="text-black">*</span>
                      </Label>
                      <Input
                        id="publish-title"
                        type="text"
                        placeholder="Mealplan Title"
                        value={publishTitle}
                        onChange={e => setPublishTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="publish-description" className="mb-1 block">
                        Description <span className="text-black">*</span>
                      </Label>
                      <Textarea
                        id="publish-description"
                        placeholder="Describe your mealplan..."
                        value={publishDescription}
                        onChange={e => setPublishDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="publish-difficulty" className="mb-1 block">Difficulty</Label>
                      <Select value={publishDifficulty} onValueChange={setPublishDifficulty}>
                        <SelectTrigger id="publish-difficulty" className="w-full">
                          <SelectValue placeholder="Select Difficulty (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="publish-image" className="mb-1 block">Image</Label>
                      <Input
                        id="publish-image"
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0] || null;
                          setPublishImage(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => setPublishImagePreview(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          } else {
                            setPublishImagePreview(null);
                          }
                        }}
                      />
                      {publishImagePreview && (
                        <img src={publishImagePreview} alt="Preview" className="w-full h-40 object-cover rounded mt-2" />
                      )}
                    </div>
                    <div>
                      <Label className="mb-1 block">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {predefinedTags.map(tag => (
                          <Badge
                            key={tag}
                            variant={publishTags.includes(tag) ? "default" : "secondary"}
                            className={`cursor-pointer select-none ${publishTags.includes(tag) ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                            onClick={() => setPublishTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center mt-2"
                      disabled={publishing}
                    >
                      <Upload className="h-4 w-4 mr-1" /> {publishing ? 'Publishing...' : 'Publish'}
                    </Button>
                  </form>
                </HeadlessDialog.Panel>
              </div>
            </HeadlessDialog>
          )}
    
          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <HeadlessDialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
              <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" onClick={() => setShowDeleteModal(false)} />
              <div className="flex items-center justify-center min-h-screen px-4">
                <HeadlessDialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-50 p-6">
                  <HeadlessDialog.Title className="text-2xl font-bold mb-4">Delete Mealplan</HeadlessDialog.Title>
                  <div className="mb-4 text-gray-700">Are you sure you want to delete this mealplan? This action cannot be undone.</div>
                  <div className="flex space-x-2 mt-6">
                    <Button className="bg-red-600 hover:bg-red-700 text-white flex-1 flex items-center justify-center" onClick={handleDelete} disabled={deleting}>
                      <Trash className="h-4 w-4 mr-1" /> {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button variant="outline" className="flex-1 flex items-center justify-center border-emerald-600 text-emerald-600" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </HeadlessDialog.Panel>
              </div>
            </HeadlessDialog>
          )}

          {/* Recipe Selection Dialog */}
          <Dialog open={showRecipeSelector} onOpenChange={setShowRecipeSelector}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <ChefHat className="h-5 w-5 text-emerald-600" />
                  <span>Select Recipe for {selectedSlot?.day} - {selectedSlot?.mealType}</span>
                </DialogTitle>
              </DialogHeader>
              <RecipeSelector 
                onSelectRecipe={handleRecipeSelect}
                onCancel={handleCancelRecipeSelection}
              />
            </DialogContent>
          </Dialog>

          {/* Deleted Template Notification */}
          {showDeletedTemplateModal && (
            <HeadlessDialog open={showDeletedTemplateModal} onClose={() => setShowDeletedTemplateModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
              <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" onClick={() => setShowDeletedTemplateModal(false)} />
              <div className="flex items-center justify-center min-h-screen px-4">
                <HeadlessDialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-50 p-6">
                  <HeadlessDialog.Title className="text-2xl font-bold mb-4 text-red-600">Meal Plan Deleted</HeadlessDialog.Title>
                                     <div className="mb-4 text-gray-700">
                     The original meal plan template that this week was based on has been deleted by its author. 
                     Please choose a new meal plan to continue.
                   </div>
                   <div className="flex justify-center mt-6">
                     <Button 
                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" 
                       onClick={handleChooseNewPlan}
                     >
                       Choose New Plan
                     </Button>
                   </div>
                </HeadlessDialog.Panel>
              </div>
            </HeadlessDialog>
          )}
    
        </main> 
      </div> 
    );
  }
export default MyWeek; 