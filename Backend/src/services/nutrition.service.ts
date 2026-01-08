// Backend/src/services/nutrition.service.ts

import axios from 'axios';
import { NUTRITIONIX_APP_ID, NUTRITIONIX_APP_KEY } from '../config';
// IMPORTANT: Import Ingredient model AND IRecipeIngredient interface
import { Ingredient, IRecipeIngredient } from '../models'; 
import mongoose from 'mongoose'; // Needed for checking ObjectId type if required

interface NutritionData {
    calories: number;
    protein_g: number;
    totalFat_g: number;
    saturatedFat_g: number;
    cholesterol_mg: number;
    sodium_mg: number;
    carbohydrates_g: number;
    fiber_g: number;
    sugars_g: number;
    // Add any other nutrition fields you store
}

// Function now explicitly takes IRecipeIngredient[] from your backend schema
export async function calculateNutrition(recipeIngredients: IRecipeIngredient[]): Promise<{ nutritionTotals: NutritionData, unmatchedIngredients: string[] }> {
    let nutritionTotals: NutritionData = {
        calories: 0,
        protein_g: 0,
        totalFat_g: 0,
        saturatedFat_g: 0,
        cholesterol_mg: 0,
        sodium_mg: 0,
        carbohydrates_g: 0,
        fiber_g: 0,
        sugars_g: 0,
    };
    const unmatchedIngredients: string[] = [];
    // --- Step 1: Resolve Ingredient IDs to Names ---
    const ingredientsForNutritionixQuery: { amount?: number; unit?: string; name: string }[] = [];
    const ingredientNamePromises = recipeIngredients.map(async (item) => {
        if (item.ingredient instanceof mongoose.Types.ObjectId || typeof item.ingredient === 'string') {
            try {
                const ingredientDoc = await Ingredient.findById(item.ingredient);
                if (ingredientDoc) {
                    ingredientsForNutritionixQuery.push({
                        amount: item.amount,
                        unit: item.unit,
                        name: ingredientDoc.name
                    });
                } else {
                    unmatchedIngredients.push(String(item.ingredient));
                }
            } catch (err) {
                unmatchedIngredients.push(String(item.ingredient));
            }
        } else {
            unmatchedIngredients.push(JSON.stringify(item));
        }
    });
    await Promise.all(ingredientNamePromises);
    const nutritionixQueryString = ingredientsForNutritionixQuery
        .filter(item => item.name && item.name.trim().length > 0)
        .map(item => {
            const amountPart = item.amount ? `${item.amount}` : '';
            const unitPart = item.unit ? `${item.unit}` : '';
            return `${amountPart} ${unitPart} ${item.name}`.trim();
        })
        .join('\n');
    if (nutritionixQueryString.length === 0) {
        return { nutritionTotals, unmatchedIngredients };
    }
    try {
        const nutritionixResponse = await axios.post(
            'https://trackapi.nutritionix.com/v2/natural/nutrients',
            { query: nutritionixQueryString },
            {
                headers: {
                    'x-app-id': NUTRITIONIX_APP_ID,
                    'x-app-key': NUTRITIONIX_APP_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        const matchedNames: string[] = [];
        if (nutritionixResponse.data && nutritionixResponse.data.foods) {
            nutritionixResponse.data.foods.forEach((foodItem: any) => {
                nutritionTotals.calories += foodItem.nf_calories || 0;
                nutritionTotals.protein_g += foodItem.nf_protein || 0;
                nutritionTotals.totalFat_g += foodItem.nf_total_fat || 0;
                nutritionTotals.saturatedFat_g += foodItem.nf_saturated_fat || 0;
                nutritionTotals.cholesterol_mg += foodItem.nf_cholesterol || 0;
                nutritionTotals.sodium_mg += foodItem.nf_sodium || 0;
                nutritionTotals.carbohydrates_g += foodItem.nf_total_carbohydrate || 0;
                nutritionTotals.fiber_g += foodItem.nf_dietary_fiber || 0;
                nutritionTotals.sugars_g += foodItem.nf_sugars || 0;
                if (foodItem.food_name) matchedNames.push(foodItem.food_name.toLowerCase());
            });
        }
        // Find which ingredient names were not matched by Nutritionix
        const notMatched = ingredientsForNutritionixQuery
            .map(item => item.name.toLowerCase())
            .filter(name => !matchedNames.includes(name));
        unmatchedIngredients.push(...notMatched);
        return { nutritionTotals, unmatchedIngredients };
    } catch (apiError: any) {
        return { nutritionTotals, unmatchedIngredients };
    }
}