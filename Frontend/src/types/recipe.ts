// Frontend/src/types/recipe.ts

// This interface defines the expected structure of an Ingredient document
// as it would be populated (i.e., when you get the full ingredient object, not just its ID).
export interface IIngredientDetails {
    _id: string; // The ID of the ingredient document itself
    name: string;
    // Add any other properties of your Backend/src/models/Ingredient.ts
    // that you expect to be populated and used on the frontend.
    // For example, if your Ingredient model has a 'category' or 'isAllergen' field.
    // category?: string;
    // isAllergen?: boolean;
}

// This interface defines the structure of an ingredient *within* a recipe.
// It reflects the structure after Mongoose's populate() operation.
export interface IRecipeIngredient {
    ingredient: IIngredientDetails; // This must be an object reference to IIngredientDetails
    amount: number;
    unit: string;
    _id?: string; // Mongoose adds an _id to subdocuments as well, which can be useful
}

// This interface defines the overall structure of a Recipe document
// as it's typically received from your backend API (e.g., after being saved and populated).
export interface IRecipe {
    _id: string; // The unique ID of the recipe document itself
    name: string; // Corresponds to 'title' in your frontend form, but 'name' in backend schema
    description: string;
    prepTimeMin?: number; // Optional, matches backend schema
    cookTimeMin?: number; // Optional, matches backend schema
    servings?: number; // Optional
    difficulty?: string; // Optional
    cuisine?: string; // Optional
    image?: string; // Optional (if you add image handling)
    instructions: string[]; // Array of strings
    ingredients: IRecipeIngredient[];
    tags: string[]; // Array of strings
    author: string; // Assuming author is just a string ID for now, will be User ObjectId on backend
                     // If you populate author on backend, this would be { _id: string; username: string; }

    // Nutrition fields - these are added by the backend after calculation
    calories?: number;
    protein_g?: number;
    totalFat_g?: number;
    saturatedFat_g?: number;
    cholesterol_mg?: number;
    sodium_mg?: number;
    carbohydrates_g?: number;
    fiber_g?: number;
    sugars_g?: number;

    createdAt?: string; // Mongoose timestamps (optional)
    updatedAt?: string; // Mongoose timestamps (optional)
    
    // Additional fields that may be returned in API responses
    unmatchedIngredients?: string[]; // Returned when ingredients couldn't be matched during create/update
}