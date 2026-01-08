// src/types/user.ts

export interface IUser {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  isVerified?: boolean;
  isDeleted?: boolean;

  /** Total number of followers this user has */
  followers?: number;

  /** Total number of users this user is following */
  following?: number;

  subscriptionType?: string;
  subscriptionStatus?: string;

  // Premium fitness/nutrition fields
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
}
