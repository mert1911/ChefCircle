import User from '../models/User';
import { Request, Response } from 'express';
import auth from '../middleware/auth';
import { UserMealplan } from '../models/mealplan';

// Get user's planned recipes
export const getPlannedRecipes = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(userId).populate('plannedRecipes');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ plannedRecipes: user.plannedRecipes });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch planned recipes', error: err.message });
  }
};

// Add a recipe to plannedRecipes
export const addPlannedRecipe = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { recipeId } = req.body;
    if (!recipeId) return res.status(400).json({ message: 'recipeId is required' });
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { plannedRecipes: recipeId } },
      { new: true }
    ).populate('plannedRecipes');
    res.json({ plannedRecipes: user.plannedRecipes });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to add planned recipe', error: err.message });
  }
};

// Remove a recipe from plannedRecipes
export const removePlannedRecipe = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { recipeId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { plannedRecipes: recipeId } },
      { new: true }
    ).populate('plannedRecipes');
    res.json({ plannedRecipes: user.plannedRecipes });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to remove planned recipe', error: err.message });
  }
};

// Create a new UserMealplan for a week
export const createUserMealplan = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week, slots, shoppingListState, template } = req.body;
    if (!week || !slots) return res.status(400).json({ message: 'week and slots are required' });
    const mealplan = new UserMealplan({ user: userId, week, slots, shoppingListState, template });
    await mealplan.save();
    res.status(201).json(mealplan);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create mealplan', error: err.message });
  }
};

// Get UserMealplan for a specific week
export const getUserMealplan = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week } = req.query;
    if (!week) return res.status(400).json({ message: 'week is required' });
    
    let mealplan = await UserMealplan.findOne({ user: userId, week }).populate('slots.recipe');
    
    // If no mealplan exists, create an empty one for the week
    if (!mealplan) {
      mealplan = new UserMealplan({
        user: userId,
        week,
        slots: [],
        shoppingListState: []
      });
      await mealplan.save();
    }
    
    res.json(mealplan);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch mealplan', error: err.message });
  }
};

// Update UserMealplan for a specific week
export const updateUserMealplan = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week } = req.query;
    if (!week) return res.status(400).json({ message: 'week is required' });
    const { slots, shoppingListState } = req.body;
    const mealplan = await UserMealplan.findOneAndUpdate(
      { user: userId, week },
      { slots, shoppingListState },
      { new: true }
    ).populate('slots.recipe');
    if (!mealplan) return res.status(404).json({ message: 'Mealplan not found' });
    res.json(mealplan);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update mealplan', error: err.message });
  }
};

// Delete UserMealplan for a specific week
export const deleteUserMealplan = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week } = req.query;
    if (!week) return res.status(400).json({ message: 'week is required' });
    const mealplan = await UserMealplan.findOneAndDelete({ user: userId, week });
    if (!mealplan) return res.status(404).json({ message: 'Mealplan not found' });
    res.json({ message: 'Mealplan deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete mealplan', error: err.message });
  }
};

// Get nutrition goals for the authenticated user
export const getUserGoals = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const goals = {
      dailyCalories: user.dailyCalories,
      dailyProteins: user.dailyProteins,
      dailyCarbs: user.dailyCarbs,
      dailyFats: user.dailyFats
    };
    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch nutrition goals', error: err.message });
  }
};

// Get weight history (optionally for a specific week)
export const getWeightHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week } = req.query;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    let history = user.weightHistory || [];
    if (week) history = history.filter((entry: any) => entry.week === week);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch weight history', error: err.message });
  }
};

// Add or update weight for a week
export const setWeightForWeek = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { week, value } = req.body;
    if (!week || typeof value !== 'number') return res.status(400).json({ message: 'week and value required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    let updated = false;
    user.weightHistory = (user.weightHistory || []).map((entry: any) => {
      if (entry.week === week) {
        updated = true;
        return { ...entry, value };
      }
      return entry;
    });
    if (!updated) user.weightHistory.push({ week, value });
    await user.save();
    res.json({ success: true, weightHistory: user.weightHistory });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to set weight', error: err.message });
  }
};

// Search for users by name or username
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Search for users by firstName, lastName, or username (case-insensitive)
    const users = await User.find({
      _id: { $ne: userId }, // Exclude the current user from search results
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    })
    .select('firstName lastName username profileImage bio subscriptionType subscriptionStatus')
    .limit(10); // Limit results to 10 users

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to search users', error: err.message });
  }
}; 