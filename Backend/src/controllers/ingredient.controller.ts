import { Request, Response } from 'express';
import { Ingredient, IIngredient } from '../models'; // Import Ingredient model and its interface


// Get ingredient by ID
export const getIngredientById = async (req: Request, res: Response) => {
    try {
        const ingredientId = req.params.id;
        const ingredient = await Ingredient.findById(ingredientId);

        if (!ingredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }
        res.status(200).json(ingredient);
    } catch (error: any) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Ingredient ID format.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Create a new ingredient
export const createIngredient = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Ingredient name is required.' });
        }

        const newIngredient: IIngredient = new Ingredient({ name });
        await newIngredient.save();
        res.status(201).json(newIngredient);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        // Handle duplicate key error if 'name' is unique
        if (error.code === 11000) {
            return res.status(409).json({ message: `Ingredient with name '${req.body.name}' already exists.` });
        }
        res.status(500).json({ message: error.message });
    }
};
