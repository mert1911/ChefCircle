
export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime?: string;
  servings: number;
  difficulty?: string;
  cuisine?: string;
  similarity: number;
  
  // Nutrition information
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  
  // Recipe details
  ingredients: string[];
  instructions: string[];
  
  // Additional info
  tags: string[];
  author: string;
  image?: string;
}

export interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  recipes?: Recipe[];
  hasRecipes?: boolean;
  suggestedRecipeIds?: string[]; // New: Track recipe IDs suggested in this message
  isFollowUp?: boolean; // New: Flag to indicate this was a follow-up request
}
