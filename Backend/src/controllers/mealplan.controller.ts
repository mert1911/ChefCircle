import { Request, Response } from 'express';
import { UserMealplan, MealplanTemplate}  from '../models/mealplan';
import { Recipe } from '../models/recipe';
import mongoose from 'mongoose';
import User from '../models/User';
import upload from '../middleware/multerUpload';
const { ObjectId } = mongoose.Types;

// =================================
// Users Mealplan Controller
// =================================


// Create a new mealplan for a week
export const createMyWeekMealplan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { week, plannedRecipes, slots } = req.body;
    if (!week) return res.status(400).json({ error: 'Week is required' });
    // --- LOGGING: Print week-to-date mapping ---
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    console.log(`[WEEK LOG] Date mapping for week ${week}:`);
    days.forEach(day => {
      const date = getDateForDayOfWeek(week, day);
      console.log(`[WEEK LOG]   ${day}: ${date}`);
    });
    // --- END LOGGING ---
    const existing = await UserMealplan.findOne({ user: userId, week });
    if (existing) return res.status(400).json({ error: 'Mealplan already exists for this week' });
    const mealplan = await UserMealplan.create({
      user: userId,
      week,
      slots: slots || [],
      shoppingListState: [],
    });
    res.json(mealplan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create mealplan', details: err });
  }
};


// Get the user's mealplan for a specific week
export const getMyWeekMealplan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: 'Week is required' });
    // --- LOGGING: Print week-to-date mapping ---
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    console.log(`[WEEK LOG] Date mapping for week ${week}:`);
    days.forEach(day => {
      const date = getDateForDayOfWeek(week as string, day);
      console.log(`[WEEK LOG]   ${day}: ${date}`);
    });
    // --- END LOGGING ---
    const mealplan = await UserMealplan.findOne({ user: userId, week })
      .populate({
        path: 'slots.recipe',
        populate: { path: 'ingredients.ingredient' }
      });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found' });
    res.json(mealplan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mealplan', details: err });
  }
};


// Update the user's mealplan for a week
export const updateMyWeekMealplan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { plannedRecipes, slots } = req.body;
    const mealplan = await UserMealplan.findOne({ _id: id, user: userId });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found' });
    if (slots) mealplan.slots = slots;
    await mealplan.save();
    res.json(mealplan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mealplan', details: err });
  }
};


// Delete the user's mealplan for a week
export const deleteMyWeekMealplan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const mealplan = await UserMealplan.findOneAndDelete({ _id: id, user: userId });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mealplan', details: err });
  }
};


// Assign a recipe to a slot
export const assignRecipeToSlot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date, mealType, recipeId, servings } = req.body;
    let mealplan = await UserMealplan.findOne({ user: userId });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found' });
    // Remove any existing slot for this date/mealType
    mealplan.slots = mealplan.slots.filter((slot: any) => !(slot.date === date && slot.mealType === mealType));
    mealplan.slots.push({ date, mealType, recipe: recipeId, servings: servings || 1 });
    await mealplan.save();
    await mealplan.populate({
      path: 'slots.recipe',
      populate: { path: 'ingredients.ingredient' }
    });
    await mealplan.populate({
      path: 'plannedRecipes',
      populate: { path: 'ingredients.ingredient' }
    });
    res.json(mealplan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign recipe to slot', details: err });
  }
};

// New: Update servings for a slot
export const updateSlotServings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date, mealType, servings } = req.body;
    if (!date || !mealType || !servings || servings < 1) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    let mealplan = await UserMealplan.findOne({ user: userId });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found' });
    let updated = false;
    mealplan.slots = mealplan.slots.map((slot: any) => {
      if (slot.date === date && slot.mealType === mealType) {
        updated = true;
        return { ...slot.toObject(), servings };
      }
      return slot;
    });
    if (!updated) return res.status(404).json({ error: 'Slot not found' });
    await mealplan.save();
    await mealplan.populate({
      path: 'slots.recipe',
      populate: { path: 'ingredients.ingredient' }
    });
    await mealplan.populate({
      path: 'plannedRecipes',
      populate: { path: 'ingredients.ingredient' }
    });
    res.json(mealplan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slot servings', details: err });
  }
};

