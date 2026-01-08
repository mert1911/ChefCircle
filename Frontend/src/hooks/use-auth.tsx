import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAuthContext } from '../lib/api';
import { clearConversationData } from '../lib/conversation-storage';

// Define the API URL with fallback to localhost:8080
const API = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

// Define the user type
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  subscriptionType?: 'free' | 'premium' | 'premium_annual';
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | null;
  // Premium fitness/nutrition fields
  fitnessGoal?: 'weight_loss' | 'weight_gain' | 'health';
  weightHistory?: { value: number; week: string }[];
  height?: number;
  biologicalGender?: 'male' | 'female';
  age?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalories?: number;
  dailyProteins?: number;
  dailyCarbs?: number;
  dailyFats?: number;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateUserData: (userData: Partial<User>) => void;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<string | null>;
}

// Define the register form data type
interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Store user data in localStorage when it changes (but not tokens)
  const updateUser = (userData: User | null) => {
    console.log("Setting user state:", userData);
    setUser(userData);
    
    // Store user data in localStorage for persistence (but not tokens)
    if (userData) {
      try {
        localStorage.setItem('user', JSON.stringify(userData));
        console.log("User data stored in localStorage");
      } catch (e) {
        console.error("Error storing user data in localStorage:", e);
      }
    } else {
      localStorage.removeItem('user');
      console.log("User data removed from localStorage");
    }
  };

  // Get current access token
  const getAccessToken = () => accessToken;

  // Refresh access token using HTTP-only cookie
  const refreshToken = async (): Promise<string | null> => {
    try {
      console.log("Attempting to refresh access token...");
      const response = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Token refreshed successfully");
        setAccessToken(data.token);
        return data.token;
      } else {
        console.error("Token refresh failed:", response.status);
        // If refresh fails, logout user
        handleLogout();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      handleLogout();
      return null;
    }
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

  // Auto-refresh token if it's expiring soon
  useEffect(() => {
    if (accessToken && isTokenExpiringSoon(accessToken)) {
      console.log("Token is expiring soon, attempting refresh...");
      refreshToken();
    }
  }, [accessToken]);

  // Debug: log user state changes
  useEffect(() => {
    console.log("Auth user state changed:", user);
  }, [user]);

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("Initializing auth...");
      
      // Try to get cached user data
      const savedUserData = localStorage.getItem('user');
      
      if (savedUserData) {
        try {
          const parsedUser = JSON.parse(savedUserData);
          console.log("Found cached user data:", parsedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error("Error parsing saved user data:", e);
          localStorage.removeItem('user');
        }
      }

      // Try to refresh token to get a new access token
      const token = await refreshToken();
      if (token) {
        // Fetch updated user data
        await fetchUserData(token);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      console.log("Fetching user data from backend...");
      const response = await fetch(`${API}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched successfully:", userData);
        
        // Format user data
        const formattedUser: User = {
          id: userData._id || userData.id,
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          bio: userData.bio,
          profileImage: userData.profileImage,
          subscriptionType: userData.subscriptionType,
          subscriptionStatus: userData.subscriptionStatus,
          // Premium fitness/nutrition fields
          fitnessGoal: userData.fitnessGoal,
          weightHistory: userData.weightHistory,
          height: userData.height,
          biologicalGender: userData.biologicalGender,
          age: userData.age,
          activityLevel: userData.activityLevel,
          dailyCalories: userData.dailyCalories,
          dailyProteins: userData.dailyProteins,
          dailyCarbs: userData.dailyCarbs,
          dailyFats: userData.dailyFats
        };
        
        updateUser(formattedUser);
      } else {
        console.error("Failed to fetch user data. Status:", response.status);
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      handleLogout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with email:", email);
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Login failed:", data);
        throw new Error(data.msg || 'Login failed');
      }
      
      console.log("Login successful:", data);
      
      // Store access token in memory and user data
      setAccessToken(data.token);
      updateUser(data.user);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (formData: RegisterFormData) => {
    try {
      console.log("Attempting registration...");
      
      const response = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Registration failed:", data);
        throw new Error(data.msg || 'Registration failed');
      }
      
      console.log("Registration successful:", data);
      
      // Store access token in memory and user data
      setAccessToken(data.token);
      updateUser(data.user);
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    console.log("Logging out user");
    
    // Clear conversation data for the current user before logging out
    if (user?.id) {
      clearConversationData(user.id);
    }
    
    setAccessToken(null);
    updateUser(null);
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear HTTP-only cookie
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
    } finally {
      handleLogout();
    }
  };

  const updateUserData = (userData: Partial<User>) => {
    if (user) {
      // Normalize email case if it's being updated
      const normalizedUserData = {
        ...userData,
        email: userData.email ? userData.email.toLowerCase() : userData.email
      };
      const updatedUser = { ...user, ...normalizedUserData };
      updateUser(updatedUser);
    }
  };

  const authContextValue = {
    user, 
    isAuthenticated: !!user, 
    isLoading, 
    login, 
    register, 
    logout,
    updateUserData,
    getAccessToken,
    refreshToken
  };

  // Set the auth context for the API utility
  useEffect(() => {
    setAuthContext(authContextValue);
  }, [authContextValue]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 