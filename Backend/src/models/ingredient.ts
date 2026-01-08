
import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient extends Document {
  name: string;
}

const ingredientSchema = new Schema<IIngredient>({
  name: { type: String, required: true, unique: true }
});

export const Ingredient = mongoose.model<IIngredient>('Ingredient', ingredientSchema);