// Remove a recipe from a slot
export const removeRecipeFromSlot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date, mealType } = req.body;
    let mealplan = await UserMealplan.findOne({ user: userId });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found' });
    mealplan.slots = mealplan.slots.filter((slot: any) => !(slot.date === date && slot.mealType === mealType));
    await mealplan.save();
    await mealplan.populate({
      path: 'slots.recipe',
      populate: { path: 'ingredients.ingredient' }
    });
    await mealplan.populate({
      path: 'plannedRecipes',
      populate: { path: 'ingredients.ingredient' }
    });
    res.json(mealplan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove recipe from slot', details: err });
  }
};


// =================================
// Users Planned Recipes
// =================================


// Add a recipe to plannedRecipes 
export const addRecipeToPlanned = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { recipeId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: 'Invalid recipe ID' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.plannedRecipes) user.plannedRecipes = [];
    if (!user.plannedRecipes.map((id: any) => id.toString()).includes(recipeId)) {
      user.plannedRecipes.push(recipeId);
      await user.save();
    }
    // Populate plannedRecipes for response
    await user.populate({ path: 'plannedRecipes', populate: { path: 'ingredients.ingredient' } });
    res.json({ plannedRecipes: user.plannedRecipes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add recipe', details: err });
  }
};


// Get the user's planned recipes
export const getUserPlannedRecipes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).populate({
      path: 'plannedRecipes',
      populate: { path: 'ingredients.ingredient' }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ plannedRecipes: user.plannedRecipes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch planned recipes', details: err });
  }
};


// Remove a recipe from plannedRecipes
export const removeRecipeFromPlanned = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { recipeId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.plannedRecipes) user.plannedRecipes = [];
    user.plannedRecipes = user.plannedRecipes.filter((id: any) => id.toString() !== recipeId);
    await user.save();
    // Populate plannedRecipes for response
    await user.populate({ path: 'plannedRecipes', populate: { path: 'ingredients.ingredient' } });
    res.json({ plannedRecipes: user.plannedRecipes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove recipe', details: err });
  }
};

// Get weekly nutrition aggregated per day
export const getWeeklyNutrition = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    let { week } = req.query;
    if (!week) {
      // Generate current ISO week string (e.g., '2024-W23') using Central European Time (Europe/Berlin)
      const now = new Date();
      const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
      const year = berlinTime.getFullYear();
      const getISOWeek = (date: Date) => {
        const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
        const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        return weekNum;
      };
      const weekNum = getISOWeek(berlinTime);
      week = `${year}-W${String(weekNum).padStart(2, '0')}`;
    }
    // Use UserMealplan for the specified week
    const mealplan = await UserMealplan.findOne({ user: userId, week }).populate({
      path: 'slots.recipe',
      populate: { path: 'ingredients.ingredient' }
    });
    
    // If no mealplan exists, return empty nutrition data
    if (!mealplan) {
      return res.json({});
    }
    
    // Aggregate nutrition per day
    const dailyNutrition: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
    for (const slot of mealplan.slots) {
      const date = slot.date;
      if (!dailyNutrition[date]) {
        dailyNutrition[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      const recipe: any = slot.recipe;
      const servings = slot.servings || 1;
      const recipeServings = recipe && recipe.servings ? recipe.servings : 1;
      const multiplier = servings / recipeServings;
      if (recipe) {
        dailyNutrition[date].calories += (recipe.calories || 0) * multiplier;
        dailyNutrition[date].protein += (recipe.protein_g || 0) * multiplier;
        dailyNutrition[date].carbs += (recipe.carbohydrates_g || 0) * multiplier;
        dailyNutrition[date].fat += (recipe.totalFat_g || 0) * multiplier;
      }
    }
    res.json(dailyNutrition);
  } catch (err) {
    res.status(500).json({ error: 'Failed to aggregate weekly nutrition', details: err });
  }
}; 



// =================================
// Shopping List
// =================================


