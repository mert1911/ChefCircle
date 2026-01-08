const API_BASE_URL = 'http://localhost:8080/api';

// This will be set by the auth context when available
let authContext: any = null;

// Function to set the auth context reference
export const setAuthContext = (context: any) => {
  authContext = context;
};

// Helper function to get auth headers with automatic token refresh
export const getAuthHeaders = async () => {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  console.log("[API DEBUG] authContext:", authContext ? "Available" : "NULL");
  
  if (authContext) {
    let token = authContext.getAccessToken();
    console.log("[API DEBUG] Initial token:", token ? "Present" : "None");
    
    // If no token or token is about to expire, try to refresh
    if (!token || isTokenExpiringSoon(token)) {
      console.log("Token missing or expiring, attempting refresh...");
      token = await authContext.refreshToken();
      console.log("[API DEBUG] Refreshed token:", token ? "Present" : "None");
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log("[API DEBUG] Authorization header set with Bearer token");
    } else {
      console.log("[API DEBUG] No token available for Authorization header");
    }
  } else {
    console.log("[API DEBUG] No authContext available - headers will not include Authorization");
  }

  return headers;
};

// Check if token is about to expire (within 2 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp - currentTime < 2 * 60; // 2 minutes
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Enhanced fetch function with automatic token refresh
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include', // Include cookies for refresh token
  });

  // If we get a 401 and we have auth context, try to refresh token once
  if (response.status === 401 && authContext) {
    console.log("Received 401, attempting token refresh...");
    const newToken = await authContext.refreshToken();
    
    if (newToken) {
      // Retry the request with the new token
      const retryHeaders = {
        ...headers,
        'Authorization': `Bearer ${newToken}`,
        ...options.headers,
      };
      
      return fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  return response;
};

export const userAPI = {
  // Get current user
  getCurrentUser: async () => {
    const response = await apiRequest('/auth/user');
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to get user');
    return data;
  },

  // Get password requirements
  getPasswordRequirements: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/password-requirements`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to get password requirements');
    return data;
  },

  // Validate password in real-time
  validatePassword: async (password: string) => {
    const response = await apiRequest('/auth/validate-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to validate password');
    return data;
  },

  // Update user profile
  updateProfile: async (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    profileImage?: string;
    // Premium fitness/nutrition fields (optional)
    fitnessGoal?: 'weight_loss' | 'weight_gain' | 'health';
    weight?: number;
    height?: number;
    biologicalGender?: 'male' | 'female';
    age?: number;
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    dailyCalories?: number;
    dailyProteins?: number;
    dailyCarbs?: number;
    dailyFats?: number;
  }) => {
    const response = await apiRequest('/auth/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to update profile');
    return data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiRequest('/auth/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to change password');
    return data;
  },

  // Delete account
  deleteAccount: async (password: string, reason?: string) => {
    const response = await apiRequest('/auth/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, reason }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to deactivate account');
    return data;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to send reset email');
    return data;
  },

  // Reset password
  resetPassword: async (token: string, email: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to reset password');
    return data;
  },
};

const MEALPLAN_BASE_URL = 'http://localhost:8080/mealplan';
const USER_BASE_URL = 'http://localhost:8080/user';

export const mealplanAPI = {
  // UserMealplan CRUD
  createUserMealplan: async (data) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${USER_BASE_URL}/mealplan`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to create mealplan');
    return resData;
  },
  getUserMealplan: async (week) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${USER_BASE_URL}/mealplan?week=${encodeURIComponent(week)}`, {
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to get mealplan');
    return resData;
  },
  updateUserMealplan: async (week, data) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${USER_BASE_URL}/mealplan?week=${encodeURIComponent(week)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to update mealplan');
    return resData;
  },
  deleteUserMealplan: async (week) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${USER_BASE_URL}/mealplan?week=${encodeURIComponent(week)}`, {
      method: 'DELETE',
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to delete mealplan');
    return resData;
  },
  // Publish UserMealplan as Template
  publishUserMealplanAsTemplate: async (data) => {
    const headers = await getAuthHeaders();
    let body, finalHeaders;
    if (data instanceof FormData) {
      body = data;
      // Don't set Content-Type for FormData; browser will set it
      finalHeaders = { ...headers };
      delete finalHeaders['Content-Type'];
    } else {
      body = JSON.stringify(data);
      finalHeaders = { ...headers, 'Content-Type': 'application/json' };
    }
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/publish-from-user-mealplan`, {
      method: 'POST',
      headers: finalHeaders,
      body,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to publish template');
    return resData;
  },
  // Create UserMealplan from Template
  createUserMealplanFromTemplate: async ({ templateId, week }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/usermealplan/create-from-template`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ templateId, week }), 
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to create mealplan from template');
    return resData;
  },
  // Copy a published mealplan template to user's week
  copyMealplanToMyWeek: async (templateId, week) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/${templateId}/copy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ week }),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to copy mealplan');
    return resData;
  },
  // Get weekly nutrition for a given week
  getWeeklyNutrition: async (week) => {
    const headers = await getAuthHeaders();
    const url = week ? `${MEALPLAN_BASE_URL}/nutrition?week=${encodeURIComponent(week)}` : `${MEALPLAN_BASE_URL}/nutrition`;
    const response = await fetch(url, {
      headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get weekly nutrition');
    return data;
  },

  // MyWeek endpoints
  getMyWeekMealplan: async (week) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/myweek?week=${encodeURIComponent(week)}`, {
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to get mealplan');
    return resData;
  },
  createMyWeekMealplan: async (data) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/myweek`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to create mealplan');
    return resData;
  },
  updateMyWeekMealplan: async (id, data) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/myweek/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to update mealplan');
    return resData;
  },
  deleteMyWeekMealplan: async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/myweek/${id}`, {
      method: 'DELETE',
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to delete mealplan');
    return resData;
  },
};

export const templateAPI = {
  // MealplanTemplate CRUD
  createTemplate: async (data) => {
    const headers = await getAuthHeaders();
    let body, finalHeaders;
    if (data instanceof FormData) {
      body = data;
      finalHeaders = { ...headers };
      delete finalHeaders['Content-Type']; // Let browser set it
    } else {
      body = JSON.stringify(data);
      finalHeaders = { ...headers, 'Content-Type': 'application/json' };
    }
    const response = await fetch(`${MEALPLAN_BASE_URL}/template`, {
      method: 'POST',
      headers: finalHeaders,
      body,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to create template');
    return resData;
  },
  getTemplates: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template${query ? '?' + query : ''}`, { headers });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to get templates');
    return resData;
  },
  getTemplateById: async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/${id}`, { headers });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to get template');
    return resData;
  },
  updateTemplate: async (id, data) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to update template');
    return resData;
  },
  deleteTemplate: async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/${id}`, {
      method: 'DELETE',
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to delete template');
    return resData;
  },
  // Favorite a MealplanTemplate
  favoriteTemplate: async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/${id}/favorite`, {
      method: 'POST',
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to favorite template');
    return resData;
  },
  // Unfavorite a MealplanTemplate
  unfavoriteTemplate: async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${MEALPLAN_BASE_URL}/template/${id}/unfavorite`, {
      method: 'POST',
      headers,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to unfavorite template');
    return resData;
  },
};

