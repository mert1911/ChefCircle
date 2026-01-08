import mongoose, { Document, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // Password can be optional in the interface if not always fetched
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string; // Assuming this is a string path
  role?: 'user' | 'admin'; // Add role field
  subscriptionType?: string;
  subscriptionStatus?: string;
  // Password reset fields
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Refresh token rotation fields
  refreshToken?: string;
  refreshTokenExpires?: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
  favorites?: mongoose.Types.ObjectId[];
  favoriteMealPlans?: mongoose.Types.ObjectId[];
  followers?: Types.ObjectId[];   // users who follow this user
  following?: Types.ObjectId[];   // users this user follows
  // Soft deletion fields
  isDeleted?: boolean;
  deletedAt?: Date;
  deletionReason?: string;
  // Instance methods
  softDelete(reason?: string): Promise<IUser>;
  restore(): Promise<IUser>;
}
export interface IUserModel extends mongoose.Model<IUser> {
  findDeleted(): mongoose.Query<IUser[], IUser>;
}


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    default: '',
  },
  lastName: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500,
  },
  profileImage: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],

  // Track who this user follows:
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],

  // Stripe subscription fields
  subscriptionType: {
    type: String,
    enum: ['free', 'premium', 'premium_annual'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'past_due', null],
    default: null,
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  subscriptionStartDate: {
    type: Date,
    default: null,
  },
  subscriptionEndDate: {
    type: Date,
    default: null,
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],

  favoriteMealPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MealplanTemplate' }],

  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // Refresh token rotation fields
  refreshToken: {
    type: String,
    default: null,
  },
  refreshTokenExpires: {
    type: Date,
    default: null,
  },
  // Premium fitness/nutrition fields
  fitnessGoal: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'health'],
    default: null,
  },
  weightHistory: [
    {
      value: { type: Number, required: true },
      week: { type: String, required: true }, // e.g., '2024-W23'
    }
  ],
  height: {
    type: Number,
    default: null,
  },
  biologicalGender: {
    type: String,
    enum: ['male', 'female'],
    default: null,
  },
  age: {
    type: Number,
    default: null,
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: null,
  },
  dailyCalories: {
    type: Number,
    default: null,
  },
  dailyProteins: {
    type: Number,
    default: null,
  },
  dailyCarbs: {
    type: Number,
    default: null,
  },
  dailyFats: {
    type: Number,
    default: null,
  },
  plannedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    // Soft deletion fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletionReason: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});


// Add middleware to exclude soft-deleted users from queries by default
userSchema.pre(/^find/, function(this: mongoose.Query<any, any>) {
  // Only add the filter if it's not already specified
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Static method to find deleted users (for admin purposes)
userSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true });
};

// Instance method to soft delete a user
userSchema.methods.softDelete = function(reason?: string) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletionReason = reason || 'User requested account deletion';
  return this.save();
};

// Instance method to restore a deleted user
userSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletionReason = null;
  return this.save();
};

const User = mongoose.models.User || mongoose.model<IUser, IUserModel>('User', userSchema);

export {userSchema};

export default User; 