// Get the g list (aggregate ingredients from assigned recipes, scaled by servings)
export const getShoppingList = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    let { week } = req.query;
    if (!week) {
      // Generate current ISO week string (e.g., '2024-W23') using Central European Time (Europe/Berlin)
      const now = new Date();
      const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
      const year = berlinTime.getFullYear();
      const getISOWeek = (date: Date) => {
        const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
        const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        return weekNum;
      };
      const weekNum = getISOWeek(berlinTime);
      week = `${year}-W${String(weekNum).padStart(2, '0')}`;
    }
    // Use UserMealplan for the specified week
    const mealplan = await UserMealplan.findOne({ user: userId, week }).populate({
      path: 'slots.recipe',
      populate: { path: 'ingredients.ingredient' }
    });
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found for this week' });
    // Aggregate ingredients, scaling by servings
    const ingredientMap: Record<string, { ingredientId: string; name: string; amount: number; unit: string }> = {};
    for (const slot of mealplan.slots) {
      const recipe: any = slot.recipe;
      const slotServings = slot.servings || 1;
      const recipeServings = recipe && recipe.servings ? recipe.servings : 1;
      if (recipe && recipe.ingredients) {
        for (const ing of recipe.ingredients) {
          const name = ing.ingredient && typeof ing.ingredient === 'object' ? ing.ingredient.name : 'Unknown ingredient';
          const ingredientId = ing.ingredient && typeof ing.ingredient === 'object' ? ing.ingredient._id?.toString() : undefined;
          const key = `${ingredientId || name}-${ing.unit}`;
          if (!ingredientMap[key]) {
            ingredientMap[key] = { ingredientId, name, amount: 0, unit: ing.unit };
          }
          // Scale by slotServings / recipeServings
          ingredientMap[key].amount += ing.amount * (slotServings / recipeServings);
        }
      }
    }
    // Merge checked state from shoppingListState
    let updatedShoppingListState = mealplan.shoppingListState || [];
    let needsSave = false;
    // In getShoppingList, update resultList mapping to round amount
    const resultList = Object.values(ingredientMap).map(item => {
      const stateIdx = updatedShoppingListState.findIndex(
        (s: any) => s.ingredient?.toString() === item.ingredientId && s.unit === item.unit
      );
      let checked = false;
      if (stateIdx !== -1) {
        const state = updatedShoppingListState[stateIdx];
        if (state.amount === item.amount) {
          checked = state.checked;
        } else {
          // Amount changed (e.g., new recipe added), reset checked
          checked = false;
          updatedShoppingListState[stateIdx].checked = false;
          updatedShoppingListState[stateIdx].amount = item.amount;
          needsSave = true;
        }
      } else {
        // New ingredient+unit
        updatedShoppingListState.push({
          ingredient: new mongoose.Types.ObjectId(item.ingredientId),
          unit: item.unit,
          checked: false,
          amount: item.amount
        });
        checked = false;
        needsSave = true;
      }
      // Round amount to two decimal places
      return { ...item, checked, amount: Math.round(item.amount * 100) / 100 };
    });
    // Remove any shoppingListState entries that are no longer in the list
    const validKeys = new Set(Object.values(ingredientMap).map(i => `${i.ingredientId}-${i.unit}`));
    if (updatedShoppingListState.length !== resultList.length) {
      updatedShoppingListState = updatedShoppingListState.filter((s: any) => validKeys.has(`${s.ingredient?.toString()}-${s.unit}`));
      needsSave = true;
    }
    if (needsSave) {
      mealplan.shoppingListState = updatedShoppingListState;
      await mealplan.save();
    }
    res.json(resultList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate shopping list', details: err });
  }
};

