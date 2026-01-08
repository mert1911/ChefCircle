
import mongoose, { Schema, Document, Types } from 'mongoose'; // Import Types for ObjectId
import { IRecipeIngredient, recipeIngredientSchema} from './recipeIngredient';
import { IIngredient } from './ingredient';
import {IUser} from './User'; // Only import the default export (the model) if you need it directly here.

// Define the NutritionData interface for the recipe document itself
export interface INutritionData {
    calories?: number;
    protein_g?: number;
    totalFat_g?: number;
    saturatedFat_g?: number;
    cholesterol_mg?: number;
    sodium_mg?: number;
    carbohydrates_g?: number;
    fiber_g?: number;
    sugars_g?: number;
}

const nutritionDataSchema = new Schema<INutritionData>({
    calories: { type: Number, default: 0, min: 0 },
    protein_g: { type: Number, default: 0, min: 0 },
    totalFat_g: { type: Number, default: 0, min: 0 },
    saturatedFat_g: { type: Number, default: 0, min: 0 },
    cholesterol_mg: { type: Number, default: 0, min: 0 },
    sodium_mg: { type: Number, default: 0, min: 0 },
    carbohydrates_g: { type: Number, default: 0, min: 0 },
    fiber_g: { type: Number, default: 0, min: 0 },
    sugars_g: { type: Number, default: 0, min: 0 },
}, { _id: false });


// Add rating interface
export interface IRecipeRating {
    user: Types.ObjectId;
    value: number;
}

const ratingSchema = new Schema<IRecipeRating>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, required: true, min: 1, max: 5 }
}, { _id: false });

// Full Recipe interface, extending Document and including INutritionData
export interface IRecipe extends Document, INutritionData { // <--- Extend with INutritionData
    //User input fields
    name: string;
    description: string;

    prepTimeMin: number;
    cookTimeMin: number; 
    servings: number;   
    difficulty?: 'easy' | 'medium' | 'hard'; 
    cuisine?: 'Mediterranean' | 'Middle Eastern' | 'Latin American' | 'Asian' | 'African' | 'European' | 'North American' | 'Fusion' | 'Other';

    image?: string;

    ingredients: IRecipeIngredient[]; 
    instructions: string[]; 
    tags?: Array<'Vegan' | 'Vegetarian' | 'Gluten-Free' | 'Low-Carb' | 'High-Protein' | 'Keto' | 'Paleo' | 'Dairy-Free'>;


    //System fields
    isPublic: boolean; 
    author: Types.ObjectId;
    ratings?: IRecipeRating[];
    averageRating?: number;
    
    // Embedding field for semantic search
    embedding?: number[]; // Used for AI-Chatbot 
        
}



const recipeSchema = new Schema<IRecipe>({
    name: { type: String, required: true },
    description: { type: String, required: true },

    prepTimeMin: { type: Number, required: true },
    cookTimeMin: { type: Number, required: true },
    servings: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    cuisine: { type: String, enum: ['Mediterranean', 'Middle Eastern', 'Latin American', 'Asian', 'African', 'European', 'North American', 'Fusion', 'Other'] },
    
    image: { type: String },

    ingredients: [{ type: recipeIngredientSchema, required: true }],
    instructions: [{ type: String, required: true }],
    tags: [{ type: String, enum: ['Vegan','Vegetarian','Gluten-Free','Low-Carb','High-Protein','Keto','Paleo','Dairy-Free'] }],
    
    isPublic: { type: Boolean, default: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    // Nutrition fields with default values
    calories: { type: Number, default: 0, min: 0 },
    protein_g: { type: Number, default: 0, min: 0 },
    totalFat_g: { type: Number, default: 0, min: 0 },
    saturatedFat_g: { type: Number, default: 0, min: 0 },
    cholesterol_mg: { type: Number, default: 0, min: 0 },
    sodium_mg: { type: Number, default: 0, min: 0 },
    carbohydrates_g: { type: Number, default: 0, min: 0 },
    fiber_g: { type: Number, default: 0, min: 0 },
    sugars_g: { type: Number, default: 0, min: 0 },
    embedding: [{ type: Number }],
}, {
    timestamps: true,
});

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);