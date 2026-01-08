import { Request, Response } from 'express';
import { ChatbotService, ChatbotRequest } from '../services/chatbot.service';
import { ChatbotValidator } from '../validation/chatbot.validation';
import { ResponseFormatter } from '../utils/response.formatter';
import { OPENAI_API_KEY } from '../config';
import User from '../models/User';
import { UserData } from '../services/prompt.builder';

// Initialize the chatbot service
const chatbotService = new ChatbotService();

export const sendChatMessage = async (req: Request, res: Response) => {
  console.log('🚨 CHATBOT CONTROLLER CALLED!!!');
  
  try {
    // Step 1: Validate request
    const validation = ChatbotValidator.validateChatRequest(req.body);
    if (!validation.isValid) {
      return ResponseFormatter.sendValidationError(res, validation.error!);
    }

    // Step 2: Validate OpenAI configuration
    const configValidation = ChatbotValidator.validateOpenAIConfig(OPENAI_API_KEY);
    if (!configValidation.isValid) {
      return ResponseFormatter.sendError(res, configValidation.statusCode!, configValidation.error!);
    }

    // Step 3: Extract and log request data
    const { message, conversationHistory = [], excludeRecipeIds = [] } = req.body;
    console.log('📝 Request body:', { 
      message, 
      historyLength: conversationHistory.length, 
      excludeRecipeIds: excludeRecipeIds.length 
    });

    // Step 4: Fetch user data for personalization
    const userData = await fetchUserData(req.user?.id);

    // Step 5: Build chatbot request
    const chatbotRequest: ChatbotRequest = {
      message,
      conversationHistory,
      excludeRecipeIds,
      userData
    };

    // Step 6: Process with chatbot service
    const result = await chatbotService.processMessage(chatbotRequest);

    // Step 7: Handle different response types
    if (result.intent === 'search_recipes' && result.recipes) {
      return ResponseFormatter.sendRecipeSearchResponse(res, {
        response: result.response,
        recipes: result.recipes,
        hasRecipes: result.hasRecipes!,
        suggestedRecipeIds: result.suggestedRecipeIds!,
        isFollowUp: result.isFollowUp!
      });
    } else {
      return ResponseFormatter.sendGeneralChatResponse(res, result.response);
    }

  } catch (error: any) {
    console.error('❌ Chatbot controller error:', error);
    
    // Handle specific OpenAI errors
    if (error.code && ['insufficient_quota', 'invalid_api_key', 'rate_limit_exceeded'].includes(error.code)) {
      return ResponseFormatter.sendOpenAIError(res, error);
    }
    
    // Generic error response
    return ResponseFormatter.sendError(res, 500, 'Failed to process chat message', error.message);
  }
};

/**
 * Fetch user data for personalization
 */
async function fetchUserData(userId?: string): Promise<UserData | undefined> {
  if (!userId) {
    return undefined;
  }

  try {
    const userData = await User.findById(userId).select('-password');
    if (userData) {
      console.log(`👤 User data loaded: ${userData.username} (${userData.subscriptionType})`);
      if (userData.dailyCalories) {
        console.log(`🥗 Nutrition targets: ${userData.dailyCalories} cal, ${userData.dailyProteins}g protein`);
      }
      if (userData.fitnessGoal) {
        console.log(`🎯 Fitness goal: ${userData.fitnessGoal}`);
      }
    }
    return userData?.toObject() as UserData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return undefined;
  }
} 