// Update checked state for a shopping list item
export const updateShoppingListChecked = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ingredientId, unit, checked } = req.body;
    
    console.log('=== Shopping List Check Update Debug ===');
    console.log('Received payload:', { ingredientId, unit, checked });
    console.log('User ID:', userId);
    
    if (!ingredientId || !unit || typeof checked !== 'boolean') {
      return res.status(400).json({ error: 'Missing ingredientId, unit, or checked' });
    }
    // Determine current week in CET
    const now = new Date();
    const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    const year = berlinTime.getFullYear();
    const getISOWeek = (date: Date) => {
      const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
      const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return weekNum;
    };
    const weekNum = getISOWeek(berlinTime);
    const week = `${year}-W${String(weekNum).padStart(2, '0')}`;
    
    console.log('Current week:', week);
    
    // Use UserMealplan for the current week
    const mealplan = await UserMealplan.findOne({ user: userId, week });
    console.log('Found mealplan:', mealplan ? 'Yes' : 'No');
    
    if (!mealplan) return res.status(404).json({ error: 'Mealplan not found for current week' });
    
    console.log('Current shoppingListState:', mealplan.shoppingListState);
    
    let found = false;
    if (!mealplan.shoppingListState) mealplan.shoppingListState = [];
    
    for (let item of mealplan.shoppingListState) {
      console.log('Checking item:', {
        itemIngredientId: item.ingredient?.toString(),
        itemUnit: item.unit,
        searchIngredientId: ingredientId,
        searchUnit: unit,
        match: item.ingredient?.toString() === ingredientId && item.unit === unit
      });
      
      if (item.ingredient?.toString() === ingredientId && item.unit === unit) {
        console.log('Found matching item, updating checked from', item.checked, 'to', checked);
        item.checked = checked;
        found = true;
        break;
      }
    }
    
    console.log('Item found and updated:', found);
    
    if (found) {
      mealplan.markModified('shoppingListState');
    }
    
    await mealplan.save();
    console.log('Mealplan saved successfully');
    
    // Return the updated shopping list directly instead of regenerating it
    // This prevents getShoppingList from overwriting our changes
    const updatedMealplan = await UserMealplan.findOne({ user: userId, week }).populate({
      path: 'slots.recipe',
      populate: { path: 'ingredients.ingredient' }
    });
    
    if (!updatedMealplan) {
      return res.status(404).json({ error: 'Mealplan not found after update' });
    }
    
    // Aggregate ingredients, scaling by servings
    const ingredientMap: Record<string, { ingredientId: string; name: string; amount: number; unit: string }> = {};
    for (const slot of updatedMealplan.slots) {
      const recipe: any = slot.recipe;
      const slotServings = slot.servings || 1;
      const recipeServings = recipe && recipe.servings ? recipe.servings : 1;
      if (recipe && recipe.ingredients) {
        for (const ing of recipe.ingredients) {
          const name = ing.ingredient && typeof ing.ingredient === 'object' ? ing.ingredient.name : 'Unknown ingredient';
          const ingredientId = ing.ingredient && typeof ing.ingredient === 'object' ? ing.ingredient._id?.toString() : undefined;
          const key = `${ingredientId || name}-${ing.unit}`;
          if (!ingredientMap[key]) {
            ingredientMap[key] = { ingredientId, name, amount: 0, unit: ing.unit };
          }
          // Scale by slotServings / recipeServings
          ingredientMap[key].amount += ing.amount * (slotServings / recipeServings);
        }
      }
    }
    
    // Merge with the updated shoppingListState
    const resultList = Object.values(ingredientMap).map(item => {
      const stateItem = updatedMealplan.shoppingListState?.find(
        (s: any) => s.ingredient?.toString() === item.ingredientId && s.unit === item.unit
      );
      const checked = stateItem ? stateItem.checked : false;
      // Round amount to two decimal places
      return { ...item, checked, amount: Math.round(item.amount * 100) / 100 };
    });
    
    console.log('Returning updated shopping list with', resultList.length, 'items');
    res.json(resultList);
  } catch (err) {
    console.error('Error in updateShoppingListChecked:', err);
    res.status(500).json({ error: 'Failed to update checked state', details: err });
  }
};




// =================================
// Mealplan Template
// =================================





// Copy a published mealplan to the current user's MyWeek for a specified week //DOUBLE CHEKC WHETHER THIS IS NEEDED
export const copyMealplanToMyWeek = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params; // templateId from route param
    const { week } = req.body;
    if (!week) return res.status(400).json({ error: 'Week is required' });

    // Find the published mealplan template to copy
    const template = await MealplanTemplate.findById(id).populate('slots.recipe');
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Map slots: dayOfWeek -> date in the selected week
    const userSlots = template.slots.map(slot => ({
      mealType: slot.mealType,
      date: getDateForDayOfWeek(week, slot.dayOfWeek),
      recipe: typeof slot.recipe === 'object' && slot.recipe !== null && '_id' in slot.recipe ? slot.recipe._id : String(slot.recipe),
      servings: slot.servings
    }));

    // Check for existing mealplan for this user/week
    const existing = await UserMealplan.findOne({ user: userId, week });
    if (existing) return res.status(400).json({ error: 'Mealplan already exists for this week' });

    // Create a new mealplan for the user/week
    const userMealplan = new UserMealplan({
      user: userId,
      week,
      slots: userSlots,
      template: template._id,
      shoppingListState: [],
    });
    await userMealplan.save();
    res.status(201).json(userMealplan);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to copy mealplan', details: err.message });
  }
};




