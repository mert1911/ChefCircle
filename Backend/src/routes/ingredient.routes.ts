// Backend/src/routes/ingredient.routes.ts

import { Router } from 'express';
import auth, { authorizeRoles } from '../middleware/auth'; // Import auth middlewares
// Import the controller functions for ingredients
import {
    getIngredientById,
    createIngredient,
} from '../controllers/ingredient.controller'; // Make sure this path is correct

const ingredientRouter = Router();

// Define routes for ingredient operations

ingredientRouter.get('/:id', getIngredientById);
ingredientRouter.post('/', createIngredient);
;

export default ingredientRouter;