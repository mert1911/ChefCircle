import mongoose, { Schema, Document, Types } from 'mongoose';
import { IRecipe } from './recipe';
import { IIngredient } from './ingredient';
import { IUser } from './User';

//Section 1 - Mealplan Instance (Scheduled for a week)

//One specific slot in a week 
export interface IUserMealplanSlot { 
  mealType: string;
  date: string; 
  recipe: Types.ObjectId; 
  servings: number;
}

const UserMealplanSlotSchema = new Schema<IUserMealplanSlot>({
  mealType: { type: String, required: true },
  date: { type: String, required: true },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  servings: { type: Number, required: true },
});

// Shopping list items for current week
export interface IShoppingListItemState {
  ingredient: Types.ObjectId; //ingredientId
  unit: string;
  checked: boolean;
  amount: number; 
}

const shoppingListItemStateSchema = new Schema<IShoppingListItemState>({
  ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  unit: { type: String, required: true },
  checked: { type: Boolean, default: false },
  amount: { type: Number, required: true },
}, { _id: false });


//Mealplan Instance (Scheduled for a specific week) ---
export interface IUserMealplan extends Document {
  user: Types.ObjectId;
  week: string; // e.g., '2025-W28'
  slots: IUserMealplanSlot[];
  shoppingListState?: IShoppingListItemState[];
  createdAt?: Date;
  updatedAt?: Date;
  }

const UserMealplanSchema = new Schema<IUserMealplan>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  week: { type: String, required: true },
  slots: [UserMealplanSlotSchema],
  shoppingListState: [shoppingListItemStateSchema],
}, { timestamps: true });

export const UserMealplan = mongoose.model<IUserMealplan>('UserMealplan', UserMealplanSchema);













//Section 2 - Mealplan Teamplates (Shareable - not scheduled for a specific week)


export interface IMealplanTemplateSlot {
  mealType: string;
  dayOfWeek: string; 
  recipe: IRecipe;
  servings: number;
}

const MealplanTemplateSlotSchema = new Schema<IMealplanTemplateSlot>({
  mealType: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  servings: { type: Number, required: true },
});


//Rating of the template
export interface IMealplanRating {
  user: Types.ObjectId;
  value: number;
}

const mealplanRatingSchema = new Schema<IMealplanRating>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 }
}, { _id: false });



//Mealplan Templates (Shareable)
export interface IMealplanTemplate extends Document {
  title: string;
  description: string;
  tags?: string[];
  author: IUser;
  slots: IMealplanTemplateSlot[];
  difficulty?: 'easy' | 'medium' | 'hard';
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ratings?: IMealplanRating[];
}


const MealplanTemplateSchema = new Schema<IMealplanTemplate>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  slots: [MealplanTemplateSlotSchema],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }, // Optional
  image: { type: String }, // Optional
  ratings: [mealplanRatingSchema]
}, { timestamps: true });

export const MealplanTemplate = mongoose.model<IMealplanTemplate>('MealplanTemplate', MealplanTemplateSchema);