export const createMealplanTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week, title, description, tags, difficulty } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'title and description are required' });
    // --- LOGGING: Print week-to-date mapping ---
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      const date = getDateForDayOfWeek(week, day);
    });

    const userMealplan = await UserMealplan.findOne({ user: userId, week }).populate('slots.recipe');
    if (!userMealplan) return res.status(404).json({ message: 'UserMealplan not found' });
    // Map slots: date -> dayOfWeek
    const templateSlots = userMealplan.slots.map(slot => ({
      mealType: slot.mealType,
      dayOfWeek: getDayOfWeekFromDate(slot.date),
      recipe: typeof slot.recipe === 'object' && slot.recipe !== null && '_id' in slot.recipe ? slot.recipe._id : String(slot.recipe),
      servings: slot.servings
    }));
    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    }
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map((t: string) => t.trim());
      }
    }
    const template = new MealplanTemplate({
      title,
      description,
      tags: parsedTags,
      author: userId,
      slots: templateSlots,
      difficulty,
      image: imagePath
    });
    await template.save();
    res.status(201).json(template);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create template', error: err.message });
  }
};

// Get all MealplanTemplates (optionally filter by search/tags)
export const getMealplanTemplates = async (req: Request, res: Response) => {
  try {
    const { search, tags } = req.query;
    let query: any = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    const templates = await MealplanTemplate.find(query)
      .populate([
        { path: 'author', select: 'username firstName lastName' },
        { path: 'slots.recipe' }
      ]);
    // Transform response to include calculated ratings
    const responseTemplates = templates.map(template => {
      const templateObj = template.toObject();
      const ratings = templateObj.ratings || [];
      const sum = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
      return {
        ...templateObj,
        averageRating: ratings.length > 0 ? sum / ratings.length : 0,
        totalRatings: ratings.length
      };
    });
    res.json(responseTemplates);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch templates', error: err.message });
  }
};

// Get a single MealplanTemplate by ID
export const getMealplanTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await MealplanTemplate.findById(id)
      .populate([
        { path: 'author', select: 'username firstName lastName' },
        { path: 'slots.recipe' }
      ]);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    // Calculate ratings for response
    const templateObj = template.toObject();
    const ratings = templateObj.ratings || [];
    const sum = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
    const responseTemplate = {
      ...templateObj,
      averageRating: ratings.length > 0 ? sum / ratings.length : 0,
      totalRatings: ratings.length
    };
    res.json(responseTemplate);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch template', error: err.message });
  }
};

// Delete a MealplanTemplate by ID (only author can delete)
export const deleteMealplanTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const template = await MealplanTemplate.findOneAndDelete({ _id: id, author: userId });
    if (!template) return res.status(404).json({ message: 'Template not found or not authorized' });
    
    // Cascade deletion: Remove all user meal plans based on this template
    try {
      // Find all UserMealplan records that were created from this template
      // Note: We'll need to add a templateId field to UserMealplan to track this
      // For now, we'll mark them as deleted by setting a flag or removing them
      // This is a simplified approach - in production you might want to track template relationships
      console.log(`Template ${id} deleted, cascade effects applied`);
      
      // Remove all user meal plans that were created from this template
      await UserMealplan.deleteMany({ template: id });
      
      // Remove from all users' favorite meal plans
      await User.updateMany(
        { favoriteMealPlans: id },
        { $pull: { favoriteMealPlans: id } }
      );
    } catch (cascadeErr) {
      console.error('Error in cascade deletion:', cascadeErr);
      // Continue with template deletion even if cascade operations fail
    }
    
    res.json({ message: 'Template deleted', cascadeEffects: 'User meal plans and favorites updated' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete template', error: err.message });
  }
};



