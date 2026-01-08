import express from 'express';
import { getPlannedRecipes, addPlannedRecipe, removePlannedRecipe, createUserMealplan, getUserMealplan, updateUserMealplan, deleteUserMealplan, getUserGoals, getWeightHistory, setWeightForWeek, searchUsers } from '../controllers/user.controller';
import auth from '../middleware/auth';

const router = express.Router();

// Search for users
router.get('/search', auth, searchUsers);

// Get all planned recipes for the authenticated user
router.get('/planned-recipes', auth, getPlannedRecipes);

// Add a recipe to planned recipes
router.post('/planned-recipes', auth, addPlannedRecipe);

// Remove a recipe from planned recipes
router.delete('/planned-recipes/:recipeId', auth, removePlannedRecipe);

// UserMealplan CRUD//
//router.post('/mealplan', auth, createUserMealplan);
//router.get('/mealplan', auth, getUserMealplan); // expects ?week=YYYY-Www 
//router.put('/mealplan', auth, updateUserMealplan); // expects ?week=YYYY-Www
//router.delete('/mealplan', auth, deleteUserMealplan); // expects ?week=YYYY-Www

// Get nutrition goals for the authenticated user
router.get('/goals', auth, getUserGoals);
// Weight history endpoints
router.get('/weight-history', auth, getWeightHistory);
router.post('/weight-history', auth, setWeightForWeek);

export default router; 