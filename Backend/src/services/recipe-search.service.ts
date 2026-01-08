import { Recipe } from '../models';
import { generateEmbedding } from './embedding.service';
import { KNNSearch } from './knn.service';

// Interface for recipe search result
export interface RecipeSearchResult {
  recipe: any;
  similarity: number;
}

/**
 * Search for recipes based on semantic similarity to a query using k-NN
 * @param query User's search query (e.g., "pasta with tomatoes and cheese")
 * @param limit Maximum number of results to return
 * @param minSimilarity Minimum similarity threshold (0-1)
 * @param excludeIds Optional array of recipe IDs to exclude from results
 * @returns Array of recipes with similarity scores
 */
export const searchRecipesByQuery = async (
  query: string,
  limit: number = 3,
  minSimilarity: number = 0.6,
  excludeIds: string[] = []
): Promise<RecipeSearchResult[]> => {
  try {
    console.log(`🔍 Searching recipes for query: "${query}" using k-NN`);
    if (excludeIds.length > 0) {
      console.log(`🚫 Excluding ${excludeIds.length} previously suggested recipes`);
    }
    
    // Step 1: Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    console.log(`📊 Query embedding generated (${queryEmbedding.length} dimensions)`);
    
    // Step 2: Get all recipes that have embeddings
    const recipesWithEmbeddings = await Recipe.find({
      embedding: { $exists: true, $ne: [] }
    })
    .populate('ingredients.ingredient', 'name')
    .populate('author', 'username firstName lastName')
    .lean(); // Use lean() for better performance since we're just reading
    
    console.log(`📚 Found ${recipesWithEmbeddings.length} recipes with embeddings`);
    
    if (recipesWithEmbeddings.length === 0) {
      console.log('⚠️ No recipes with embeddings found');
      return [];
    }
    
    // Step 3: Initialize k-NN Search
    const knn = new KNNSearch<any>(limit, 'cosine');
    
    // Add recipes to k-NN index
    recipesWithEmbeddings.forEach(recipe => {
      if (recipe.embedding && recipe.embedding.length > 0) {
        knn.addItem(recipe, recipe.embedding, (recipe as any)._id.toString());
      }
    });
    
    // Step 4: Perform k-NN search
    const results = knn.search(queryEmbedding, excludeIds);
    
    // Step 5: Filter by minimum similarity
    const searchResults: RecipeSearchResult[] = results
      .filter(result => result.score >= minSimilarity)
      .map(result => ({
        recipe: result.item,
        similarity: result.score
      }));
    
    console.log(`✅ Found ${searchResults.length} similar recipes (excluded ${excludeIds.length})`);
    
    // Log top results for debugging
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. "${result.recipe.name}" (similarity: ${result.similarity.toFixed(3)})`);
    });
    
    return searchResults;
    
  } catch (error: any) {
    console.error('❌ Error in recipe search:', error);
    throw new Error(`Recipe search failed: ${error.message}`);
  }
};

/**
 * Search for recipes based on specific ingredients
 * @param ingredients Array of ingredient names
 * @param limit Maximum number of results to return
 * @param minSimilarity Minimum similarity threshold
 * @param excludeIds Optional array of recipe IDs to exclude from results
 * @returns Array of recipes with similarity scores
 */
export const searchRecipesByIngredients = async (
  ingredients: string[],
  limit: number = 3,
  minSimilarity: number = 0.3,
  excludeIds: string[] = []
): Promise<RecipeSearchResult[]> => {
  // Create a search query from ingredients
  const query = `recipe with ${ingredients.join(', ')}`;
  return searchRecipesByQuery(query, limit, minSimilarity, excludeIds);
};

/**
 * Format individual recipe for frontend display
 * @param recipe Recipe object from database
 * @param similarity Similarity score
 * @returns Formatted recipe object for frontend
 */
export const formatRecipeForFrontend = (recipe: any, similarity: number) => {
  // Format ingredients list
  const ingredientsList = recipe.ingredients?.map((ing: any) => {
    const ingredientName = ing.ingredient?.name || 'ingredient';
    return `${ing.amount} ${ing.unit} ${ingredientName}`;
  }) || [];

  return {
    id: recipe._id.toString(),
    title: recipe.name,
    description: recipe.description,
    prepTime: `${recipe.prepTimeMin} min`,
    cookTime: recipe.cookTimeMin ? `${recipe.cookTimeMin} min` : null,
    servings: recipe.servings || 1,
    difficulty: recipe.difficulty,
    cuisine: recipe.cuisine,
    similarity: Math.round(similarity * 100),
    
    // Nutrition information - using correct database field names
    calories: Math.round(recipe.calories || 0),
    protein: `${Math.round(recipe.protein_g || 0)}g`,
    carbs: `${Math.round(recipe.carbohydrates_g || 0)}g`,
    fat: `${Math.round(recipe.totalFat_g || 0)}g`,
    
    // Recipe details
    ingredients: ingredientsList,
    instructions: recipe.instructions || [],
    
    // Additional info
    tags: recipe.tags || [],
    author: recipe.author?.username || 'Unknown Chef',
    image: recipe.image || null
  };
};

/**
 * Format recipe search results for chatbot response
 * @param results Array of recipe search results
 * @param userData Optional user data for personalized recommendations
 * @returns Object with text response and structured recipe data
 */
export const formatRecipeSearchResults = (results: RecipeSearchResult[], userData?: any): {
  textResponse: string;
  recipes: any[];
  hasRecipes: boolean;
} => {
  if (results.length === 0) {
    return {
      textResponse: "I couldn't find any recipes matching your search. Try describing different ingredients or cooking methods!",
      recipes: [],
      hasRecipes: false
    };
  }

  // Format recipes for frontend display
  const formattedRecipes = results.map(result => 
    formatRecipeForFrontend(result.recipe, result.similarity)
  );

  // Create base text response
  const count = results.length;
  let textResponse = `Great! I found ${count} recipe${count > 1 ? 's' : ''} that match your request. Here ${count > 1 ? 'are your top options' : 'is a perfect option'} based on your ingredients and preferences:`;

  // Add personalized advice based on user's fitness goal
  if (userData && userData.fitnessGoal && formattedRecipes.length > 0) {
    const personalizedAdvice = generatePersonalizedAdvice(formattedRecipes, userData);
    if (personalizedAdvice) {
      textResponse += `\n\n${personalizedAdvice}`;
    }
  }

  return {
    textResponse,
    recipes: formattedRecipes,
    hasRecipes: true
  };
};

/**
 * Generate personalized recipe advice based on user's fitness goal
 */
const generatePersonalizedAdvice = (recipes: any[], userData: any): string => {
  if (!recipes.length || !userData.fitnessGoal) return '';

  const topRecipe = recipes[0]; // Highest similarity recipe
  const goalText = getGoalSpecificAdvice(userData.fitnessGoal);
  
  // Analyze the top recipe for the user's goal
  let advice = `🎯 Based on your ${getFitnessGoalDisplayText(userData.fitnessGoal)} goal, I'd especially recommend "${topRecipe.title}".`;
  
  // Add goal-specific reasoning
  if (userData.fitnessGoal === 'weight_loss') {
    advice += ` At ${topRecipe.calories} calories per serving, it fits well within a calorie deficit while providing ${topRecipe.protein} of protein to help maintain muscle mass.`;
  } else if (userData.fitnessGoal === 'weight_gain') {
    advice += ` With ${topRecipe.calories} calories and ${topRecipe.protein} of protein per serving, it's perfect for supporting your muscle-building goals.`;
  } else { // health
    advice += ` It offers a balanced ${topRecipe.calories} calories with ${topRecipe.protein} of protein, making it ideal for maintaining overall health.`;
  }

  return advice;
};

/**
 * Get fitness goal display text
 */
const getFitnessGoalDisplayText = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight_loss': return 'weight loss';
    case 'weight_gain': return 'weight gain';
    case 'health': return 'general health';
    default: return 'fitness';
  }
};

/**
 * Get goal-specific advice text
 */
const getGoalSpecificAdvice = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight_loss':
      return 'For weight loss, focus on recipes with higher protein and lower calories to maintain satiety while in a calorie deficit.';
    case 'weight_gain':
      return 'For weight gain, prioritize calorie-dense recipes with good protein content to support muscle growth.';
    case 'health':
      return 'For general health, aim for balanced recipes with good macro distribution and nutrient variety.';
    default:
      return '';
  }
}; 