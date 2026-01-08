// Backend/src/routes/recipe.routes.ts
import { Router } from 'express';
import upload from '../middleware/multerUpload';
import auth from '../middleware/auth';
import {
  getRecipeById,
  getAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addFavoriteRecipe,
  deleteFavoriteRecipe,
  getFavoriteRecipes,
  getRecipesByUser,        // ← make sure this is imported from your controller
  getRecipeCount,
  rateRecipe
} from '../controllers/recipe.controller';

const recipeRouter = Router();

// Favorite recipes routes
recipeRouter.post('/favorites/:recipeId', auth, addFavoriteRecipe);
recipeRouter.delete('/favorites/:recipeId', auth, deleteFavoriteRecipe);
recipeRouter.get('/favorites', auth, getFavoriteRecipes);

// 1) Public: get all recipes
recipeRouter.get('/', getAllRecipes);

// 2) NEW: get recipes for a specific user
//    Must come *before* `/:id` or it'll never match
recipeRouter.get(
  '/users/:userId/recipes',
  auth,
  getRecipesByUser
);

// get number of recipes
recipeRouter.get('/count', getRecipeCount);


// 3) get a single recipe by its ID
recipeRouter.get('/:id', getRecipeById);


// Create / update / delete
recipeRouter.post('/', upload.single('image'), auth, createRecipe);
recipeRouter.put('/:id', upload.single('image'), auth, updateRecipe);
recipeRouter.delete('/:id', auth, deleteRecipe);
recipeRouter.post('/rate', auth, rateRecipe);

export default recipeRouter;
