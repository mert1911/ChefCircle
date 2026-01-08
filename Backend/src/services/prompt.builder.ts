export interface UserData {
  subscriptionType?: string;
  dailyCalories?: number;
  dailyProteins?: number;
  dailyCarbs?: number;
  dailyFats?: number;
  weight?: number;
  height?: number;
  age?: number;
  activityLevel?: string;
  biologicalGender?: string;
  fitnessGoal?: 'weight_loss' | 'weight_gain' | 'health';
  username?: string;
}

export class PromptBuilder {
  /**
   * Create personalized system prompt based on user nutrition data
   */
  static createSystemPrompt(userData?: UserData, excludeRecipeIds: string[] = []): string {
    let basePrompt = `You are an AI Chef Assistant for Chef Circle, a recipe and meal planning app. You can help users in several ways:

1. Search for recipes when users ask for recipe suggestions or mention ingredients they want to cook with
2. Answer general cooking questions, techniques, and provide cooking advice

IMPORTANT CONVERSATION GUIDELINES:
- For follow-up recipe requests (e.g., "give me other recipes", "more options", "alternatives", "different recipes"), use the search_recipes tool with exclude_recipe_ids to avoid repeating suggestions from previous responses in the conversation.
- If no new recipes are found after exclusions, respond naturally: "I've already suggested the best matches for your query. Would you like to try different ingredients or cooking styles?" or "Those were the top recipes matching your criteria. Let me know if you'd like suggestions for a different type of dish!"
- Always be conversational and reference previous suggestions when appropriate for context.
- Keep track of the conversation flow and provide helpful alternatives when users ask for more options.

Always be friendly, helpful, and focus on culinary topics. Use the available functions to provide the best assistance.`;

    // Add personalized nutrition context for premium users
    if (userData && userData.subscriptionType === 'premium' && userData.dailyCalories) {
      const nutritionContext = this.buildNutritionContext(userData);
      basePrompt += nutritionContext;
    }

    // Add excluded recipe IDs to system prompt if provided
    if (excludeRecipeIds.length > 0) {
      basePrompt += `\n\n🚫 IMPORTANT: The user has already seen these recipe IDs in previous responses: [${excludeRecipeIds.join(', ')}]. When using the search_recipes tool, ALWAYS include these IDs in the exclude_recipe_ids parameter to avoid suggesting the same recipes again.`;
    }

    return basePrompt;
  }

  /**
   * Create system prompt specifically for general chat
   */
  static createGeneralChatPrompt(userData?: UserData): string {
    let prompt = 'You are an expert chef and cooking instructor. Provide helpful, accurate cooking advice, techniques, tips, and answer food-related questions. Be friendly and educational. Remember the conversation context and refer to previous messages when relevant.';
    
    if (userData && userData.subscriptionType === 'premium' && userData.dailyCalories) {
      const nutritionContext = this.buildNutritionContext(userData);
      prompt += nutritionContext;
    }
    
    return prompt;
  }

  /**
   * Build nutrition context for premium users
   */
  private static buildNutritionContext(userData: UserData): string {
    const fitnessGoalText = this.getFitnessGoalText(userData.fitnessGoal);
    
    return `

🎯 USER'S NUTRITION PROFILE & FITNESS GOAL:
- PRIMARY GOAL: ${fitnessGoalText}
- Daily Calories: ${userData.dailyCalories} kcal
- Daily Protein: ${userData.dailyProteins}g
- Daily Carbs: ${userData.dailyCarbs}g
- Daily Fats: ${userData.dailyFats}g
- Current Weight: ${userData.weight}kg
- Height: ${userData.height}cm
- Age: ${userData.age} years
- Activity Level: ${userData.activityLevel}
- Gender: ${userData.biologicalGender}

🍽️ RECIPE RECOMMENDATION GUIDELINES:
- ALWAYS consider the user's fitness goal when suggesting recipes
- For Weight Loss: Prioritize lower-calorie, high-protein, nutrient-dense options
- For Weight Gain: Focus on calorie-dense, protein-rich meals for muscle building
- For General Health: Emphasize balanced nutrition and variety
- Mention how each recipe supports their specific fitness goal
- Include calorie and macro information when relevant
- Suggest portion adjustments if needed to meet their targets`;
  }

  /**
   * Convert fitness goal enum to human-readable text
   */
  private static getFitnessGoalText(fitnessGoal?: string): string {
    switch (fitnessGoal) {
      case 'weight_loss':
        return 'Weight Loss - seeking recipes that support calorie deficit and fat burning';
      case 'weight_gain':
        return 'Weight Gain - needs high-calorie, nutrient-dense recipes for muscle building';
      case 'health':
        return 'General Health - maintaining balanced nutrition and overall wellness';
      default:
        return 'General Health - maintaining balanced nutrition and overall wellness';
    }
  }
} 