// Add a new controller for rating a mealplan
export const rateMealplan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { mealplanId, value } = req.body;
    if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
    if (!mealplanId || typeof value !== 'number' || value < 1 || value > 5) {
      return res.status(400).json({ message: 'Invalid mealplanId or rating value (must be 1-5).' });
    }
    // Only allow rating templates
    const template = await MealplanTemplate.findById(mealplanId);
    if (!template) return res.status(404).json({ message: 'Mealplan template not found.' });
    // Remove any existing rating by this user
    template.ratings = (template.ratings || []).filter((r: any) => r.user.toString() !== userId);
    // Add the new rating
    template.ratings.push({ user: new mongoose.Types.ObjectId(userId), value });
    // Calculate average for the response only
    const sum = template.ratings.reduce((acc: number, r: any) => acc + r.value, 0);
    const averageRating = template.ratings.length > 0 ? sum / template.ratings.length : 0;
    await template.save();
    res.status(200).json({ 
      averageRating, 
      totalRatings: template.ratings.length,
      ratings: template.ratings 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 

// Add a mealplan to user's favorites
export const addFavoriteMealplan = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const mealplanId = req.params.mealplanId;
        console.log(`[MEALPLAN FAVORITES] Adding mealplan to favorites - userId: ${userId}, mealplanId: ${mealplanId}`);
        if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
        // Check if mealplan template exists
        const template = await MealplanTemplate.findById(mealplanId);
        if (!template) {
            console.log(`[MEALPLAN FAVORITES] Mealplan template not found: ${mealplanId}`);
            return res.status(404).json({ message: 'Mealplan template not found.' });
        }
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (!user.favoriteMealPlans) user.favoriteMealPlans = [];
        if (user.favoriteMealPlans.map((id: any) => id.toString()).includes(mealplanId)) {
            console.log(`[MEALPLAN FAVORITES] Mealplan already in user's favorites: ${mealplanId}`);
            return res.status(400).json({ message: 'Mealplan already in favorites.' });
        }
        user.favoriteMealPlans.push(mealplanId);
        await user.save();
        console.log(`[MEALPLAN FAVORITES] Successfully added mealplan ${mealplanId} to user ${userId} favorites`);
        res.status(200).json({ message: 'Mealplan added to favorites.' });
    } catch (error: any) {
        console.error(`[MEALPLAN FAVORITES] Error adding mealplan to favorites:`, error);
        res.status(500).json({ message: error.message });
    }
};

// Remove a mealplan from user's favorites
export const deleteFavoriteMealplan = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const mealplanId = req.params.mealplanId;
        console.log(`[MEALPLAN FAVORITES] Removing mealplan from favorites - userId: ${userId}, mealplanId: ${mealplanId}`);
        if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (!user.favoriteMealPlans) user.favoriteMealPlans = [];
        user.favoriteMealPlans = user.favoriteMealPlans.filter((id: any) => id.toString() !== mealplanId);
        await user.save();
        console.log(`[MEALPLAN FAVORITES] Successfully removed mealplan ${mealplanId} from user ${userId} favorites`);
        res.status(200).json({ message: 'Mealplan removed from favorites.' });
    } catch (error: any) {
        console.error(`[MEALPLAN FAVORITES] Error removing mealplan from favorites:`, error);
        res.status(500).json({ message: error.message });
    }
};

// Get all favorite mealplans for a user
export const getFavoriteMealplans = async (req: Request, res: Response) => {
    try {
        console.log('[MEALPLAN FAVORITES] Controller entered');
        const userId = req.user?.id;
        console.log('[MEALPLAN FAVORITES] Requested by userId:', userId);
        if (!userId) {
            console.warn('[MEALPLAN FAVORITES] No userId found on request.');
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const user = await User.findById(userId).populate({
            path: 'favoriteMealPlans',
            populate: [
                { path: 'author', select: 'username firstName lastName' },
                { path: 'slots.recipe' }
            ]
        });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        // Transform response to include calculated ratings
        const favorites = (user.favoriteMealPlans || []).map((template: any) => {
            const templateObj = template.toObject();
            const ratings = templateObj.ratings || [];
            const sum = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
            return {
                ...templateObj,
                averageRating: ratings.length > 0 ? sum / ratings.length : 0,
                totalRatings: ratings.length
            };
        });

        console.log('[MEALPLAN FAVORITES] Found favorite mealplans:', favorites.length);
        res.status(200).json(favorites);
    } catch (error: any) {
        console.error('[MEALPLAN FAVORITES] Error in getFavoriteMealplans:', error.stack || error);
        res.status(500).json({ message: error.message });
    }
}; 



// =================================
// Helper functions
// =================================


// Helper: Map date string (YYYY-MM-DD) to dayOfWeek string
function getDayOfWeekFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Berlin' });
}

// Helper: Get Monday of ISO week (ISO 8601)
function getMondayOfISOWeek(year: number, week: number): Date {
  // ISO week 1 is the week with the first Thursday of the year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayUTC = new Date(jan4);
  mondayUTC.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  // Convert to CET for all calculations
  return new Date(mondayUTC.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
}

// Helper: Map dayOfWeek string to date in a given ISO week (Monday as first day)
function getDateForDayOfWeek(week: string, dayOfWeek: string): string {
  // week: '2025-W28', dayOfWeek: 'Monday', ...
  const [year, weekNum] = week.split('-W').map(Number);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const offset = days.indexOf(dayOfWeek);
  const monday = getMondayOfISOWeek(year, weekNum);
  const date = new Date(monday);
  date.setDate(monday.getDate() + offset);
  return date.toISOString().slice(0,10);
}