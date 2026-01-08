// Backend/src/models/recipeIngredient.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IIngredient } from './ingredient';



export interface IRecipeIngredient extends Document {
    ingredient: IIngredient; 
    amount: number;
    unit: 'gram' | 'kilogram' | 'milliliter' | 'liter' | 'teaspoon(s)' | 'tablespoon(s)' | 'piece(s)' | 'slice(s)';
}

export const recipeIngredientSchema = new Schema<IRecipeIngredient>({
    ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    amount: { type: Number, required: true },
    unit: { type: String, enum: ['gram', 'kilogram', 'milliliter', 'liter', 'teaspoon(s)', 'tablespoon(s)', 'piece(s)', 'slice(s)'], required: true },
});

export const RecipeIngredient = mongoose.model<IRecipeIngredient>("RecipeIngredient", recipeIngredientSchema);
