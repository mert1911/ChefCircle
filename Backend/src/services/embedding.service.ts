import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config';
import { IRecipe } from '../models/recipe';
import { IRecipeIngredient } from '../models/recipeIngredient';
import { IIngredient } from '../models/ingredient';
import { Types } from 'mongoose';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Generate a focused text representation of a recipe for embedding
 * Includes only recipe name, ingredients, and diet tags for better ingredient-based search
 * @param recipe Recipe data to convert to text
 * @returns String representation of the recipe
 */
export const generateRecipeText = (recipe: {
  name: string;
  description: string;
  instructions: string[];
  tags: string[];
  ingredients: IRecipeIngredient[];
  cuisine?: string;
  difficulty?: string;
  prepTimeMin: number;
  cookTimeMin?: number;
  servings?: number;
}): string => {
  // Create ingredient text with amounts and units
  const ingredientTexts = recipe.ingredients.map(ing => {
    // Handle both populated and non-populated ingredient references
    const ingredient = ing.ingredient;
    const ingredientName = (ingredient && typeof ingredient === 'object' && 'name' in ingredient) 
      ? ingredient.name 
      : `ingredient_${ingredient}`;
    return `${ing.amount} ${ing.unit} ${ingredientName}`;
  });

  // Filter to only include diet-related tags for better ingredient matching
  const DIET_TAGS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Low-Carb', 'High-Protein', 'Keto', 'Paleo', 'Dairy-Free'];
  const dietTags = recipe.tags.filter(tag => DIET_TAGS.includes(tag));

  // Build focused recipe text for better ingredient-based search
  const recipeText = [
    `Recipe: ${recipe.name}`,
    `Ingredients: ${ingredientTexts.join(', ')}`,
    dietTags.length > 0 ? `Diet: ${dietTags.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return recipeText;
};

/**
 * Generate OpenAI embedding for a recipe
 * @param recipeText Text representation of the recipe
 * @returns Embedding vector
 */
export const generateEmbedding = async (recipeText: string): Promise<number[]> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('🧠 Generating embedding for recipe text...');
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // OpenAI's latest and most cost-effective embedding model
      input: recipeText,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    
    console.log(`✅ Embedding generated successfully (${embedding.length} dimensions)`);
    
    return embedding;
  } catch (error: any) {
    console.error('❌ Error generating embedding:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing details.');
    }
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }

    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embedding for a complete recipe object
 * @param recipe Recipe object to generate embedding for
 * @returns Embedding vector
 */
export const generateRecipeEmbedding = async (recipe: {
  name: string;
  description: string;
  instructions: string[];
  tags: string[];
  ingredients: IRecipeIngredient[];
  cuisine?: string;
  difficulty?: string;
  prepTimeMin: number;
  cookTimeMin?: number;
  servings?: number;
}): Promise<number[]> => {
  const recipeText = generateRecipeText(recipe);
  console.log('📝 Recipe text for embedding:', recipeText.substring(0, 200) + '...');
  
  return await generateEmbedding(recipeText);
}; 