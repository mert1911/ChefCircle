
import { Router, Request, Response } from 'express';
import { Recipe } from '../models';
import { getUserPlannedRecipes } from '../controllers/mealplan.controller';
import auth from '../middleware/auth';


const router = Router();

// GET /recipes — fetch all recipes
router.get('/', async (req: Request, res: Response) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /recipes — create a new recipe
router.post('/', async (req: Request, res: Response) => {
  try {
    const newRecipe = new Recipe(req.body);
    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/user/planned-recipes', auth, getUserPlannedRecipes);

export default router;