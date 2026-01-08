export interface ValidationResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
}

export interface ChatRequestBody {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  excludeRecipeIds?: string[];
}

export class ChatbotValidator {
  /**
   * Validate the main chat request
   */
  static validateChatRequest(body: any): ValidationResult {
    if (!body) {
      return {
        isValid: false,
        error: 'Request body is required',
        statusCode: 400
      };
    }

    // Validate message
    const messageValidation = this.validateMessage(body.message);
    if (!messageValidation.isValid) {
      return messageValidation;
    }

    // Validate conversation history if provided
    if (body.conversationHistory !== undefined) {
      const historyValidation = this.validateConversationHistory(body.conversationHistory);
      if (!historyValidation.isValid) {
        return historyValidation;
      }
    }

    // Validate excludeRecipeIds if provided
    if (body.excludeRecipeIds !== undefined) {
      const excludeIdsValidation = this.validateExcludeRecipeIds(body.excludeRecipeIds);
      if (!excludeIdsValidation.isValid) {
        return excludeIdsValidation;
      }
    }

    return { isValid: true };
  }

  /**
   * Validate the message field
   */
  private static validateMessage(message: any): ValidationResult {
    if (!message) {
      return {
        isValid: false,
        error: 'Message is required',
        statusCode: 400
      };
    }

    if (typeof message !== 'string') {
      return {
        isValid: false,
        error: 'Message must be a string',
        statusCode: 400
      };
    }

    if (message.trim().length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty',
        statusCode: 400
      };
    }

    if (message.length > 2000) {
      return {
        isValid: false,
        error: 'Message is too long (maximum 2000 characters)',
        statusCode: 400
      };
    }

    return { isValid: true };
  }

  /**
   * Validate conversation history array
   */
  private static validateConversationHistory(history: any): ValidationResult {
    if (!Array.isArray(history)) {
      return {
        isValid: false,
        error: 'Conversation history must be an array',
        statusCode: 400
      };
    }

    if (history.length > 50) {
      return {
        isValid: false,
        error: 'Conversation history is too long (maximum 50 messages)',
        statusCode: 400
      };
    }

    for (let i = 0; i < history.length; i++) {
      const message = history[i];
      
      if (!message || typeof message !== 'object') {
        return {
          isValid: false,
          error: `Invalid message at index ${i}: must be an object`,
          statusCode: 400
        };
      }

      if (!message.role || !message.content) {
        return {
          isValid: false,
          error: `Invalid message at index ${i}: role and content are required`,
          statusCode: 400
        };
      }

      if (!['user', 'assistant'].includes(message.role)) {
        return {
          isValid: false,
          error: `Invalid message at index ${i}: role must be 'user' or 'assistant'`,
          statusCode: 400
        };
      }

      if (typeof message.content !== 'string') {
        return {
          isValid: false,
          error: `Invalid message at index ${i}: content must be a string`,
          statusCode: 400
        };
      }

      if (message.content.length > 2000) {
        return {
          isValid: false,
          error: `Invalid message at index ${i}: content is too long (maximum 2000 characters)`,
          statusCode: 400
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate excludeRecipeIds array
   */
  private static validateExcludeRecipeIds(excludeIds: any): ValidationResult {
    if (!Array.isArray(excludeIds)) {
      return {
        isValid: false,
        error: 'excludeRecipeIds must be an array',
        statusCode: 400
      };
    }

    if (excludeIds.length > 100) {
      return {
        isValid: false,
        error: 'Too many excluded recipe IDs (maximum 100)',
        statusCode: 400
      };
    }

    for (let i = 0; i < excludeIds.length; i++) {
      const id = excludeIds[i];
      
      if (typeof id !== 'string') {
        return {
          isValid: false,
          error: `Invalid recipe ID at index ${i}: must be a string`,
          statusCode: 400
        };
      }

      if (id.trim().length === 0) {
        return {
          isValid: false,
          error: `Invalid recipe ID at index ${i}: cannot be empty`,
          statusCode: 400
        };
      }

      // Basic MongoDB ObjectId format validation
      if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        return {
          isValid: false,
          error: `Invalid recipe ID at index ${i}: must be a valid ObjectId`,
          statusCode: 400
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate OpenAI API configuration
   */
  static validateOpenAIConfig(apiKey?: string): ValidationResult {
    if (!apiKey) {
      return {
        isValid: false,
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.',
        statusCode: 500
      };
    }

    if (!apiKey.startsWith('sk-')) {
      return {
        isValid: false,
        error: 'Invalid OpenAI API key format',
        statusCode: 500
      };
    }

    return { isValid: true };
  }
} 