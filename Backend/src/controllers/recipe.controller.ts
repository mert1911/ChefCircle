import { Request, Response } from 'express';
// Import your Mongoose models from the models index file
import { Recipe, Ingredient, User } from '../models';
import { IRecipe, INutritionData } from '../models/recipe'; // Import IRecipe and INutritionData for clarity
import { IRecipeIngredient } from '../models/recipeIngredient'; // Import IRecipeIngredient and Unit enum
import { calculateNutrition } from '../services/nutrition.service'; 
import { generateRecipeEmbedding } from '../services/embedding.service';
import { Tag } from '../models/tag';
import mongoose from 'mongoose'; // Still needed for general Mongoose errors

// Extend the Express Request type to include the 'file' property from Multer
// Note: 'user' property is now defined globally in auth.ts middleware
declare global {
    namespace Express {
        interface Request {
            file?: Express.Multer.File;
        }
    }
}

// Controller function to create a new recipe
export const createRecipe = async (req: Request, res: Response) => {
    try {
            const {
            name,
            description,
            prepTimeMin: prepTimeMinStr, 
            cookTimeMin: cookTimeMinStr,
            servings: servingsStr,
            difficulty,
            cuisine,
            instructions: instructionsStr,
            tags: tagsStr,
            ingredients: rawIngredientsStr,
        } = req.body;

        const authorId = req.user?.id; 
        
        //Parsing incoming data 
        const prepTimeMin = prepTimeMinStr ? parseInt(prepTimeMinStr as string) : undefined;
        const cookTimeMin = cookTimeMinStr ? parseInt(cookTimeMinStr as string) : undefined;
        const servings = servingsStr ? parseInt(servingsStr as string) : undefined;
        
        const instructions = instructionsStr ? JSON.parse(instructionsStr as string) : [];
        const tags = tagsStr ? JSON.parse(tagsStr as string) : [];
        const rawIngredients = rawIngredientsStr ? JSON.parse(rawIngredientsStr as string) : [];

        const imagePath = req.file ? req.file.path : undefined;

        // Basic validation 
        if (!name || !description || instructions.length === 0 || rawIngredients.length === 0 || prepTimeMin === undefined || cookTimeMin === undefined || servings === undefined) {
            return res.status(400).json({ message: 'Missing required recipe fields: name, description, instructions, ingredients, prepTimeMin, cookTimeMin, and servings are required.' });
        }
        
        if (typeof prepTimeMin !== 'number' || prepTimeMin < 0) {
             return res.status(400).json({ message: 'prepTimeMin must be a non-negative number.' });
        }
        if (typeof cookTimeMin !== 'number' || cookTimeMin < 0) {
            return res.status(400).json({ message: 'cookTimeMin must be a non-negative number.' });
        }
        if (typeof servings !== 'number' || servings <= 0) {
            return res.status(400).json({ message: 'servings must be positive number.' });
        }



        // Step 1: Process Raw Ingredients and Create Embedded IRecipeIngredient objects ---
        const embeddedRecipeIngredients: IRecipeIngredient[] = [];

        for (const item of rawIngredients) {
            const { ingredient: ingredientName, amount, unit } = item;

            if (!ingredientName || typeof ingredientName !== 'string' || !amount || typeof amount !== 'number' || !unit || typeof unit !== 'string') {
                console.warn(`Invalid ingredient format received: ${JSON.stringify(item)}. Skipping.`);
                continue;
            }

            const ALLOWED_UNITS = ['gram','kilogram','milliliter','liter','teaspoon(s)','tablespoon(s)','piece(s)','slice(s)'];

            if (!ALLOWED_UNITS.includes(unit)) {
                return res.status(400).json({ message: `Invalid unit provided: "${unit}". Allowed units are: ${ALLOWED_UNITS.join(', ')}.` });
            }


            //Checks if ingredient exists, if not create it
            let ingredientDoc = await Ingredient.findOne({ name: ingredientName.toLowerCase() });
            if (!ingredientDoc) {
                ingredientDoc = await Ingredient.create({ name: ingredientName.toLowerCase() });
                console.log(`Created new master ingredient: ${ingredientDoc.name} with ID: ${ingredientDoc._id}`);
            }

            const embeddedIngredient: IRecipeIngredient = {
                ingredient: ingredientDoc._id,
                amount,
                unit
            } as IRecipeIngredient;

            embeddedRecipeIngredients.push(embeddedIngredient);
        }

        if (embeddedRecipeIngredients.length === 0) {
            return res.status(400).json({ message: 'No valid ingredients provided for the recipe after processing.' });
        }




        //Step 2: Calculates Nutrition Data for each ingredient
        const { nutritionTotals, unmatchedIngredients } = await calculateNutrition(embeddedRecipeIngredients);
        console.log('Calculated Nutrition Details:', nutritionTotals);

        // --- Round nutrition details before saving ---
        const roundedNutritionDetails = roundNutrition(nutritionTotals);

        // Step 3: Generates embedding for the recipe for the AI Chatbot
        console.log('🧠 Generating embedding for recipe...');
        let embedding: number[] = [];
        try {
            embedding = await generateRecipeEmbedding({
                name,
                description,
                instructions,
                tags: tags || [],
                ingredients: embeddedRecipeIngredients,
                cuisine,
                difficulty,
                prepTimeMin,
                cookTimeMin,
                servings
            });
            console.log('✅ Embedding generated successfully');
        } catch (embeddingError: any) {
            console.warn('⚠️ Failed to generate embedding:', embeddingError.message);
            // Continue with recipe creation even if embedding fails -> May lead to not finding the recipe in the AI Chatbot, but creating the recipe was prioritzed"
        }

        // Step 4: Creates Recipe document
        const newRecipeData = {
            name,
            description,
            prepTimeMin,
            cookTimeMin: cookTimeMin,
            servings: servings,
            difficulty: difficulty || undefined,
            cuisine: cuisine || undefined,
            image: imagePath,
            instructions,
            tags: tags || [],
            author: authorId,
            ingredients: embeddedRecipeIngredients,
            embedding: embedding.length > 0 ? embedding : undefined, // Only add embedding if generation was successful
            ...roundedNutritionDetails
        };

        const newRecipe = new Recipe(newRecipeData);
        await newRecipe.save();

        if (Array.isArray(tags) && tags.length > 0) {
        await Promise.all(
            tags.map(tagName =>
            Tag.findOneAndUpdate(
                { name: tagName },
                { $inc: { count: 1 } },
                { upsert: true /* create if not exists */, new: true }
            )
            )
        );
        }
        // --- Step 5: Populate ingredients for the response after saving ---
        // CRUCIAL: Populate author for the response to the frontend
        const populatedRecipe = await Recipe.findById(newRecipe._id)
            .populate('ingredients.ingredient')
            .populate('author', 'username firstName lastName'); // CRUCIAL: Populate author here too
        
        // Prepare response with totalRatings
        const responseRecipe = populatedRecipe ? (populatedRecipe.toObject() as any) : null;
        if (responseRecipe && Array.isArray(responseRecipe.ratings)) {
            responseRecipe.totalRatings = responseRecipe.ratings.length;
            res.status(201).json({ ...responseRecipe, unmatchedIngredients });
        } else if (responseRecipe) {
            responseRecipe.totalRatings = 0;
            res.status(201).json({ ...responseRecipe, unmatchedIngredients });
        } else {
            res.status(500).json({ message: 'Failed to create recipe', error: 'Recipe not found after creation.' });
        }
    } catch (error: any) {
        console.error('Error creating recipe:', error);

        if (error.name === 'ValidationError') {
            const errors: { [key: string]: string } = {};
            for (let field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ message: 'Recipe validation failed', errors });
        }
        
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Duplicate entry detected', fields: error.keyValue });
        }

        if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
            return res.status(400).json({ message: `Invalid ID format for field: ${error.path}. Check if author or other ID fields are correctly formatted.` });
        }

        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const getRecipeById = async (req: Request, res: Response) => {
    try {
        const recipeId = req.params.id;
       
        // Find the recipe and populate its references
        const recipe = await Recipe.findById(recipeId)
            .populate('ingredients.ingredient') // Correct for embedded documents
            .populate('author', 'username firstName lastName'); // CRUCIAL: Populate author details

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Check if averageRating needs to be recalculated
        if (recipe.averageRating === 0 && recipe.ratings && recipe.ratings.length > 0) {
            await recalculateAverageRating(recipeId);
            // Fetch the updated recipe
            const updatedRecipe = await Recipe.findById(recipeId)
                .populate('ingredients.ingredient')
                .populate('author', 'username firstName lastName');
            if (updatedRecipe) {
                const responseRecipe = updatedRecipe.toObject() as any;
                responseRecipe.totalRatings = Array.isArray(responseRecipe.ratings) ? responseRecipe.ratings.length : 0;
                res.status(200).json(responseRecipe);
                return;
            } else {
                return res.status(500).json({ message: 'Recipe not found after updating average rating.' });
            }
        }

        // Prepare response with totalRatings
        const responseRecipe = recipe ? (recipe.toObject() as any) : null;
        if (responseRecipe && Array.isArray(responseRecipe.ratings)) {
            responseRecipe.totalRatings = responseRecipe.ratings.length;
            res.status(200).json(responseRecipe);
        } else if (responseRecipe) {
            responseRecipe.totalRatings = 0;
            res.status(200).json(responseRecipe);
        } else {
            res.status(500).json({ message: 'Recipe not found after fetching.' });
        }
    } catch (error: any) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Recipe ID format.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Controller function to get all recipes
export const getAllRecipes = async (req: Request, res: Response) => {
    try {
        // Fetch only public recipes and populate necessary fields
        const recipes = await Recipe.find({ isPublic: true })
            .populate('ingredients.ingredient') // Correct for embedded documents
            .populate('author', 'username firstName lastName'); // CRUCIAL: Populate author details

        // Process each recipe to ensure average ratings are correct
        const processedRecipes = await Promise.all(recipes.map(async (recipe) => {
            // Check if averageRating needs to be recalculated
            if (recipe.averageRating === 0 && recipe.ratings && recipe.ratings.length > 0) {
                await recalculateAverageRating((recipe._id as any)?.toString() || '');
                // Fetch the updated recipe
                const updatedRecipe = await Recipe.findById(recipe._id)
                    .populate('ingredients.ingredient')
                    .populate('author', 'username firstName lastName');
                return updatedRecipe || recipe;
            }
            return recipe;
        }));

        // Prepare response with totalRatings for each recipe
        const responseRecipes = processedRecipes.map(recipe => {
            if (!recipe) return null;
            const obj = recipe.toObject() as any;
            obj.totalRatings = Array.isArray(obj.ratings) ? obj.ratings.length : 0;
            return obj;
        }).filter(Boolean);
        res.status(200).json(responseRecipes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Controller function to update a recipe
export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const recipeId = req.params.id;
        const updateData = req.body;

        // Parse numerical fields from string to number for update
        if (updateData.prepTimeMin) updateData.prepTimeMin = parseInt(updateData.prepTimeMin as string);
        if (updateData.cookTimeMin) updateData.cookTimeMin = parseInt(updateData.cookTimeMin as string);
        if (updateData.servings) updateData.servings = parseInt(updateData.servings as string);

        // Parse array fields from JSON string
        if (updateData.instructions) updateData.instructions = JSON.parse(updateData.instructions as string);
        if (updateData.tags) updateData.tags = JSON.parse(updateData.tags as string);
        
        // Re-process ingredients if they are part of the update
        let unmatchedIngredients: string[] = [];
        if (updateData.ingredients) {
            const parsedIngredients = JSON.parse(updateData.ingredients as string);
            const embeddedRecipeIngredients: IRecipeIngredient[] = [];
            for (const item of parsedIngredients) {
                const { ingredient: ingredientName, amount, unit } = item;
                if (!ingredientName || typeof ingredientName !== 'string' || !amount || typeof amount !== 'number' || !unit || typeof unit !== 'string') {
                    console.warn(`Invalid ingredient format received during update: ${JSON.stringify(item)}. Skipping.`);
                    continue;
                }
                let ingredientDoc = await Ingredient.findOne({ name: ingredientName.toLowerCase() });
                if (!ingredientDoc) {
                    ingredientDoc = await Ingredient.create({ name: ingredientName.toLowerCase() });
                }
                embeddedRecipeIngredients.push({
                    ingredient: ingredientDoc._id,
                    amount: amount, 
                    unit
                } as IRecipeIngredient);
            }
            updateData.ingredients = embeddedRecipeIngredients;
            // Recalculate nutrition if ingredients changed as part of the update
            const { nutritionTotals, unmatchedIngredients: unmatched } = await calculateNutrition(embeddedRecipeIngredients);
            unmatchedIngredients = unmatched;
            // Round the recalculated nutrition details
            const roundedNutritionDetails = roundNutrition(nutritionTotals);
            // Merge the new rounded nutrition details into the updateData object
            Object.assign(updateData, roundedNutritionDetails);
        }

        // Generate new embedding if any content has changed
        const hasContentChange = updateData.name || updateData.description || updateData.instructions || 
                                updateData.tags || updateData.ingredients || updateData.cuisine || updateData.difficulty;
        
        if (hasContentChange) {
            try {
                console.log('🧠 Regenerating embedding for updated recipe...');
                
                // Get existing recipe data to fill in missing fields
                const existingRecipe = await Recipe.findById(recipeId);
                if (existingRecipe) {
                    const embedding = await generateRecipeEmbedding({
                        name: updateData.name || existingRecipe.name,
                        description: updateData.description || existingRecipe.description,
                        instructions: updateData.instructions || existingRecipe.instructions,
                        tags: updateData.tags || existingRecipe.tags,
                        ingredients: updateData.ingredients || existingRecipe.ingredients,
                        cuisine: updateData.cuisine || existingRecipe.cuisine,
                        difficulty: updateData.difficulty || existingRecipe.difficulty,
                        prepTimeMin: updateData.prepTimeMin || existingRecipe.prepTimeMin,
                        cookTimeMin: updateData.cookTimeMin || existingRecipe.cookTimeMin,
                        servings: updateData.servings || existingRecipe.servings
                    });
                    updateData.embedding = embedding;
                    console.log('✅ Embedding regenerated successfully');
                }
            } catch (embeddingError: any) {
                console.warn('⚠️ Failed to regenerate embedding:', embeddingError.message);
                // Continue with recipe update even if embedding fails
            } 
        }

        // Handle image upload for updates
        if (req.file) {
            updateData.image = req.file.path;
        } else if (req.body.image === '') {
            updateData.image = undefined; 
        } else if (req.body.image === undefined) {
             delete updateData.image;
        }

        const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, updateData, { new: true, runValidators: true })
            .populate('ingredients.ingredient')
            .populate('author', 'username firstName lastName'); 

        if (!updatedRecipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Prepare response with totalRatings
        const responseRecipe = updatedRecipe.toObject();
        (responseRecipe as any).totalRatings = Array.isArray(responseRecipe.ratings) ? responseRecipe.ratings.length : 0;
        res.status(200).json({ ...responseRecipe, unmatchedIngredients });
    } catch (error: any) {
        console.error('Error updating recipe:', error);

        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID format for field: ${error.path}. Check if author or other ID fields are correctly formatted.' });
        }
        if (error.name === 'ValidationError') {
            const errors: { [key: string]: string } = {};
            for (let field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ message: 'Recipe validation failed', errors });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Controller function to delete a recipe
export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const recipeId = req.params.id;
        const deletedRecipe = await Recipe.findByIdAndUpdate(recipeId, { isPublic: false, embedding: [] });

        if (!deletedRecipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        
        console.log(`Unpublished recipe ${recipeId}`);
            
        res.status(200).json({ 
            message: 'Recipe deleted successfully',
            deletedRecipe:deletedRecipe
        });
    } catch (error: any) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        res.status(500).json({ message: error.message });
    }
};



// Add a recipe to user's favorites
export const addFavoriteRecipe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const recipeId = req.params.recipeId;
        
        if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
        
        // Check if recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found.' });
        }
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        if (!user.favorites) user.favorites = [];
        
        if (user.favorites.includes(recipeId)) {
            return res.status(400).json({ message: 'Recipe already in favorites.' });
        }
        
        user.favorites.push(recipeId);
        await user.save();
        res.status(200).json({ message: 'Recipe added to favorites.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Remove a recipe from user's favorites
export const deleteFavoriteRecipe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const recipeId = req.params.recipeId;
        if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.favorites = (user.favorites || []).filter((fav: any) => fav.toString() !== recipeId);
        await user.save();
        res.status(200).json({ message: 'Recipe removed from favorites.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get all favorite recipes for a user - i think not used
export const getFavoriteRecipes = async (req: Request, res: Response) => {
    try {
        console.log('[FAVORITES] Controller entered');
        const userId = req.user?.id;
        console.log('[FAVORITES] Requested by userId:', userId);
        if (!userId) {
            console.warn('[FAVORITES] No userId found on request.');
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const user = await User.findById(userId);
        console.log('[FAVORITES] User object:', user);
        if (!user) {
            console.warn('[FAVORITES] User not found for id:', userId);
            return res.status(404).json({ message: 'User not found.' });
        }
        console.log('[FAVORITES] Raw favorites array:', user.favorites);

        // Filter out invalid ObjectIds
        const validFavorites = (user.favorites || []).filter((fav: any) => {
            const valid = mongoose.Types.ObjectId.isValid(fav);
            if (!valid) console.warn('[FAVORITES] Invalid ObjectId in favorites:', fav);
            return valid;
        });
        console.log('[FAVORITES] Valid favorites array:', validFavorites);

        // Fetch only recipes that exist and are valid
        const recipes = await Recipe.find({ _id: { $in: validFavorites } })
            .populate('author', 'username firstName lastName')
            .populate('ingredients.ingredient');

        console.log('[FAVORITES] Populated favorite recipes:', recipes);

        res.status(200).json(recipes);
    } catch (error: any) {
        console.error('[FAVORITES] Error in getFavoriteRecipes:', error.stack || error);
        res.status(500).json({ message: error.message });
    }
};

//I THINK NOT USED
export const getRecipesByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    // QUERY THE FLAT FIELD
    const recipes = await Recipe.find({ author: userId, isPublic: true });
    return res.json(recipes);
  } catch (err: any) {
    console.error('Error in getRecipesByUser:', err);
    return res.status(500).send('Server Error');
  }
};
export const getRecipeCount = async (req: Request, res: Response) => {
    try {
        const count = await Recipe.countDocuments({isPublic: true});
        res.status(200).json({ count });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new controller for rating a recipe
export const rateRecipe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { recipeId, value } = req.body;
        if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
        if (!recipeId || typeof value !== 'number' || value < 1 || value > 5) {
            return res.status(400).json({ message: 'Invalid recipeId or rating value (must be 1-5).' });
        }
        // Use updateOne to avoid updating updatedAt
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found.' });

        // Remove any existing rating by this user
        let ratings = (recipe.ratings || []).filter((r: any) => r.user.toString() !== userId);

        ratings.push({ user: new mongoose.Types.ObjectId(userId), value });
        // Recalculate average
        const sum = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
        const averageRating = ratings.length > 0 ? sum / ratings.length : 0;

        // Update only ratings and averageRating, without updating updatedAt
        await Recipe.updateOne(
            { _id: recipeId },
            { $set: { ratings, averageRating } },
            { timestamps: false }
        );

        res.status(200).json({ averageRating, ratings });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to recalculate average rating for a recipe
const recalculateAverageRating = async (recipeId: string) => {
    try {
        const recipe = await Recipe.findById(recipeId);
        if (!recipe || !recipe.ratings || recipe.ratings.length === 0) {
            return 0;
        }
        
        const sum = recipe.ratings.reduce((acc: number, r: any) => acc + r.value, 0);
        const averageRating = sum / recipe.ratings.length;
        
        // Update the average rating in the database
        await Recipe.updateOne(
            { _id: recipeId },
            { $set: { averageRating } },
            { timestamps: false }
        );
        
        return averageRating;
    } catch (error) {
        console.error('Error recalculating average rating:', error);
        return 0;
    }
};





//Helper functions
// Helper function to round nutrition values to the nearest integer
const roundNutrition = (data: any) => {
    // We create a copy to avoid directly modifying the Mongoose document that might still be in use
    const roundedData = { ...data }; 
    // Check if the property exists and is a number before rounding
    if (typeof roundedData.calories === 'number') roundedData.calories = Math.round(roundedData.calories);
    if (typeof roundedData.protein_g === 'number') roundedData.protein_g = Math.round(roundedData.protein_g);
    if (typeof roundedData.totalFat_g === 'number') roundedData.totalFat_g = Math.round(roundedData.totalFat_g);
    if (typeof roundedData.saturatedFat_g === 'number') roundedData.saturatedFat_g = Math.round(roundedData.saturatedFat_g);
    if (typeof roundedData.cholesterol_mg === 'number') roundedData.cholesterol_mg = Math.round(roundedData.cholesterol_mg);
    if (typeof roundedData.sodium_mg === 'number') roundedData.sodium_mg = Math.round(roundedData.sodium_mg);
    if (typeof roundedData.carbohydrates_g === 'number') roundedData.carbohydrates_g = Math.round(roundedData.carbohydrates_g);
    if (typeof roundedData.fiber_g === 'number') roundedData.fiber_g = Math.round(roundedData.fiber_g);
    if (typeof roundedData.sugars_g === 'number') roundedData.sugars_g = Math.round(roundedData.sugars_g);
    return roundedData;
};







