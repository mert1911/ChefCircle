import { Router } from 'express';
import auth from '../middleware/auth';
import upload from '../middleware/multerUpload';
import {
  addRecipeToPlanned,
  removeRecipeFromPlanned,
  assignRecipeToSlot,
  removeRecipeFromSlot,
  getShoppingList,
  updateSlotServings,
  updateShoppingListChecked,
  copyMealplanToMyWeek,
  getMyWeekMealplan,
  createMyWeekMealplan,
  updateMyWeekMealplan,
  deleteMyWeekMealplan,
  createMealplanTemplate,
  getMealplanTemplates,
  getMealplanTemplateById,
  deleteMealplanTemplate,
  rateMealplan,
  getWeeklyNutrition,
  addFavoriteMealplan,
  deleteFavoriteMealplan,
  getFavoriteMealplans
} from '../controllers/mealplan.controller';

const mealplanRouter = Router();
// =================================
// Users Mealplan
// =================================

mealplanRouter.get('/myweek', auth, getMyWeekMealplan);
mealplanRouter.post('/myweek', auth, createMyWeekMealplan);
mealplanRouter.put('/myweek/:id', auth, updateMyWeekMealplan);
mealplanRouter.delete('/myweek/:id', auth, deleteMyWeekMealplan)

mealplanRouter.post('/slot', auth, assignRecipeToSlot);
mealplanRouter.post('/slot/servings', auth, updateSlotServings);
mealplanRouter.delete('/slot', auth, removeRecipeFromSlot);

mealplanRouter.post('/template/:id/copy', auth, copyMealplanToMyWeek);

mealplanRouter.post('/template/favorites/:mealplanId', auth, addFavoriteMealplan);
mealplanRouter.get('/template/favorites', auth, getFavoriteMealplans);
mealplanRouter.delete('/template/favorites/:mealplanId', auth, deleteFavoriteMealplan);

mealplanRouter.get('/nutrition', auth, getWeeklyNutrition);


// =================================
// Shopping List
// =================================

mealplanRouter.get('/shopping-list', auth, getShoppingList);
mealplanRouter.post('/shopping-list/check', auth, updateShoppingListChecked);



// =================================
// Mealplan Template
// =================================

mealplanRouter.post('/template', upload.single('image'), auth, createMealplanTemplate);
mealplanRouter.get('/template', getMealplanTemplates);
mealplanRouter.get('/template/:id', getMealplanTemplateById);
mealplanRouter.delete('/template/:id', auth, deleteMealplanTemplate);

mealplanRouter.post('/rate', auth, rateMealplan);


export default mealplanRouter; 