// Recipe API functions
export const recipeAPI = {
  // Get all recipes
  getAllRecipes: async () => {
    const response = await fetch(`http://localhost:8080/recipes`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get recipes');
    return data;
  },

  // Get recipe count
  getRecipeCount: async () => {
    const response = await fetch(`http://localhost:8080/recipes/count`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get recipe count');
    return data.count;
  },

  // Get recipe by ID
  getRecipeById: async (id) => {
    const response = await fetch(`http://localhost:8080/recipes/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get recipe');
    return data;
  },

  // Get newest recipes (sorted by creation date)
  getNewestRecipes: async (limit = 3) => {
    const response = await fetch(`http://localhost:8080/recipes`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get recipes');
    
    // Sort by creation date (newest first) and limit
    const sortedRecipes = data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    return sortedRecipes;
  },

  // Add recipe to favorites
  addFavorite: async (recipeId) => {
    const response = await fetch(`http://localhost:8080/recipes/favorites/${recipeId}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add favorite');
    return data;
  },

  // Remove recipe from favorites
  removeFavorite: async (recipeId) => {
    const response = await fetch(`http://localhost:8080/recipes/favorites/${recipeId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to remove favorite');
    return data;
  },

  // Get favorite recipes
  getFavorites: async () => {
    const response = await fetch(`http://localhost:8080/recipes/favorites`, {
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get favorites');
    return data;
  },
};

// Shopping list API functions
export const shoppingListAPI = {
  // Get shopping list
  getShoppingList: async (week) => {
    const url = week ? `${MEALPLAN_BASE_URL}/shopping-list?week=${encodeURIComponent(week)}` : `${MEALPLAN_BASE_URL}/shopping-list`;
    const response = await fetch(url, {
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get shopping list');
    return data;
  },

  // Update shopping list item checked state
  updateChecked: async (ingredientId, unit, checked) => {
    const response = await fetch(`${MEALPLAN_BASE_URL}/shopping-list/check`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ ingredientId, unit, checked }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update shopping list');
    return data;
  },
}; 

export const addWeightForWeek = async ({ week, value }: { week: string, value: number }) => {
  const headers = await getAuthHeaders();
  const response = await fetch('http://localhost:8080/user/weight-history', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ week, value }),
  });
  if (!response.ok) throw new Error('Failed to set weight');
  return response.json();
};

export const getWeightHistory = async (week?: string) => {
  const headers = await getAuthHeaders();
  const url = week
    ? `http://localhost:8080/user/weight-history?week=${encodeURIComponent(week)}`
    : 'http://localhost:8080/user/weight-history';
  const response = await fetch(url, { headers, credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch weight history');
  return response.json();
};

// Search for users
export const searchUsers = async (query: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`http://localhost:8080/user/search?query=${encodeURIComponent(query)}`, {
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to search users');
  }
  
  return response.json();
};

// Generic API object for common HTTP methods
const api = {
  post: async (url: string, data?: any) => {
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: await response.json(), status: response.status };
  },
  get: async (url: string) => {
    const response = await apiRequest(url);
    return { data: await response.json(), status: response.status };
  },
  put: async (url: string, data?: any) => {
    const response = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { data: await response.json(), status: response.status };
  },
  delete: async (url: string) => {
    const response = await apiRequest(url, {
      method: 'DELETE',
    });
    return { data: await response.json(), status: response.status };
  },
};

export default api; 