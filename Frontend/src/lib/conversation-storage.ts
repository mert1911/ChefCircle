import { ChatMessage } from '@/types/chatbot';

// Keys for localStorage
const CONVERSATION_MESSAGES_KEY = 'chefcircle_conversation_messages';
const SUGGESTED_RECIPE_IDS_KEY = 'chefcircle_suggested_recipe_ids';

// Interface for stored conversation data
interface ConversationData {
  messages: ChatMessage[];
  suggestedRecipeIds: string[];
  lastUpdated: number;
}

/**
 * Get user-specific localStorage key
 */
const getUserKey = (baseKey: string, userId: string): string => {
  return `${baseKey}_${userId}`;
};

/**
 * Save conversation messages to localStorage
 */
export const saveConversationMessages = (userId: string, messages: ChatMessage[]): void => {
  try {
    const key = getUserKey(CONVERSATION_MESSAGES_KEY, userId);
    localStorage.setItem(key, JSON.stringify(messages));
    console.log(`💾 Saved ${messages.length} conversation messages for user ${userId}`);
  } catch (error) {
    console.error('Error saving conversation messages:', error);
  }
};

/**
 * Load conversation messages from localStorage
 */
export const loadConversationMessages = (userId: string): ChatMessage[] => {
  try {
    const key = getUserKey(CONVERSATION_MESSAGES_KEY, userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const messages = JSON.parse(stored) as ChatMessage[];
      console.log(`📂 Loaded ${messages.length} conversation messages for user ${userId}`);
      return messages;
    }
  } catch (error) {
    console.error('Error loading conversation messages:', error);
  }
  return [];
};

/**
 * Save suggested recipe IDs to localStorage
 */
export const saveSuggestedRecipeIds = (userId: string, recipeIds: string[]): void => {
  try {
    const key = getUserKey(SUGGESTED_RECIPE_IDS_KEY, userId);
    localStorage.setItem(key, JSON.stringify(recipeIds));
    console.log(`💾 Saved ${recipeIds.length} suggested recipe IDs for user ${userId}`);
  } catch (error) {
    console.error('Error saving suggested recipe IDs:', error);
  }
};

/**
 * Load suggested recipe IDs from localStorage
 */
export const loadSuggestedRecipeIds = (userId: string): string[] => {
  try {
    const key = getUserKey(SUGGESTED_RECIPE_IDS_KEY, userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const recipeIds = JSON.parse(stored) as string[];
      console.log(`📂 Loaded ${recipeIds.length} suggested recipe IDs for user ${userId}`);
      return recipeIds;
    }
  } catch (error) {
    console.error('Error loading suggested recipe IDs:', error);
  }
  return [];
};

/**
 * Save complete conversation data
 */
export const saveConversationData = (userId: string, messages: ChatMessage[], suggestedRecipeIds: string[]): void => {
  saveConversationMessages(userId, messages);
  saveSuggestedRecipeIds(userId, suggestedRecipeIds);
};

/**
 * Load complete conversation data
 */
export const loadConversationData = (userId: string): { messages: ChatMessage[], suggestedRecipeIds: string[] } => {
  return {
    messages: loadConversationMessages(userId),
    suggestedRecipeIds: loadSuggestedRecipeIds(userId)
  };
};

/**
 * Clear all conversation data for a specific user
 */
export const clearConversationData = (userId: string): void => {
  try {
    const messagesKey = getUserKey(CONVERSATION_MESSAGES_KEY, userId);
    const recipeIdsKey = getUserKey(SUGGESTED_RECIPE_IDS_KEY, userId);
    
    localStorage.removeItem(messagesKey);
    localStorage.removeItem(recipeIdsKey);
    
    console.log(`🗑️ Cleared conversation data for user ${userId}`);
  } catch (error) {
    console.error('Error clearing conversation data:', error);
  }
};

/**
 * Clear all conversation data for all users (for complete cleanup)
 */
export const clearAllConversationData = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const conversationKeys = keys.filter(key => 
      key.startsWith(CONVERSATION_MESSAGES_KEY) || 
      key.startsWith(SUGGESTED_RECIPE_IDS_KEY)
    );
    
    conversationKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`🗑️ Cleared all conversation data (${conversationKeys.length} keys)`);
  } catch (error) {
    console.error('Error clearing all conversation data:', error);
  }
};

/**
 * Check if conversation data exists for a user
 */
export const hasConversationData = (userId: string): boolean => {
  try {
    const messagesKey = getUserKey(CONVERSATION_MESSAGES_KEY, userId);
    const recipeIdsKey = getUserKey(SUGGESTED_RECIPE_IDS_KEY, userId);
    
    return localStorage.getItem(messagesKey) !== null || localStorage.getItem(recipeIdsKey) !== null;
  } catch (error) {
    console.error('Error checking conversation data:', error);
    return false;
  }
}; 