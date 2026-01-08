import { Response } from 'express';

export interface ApiResponse {
  success: boolean;
  response?: string;
  intent?: string;
  recipes?: any[];
  hasRecipes?: boolean;
  suggestedRecipeIds?: string[];
  isFollowUp?: boolean;
  timestamp: string;
  error?: string;
  details?: string;
}

export class ResponseFormatter {
  /**
   * Send a successful chatbot response
   */
  static sendSuccess(
    res: Response, 
    data: {
      response: string;
      intent: string;
      recipes?: any[];
      hasRecipes?: boolean;
      suggestedRecipeIds?: string[];
      isFollowUp?: boolean;
    }
  ): void {
    const apiResponse: ApiResponse = {
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    };

    res.json(apiResponse);
  }

  /**
   * Send a recipe search response
   */
  static sendRecipeSearchResponse(
    res: Response,
    data: {
      response: string;
      recipes: any[];
      hasRecipes: boolean;
      suggestedRecipeIds: string[];
      isFollowUp: boolean;
    }
  ): void {
    const apiResponse: ApiResponse = {
      success: true,
      intent: 'search_recipes',
      ...data,
      timestamp: new Date().toISOString()
    };

    res.json(apiResponse);
  }

  /**
   * Send a general chat response
   */
  static sendGeneralChatResponse(res: Response, response: string): void {
    const apiResponse: ApiResponse = {
      success: true,
      response,
      intent: 'general_chat',
      timestamp: new Date().toISOString()
    };

    res.json(apiResponse);
  }

  /**
   * Send an error response
   */
  static sendError(
    res: Response, 
    statusCode: number, 
    error: string, 
    details?: string
  ): void {
    const apiResponse: ApiResponse = {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(apiResponse);
  }

  /**
   * Send validation error response
   */
  static sendValidationError(res: Response, error: string): void {
    this.sendError(res, 400, error);
  }

  /**
   * Send OpenAI specific error responses
   */
  static sendOpenAIError(res: Response, error: any): void {
    console.error('OpenAI error:', error);
    
    if (error.code === 'insufficient_quota') {
      this.sendError(
        res, 
        402, 
        'OpenAI API quota exceeded. Please check your billing details.'
      );
      return;
    }
    
    if (error.code === 'invalid_api_key') {
      this.sendError(
        res, 
        401, 
        'Invalid OpenAI API key. Please check your configuration.'
      );
      return;
    }

    if (error.code === 'rate_limit_exceeded') {
      this.sendError(
        res, 
        429, 
        'Rate limit exceeded. Please try again later.'
      );
      return;
    }

    // Generic OpenAI error
    this.sendError(
      res, 
      500, 
      'An error occurred while processing your request with OpenAI',
      error.message
    );
  }

  /**
   * Send internal server error
   */
  static sendInternalError(res: Response, error: any): void {
    console.error('Internal error:', error);
    
    this.sendError(
      res, 
      500, 
      'An internal error occurred while processing your request',
      error.message
    );
  }

  /**
   * Send service unavailable error
   */
  static sendServiceUnavailable(res: Response, service: string): void {
    this.sendError(
      res, 
      503, 
      `${service} service is currently unavailable. Please try again later.`
    );
  }
} 