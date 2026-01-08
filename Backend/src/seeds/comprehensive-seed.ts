import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { Recipe } from '../models/recipe';
import { Ingredient } from '../models/ingredient';
import { MealplanTemplate, IMealplanTemplateSlot, UserMealplan } from '../models/mealplan';
import { Post } from '../models/post';
import { DATABASE_CONFIG, validateConfig } from '../config';
import { generateRecipeEmbedding } from '../services/embedding.service';

// Define the Unit enum here since it's needed for the seed data
enum Unit {
    GRAM = 'gram',
    KILOGRAM = 'kilogram',
    MILLILITER = 'milliliter',
    LITER = 'liter',
    TEASPOON = 'teaspoon(s)',
    TABLESPOON = 'tablespoon(s)',
    PIECE = 'piece(s)', 
    SLICE = 'slice(s)'  
}

// =================================
// SAMPLE USERS DATA
// =================================
const sampleUsers = [
  {
    username: 'kim',
    email: 'kim.schlemmer@tum.de',
    password: 'Kim2025!',
    firstName: 'Kim',
    lastName: 'Schlemmer',
    bio: 'Computer Science student with a passion for cooking.',
    profileImage: 'https://scontent-muc2-1.xx.fbcdn.net/v/t39.30808-1/279004082_391938746272485_4229077209008111338_n.jpg?stp=c506.0.1150.1150a_dst-jpg_s200x200_tt6&_nc_cat=104&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=iiXagSuzxOsQ7kNvwECecUy&_nc_oc=AdnMmJZEikV5INBRs2dnOzguM2roAJ1SZad-EVECHFweqJkk1pmvkhuuI18R5KGIdSPEeB2CNtm7d2XQn7tSnir9&_nc_zt=24&_nc_ht=scontent-muc2-1.xx&_nc_gid=rs3YSIMMf7LiS5kG1TVQEw&oh=00_AfQtiMo8_F7S1BZD5HOAVjrbDaNgXRgib1J6HmTwWuq_aQ&oe=687FEEF2',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date('2025-07-19T22:52:52.631+00:00'),
    subscriptionEndDate: new Date('2025-08-19T22:52:48.000+00:00'),
    stripeCustomerId: 'cus_Si9wqSPysdMEv6',
    stripeSubscriptionId: 'sub_1RmjccR0ns7Y7OiCcAb2nYLX',
    fitnessGoal: 'weight_gain',
    height: 178,
    biologicalGender: 'male',
    age: 23,
    activityLevel: 'sedentary',
    dailyCalories: 2439,
    dailyProteins: 172,
    dailyCarbs: 286,
    dailyFats: 68,
    weightHistory: [
      { value: 77,
        week: '2025-W28'
      },
      { value: 77.5,
        week: '2025-W29'
      },
      { value: 78,
        week: '2025-W30'
      },
    ]
  },
  {
    username: 'mert',
    email: 'mert.ayvazoglu@tum.de',
    password: 'Mert2025!',
    firstName: 'Mert',
    lastName: 'Ayvazoglu',
    bio: 'Software Engineering student who loves trying out new recipes.',
    profileImage: 'https://media.licdn.com/dms/image/v2/D4E03AQGrZ7m0Fl83sg/profile-displayphoto-shrink_200_200/B4EZZOSHfkHcAY-/0/1745070095237?e=1755734400&v=beta&t=GN3JirhJELtVEgtsF0MnBIWJrK97UOz56Fb4rSCGqXo',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date('2025-07-19T22:58:28.357+00:00'),
    subscriptionEndDate: new Date('2025-07-19T22:45:52.691+00:00'),
    stripeCustomerId: 'cus_SiA2qwV1OZEyrF',
    stripeSubscriptionId: 'sub_1RmjhzR0ns7Y7OiC3sDLh19c',
    fitnessGoal: 'health',
    height: 181,
    biologicalGender: 'male',
    age: 24,
    activityLevel: 'light',
    dailyCalories: 2387,
    dailyProteins: 158,
    dailyCarbs: 289,
    dailyFats: 66,
    weightHistory: [
      { value: 72,
        week: '2025-W28'
      },
      { value: 72.3,
        week: '2025-W29'
      },
      { value: 72,
        week: '2025-W30'
      },
    ]
  },
  {
    username: 'bengisu',
    email: 'bengisu.ozdemir@tum.de',
    password: 'Bengisu2025!',
    firstName: 'Bengisu',
    lastName: 'Özdemir',
    bio: 'Informatics student exploring international recipes.',
    profileImage: '',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date('2025-07-19T23:01:02.014+00:00'),
    subscriptionEndDate: new Date('2025-08-19T23:00:58.000+00:00'),
    stripeCustomerId: 'cus_SiA4ZRBzQ421Tu',
    stripeSubscriptionId: 'sub_1RmjkWR0ns7Y7OiCfUhWhm77'
  },
  {
    username: 'nick',
    email: 'nick.breit@tum.de',
    password: 'Nick2025!',
    firstName: 'Nick',
    lastName: 'Breit',
    bio: 'Engineering student with a love for healthy cooking.',
    profileImage: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Arminia_Bielefeld_Logo_2021%E2%80%93.svg',
    subscriptionType: 'free'
  },
  {
    username: 'chefemma',
    email: 'chef.emma@tum.de',
    password: 'ChefEmma2025!',
    firstName: 'Chef',
    lastName: 'Emma',
    bio: 'Professional chef and culinary instructor.',
    profileImage: 'https://cdn2.iconfinder.com/data/icons/professions/512/cook_woman_user-512.png',
    subscriptionType: 'free'
  }
];

// =================================
// SAMPLE INGREDIENTS DATA
// =================================
const sampleIngredients = [
  // Proteins
  'Chicken Breast', 'Salmon Fillet', 'Ground Turkey', 'Eggs', 'Greek Yogurt', 'Cottage Cheese',
  'Tofu', 'Tempeh', 'Black Beans', 'Chickpeas', 'Lentils', 'Almonds', 'Walnuts', 'Cashews',
  'Protein Powder', 'Quinoa', 'Hemp Seeds', 'Chia Seeds',
  
  // Vegetables
  'Spinach', 'Kale', 'Broccoli', 'Cauliflower', 'Bell Pepper', 'Zucchini', 'Cucumber', 
  'Tomatoes', 'Cherry Tomatoes', 'Red Onion', 'Garlic', 'Ginger', 'Avocado', 'Sweet Potato',
  'Mushrooms', 'Carrots', 'Celery', 'Asparagus', 'Brussels Sprouts', 'Lettuce',
  
  // Fruits
  'Blueberries', 'Strawberries', 'Banana', 'Apple', 'Lemon', 'Lime', 'Orange', 'Coconut',
  
  // Grains & Starches
  'Brown Rice', 'Wild Rice', 'Oats', 'Almond Flour', 'Coconut Flour',
  
  // Healthy Fats
  'Olive Oil', 'Coconut Oil', 'Avocado Oil', 'Coconut Milk', 'Almond Milk', 'Tahini',
  'Almond Butter', 'Coconut Butter',
  
  // Seasonings & Others
  'Sea Salt', 'Black Pepper', 'Turmeric', 'Cumin', 'Paprika', 'Garlic Powder', 'Oregano',
  'Basil', 'Thyme', 'Rosemary', 'Cinnamon', 'Vanilla Extract', 'Apple Cider Vinegar',
  'Lemon Juice', 'Nutritional Yeast', 'Dark Chocolate', 'Honey', 'Maple Syrup'
];

// =================================
// SAMPLE RECIPES DATA  
// =================================
const sampleRecipes = [
  // BREAKFAST RECIPES
  {
    name: 'High-Protein Chia Pudding',
    description: 'Creamy overnight chia pudding packed with protein and omega-3s, perfect for busy mornings.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 5,
    cookTimeMin: 0,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Mix chia seeds with almond milk in a bowl.',
      'Add protein powder, maple syrup, and vanilla extract.',
      'Whisk thoroughly to prevent clumping.',
      'Refrigerate overnight or at least 4 hours.',
      'Top with fresh blueberries and chopped almonds before serving.'
    ],
    ingredientsList: [
      { name: 'Chia Seeds', amount: 60, unit: Unit.GRAM },
      { name: 'Almond Milk', amount: 400, unit: Unit.MILLILITER },
      { name: 'Protein Powder', amount: 30, unit: Unit.GRAM },
      { name: 'Maple Syrup', amount: 30, unit: Unit.MILLILITER },
      { name: 'Vanilla Extract', amount: 5, unit: Unit.MILLILITER },
      { name: 'Blueberries', amount: 100, unit: Unit.GRAM },
      { name: 'Almonds', amount: 30, unit: Unit.GRAM }
    ],
    calories: 580,
    protein_g: 35,
    totalFat_g: 25,
    saturatedFat_g: 3,
    cholesterol_mg: 0,
    sodium_mg: 180,
    carbohydrates_g: 45,
    fiber_g: 20,
    sugars_g: 25,
    image: 'uploads/recipe-high-protein-chia-pudding.jpg'
  },
  {
    name: 'Keto Avocado Egg Bowl',
    description: 'Creamy baked avocado filled with eggs and topped with herbs. Perfect keto breakfast.',
    tags: ['Keto', 'Low-Carb', 'Gluten-Free', 'Vegetarian'],
    prepTimeMin: 5,
    cookTimeMin: 15,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Preheat oven to 200°C.',
      'Cut avocados in half and remove pits, scoop out some flesh.',
      'Crack one egg into each avocado half.',
      'Season with salt, pepper, and paprika.',
      'Bake for 12-15 minutes until eggs are set.',
      'Garnish with fresh herbs and serve immediately.'
    ],
    ingredientsList: [
      { name: 'Avocado', amount: 2, unit: Unit.PIECE },
      { name: 'Eggs', amount: 4, unit: Unit.PIECE },
      { name: 'Sea Salt', amount: 2, unit: Unit.GRAM },
      { name: 'Black Pepper', amount: 1, unit: Unit.GRAM },
      { name: 'Paprika', amount: 2, unit: Unit.GRAM },
      { name: 'Basil', amount: 5, unit: Unit.GRAM }
    ],
    calories: 620,
    protein_g: 24,
    totalFat_g: 54,
    saturatedFat_g: 12,
    cholesterol_mg: 744,
    sodium_mg: 480,
    carbohydrates_g: 12,
    fiber_g: 20,
    sugars_g: 2,
    image: 'uploads/recipe-keto-avocado-egg-bowl.jpg'
  },
  {
    name: 'Gluten-Free Oat Pancakes',
    description: 'Fluffy pancakes made with oats and almond flour, naturally gluten-free and delicious.',
    tags: ['Gluten-Free', 'Vegetarian'],
    prepTimeMin: 10,
    cookTimeMin: 15,
    servings: 3,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Blend oats into flour consistency.',
      'Mix oat flour, almond flour, and baking powder.',
      'In another bowl, whisk eggs, almond milk, and maple syrup.',
      'Combine wet and dry ingredients until smooth.',
      'Cook pancakes in oiled pan for 2-3 minutes each side.',
      'Serve with fresh berries and maple syrup.'
    ],
    ingredientsList: [
      { name: 'Oats', amount: 150, unit: Unit.GRAM },
      { name: 'Almond Flour', amount: 100, unit: Unit.GRAM },
      { name: 'Eggs', amount: 3, unit: Unit.PIECE },
      { name: 'Almond Milk', amount: 300, unit: Unit.MILLILITER },
      { name: 'Maple Syrup', amount: 45, unit: Unit.MILLILITER },
      { name: 'Coconut Oil', amount: 15, unit: Unit.MILLILITER },
      { name: 'Strawberries', amount: 150, unit: Unit.GRAM }
    ],
    calories: 920,
    protein_g: 35,
    totalFat_g: 45,
    saturatedFat_g: 8,
    cholesterol_mg: 558,
    sodium_mg: 220,
    carbohydrates_g: 85,
    fiber_g: 18,
    sugars_g: 35,
    image: 'uploads/recipe-gluten-free-oat-pancakes.jpg'
  },

  // LUNCH RECIPES
  {
    name: 'Mediterranean Quinoa Bowl',
    description: 'Fresh and colorful bowl with quinoa, vegetables, and tahini dressing.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 15,
    cookTimeMin: 20,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'Mediterranean',
    instructions: [
      'Cook quinoa according to package instructions.',
      'Dice cucumber, tomatoes, and red onion.',
      'Massage kale with lemon juice and olive oil.',
      'Mix tahini with lemon juice, garlic, and water for dressing.',
      'Combine all ingredients in bowls.',
      'Drizzle with tahini dressing and serve.'
    ],
    ingredientsList: [
      { name: 'Quinoa', amount: 200, unit: Unit.GRAM },
      { name: 'Cucumber', amount: 200, unit: Unit.GRAM },
      { name: 'Cherry Tomatoes', amount: 200, unit: Unit.GRAM },
      { name: 'Red Onion', amount: 100, unit: Unit.GRAM },
      { name: 'Kale', amount: 150, unit: Unit.GRAM },
      { name: 'Tahini', amount: 60, unit: Unit.GRAM },
      { name: 'Lemon Juice', amount: 60, unit: Unit.MILLILITER },
      { name: 'Olive Oil', amount: 30, unit: Unit.MILLILITER },
      { name: 'Garlic', amount: 2, unit: Unit.PIECE }
    ],
    calories: 980,
    protein_g: 35,
    totalFat_g: 42,
    saturatedFat_g: 6,
    cholesterol_mg: 0,
    sodium_mg: 180,
    carbohydrates_g: 120,
    fiber_g: 18,
    sugars_g: 20,
    image: 'uploads/recipe-mediterranean-quinoa-bowl.jpg'
  },
  {
    name: 'Grilled Salmon with Roasted Vegetables',
    description: 'Perfectly grilled salmon served with colorful roasted vegetables.',
    tags: ['Gluten-Free', 'High-Protein', 'Paleo'],
    prepTimeMin: 15,
    cookTimeMin: 25,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'North American',
    instructions: [
      'Preheat oven to 200°C.',
      'Cut vegetables into uniform pieces.',
      'Toss vegetables with olive oil, salt, and herbs.',
      'Roast vegetables for 20-25 minutes.',
      'Season salmon with salt, pepper, and lemon.',
      'Grill salmon for 4-5 minutes per side.',
      'Serve salmon over roasted vegetables.'
    ],
    ingredientsList: [
      { name: 'Salmon Fillet', amount: 600, unit: Unit.GRAM },
      { name: 'Broccoli', amount: 300, unit: Unit.GRAM },
      { name: 'Bell Pepper', amount: 200, unit: Unit.GRAM },
      { name: 'Zucchini', amount: 200, unit: Unit.GRAM },
      { name: 'Olive Oil', amount: 45, unit: Unit.MILLILITER },
      { name: 'Lemon', amount: 1, unit: Unit.PIECE },
      { name: 'Garlic', amount: 3, unit: Unit.PIECE },
      { name: 'Rosemary', amount: 5, unit: Unit.GRAM }
    ],
    calories: 1200,
    protein_g: 120,
    totalFat_g: 60,
    saturatedFat_g: 12,
    cholesterol_mg: 360,
    sodium_mg: 480,
    carbohydrates_g: 25,
    fiber_g: 12,
    sugars_g: 18,
    image: 'uploads/recipe-grilled-salmon-roasted-vegetables.jpg'
  },
  {
    name: 'Vegan Buddha Bowl',
    description: 'Nourishing bowl with plant-based proteins, grains, and rainbow vegetables.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 20,
    cookTimeMin: 30,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'Asian',
    instructions: [
      'Cook brown rice according to package directions.',
      'Roast sweet potato cubes with oil and spices.',
      'Pan-fry tofu until golden on all sides.',
      'Steam broccoli until tender-crisp.',
      'Massage kale with lemon juice.',
      'Arrange all components in bowls.',
      'Drizzle with tahini-ginger dressing.'
    ],
    ingredientsList: [
      { name: 'Brown Rice', amount: 200, unit: Unit.GRAM },
      { name: 'Tofu', amount: 400, unit: Unit.GRAM },
      { name: 'Sweet Potato', amount: 300, unit: Unit.GRAM },
      { name: 'Broccoli', amount: 200, unit: Unit.GRAM },
      { name: 'Kale', amount: 150, unit: Unit.GRAM },
      { name: 'Chickpeas', amount: 200, unit: Unit.GRAM },
      { name: 'Tahini', amount: 45, unit: Unit.GRAM },
      { name: 'Ginger', amount: 10, unit: Unit.GRAM },
      { name: 'Olive Oil', amount: 30, unit: Unit.MILLILITER }
    ],
    calories: 1400,
    protein_g: 65,
    totalFat_g: 55,
    saturatedFat_g: 8,
    cholesterol_mg: 0,
    sodium_mg: 320,
    carbohydrates_g: 165,
    fiber_g: 25,
    sugars_g: 35,
    image: 'uploads/recipe-vegan-buddha-bowl.jpg'
  },

  // DINNER RECIPES
  {
    name: 'Herb-Crusted Chicken with Cauliflower Mash',
    description: 'Juicy herb-crusted chicken breast served with creamy cauliflower mash.',
    tags: ['Gluten-Free', 'Low-Carb', 'High-Protein'],
    prepTimeMin: 15,
    cookTimeMin: 30,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'North American',
    instructions: [
      'Preheat oven to 190°C.',
      'Mix herbs with olive oil and garlic.',
      'Coat chicken breasts with herb mixture.',
      'Bake chicken for 25-30 minutes until cooked through.',
      'Steam cauliflower until very tender.',
      'Mash cauliflower with coconut milk and seasonings.',
      'Serve chicken over cauliflower mash.'
    ],
    ingredientsList: [
      { name: 'Chicken Breast', amount: 800, unit: Unit.GRAM },
      { name: 'Cauliflower', amount: 600, unit: Unit.GRAM },
      { name: 'Olive Oil', amount: 45, unit: Unit.MILLILITER },
      { name: 'Coconut Milk', amount: 100, unit: Unit.MILLILITER },
      { name: 'Garlic', amount: 4, unit: Unit.PIECE },
      { name: 'Thyme', amount: 5, unit: Unit.GRAM },
      { name: 'Rosemary', amount: 5, unit: Unit.GRAM },
      { name: 'Oregano', amount: 3, unit: Unit.GRAM }
    ],
    calories: 1100,
    protein_g: 140,
    totalFat_g: 45,
    saturatedFat_g: 15,
    cholesterol_mg: 520,
    sodium_mg: 380,
    carbohydrates_g: 20,
    fiber_g: 8,
    sugars_g: 12,
    image: 'uploads/recipe-herb-crusted-chicken-cauliflower.avif'
  },
  {
    name: 'Lentil Walnut Bolognese with Zucchini Noodles',
    description: 'Rich and hearty plant-based bolognese served over spiralized zucchini noodles.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 15,
    cookTimeMin: 35,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'European',
    instructions: [
      'Cook lentils until tender, about 20 minutes.',
      'Sauté diced onion, carrots, and celery.',
      'Add crushed tomatoes and herbs.',
      'Stir in cooked lentils and chopped walnuts.',
      'Simmer for 15 minutes.',
      'Spiralize zucchini into noodles.',
      'Serve sauce over zucchini noodles.'
    ],
    ingredientsList: [
      { name: 'Lentils', amount: 300, unit: Unit.GRAM },
      { name: 'Walnuts', amount: 100, unit: Unit.GRAM },
      { name: 'Zucchini', amount: 600, unit: Unit.GRAM },
      { name: 'Tomatoes', amount: 400, unit: Unit.GRAM },
      { name: 'Red Onion', amount: 150, unit: Unit.GRAM },
      { name: 'Carrots', amount: 100, unit: Unit.GRAM },
      { name: 'Celery', amount: 100, unit: Unit.GRAM },
      { name: 'Garlic', amount: 4, unit: Unit.PIECE },
      { name: 'Olive Oil', amount: 30, unit: Unit.MILLILITER },
      { name: 'Basil', amount: 10, unit: Unit.GRAM }
    ],
    calories: 1200,
    protein_g: 55,
    totalFat_g: 45,
    saturatedFat_g: 5,
    cholesterol_mg: 0,
    sodium_mg: 280,
    carbohydrates_g: 140,
    fiber_g: 35,
    sugars_g: 25,
    image: 'uploads/recipe-lentil-bolognese-zucchini.jpg'
  },
  {
    name: 'Coconut Curry with Tofu and Vegetables',
    description: 'Creamy coconut curry loaded with vegetables and protein-rich tofu.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 20,
    cookTimeMin: 25,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'Asian',
    instructions: [
      'Press and cube tofu, then pan-fry until golden.',
      'Sauté onion, garlic, and ginger.',
      'Add curry spices and cook until fragrant.',
      'Pour in coconut milk and bring to simmer.',
      'Add vegetables and tofu.',
      'Simmer until vegetables are tender.',
      'Serve over brown rice or quinoa.'
    ],
    ingredientsList: [
      { name: 'Tofu', amount: 400, unit: Unit.GRAM },
      { name: 'Coconut Milk', amount: 400, unit: Unit.MILLILITER },
      { name: 'Bell Pepper', amount: 200, unit: Unit.GRAM },
      { name: 'Broccoli', amount: 200, unit: Unit.GRAM },
      { name: 'Spinach', amount: 150, unit: Unit.GRAM },
      { name: 'Red Onion', amount: 150, unit: Unit.GRAM },
      { name: 'Ginger', amount: 20, unit: Unit.GRAM },
      { name: 'Garlic', amount: 4, unit: Unit.PIECE },
      { name: 'Coconut Oil', amount: 30, unit: Unit.MILLILITER },
      { name: 'Turmeric', amount: 5, unit: Unit.GRAM },
      { name: 'Cumin', amount: 5, unit: Unit.GRAM }
    ],
    calories: 1000,
    protein_g: 45,
    totalFat_g: 75,
    saturatedFat_g: 55,
    cholesterol_mg: 0,
    sodium_mg: 240,
    carbohydrates_g: 35,
    fiber_g: 15,
    sugars_g: 20,
    image: 'uploads/recipe-coconut-curry-tofu-vegetables.jpg'
  },

  // SNACK RECIPES
  {
    name: 'Protein Energy Balls',
    description: 'No-bake energy balls packed with protein powder, nuts, and natural sweeteners.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 15,
    cookTimeMin: 0,
    servings: 12,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Process almonds and walnuts until roughly chopped.',
      'Add protein powder, chia seeds, and cinnamon.',
      'Mix in almond butter and maple syrup.',
      'Add vanilla extract and mix until combined.',
      'Roll mixture into 12 balls.',
      'Refrigerate for at least 30 minutes before serving.'
    ],
    ingredientsList: [
      { name: 'Almonds', amount: 100, unit: Unit.GRAM },
      { name: 'Walnuts', amount: 100, unit: Unit.GRAM },
      { name: 'Protein Powder', amount: 60, unit: Unit.GRAM },
      { name: 'Chia Seeds', amount: 30, unit: Unit.GRAM },
      { name: 'Almond Butter', amount: 120, unit: Unit.GRAM },
      { name: 'Maple Syrup', amount: 60, unit: Unit.MILLILITER },
      { name: 'Vanilla Extract', amount: 5, unit: Unit.MILLILITER },
      { name: 'Cinnamon', amount: 3, unit: Unit.GRAM }
    ],
    calories: 1800,
    protein_g: 75,
    totalFat_g: 135,
    saturatedFat_g: 15,
    cholesterol_mg: 0,
    sodium_mg: 120,
    carbohydrates_g: 85,
    fiber_g: 25,
    sugars_g: 45,
    image: 'uploads/recipe-protein-energy-balls.jpg'
  },
  {
    name: 'Keto Fat Bombs',
    description: 'Rich and satisfying fat bombs perfect for ketogenic diet followers.',
    tags: ['Keto', 'Low-Carb', 'Gluten-Free'],
    prepTimeMin: 10,
    cookTimeMin: 0,
    servings: 8,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Melt coconut oil and coconut butter together.',
      'Mix in almond butter until smooth.',
      'Add vanilla extract and a pinch of salt.',
      'Pour into silicone molds.',
      'Refrigerate until firm, about 2 hours.',
      'Store in refrigerator until ready to eat.'
    ],
    ingredientsList: [
      { name: 'Coconut Oil', amount: 120, unit: Unit.MILLILITER },
      { name: 'Coconut Butter', amount: 100, unit: Unit.GRAM },
      { name: 'Almond Butter', amount: 80, unit: Unit.GRAM },
      { name: 'Vanilla Extract', amount: 5, unit: Unit.MILLILITER },
      { name: 'Sea Salt', amount: 1, unit: Unit.GRAM }
    ],
    calories: 1600,
    protein_g: 25,
    totalFat_g: 160,
    saturatedFat_g: 120,
    cholesterol_mg: 0,
    sodium_mg: 240,
    carbohydrates_g: 20,
    fiber_g: 12,
    sugars_g: 8,
    image: 'uploads/recipe-keto-fat-bombs.avif'
  },

  // Additional recipes to reach 20-25 total
  {
    name: 'Green Smoothie Bowl',
    description: 'Nutrient-packed smoothie bowl topped with fresh fruits and superfoods.',
    tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 10,
    cookTimeMin: 0,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Blend frozen banana, spinach, and protein powder.',
      'Add almond milk gradually until thick consistency.',
      'Pour into bowls.',
      'Top with fresh berries, nuts, and chia seeds.',
      'Drizzle with almond butter if desired.',
      'Serve immediately.'
    ],
    ingredientsList: [
      { name: 'Banana', amount: 2, unit: Unit.PIECE },
      { name: 'Spinach', amount: 100, unit: Unit.GRAM },
      { name: 'Protein Powder', amount: 30, unit: Unit.GRAM },
      { name: 'Almond Milk', amount: 250, unit: Unit.MILLILITER },
      { name: 'Blueberries', amount: 100, unit: Unit.GRAM },
      { name: 'Almonds', amount: 30, unit: Unit.GRAM },
      { name: 'Chia Seeds', amount: 15, unit: Unit.GRAM },
      { name: 'Almond Butter', amount: 30, unit: Unit.GRAM }
    ],
    calories: 650,
    protein_g: 35,
    totalFat_g: 28,
    saturatedFat_g: 3,
    cholesterol_mg: 0,
    sodium_mg: 180,
    carbohydrates_g: 65,
    fiber_g: 18,
    sugars_g: 40,
    image: 'uploads/recipe-green-smoothie-bowl.avif'
  },
  {
    name: 'Paleo Beef Stir-Fry',
    description: 'Quick and flavorful beef stir-fry with colorful vegetables, paleo-friendly.',
    tags: ['Paleo', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 15,
    cookTimeMin: 12,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'Asian',
    instructions: [
      'Slice beef into thin strips.',
      'Heat oil in wok or large pan.',
      'Stir-fry beef until browned, remove.',
      'Add vegetables to pan, stir-fry until tender.',
      'Return beef to pan.',
      'Season with garlic, ginger, and herbs.',
      'Serve over cauliflower rice if desired.'
    ],
    ingredientsList: [
      { name: 'Ground Turkey', amount: 600, unit: Unit.GRAM },
      { name: 'Bell Pepper', amount: 200, unit: Unit.GRAM },
      { name: 'Broccoli', amount: 200, unit: Unit.GRAM },
      { name: 'Mushrooms', amount: 150, unit: Unit.GRAM },
      { name: 'Carrots', amount: 100, unit: Unit.GRAM },
      { name: 'Coconut Oil', amount: 30, unit: Unit.MILLILITER },
      { name: 'Garlic', amount: 4, unit: Unit.PIECE },
      { name: 'Ginger', amount: 15, unit: Unit.GRAM }
    ],
    calories: 1000,
    protein_g: 110,
    totalFat_g: 45,
    saturatedFat_g: 18,
    cholesterol_mg: 480,
    sodium_mg: 280,
    carbohydrates_g: 25,
    fiber_g: 8,
    sugars_g: 18,
    image: 'uploads/recipe-paleo-beef-stir-fry.jpg'
  },
  {
    name: 'Dairy-Free Chocolate Avocado Mousse',
    description: 'Creamy and decadent chocolate mousse made with avocado instead of dairy.',
    tags: ['Vegan', 'Dairy-Free', 'Gluten-Free'],
    prepTimeMin: 15,
    cookTimeMin: 0,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'North American',
    instructions: [
      'Blend ripe avocados until smooth.',
      'Add cocoa powder and maple syrup.',
      'Blend until creamy and well combined.',
      'Add vanilla extract and pinch of salt.',
      'Chill for at least 2 hours.',
      'Serve in small bowls with berries.'
    ],
    ingredientsList: [
      { name: 'Avocado', amount: 3, unit: Unit.PIECE },
      { name: 'Dark Chocolate', amount: 100, unit: Unit.GRAM },
      { name: 'Maple Syrup', amount: 90, unit: Unit.MILLILITER },
      { name: 'Vanilla Extract', amount: 5, unit: Unit.MILLILITER },
      { name: 'Sea Salt', amount: 1, unit: Unit.GRAM },
      { name: 'Strawberries', amount: 200, unit: Unit.GRAM }
    ],
         calories: 920,
     protein_g: 15,
     totalFat_g: 52,
     saturatedFat_g: 18,
     cholesterol_mg: 0,
     sodium_mg: 240,
     carbohydrates_g: 105,
     fiber_g: 25,
     sugars_g: 75,
     image: 'uploads/recipe-dairy-free-chocolate-avocado-mousse.jpeg'
   },
   
   // Additional recipes v2
   {
         name: 'Greek Yogurt Parfait',
    description: 'Layered Greek yogurt with berries and nuts, perfect for breakfast or snack.',
    tags: ['Vegetarian', 'Gluten-Free', 'High-Protein'],
    prepTimeMin: 5,
    cookTimeMin: 0,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'European',
     instructions: [
       'Layer Greek yogurt in glasses.',
       'Add a layer of fresh berries.',
       'Sprinkle with chopped nuts.',
       'Drizzle with honey.',
       'Repeat layers.',
       'Serve immediately or chill.'
     ],
     ingredientsList: [
       { name: 'Greek Yogurt', amount: 400, unit: Unit.GRAM },
       { name: 'Blueberries', amount: 150, unit: Unit.GRAM },
       { name: 'Strawberries', amount: 150, unit: Unit.GRAM },
       { name: 'Walnuts', amount: 60, unit: Unit.GRAM },
       { name: 'Honey', amount: 30, unit: Unit.MILLILITER }
     ],
     calories: 720,
     protein_g: 45,
     totalFat_g: 28,
     saturatedFat_g: 8,
     cholesterol_mg: 40,
     sodium_mg: 180,
     carbohydrates_g: 65,
     fiber_g: 12,
     sugars_g: 55,
     image: 'uploads/recipe-greek-yogurt-parfait.jpg'
   },
   {
     name: 'Cauliflower Rice Stir-Fry',
     description: 'Low-carb stir-fry using cauliflower rice as a grain substitute.',
     tags: ['Keto', 'Low-Carb', 'Gluten-Free', 'Paleo'],
     prepTimeMin: 10,
     cookTimeMin: 15,
     servings: 4,
     difficulty: 'easy',
     cuisine: 'Asian',
     instructions: [
       'Pulse cauliflower in food processor to rice consistency.',
       'Heat oil in large pan or wok.',
       'Add vegetables and stir-fry until tender.',
       'Push vegetables to one side.',
       'Scramble eggs on the other side.',
       'Add cauliflower rice and mix everything.',
       'Season and serve hot.'
     ],
     ingredientsList: [
       { name: 'Cauliflower', amount: 800, unit: Unit.GRAM },
       { name: 'Eggs', amount: 3, unit: Unit.PIECE },
       { name: 'Carrots', amount: 100, unit: Unit.GRAM },
       { name: 'Bell Pepper', amount: 150, unit: Unit.GRAM },
       { name: 'Garlic', amount: 3, unit: Unit.PIECE },
       { name: 'Ginger', amount: 10, unit: Unit.GRAM },
       { name: 'Coconut Oil', amount: 30, unit: Unit.MILLILITER },
       { name: 'Sea Salt', amount: 3, unit: Unit.GRAM }
     ],
     calories: 450,
     protein_g: 25,
     totalFat_g: 28,
     saturatedFat_g: 18,
     cholesterol_mg: 558,
     sodium_mg: 720,
     carbohydrates_g: 35,
     fiber_g: 18,
     sugars_g: 22,
     image: 'uploads/recipe-cauliflower-rice-stir-fry.jpg'
   },
   {
         name: 'Almond Flour Crackers',
    description: 'Crispy homemade crackers made with almond flour, perfect for snacking.',
    tags: ['Keto', 'Low-Carb', 'Gluten-Free', 'Paleo'],
    prepTimeMin: 15,
    cookTimeMin: 25,
    servings: 6,
    difficulty: 'medium',
    cuisine: 'North American',
     instructions: [
       'Preheat oven to 160°C.',
       'Mix almond flour, salt, and herbs.',
       'Beat egg and mix into dry ingredients.',
       'Roll dough between parchment paper.',
       'Cut into small squares.',
       'Bake for 20-25 minutes until golden.',
       'Cool completely before serving.'
     ],
     ingredientsList: [
       { name: 'Almond Flour', amount: 200, unit: Unit.GRAM },
       { name: 'Eggs', amount: 1, unit: Unit.PIECE },
       { name: 'Sea Salt', amount: 5, unit: Unit.GRAM },
       { name: 'Rosemary', amount: 3, unit: Unit.GRAM },
       { name: 'Olive Oil', amount: 15, unit: Unit.MILLILITER }
     ],
     calories: 1200,
     protein_g: 48,
     totalFat_g: 105,
     saturatedFat_g: 12,
     cholesterol_mg: 186,
     sodium_mg: 1200,
     carbohydrates_g: 24,
     fiber_g: 12,
     sugars_g: 6,
     image: 'uploads/recipe-almond-flour-crackers.jpg'
   },
   {
     name: 'Stuffed Bell Peppers',
     description: 'Colorful bell peppers stuffed with quinoa, vegetables, and herbs.',
     tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
     prepTimeMin: 20,
     cookTimeMin: 40,
     servings: 4,
     difficulty: 'medium',
     cuisine: 'Mediterranean',
     instructions: [
       'Preheat oven to 180°C.',
       'Cut tops off bell peppers and remove seeds.',
       'Cook quinoa according to package instructions.',
       'Sauté onion, garlic, and mushrooms.',
       'Mix cooked quinoa with sautéed vegetables.',
       'Stuff peppers with quinoa mixture.',
       'Bake for 30-35 minutes until peppers are tender.'
     ],
     ingredientsList: [
       { name: 'Bell Pepper', amount: 4, unit: Unit.PIECE },
       { name: 'Quinoa', amount: 150, unit: Unit.GRAM },
       { name: 'Mushrooms', amount: 200, unit: Unit.GRAM },
       { name: 'Red Onion', amount: 100, unit: Unit.GRAM },
       { name: 'Garlic', amount: 3, unit: Unit.PIECE },
       { name: 'Tomatoes', amount: 200, unit: Unit.GRAM },
       { name: 'Olive Oil', amount: 30, unit: Unit.MILLILITER },
       { name: 'Basil', amount: 10, unit: Unit.GRAM }
     ],
     calories: 750,
     protein_g: 28,
     totalFat_g: 18,
     saturatedFat_g: 3,
     cholesterol_mg: 0,
     sodium_mg: 120,
     carbohydrates_g: 125,
     fiber_g: 22,
     sugars_g: 35,
     image: 'uploads/recipe-stuffed-bell-peppers.jpg'
   },
   {
         name: 'Sweet Potato Hash',
    description: 'Hearty breakfast hash with roasted sweet potatoes and vegetables.',
    tags: ['Vegan', 'Gluten-Free', 'Paleo'],
    prepTimeMin: 15,
    cookTimeMin: 25,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'North American',
     instructions: [
       'Dice sweet potatoes into small cubes.',
       'Heat oil in large skillet.',
       'Add sweet potatoes and cook until tender.',
       'Add bell peppers and onions.',
       'Season with spices and herbs.',
       'Cook until vegetables are caramelized.',
       'Serve hot, optionally topped with avocado.'
     ],
     ingredientsList: [
       { name: 'Sweet Potato', amount: 600, unit: Unit.GRAM },
       { name: 'Bell Pepper', amount: 200, unit: Unit.GRAM },
       { name: 'Red Onion', amount: 150, unit: Unit.GRAM },
       { name: 'Olive Oil', amount: 45, unit: Unit.MILLILITER },
       { name: 'Paprika', amount: 5, unit: Unit.GRAM },
       { name: 'Cumin', amount: 3, unit: Unit.GRAM },
       { name: 'Garlic', amount: 3, unit: Unit.PIECE }
     ],
     calories: 820,
     protein_g: 12,
     totalFat_g: 32,
     saturatedFat_g: 5,
     cholesterol_mg: 0,
     sodium_mg: 180,
     carbohydrates_g: 130,
     fiber_g: 18,
     sugars_g: 28,
     image: 'uploads/recipe-sweet-potato-hash.jpg'
   },
   {
         name: 'Coconut Chia Pudding',
    description: 'Tropical chia pudding with coconut milk and fresh mango.',
    tags: ['Vegan', 'Gluten-Free', 'Dairy-Free'],
    prepTimeMin: 10,
    cookTimeMin: 0,
    servings: 3,
    difficulty: 'easy',
    cuisine: 'Other',
     instructions: [
       'Mix chia seeds with coconut milk.',
       'Add maple syrup and vanilla.',
       'Whisk thoroughly to prevent clumping.',
       'Refrigerate for at least 4 hours.',
       'Stir once after 30 minutes.',
       'Top with fresh mango and coconut flakes.',
       'Serve chilled.'
     ],
     ingredientsList: [
       { name: 'Chia Seeds', amount: 75, unit: Unit.GRAM },
       { name: 'Coconut Milk', amount: 450, unit: Unit.MILLILITER },
       { name: 'Maple Syrup', amount: 45, unit: Unit.MILLILITER },
       { name: 'Vanilla Extract', amount: 5, unit: Unit.MILLILITER },
       { name: 'Coconut', amount: 30, unit: Unit.GRAM }
     ],
     calories: 920,
     protein_g: 18,
     totalFat_g: 75,
     saturatedFat_g: 58,
     cholesterol_mg: 0,
     sodium_mg: 45,
     carbohydrates_g: 50,
     fiber_g: 28,
     sugars_g: 35,
     image: 'uploads/recipe-coconut-chia-pudding.jpg'
   },
   {
     name: 'Turkey Lettuce Wraps',
     description: 'Light and fresh lettuce wraps filled with seasoned ground turkey.',
     tags: ['Paleo', 'Low-Carb', 'Gluten-Free', 'High-Protein'],
     prepTimeMin: 15,
     cookTimeMin: 15,
     servings: 4,
     difficulty: 'easy',
     cuisine: 'Asian',
     instructions: [
       'Heat oil in large skillet.',
       'Cook ground turkey until browned.',
       'Add garlic, ginger, and vegetables.',
       'Season with spices and cook until tender.',
       'Wash and separate lettuce leaves.',
       'Fill lettuce cups with turkey mixture.',
       'Serve immediately with lime wedges.'
     ],
     ingredientsList: [
       { name: 'Ground Turkey', amount: 500, unit: Unit.GRAM },
       { name: 'Lettuce', amount: 200, unit: Unit.GRAM },
       { name: 'Mushrooms', amount: 150, unit: Unit.GRAM },
       { name: 'Carrots', amount: 100, unit: Unit.GRAM },
       { name: 'Garlic', amount: 4, unit: Unit.PIECE },
       { name: 'Ginger', amount: 15, unit: Unit.GRAM },
       { name: 'Coconut Oil', amount: 30, unit: Unit.MILLILITER },
       { name: 'Lime', amount: 1, unit: Unit.PIECE }
     ],
     calories: 850,
     protein_g: 95,
     totalFat_g: 42,
     saturatedFat_g: 20,
     cholesterol_mg: 400,
     sodium_mg: 280,
     carbohydrates_g: 20,
     fiber_g: 8,
     sugars_g: 12,
     image: 'uploads/recipe-turkey-lettuce-wrap.jpg'
   },
   {
     name: 'Roasted Vegetable Quinoa Salad',
     description: 'Colorful roasted vegetables tossed with quinoa and herb dressing.',
     tags: ['Vegan', 'Gluten-Free', 'High-Protein'],
     prepTimeMin: 20,
     cookTimeMin: 30,
     servings: 6,
     difficulty: 'easy',
     cuisine: 'Mediterranean',
     instructions: [
       'Preheat oven to 200°C.',
       'Chop vegetables into uniform pieces.',
       'Toss vegetables with olive oil and seasonings.',
       'Roast for 25-30 minutes until tender.',
       'Cook quinoa according to package instructions.',
       'Mix roasted vegetables with quinoa.',
       'Drizzle with lemon juice and herbs before serving.'
     ],
     ingredientsList: [
       { name: 'Quinoa', amount: 200, unit: Unit.GRAM },
       { name: 'Zucchini', amount: 200, unit: Unit.GRAM },
       { name: 'Bell Pepper', amount: 200, unit: Unit.GRAM },
       { name: 'Brussels Sprouts', amount: 200, unit: Unit.GRAM },
       { name: 'Red Onion', amount: 100, unit: Unit.GRAM },
       { name: 'Olive Oil', amount: 60, unit: Unit.MILLILITER },
       { name: 'Lemon Juice', amount: 45, unit: Unit.MILLILITER },
       { name: 'Thyme', amount: 5, unit: Unit.GRAM }
     ],
     calories: 1100,
     protein_g: 35,
     totalFat_g: 45,
     saturatedFat_g: 7,
     cholesterol_mg: 0,
     sodium_mg: 120,
     carbohydrates_g: 145,
     fiber_g: 25,
     sugars_g: 25,
     image: 'uploads/recipe-quinoa-salad.avif'
   },

   // HIGH-CALORIE & HIGH-PROTEIN OPTIONS
   {
     name: 'Ultimate Protein Power Bowl',
     description: 'Massive protein-packed bowl with quinoa, chicken, eggs, and nuts for serious nutrition goals.',
     tags: ['High-Protein', 'Gluten-Free'],
     prepTimeMin: 25,
     cookTimeMin: 35,
     servings: 1,
     difficulty: 'medium',
     cuisine: 'North American',
     instructions: [
       'Cook quinoa according to package instructions.',
       'Season and grill chicken breast until cooked through.',
       'Hard boil eggs and slice in half.',
       'Toast nuts and seeds in dry pan.',
       'Massage kale with olive oil and lemon.',
       'Slice avocado and prepare all toppings.',
       'Assemble everything in a large bowl.',
       'Drizzle with tahini dressing and serve.'
     ],
     ingredientsList: [
       { name: 'Chicken Breast', amount: 250, unit: Unit.GRAM },
       { name: 'Quinoa', amount: 100, unit: Unit.GRAM },
       { name: 'Eggs', amount: 2, unit: Unit.PIECE },
       { name: 'Avocado', amount: 1, unit: Unit.PIECE },
       { name: 'Almonds', amount: 50, unit: Unit.GRAM },
       { name: 'Walnuts', amount: 40, unit: Unit.GRAM },
       { name: 'Chia Seeds', amount: 20, unit: Unit.GRAM },
       { name: 'Hemp Seeds', amount: 20, unit: Unit.GRAM },
       { name: 'Kale', amount: 100, unit: Unit.GRAM },
       { name: 'Olive Oil', amount: 30, unit: Unit.MILLILITER },
       { name: 'Tahini', amount: 30, unit: Unit.GRAM }
     ],
     calories: 1450,
     protein_g: 82,
     totalFat_g: 95,
     saturatedFat_g: 15,
     cholesterol_mg: 558,
     sodium_mg: 320,
     carbohydrates_g: 65,
     fiber_g: 28,
     sugars_g: 12,
     image: 'uploads/recipe-protein-power-bowl.jpg'
   },
   {
     name: 'Massive Muscle-Building Smoothie',
     description: 'High-calorie protein smoothie with multiple protein sources for serious gains.',
     tags: ['High-Protein', 'Gluten-Free'],
     prepTimeMin: 10,
     cookTimeMin: 0,
     servings: 1,
     difficulty: 'easy',
     cuisine: 'North American',
     instructions: [
       'Add all liquid ingredients to blender first.',
       'Add protein powder and blend until smooth.',
       'Add frozen banana and berries.',
       'Add oats, nut butter, and seeds.',
       'Blend until completely smooth and creamy.',
       'Add ice if needed for consistency.',
       'Pour into large glass and serve immediately.'
     ],
     ingredientsList: [
       { name: 'Protein Powder', amount: 60, unit: Unit.GRAM },
       { name: 'Greek Yogurt', amount: 250, unit: Unit.GRAM },
       { name: 'Almond Milk', amount: 400, unit: Unit.MILLILITER },
       { name: 'Banana', amount: 2, unit: Unit.PIECE },
       { name: 'Blueberries', amount: 150, unit: Unit.GRAM },
       { name: 'Oats', amount: 80, unit: Unit.GRAM },
       { name: 'Almond Butter', amount: 60, unit: Unit.GRAM },
       { name: 'Chia Seeds', amount: 20, unit: Unit.GRAM },
       { name: 'Hemp Seeds', amount: 20, unit: Unit.GRAM },
       { name: 'Honey', amount: 30, unit: Unit.MILLILITER }
     ],
     calories: 1380,
     protein_g: 88,
     totalFat_g: 42,
     saturatedFat_g: 8,
     cholesterol_mg: 25,
     sodium_mg: 280,
     carbohydrates_g: 145,
     fiber_g: 22,
     sugars_g: 95,
     image: 'uploads/recipe-muscle-smoothie.avif'
   },
   {
     name: 'Loaded Salmon & Sweet Potato Feast',
     description: 'Substantial meal with large salmon fillet, roasted sweet potatoes, and avocado.',
     tags: ['High-Protein', 'Gluten-Free', 'Paleo'],
     prepTimeMin: 20,
     cookTimeMin: 40,
     servings: 1,
     difficulty: 'medium',
     cuisine: 'North American',
     instructions: [
       'Preheat oven to 200°C.',
       'Cut sweet potatoes into wedges and toss with oil.',
       'Roast sweet potatoes for 35-40 minutes.',
       'Season salmon with herbs and oil.',
       'Pan-sear salmon for 4-5 minutes per side.',
       'Steam asparagus until tender.',
       'Slice avocado and prepare lemon dressing.',
       'Plate everything together with generous portions.'
     ],
     ingredientsList: [
       { name: 'Salmon Fillet', amount: 300, unit: Unit.GRAM },
       { name: 'Sweet Potato', amount: 400, unit: Unit.GRAM },
       { name: 'Asparagus', amount: 200, unit: Unit.GRAM },
       { name: 'Avocado', amount: 1, unit: Unit.PIECE },
       { name: 'Olive Oil', amount: 45, unit: Unit.MILLILITER },
       { name: 'Almonds', amount: 40, unit: Unit.GRAM },
       { name: 'Lemon', amount: 1, unit: Unit.PIECE },
       { name: 'Garlic', amount: 3, unit: Unit.PIECE },
       { name: 'Rosemary', amount: 5, unit: Unit.GRAM }
     ],
     calories: 1520,
     protein_g: 78,
     totalFat_g: 85,
     saturatedFat_g: 18,
     cholesterol_mg: 180,
     sodium_mg: 280,
     carbohydrates_g: 95,
     fiber_g: 25,
     sugars_g: 35,
     image: 'uploads/recipe-salmon-sweet-potato.jpg'
   },
   {
     name: 'High-Protein Trail Mix Energy Balls',
     description: 'Calorie-dense energy balls loaded with nuts, seeds, and protein powder.',
     tags: ['High-Protein', 'Gluten-Free', 'Vegan'],
     prepTimeMin: 20,
     cookTimeMin: 0,
     servings: 1,
     difficulty: 'easy',
     cuisine: 'North American',
     instructions: [
       'Process all nuts until roughly chopped.',
       'Add protein powder, seeds, and spices.',
       'Mix in nut butters and maple syrup.',
       'Add vanilla and mix until combined.',
       'Form into 8-10 large energy balls.',
       'Roll in coconut flakes if desired.',
       'Refrigerate for 1 hour before eating.'
     ],
     ingredientsList: [
       { name: 'Almonds', amount: 80, unit: Unit.GRAM },
       { name: 'Walnuts', amount: 80, unit: Unit.GRAM },
       { name: 'Cashews', amount: 60, unit: Unit.GRAM },
       { name: 'Protein Powder', amount: 40, unit: Unit.GRAM },
       { name: 'Chia Seeds', amount: 25, unit: Unit.GRAM },
       { name: 'Hemp Seeds', amount: 25, unit: Unit.GRAM },
       { name: 'Almond Butter', amount: 80, unit: Unit.GRAM },
       { name: 'Tahini', amount: 40, unit: Unit.GRAM },
       { name: 'Maple Syrup', amount: 60, unit: Unit.MILLILITER },
       { name: 'Dark Chocolate', amount: 50, unit: Unit.GRAM },
       { name: 'Coconut', amount: 30, unit: Unit.GRAM }
     ],
     calories: 1620,
     protein_g: 68,
     totalFat_g: 125,
     saturatedFat_g: 22,
     cholesterol_mg: 0,
     sodium_mg: 180,
     carbohydrates_g: 85,
     fiber_g: 28,
     sugars_g: 45,
     image: 'uploads/recipe-trail-mix-energy-balls.avif'
   },
   {
     name: 'Giant Protein Pancake Stack',
     description: 'Stack of protein-packed pancakes with nuts, berries, and nut butter.',
     tags: ['High-Protein', 'Gluten-Free', 'Vegetarian'],
     prepTimeMin: 15,
     cookTimeMin: 20,
     servings: 1,
     difficulty: 'medium',
     cuisine: 'North American',
     instructions: [
       'Blend oats into flour consistency.',
       'Mix oat flour, almond flour, and protein powder.',
       'In another bowl, whisk eggs, milk, and vanilla.',
       'Combine wet and dry ingredients until smooth.',
       'Cook 6-8 large pancakes in coconut oil.',
       'Stack pancakes with layers of nut butter.',
       'Top with berries, nuts, and maple syrup.'
     ],
     ingredientsList: [
       { name: 'Oats', amount: 120, unit: Unit.GRAM },
       { name: 'Almond Flour', amount: 80, unit: Unit.GRAM },
       { name: 'Protein Powder', amount: 40, unit: Unit.GRAM },
       { name: 'Eggs', amount: 3, unit: Unit.PIECE },
       { name: 'Almond Milk', amount: 300, unit: Unit.MILLILITER },
       { name: 'Almond Butter', amount: 60, unit: Unit.GRAM },
       { name: 'Coconut Oil', amount: 30, unit: Unit.MILLILITER },
       { name: 'Blueberries', amount: 150, unit: Unit.GRAM },
       { name: 'Walnuts', amount: 50, unit: Unit.GRAM },
       { name: 'Maple Syrup', amount: 60, unit: Unit.MILLILITER }
     ],
     calories: 1480,
     protein_g: 75,
     totalFat_g: 78,
     saturatedFat_g: 18,
     cholesterol_mg: 558,
     sodium_mg: 320,
     carbohydrates_g: 125,
     fiber_g: 25,
     sugars_g: 65,
     image: 'uploads/recipe-protein-pancake.avif'
   },
   {
     name: 'Hearty Beef & Vegetable Stir-Fry',
     description: 'Large portion stir-fry with beef, vegetables, and nuts over cauliflower rice.',
     tags: ['High-Protein', 'Low-Carb', 'Gluten-Free', 'Paleo'],
     prepTimeMin: 20,
     cookTimeMin: 20,
     servings: 1,
     difficulty: 'medium',
     cuisine: 'Asian',
     instructions: [
       'Slice beef into thin strips and season.',
       'Pulse cauliflower in food processor to rice consistency.',
       'Heat oil in large wok or pan.',
       'Stir-fry beef until browned, remove and set aside.',
       'Add vegetables and stir-fry until tender.',
       'Add cauliflower rice and cook for 5 minutes.',
       'Return beef to pan and toss everything together.',
       'Garnish with nuts and serve immediately.'
     ],
     ingredientsList: [
       { name: 'Ground Turkey', amount: 300, unit: Unit.GRAM },
       { name: 'Cauliflower', amount: 400, unit: Unit.GRAM },
       { name: 'Bell Pepper', amount: 200, unit: Unit.GRAM },
       { name: 'Broccoli', amount: 200, unit: Unit.GRAM },
       { name: 'Mushrooms', amount: 150, unit: Unit.GRAM },
       { name: 'Cashews', amount: 60, unit: Unit.GRAM },
       { name: 'Coconut Oil', amount: 40, unit: Unit.MILLILITER },
       { name: 'Avocado', amount: 1, unit: Unit.PIECE },
       { name: 'Garlic', amount: 4, unit: Unit.PIECE },
       { name: 'Ginger', amount: 20, unit: Unit.GRAM }
     ],
     calories: 1350,
     protein_g: 85,
     totalFat_g: 88,
     saturatedFat_g: 35,
     cholesterol_mg: 240,
     sodium_mg: 380,
     carbohydrates_g: 45,
     fiber_g: 22,
     sugars_g: 25,
     image: 'uploads/recipe-beef-vegetable-stir-fry.avif'
   },
   {
     name: 'Ultimate Veggie-Loaded Omelet',
     description: 'Massive 4-egg omelet packed with vegetables, cheese, and avocado.',
     tags: ['High-Protein', 'Low-Carb', 'Gluten-Free', 'Vegetarian'],
     prepTimeMin: 15,
     cookTimeMin: 15,
     servings: 1,
     difficulty: 'medium',
     cuisine: 'North American',
     instructions: [
       'Sauté mushrooms, bell peppers, and spinach.',
       'Beat eggs with salt and pepper.',
       'Heat oil in large non-stick pan.',
       'Pour in eggs and let set on bottom.',
       'Add sautéed vegetables to one half.',
       'Add cheese and fold omelet over.',
       'Slide onto plate and top with avocado.',
       'Serve with side of nuts and seeds.'
     ],
     ingredientsList: [
       { name: 'Eggs', amount: 4, unit: Unit.PIECE },
       { name: 'Cottage Cheese', amount: 150, unit: Unit.GRAM },
       { name: 'Spinach', amount: 150, unit: Unit.GRAM },
       { name: 'Mushrooms', amount: 150, unit: Unit.GRAM },
       { name: 'Bell Pepper', amount: 100, unit: Unit.GRAM },
       { name: 'Avocado', amount: 1, unit: Unit.PIECE },
       { name: 'Walnuts', amount: 40, unit: Unit.GRAM },
       { name: 'Olive Oil', amount: 25, unit: Unit.MILLILITER },
       { name: 'Cherry Tomatoes', amount: 100, unit: Unit.GRAM }
     ],
     calories: 1180,
     protein_g: 65,
     totalFat_g: 85,
     saturatedFat_g: 22,
     cholesterol_mg: 800,
     sodium_mg: 680,
     carbohydrates_g: 35,
     fiber_g: 20,
     sugars_g: 18,
     image: 'uploads/recipe-veggie-omelet.avif'
   }
];

// =================================
// CLEAR DATABASE FUNCTION
// =================================
const clearDatabase = async () => {
  // Drop all collections first
  await Promise.all([
    User.deleteMany({}),
    Recipe.deleteMany({}),
    Ingredient.deleteMany({}),
    MealplanTemplate.deleteMany({}),
    Post.deleteMany({}),
    UserMealplan.deleteMany({})
  ]);

  // Drop any existing indexes on the usermealplans collection
  if (mongoose.connection.db) {
    try {
      await mongoose.connection.db.collection('usermealplans').dropIndexes();
    } catch (error: any) {
      console.warn('Warning: Could not drop indexes, they might not exist yet:', error.message);
    }
  }
};

// =================================
// SEEDING FUNCTIONS
// =================================
const seedUsers = async () => {
  const users = [];
  
  for (const userData of sampleUsers) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new User({
      ...userData,  // This spreads all fields from userData
      password: hashedPassword,
      // Explicitly set fields that might be arrays or objects to ensure proper copying
      weightHistory: userData.weightHistory ? [...userData.weightHistory] : undefined,
      fitnessGoal: userData.fitnessGoal,
      height: userData.height,
      biologicalGender: userData.biologicalGender,
      age: userData.age,
      activityLevel: userData.activityLevel,
      dailyCalories: userData.dailyCalories,
      dailyProteins: userData.dailyProteins,
      dailyCarbs: userData.dailyCarbs,
      dailyFats: userData.dailyFats
    });

    const savedUser = await user.save();
    users.push(savedUser);
  }
  
  return users;
};

const seedIngredients = async () => {
  const ingredients = [];
  
  for (const ingredientName of sampleIngredients) {
    const ingredient = new Ingredient({ name: ingredientName });
    const savedIngredient = await ingredient.save();
    ingredients.push(savedIngredient);
  }
  
  return ingredients;
};

const seedRecipes = async (users: any[], ingredients: any[]) => {
  const recipes = [];
  
  // Find specific users by email for assignment
  const kim = users.find(u => u.email === 'kim.schlemmer@tum.de');
  const mert = users.find(u => u.email === 'mert.ayvazoglu@tum.de');
  const bengisu = users.find(u => u.email === 'bengisu.ozdemir@tum.de');
  const nick = users.find(u => u.email === 'nick.breit@tum.de');
  const chef = users.find(u => u.email === 'chef.emma@tum.de');

  if (!chef || !kim || !mert || !bengisu || !nick) {
    throw new Error('Could not find all required users');
  }

  // Define specific author assignments (not evenly distributed)
  // IMPORTANT: This array must have exactly the same length as sampleRecipes
  // Each index corresponds to the recipe at the same index in sampleRecipes
  const authorAssignments = [
    chef, chef, chef, chef, chef, // First 5 recipes by Chef Emma
    kim, kim, kim, // Next 3 by Kim
    mert, mert, // Next 2 by Mert
    bengisu, bengisu, bengisu, bengisu, // Next 4 by Bengisu
    nick, // 1 by Nick
    chef, chef, chef, // 3 more by Chef Emma
    kim, kim, // 2 more by Kim
    mert, bengisu, nick, // Next 3 distributed
    chef, chef, chef, // High-calorie recipes by Chef Emma
    kim, kim, // High-protein recipes by Kim
    mert, mert // Last 2 by Mert
  ];

  // Define specific ratings for each recipe (4-5 range)
  const recipeRatings = [
    [
      { user: kim, rating: 5 },
      { user: mert, rating: 5 },
      { user: bengisu, rating: 4 }
    ],
    [
      { user: kim, rating: 4 },
      { user: nick, rating: 5 },
      { user: bengisu, rating: 5 },
      { user: mert, rating: 4 }
    ],
    [
      { user: mert, rating: 5 },
      { user: bengisu, rating: 5 },
      { user: kim, rating: 4 }
    ],
    [
      { user: nick, rating: 4 },
      { user: kim, rating: 5 },
      { user: chef, rating: 5 },
      { user: mert, rating: 4 }
    ],
    [
      { user: bengisu, rating: 5 },
      { user: kim, rating: 5 },
      { user: nick, rating: 4 }
    ],
    [
      { user: kim, rating: 5 },
      { user: mert, rating: 5 },
      { user: bengisu, rating: 4 },
      { user: nick, rating: 4 }
    ],
    [
      { user: chef, rating: 5 },
      { user: kim, rating: 4 },
      { user: mert, rating: 5 }
    ],
    [
      { user: bengisu, rating: 4 },
      { user: nick, rating: 5 },
      { user: kim, rating: 5 }
    ],
    [
      { user: mert, rating: 4 },
      { user: chef, rating: 5 },
      { user: bengisu, rating: 5 },
      { user: kim, rating: 4 }
    ],
    [
      { user: kim, rating: 5 },
      { user: nick, rating: 4 },
      { user: mert, rating: 5 }
    ],
    [
      { user: bengisu, rating: 5 },
      { user: chef, rating: 5 },
      { user: kim, rating: 4 }
    ],
    [
      { user: mert, rating: 4 },
      { user: nick, rating: 5 },
      { user: bengisu, rating: 4 },
      { user: kim, rating: 5 }
    ],
    [
      { user: chef, rating: 5 },
      { user: kim, rating: 4 },
      { user: mert, rating: 4 }
    ],
    [
      { user: bengisu, rating: 5 },
      { user: nick, rating: 5 },
      { user: kim, rating: 4 }
    ],
    [
      { user: mert, rating: 5 },
      { user: chef, rating: 5 },
      { user: bengisu, rating: 4 }
    ],
    [
      { user: kim, rating: 4 },
      { user: nick, rating: 5 },
      { user: mert, rating: 5 },
      { user: bengisu, rating: 4 }
    ],
    [
      { user: chef, rating: 5 },
      { user: kim, rating: 5 },
      { user: mert, rating: 4 }
    ],
    [
      { user: bengisu, rating: 4 },
      { user: nick, rating: 5 },
      { user: kim, rating: 5 }
    ],
    [
      { user: mert, rating: 4 },
      { user: chef, rating: 5 },
      { user: bengisu, rating: 5 },
      { user: kim, rating: 4 }
    ],
    [
      { user: kim, rating: 5 },
      { user: nick, rating: 4 },
      { user: mert, rating: 5 }
    ],
    [
      { user: bengisu, rating: 4 },
      { user: chef, rating: 5 },
      { user: kim, rating: 4 }
    ],
    [
      { user: kim, rating: 5 },
      { user: mert, rating: 5 },
      { user: bengisu, rating: 5 },
      { user: nick, rating: 4 }
    ],
    [
      { user: chef, rating: 5 },
      { user: kim, rating: 5 },
      { user: mert, rating: 4 },
      { user: bengisu, rating: 4 }
    ],
    [
      { user: kim, rating: 5 },
      { user: chef, rating: 5 },
      { user: nick, rating: 5 }
    ],
    [
      { user: bengisu, rating: 4 },
      { user: mert, rating: 5 },
      { user: kim, rating: 5 },
      { user: chef, rating: 5 }
    ],
    [
      { user: kim, rating: 5 },
      { user: nick, rating: 5 },
      { user: mert, rating: 4 }
    ],
    [
      { user: chef, rating: 5 },
      { user: bengisu, rating: 5 },
      { user: kim, rating: 5 },
      { user: mert, rating: 4 }
    ],
    [
      { user: kim, rating: 5 },
      { user: chef, rating: 5 },
      { user: nick, rating: 4 },
      { user: bengisu, rating: 4 }
    ]
  ];

  for (let i = 0; i < sampleRecipes.length; i++) {
    const recipeData = sampleRecipes[i];
    
    // Convert ingredientsList to proper ingredient references
    const recipeIngredients = recipeData.ingredientsList.map((ing: any) => {
      const foundIngredient = ingredients.find(ingredient => ingredient.name === ing.name);
      if (!foundIngredient) {
        throw new Error(`Ingredient not found: ${ing.name}`);
      }
      return {
        ingredient: foundIngredient._id,
        amount: ing.amount,
        unit: ing.unit
      };
    });

    // Assign specific author (not evenly distributed)
    const author = authorAssignments[i] || chef; // Default to chef if index out of bounds
    
    // Create recipe with specific ratings
    const recipe = new Recipe({
      name: recipeData.name,
      description: recipeData.description,
      tags: recipeData.tags,
      prepTimeMin: recipeData.prepTimeMin,
      cookTimeMin: recipeData.cookTimeMin,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      cuisine: recipeData.cuisine,
      instructions: recipeData.instructions,
      ingredients: recipeIngredients,
      calories: recipeData.calories,
      protein_g: recipeData.protein_g,
      totalFat_g: recipeData.totalFat_g,
      saturatedFat_g: recipeData.saturatedFat_g,
      cholesterol_mg: recipeData.cholesterol_mg,
      sodium_mg: recipeData.sodium_mg,
      carbohydrates_g: recipeData.carbohydrates_g,
      fiber_g: recipeData.fiber_g,
      sugars_g: recipeData.sugars_g,
      image: recipeData.image,
      author: author._id,
      isPublic: true
    });

    // Add specific ratings for this recipe
    const ratingsForRecipe = recipeRatings[i] || [
      { user: kim, rating: 4 },
      { user: mert, rating: 5 }
    ]; // Default ratings if index out of bounds
    
    const ratings = ratingsForRecipe.map(r => ({
      user: r.user._id,
      value: r.rating
    }));
    
    recipe.ratings = ratings;
    
    // Calculate average rating
    const totalRating = ratings.reduce((sum, rating) => sum + rating.value, 0);
    recipe.averageRating = Math.round((totalRating / ratings.length) * 10) / 10; // Round to 1 decimal
    recipe.ratings = ratings;

    // Generate embedding for the recipe
    console.log(`Generating embedding for recipe: "${recipeData.name}"`);
    try {
      // Convert ingredients to the format expected by the embedding function
      const embeddingIngredients = recipeIngredients.map((ing: any) => {
        const foundIngredient = ingredients.find(ingredient => ingredient._id.equals(ing.ingredient));
        return {
          ingredient: { name: foundIngredient?.name || 'unknown' },
          amount: ing.amount,
          unit: ing.unit
        };
      });

      const embedding = await generateRecipeEmbedding({
        name: recipeData.name,
        description: recipeData.description,
        instructions: recipeData.instructions,
        tags: recipeData.tags || [],
        ingredients: embeddingIngredients as any,
        cuisine: recipeData.cuisine,
        difficulty: recipeData.difficulty,
        prepTimeMin: recipeData.prepTimeMin,
        cookTimeMin: recipeData.cookTimeMin,
        servings: recipeData.servings
      });
      recipe.embedding = embedding;
      console.log(`Embedding generated successfully for "${recipeData.name}"`);
    } catch (embeddingError: any) {
      console.warn(`Failed to generate embedding for "${recipeData.name}":`, embeddingError.message);
      // Continue with recipe creation even if embedding fails
      // This ensures the core functionality still works
    }

    const savedRecipe = await recipe.save();
    recipes.push(savedRecipe);
  }
  
  return recipes;
};

const seedMealplanTemplates = async (users: any[], recipes: any[]) => {
  const mealplanTemplates = [];
  
  // Find specific users by email for assignment
  const kim = users.find(u => u.email === 'kim.schlemmer@tum.de');
  const chef = users.find(u => u.email === 'chef.emma@tum.de');
  const mert = users.find(u => u.email === 'mert.ayvazoglu@tum.de');
  const bengisu = users.find(u => u.email === 'bengisu.ozdemir@tum.de');
  const nick = users.find(u => u.email === 'nick.breit@tum.de');

  // Helper function to get recipe by name
  const getRecipeByName = (name: string) => {
    return recipes.find(r => r.name === name);
  };

  // Days of the week for template slots
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // =================================
  // 1. WEIGHT LOSS MEAL PLAN TEMPLATE (~2000 calories/day)
  // =================================
  const weightLossSlots: IMealplanTemplateSlot[] = [];
  const weightLossRecipeAssignments = [
    // Day 1 - Monday
    { mealType: 'breakfast', recipe: 'High-Protein Chia Pudding', servings: 2 },
    { mealType: 'lunch', recipe: 'Mediterranean Quinoa Bowl', servings: 2 },
    { mealType: 'dinner', recipe: 'Herb-Crusted Chicken with Cauliflower Mash', servings: 3 },
    { mealType: 'snacks', recipe: 'Protein Energy Balls', servings: 2 },
    
    // Day 2 - Tuesday
    { mealType: 'breakfast', recipe: 'Keto Avocado Egg Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Cauliflower Rice Stir-Fry', servings: 4 },
    { mealType: 'dinner', recipe: 'Grilled Salmon with Roasted Vegetables', servings: 3 },
    { mealType: 'snacks', recipe: 'Greek Yogurt Parfait', servings: 1 },
    
    // Day 3 - Wednesday
    { mealType: 'breakfast', recipe: 'Gluten-Free Oat Pancakes', servings: 2 },
    { mealType: 'lunch', recipe: 'Turkey Lettuce Wraps', servings: 2 },
    { mealType: 'dinner', recipe: 'Lentil Walnut Bolognese with Zucchini Noodles', servings: 3 },
    { mealType: 'snacks', recipe: 'Coconut Chia Pudding', servings: 1 },
    
    // Day 4 - Thursday
    { mealType: 'breakfast', recipe: 'Green Smoothie Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Sweet Potato Hash', servings: 2 },
    { mealType: 'dinner', recipe: 'Coconut Curry with Tofu and Vegetables', servings: 3 },
    { mealType: 'snacks', recipe: 'Dairy-Free Chocolate Avocado Mousse', servings: 1 },
    
    // Day 5 - Friday
    { mealType: 'breakfast', recipe: 'High-Protein Chia Pudding', servings: 2 },
    { mealType: 'lunch', recipe: 'Stuffed Bell Peppers', servings: 3 },
    { mealType: 'dinner', recipe: 'Vegan Buddha Bowl', servings: 3 },
    { mealType: 'snacks', recipe: 'Almond Flour Crackers', servings: 1 },
    
    // Day 6 - Saturday
    { mealType: 'breakfast', recipe: 'Greek Yogurt Parfait', servings: 2 },
    { mealType: 'lunch', recipe: 'Roasted Vegetable Quinoa Salad', servings: 3 },
    { mealType: 'dinner', recipe: 'Paleo Beef Stir-Fry', servings: 3 },
    { mealType: 'snacks', recipe: 'Keto Fat Bombs', servings: 1 },
    
    // Day 7 - Sunday
    { mealType: 'breakfast', recipe: 'Keto Avocado Egg Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Cauliflower Rice Stir-Fry', servings: 4 },
    { mealType: 'dinner', recipe: 'Turkey Lettuce Wraps', servings: 3 },
    { mealType: 'snacks', recipe: 'Protein Energy Balls', servings: 2 }
  ];

  weightLossRecipeAssignments.forEach((assignment, index) => {
    const dayIndex = Math.floor(index / 4);
    const recipe = getRecipeByName(assignment.recipe);
    if (recipe) {
      weightLossSlots.push({
        dayOfWeek: daysOfWeek[dayIndex],
        mealType: assignment.mealType,
        recipe: recipe._id,
        servings: assignment.servings
      });
    }
  });

  const weightLossTemplate = new MealplanTemplate({
    author: kim._id,
    title: 'Weight Loss Meal Plan Template',
    description: 'Carefully designed meal plan targeting ~2200 calories per day to support healthy weight loss while maintaining proper nutrition and satiety.',
    tags: ['High-Protein', 'Low-Carb'],
    slots: weightLossSlots,
    difficulty: 'medium',
    image: 'uploads/mealplan-weight-loss.avif',
    ratings: [
      { user: chef._id, value: 5 },
      { user: mert._id, value: 4 },
      { user: bengisu._id, value: 5 }
    ],
    averageRating: 4.67
  });

  // =================================
  // 2. WEIGHT GAIN MEAL PLAN TEMPLATE (~2700 calories/day)
  // =================================
  const weightGainSlots: IMealplanTemplateSlot[] = [];
  const weightGainRecipeAssignments = [
    // Day 1 - Monday
    { mealType: 'breakfast', recipe: 'Gluten-Free Oat Pancakes', servings: 2 },
    { mealType: 'lunch', recipe: 'Mediterranean Quinoa Bowl', servings: 3 },
    { mealType: 'dinner', recipe: 'Herb-Crusted Chicken with Cauliflower Mash', servings: 4 },
    { mealType: 'snacks', recipe: 'Protein Energy Balls', servings: 2 },
    
    // Day 2 - Tuesday
    { mealType: 'breakfast', recipe: 'High-Protein Chia Pudding', servings: 2 },
    { mealType: 'lunch', recipe: 'Grilled Salmon with Roasted Vegetables', servings: 3 },
    { mealType: 'dinner', recipe: 'Vegan Buddha Bowl', servings: 3 },
    { mealType: 'snacks', recipe: 'Greek Yogurt Parfait', servings: 1 },
    
    // Day 3 - Wednesday
    { mealType: 'breakfast', recipe: 'Keto Avocado Egg Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Sweet Potato Hash', servings: 3 },
    { mealType: 'dinner', recipe: 'Lentil Walnut Bolognese with Zucchini Noodles', servings: 4 },
    { mealType: 'snacks', recipe: 'Almond Flour Crackers', servings: 2 },
    
    // Day 4 - Thursday
    { mealType: 'breakfast', recipe: 'Green Smoothie Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Turkey Lettuce Wraps', servings: 3 },
    { mealType: 'dinner', recipe: 'Coconut Curry with Tofu and Vegetables', servings: 4 },
    { mealType: 'snacks', recipe: 'Keto Fat Bombs', servings: 2 },
    
    // Day 5 - Friday
    { mealType: 'breakfast', recipe: 'Gluten-Free Oat Pancakes', servings: 2 },
    { mealType: 'lunch', recipe: 'Stuffed Bell Peppers', servings: 4 },
    { mealType: 'dinner', recipe: 'Paleo Beef Stir-Fry', servings: 4 },
    { mealType: 'snacks', recipe: 'Coconut Chia Pudding', servings: 1 },
    
    // Day 6 - Saturday
    { mealType: 'breakfast', recipe: 'High-Protein Chia Pudding', servings: 2 },
    { mealType: 'lunch', recipe: 'Mediterranean Quinoa Bowl', servings: 3 },
    { mealType: 'dinner', recipe: 'Roasted Vegetable Quinoa Salad', servings: 6 },
    { mealType: 'snacks', recipe: 'Dairy-Free Chocolate Avocado Mousse', servings: 1 },
    
    // Day 7 - Sunday
    { mealType: 'breakfast', recipe: 'Greek Yogurt Parfait', servings: 2 },
    { mealType: 'lunch', recipe: 'Cauliflower Rice Stir-Fry', servings: 4 },
    { mealType: 'dinner', recipe: 'Grilled Salmon with Roasted Vegetables', servings: 4 },
    { mealType: 'snacks', recipe: 'Protein Energy Balls', servings: 2 }
  ];

  weightGainRecipeAssignments.forEach((assignment, index) => {
    const dayIndex = Math.floor(index / 4);
    const recipe = getRecipeByName(assignment.recipe);
    if (recipe) {
      weightGainSlots.push({
        dayOfWeek: daysOfWeek[dayIndex],
        mealType: assignment.mealType,
        recipe: recipe._id,
        servings: assignment.servings
      });
    }
  });

  const weightGainTemplate = new MealplanTemplate({
    author: chef._id,
    title: 'Weight Gain Muscle Building Template',
    description: 'High-calorie meal plan designed for muscle building and healthy weight gain, targeting ~2700 calories per day with optimal protein distribution.',
    tags: ['High-Protein'],
    slots: weightGainSlots,
    difficulty: 'hard',
    image: 'uploads/mealplan-weight-gain.avif',
    ratings: [
      { user: kim._id, value: 5 },
      { user: mert._id, value: 5 },
      { user: nick._id, value: 4 },
      { user: bengisu._id, value: 4 }
    ],
    averageRating: 4.5
  });

  // =================================
  // 3. HEALTHY BALANCED MEAL PLAN TEMPLATE (~2300 calories/day)
  // =================================
  const healthySlots: IMealplanTemplateSlot[] = [];
  const healthyRecipeAssignments = [
    // Day 1 - Monday
    { mealType: 'breakfast', recipe: 'High-Protein Chia Pudding', servings: 2 },
    { mealType: 'lunch', recipe: 'Mediterranean Quinoa Bowl', servings: 2 },
    { mealType: 'dinner', recipe: 'Grilled Salmon with Roasted Vegetables', servings: 3 },
    { mealType: 'snacks', recipe: 'Green Smoothie Bowl', servings: 1 },
    
    // Day 2 - Tuesday
    { mealType: 'breakfast', recipe: 'Greek Yogurt Parfait', servings: 2 },
    { mealType: 'lunch', recipe: 'Stuffed Bell Peppers', servings: 3 },
    { mealType: 'dinner', recipe: 'Coconut Curry with Tofu and Vegetables', servings: 3 },
    { mealType: 'snacks', recipe: 'Protein Energy Balls', servings: 2 },
    
    // Day 3 - Wednesday
    { mealType: 'breakfast', recipe: 'Gluten-Free Oat Pancakes', servings: 2 },
    { mealType: 'lunch', recipe: 'Turkey Lettuce Wraps', servings: 3 },
    { mealType: 'dinner', recipe: 'Vegan Buddha Bowl', servings: 2 },
    { mealType: 'snacks', recipe: 'Coconut Chia Pudding', servings: 1 },
    
    // Day 4 - Thursday
    { mealType: 'breakfast', recipe: 'Keto Avocado Egg Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Sweet Potato Hash', servings: 3 },
    { mealType: 'dinner', recipe: 'Herb-Crusted Chicken with Cauliflower Mash', servings: 3 },
    { mealType: 'snacks', recipe: 'Dairy-Free Chocolate Avocado Mousse', servings: 1 },
    
    // Day 5 - Friday
    { mealType: 'breakfast', recipe: 'Green Smoothie Bowl', servings: 2 },
    { mealType: 'lunch', recipe: 'Cauliflower Rice Stir-Fry', servings: 4 },
    { mealType: 'dinner', recipe: 'Lentil Walnut Bolognese with Zucchini Noodles', servings: 3 },
    { mealType: 'snacks', recipe: 'Almond Flour Crackers', servings: 1 },
    
    // Day 6 - Saturday
    { mealType: 'breakfast', recipe: 'High-Protein Chia Pudding', servings: 2 },
    { mealType: 'lunch', recipe: 'Roasted Vegetable Quinoa Salad', servings: 3 },
    { mealType: 'dinner', recipe: 'Paleo Beef Stir-Fry', servings: 3 },
    { mealType: 'snacks', recipe: 'Greek Yogurt Parfait', servings: 1 },
    
    // Day 7 - Sunday
    { mealType: 'breakfast', recipe: 'Gluten-Free Oat Pancakes', servings: 2 },
    { mealType: 'lunch', recipe: 'Mediterranean Quinoa Bowl', servings: 2 },
    { mealType: 'dinner', recipe: 'Coconut Curry with Tofu and Vegetables', servings: 3 },
    { mealType: 'snacks', recipe: 'Keto Fat Bombs', servings: 2 }
  ];

  healthyRecipeAssignments.forEach((assignment, index) => {
    const dayIndex = Math.floor(index / 4);
    const recipe = getRecipeByName(assignment.recipe);
    if (recipe) {
      healthySlots.push({
        dayOfWeek: daysOfWeek[dayIndex],
        mealType: assignment.mealType,
        recipe: recipe._id,
        servings: assignment.servings
      });
    }
  });

  const healthyTemplate = new MealplanTemplate({
    author: mert._id,
    title: 'Healthy Balanced Lifestyle Template',
    description: 'Well-balanced meal plan focusing on whole foods, varied nutrients, and sustainable eating habits. Perfect for maintaining health and energy.',
    tags: ['Healthy', 'Gluten-Free'],
    slots: healthySlots,
    difficulty: 'easy',
    image: 'uploads/mealplan-healthy.avif',
    ratings: [
      { user: kim._id, value: 4 },
      { user: chef._id, value: 5 },
      { user: nick._id, value: 5 },
      { user: bengisu._id, value: 4 }
    ],
    averageRating: 4.5
  });

  // Save all meal plan templates
  const savedWeightLoss = await weightLossTemplate.save();
  const savedWeightGain = await weightGainTemplate.save();
  const savedHealthy = await healthyTemplate.save();

  mealplanTemplates.push(savedWeightLoss, savedWeightGain, savedHealthy);
  return mealplanTemplates;
};

const seedPosts = async (users: any[], recipes: any[]) => {
  const posts = [];
  
  // Find specific users by email for assignment
  const kim = users.find(u => u.email === 'kim.schlemmer@tum.de');
  const chef = users.find(u => u.email === 'chef.emma@tum.de');
  const mert = users.find(u => u.email === 'mert.ayvazoglu@tum.de');
  const bengisu = users.find(u => u.email === 'bengisu.ozdemir@tum.de');
  const nick = users.find(u => u.email === 'nick.breit@tum.de');

  // Helper function to get recipe by name
  const getRecipeByName = (name: string) => {
    return recipes.find(r => r.name === name);
  };

  // Helper function to get random users for likes and comments
  const getRandomUsers = (count: number, exclude?: any) => {
    const availableUsers = users.filter(u => u._id.toString() !== exclude?._id.toString());
    const shuffled = availableUsers.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Sample post data with realistic content
  const samplePosts = [
    {
      author: chef,
      recipe: 'Ultimate Protein Power Bowl',
      content: "Just finished perfecting this incredible protein bowl! 💪 The combination of quinoa, grilled chicken, and all those superfoods makes it the perfect post-workout meal. The tahini dressing really brings everything together. Give it a try!",
      tags: ['HealthyEating', 'PostWorkout', 'ProteinBowl', 'ChefLife'],
      likes: 3,
      shares: 1,
      comments: [
        { author: kim, content: "This looks amazing! Can't wait to try the tahini dressing recipe 😍" },
        { author: mert, content: "Perfect timing! Just what I needed for my bulk 💪" },
        { author: bengisu, content: "Those colors are so beautiful! Nutrition and aesthetics in one bowl ✨" }
      ]
    },
    {
      author: kim,
      recipe: 'High-Protein Chia Pudding',
      content: "Morning fuel sorted! ☀️ This chia pudding has become my absolute favorite breakfast. Prepped 4 jars yesterday and now I have breakfast ready for the whole week. The protein powder makes it super filling too!",
      tags: ['MealPrep', 'BreakfastGoals', 'ChiaPudding', 'HealthyLifestyle'],
      likes: 4,
      shares: 1,
      comments: [
        { author: chef, content: "Meal prep master! 👑 This is exactly how you set yourself up for success" },
        { author: nick, content: "Which protein powder do you use? Mine always makes it taste chalky 🤔" },
        { author: kim, content: "@nick I use vanilla whey! The key is to whisk it really well to avoid clumps" }
      ]
    },
    {
      author: mert,
      recipe: 'Massive Muscle-Building Smoothie',
      content: "BEAST MODE ACTIVATED! 🚀 This smoothie is an absolute game-changer for my morning routine. 88g of protein and it actually tastes incredible. My new secret weapon for hitting those macros!",
      tags: ['BulkSeason', 'ProteinShake', 'GainzTime', 'MorningMotivation'],
      likes: 4,
      shares: 2,
      comments: [
        { author: chef, content: "Now that's what I call dedication! Keep crushing those goals 💪" },
        { author: bengisu, content: "The dedication is inspiring! Maybe I should try this for my fitness goals too" },
        { author: kim, content: "88g of protein?! That's impressive. How do you feel after drinking it?" },
        { author: mert, content: "@kim Honestly super energized! Takes a while to drink but totally worth it" }
      ]
    },
    {
      author: bengisu,
      recipe: 'Mediterranean Quinoa Bowl',
      content: "Bringing some Mediterranean sunshine to my plate! 🌞 This quinoa bowl reminds me of summer vacations in Greece. The fresh vegetables and that tahini dressing make every bite a little celebration ✨",
      tags: ['Mediterranean', 'FreshEating', 'VeggiePower', 'Mindfulness'],
      likes: 3,
      shares: 1,
      comments: [
        { author: chef, content: "Beautiful plating! The Mediterranean diet is one of my favorites to cook" },
        { author: kim, content: "This looks so fresh and colorful! Perfect for spring weather 🌸" }
      ]
    },
    {
      author: nick,
      recipe: 'Keto Avocado Egg Bowl',
      content: "Keto breakfast game strong! 🥑 Started my keto journey last month and this has become my go-to breakfast. Simple, delicious, and keeps me full until lunch. Who knew eating fat could be so satisfying? 😄",
      tags: ['KetoLife', 'LowCarb', 'BreakfastWin', 'HealthyFats'],
      likes: 2,
      shares: 0,
      comments: [
        { author: mert, content: "Keto crew! 🙌 How's your energy been since starting?" },
        { author: nick, content: "@mert Amazing actually! No more afternoon crashes" },
        { author: chef, content: "Great choice! This is one of my favorite keto-friendly recipes" }
      ]
    },
    {
      author: chef,
      recipe: 'Loaded Salmon & Sweet Potato Feast',
      content: "When you want to treat yourself but keep it healthy! 🐟🍠 This salmon dish proves that nutritious food doesn't have to be boring. The omega-3s and complex carbs make this perfect for recovery days.",
      tags: ['SalmonLove', 'HealthyIndulgence', 'RecoveryMeal', 'ChefSpecial'],
      likes: 4,
      shares: 1,
      comments: [
        { author: kim, content: "Your plating skills are incredible! This looks restaurant-quality 👨‍🍳" },
        { author: bengisu, content: "The colors are so vibrant! What spices did you use on the sweet potato?" },
        { author: chef, content: "@bengisu Just paprika, cumin, and a touch of garlic powder! Simple is best" }
      ]
    },
    {
      author: kim,
      recipe: 'Green Smoothie Bowl',
      content: "Green goodness to start the day! 🌱 I know it looks like baby food but trust me, this smoothie bowl tastes like a tropical vacation. The protein powder makes it substantial enough for my morning workouts too!",
      tags: ['GreenSmoothie', 'PlantPower', 'MorningRitual', 'TropicalVibes'],
      likes: 3,
      shares: 1,
      comments: [
        { author: mert, content: "The toppings look amazing! Love the chia seeds on top" },
        { author: nick, content: "Okay you've convinced me to try green smoothies 🥬" },
        { author: bengisu, content: "Such a beautiful way to get your greens! Very inspiring ✨" }
      ]
    },
    {
      author: mert,
      recipe: 'Hearty Beef & Vegetable Stir-Fry',
      content: "Quick dinner after a long training session! ⚡ This stir-fry is my lifesaver when I'm too tired to cook something complex but still need proper nutrition. 15 minutes and boom - complete meal!",
      tags: ['QuickMeal', 'PostWorkout', 'StirFryLife', 'EfficiencyWin'],
      likes: 3,
      shares: 1,
      comments: [
        { author: chef, content: "Love the efficiency! Sometimes simple is exactly what you need" },
        { author: kim, content: "This is perfect for busy weeknights! Saving this recipe 📌" }
      ]
    },
    {
      author: bengisu,
      recipe: 'Coconut Curry with Tofu and Vegetables',
      content: "Cozy vibes with this amazing curry! 🍛 The coconut milk makes everything so creamy and comforting. Perfect for these chilly evenings when you want something warming and nourishing. The turmeric gives it such a beautiful color too!",
      tags: ['CurryLove', 'CozyNights', 'PlantBased', 'ComfortFood'],
      likes: 4,
      shares: 1,
      comments: [
        { author: chef, content: "Curry is pure comfort food! Love how you captured the coziness" },
        { author: kim, content: "That golden color is gorgeous! I need to cook more with turmeric" },
        { author: nick, content: "Never been a tofu fan but this actually looks really appetizing!" }
      ]
    },
    {
      author: nick,
      recipe: 'Turkey Lettuce Wraps',
      content: "Light but satisfying dinner! 🥬 These lettuce wraps are genius - all the flavor of a hearty meal but without feeling heavy. Perfect when you want something fresh but still filling. Game changer for summer evenings!",
      tags: ['LightEating', 'SummerVibes', 'FreshMeal', 'HealthySwap'],
      likes: 2,
      shares: 0,
      comments: [
        { author: bengisu, content: "Such a creative way to enjoy a hearty meal! Love the freshness 🌿" },
        { author: mert, content: "Might try this on my next cut! Looks filling but light" }
      ]
    },
    {
      author: chef,
      recipe: 'Protein Energy Balls',
      content: "Snack prep Sunday! 🍫 Made a double batch of these energy balls and they're already almost gone. The perfect balance of sweet treat and functional nutrition. Great for pre-workout fuel or afternoon energy boost!",
      tags: ['SnackPrep', 'EnergyBalls', 'PreWorkout', 'HealthySnacking'],
      likes: 4,
      shares: 2,
      comments: [
        { author: kim, content: "These disappeared so fast in my house! Making more tomorrow 😂" },
        { author: mert, content: "Perfect pre-workout snack! Love that they're not overly sweet" },
        { author: bengisu, content: "The kids love these too! Win-win for healthy family snacking" }
      ]
    },
    {
      author: kim,
      recipe: 'Dairy-Free Chocolate Avocado Mousse',
      content: "Dessert that doesn't derail your goals! 🥑🍫 I was skeptical about avocado in dessert, but this mousse is absolutely incredible. Rich, creamy, and you'd never guess it's actually healthy. Mind blown!",
      tags: ['HealthyDessert', 'DairyFree', 'MindBlown', 'GuiltFreeIndulgence'],
      likes: 3,
      shares: 1,
      comments: [
        { author: chef, content: "The power of avocado! It's amazing what you can create with whole foods" },
        { author: nick, content: "Wait, this is made with avocado?! I need to try this ASAP" },
        { author: bengisu, content: "This looks so decadent! Perfect for when you want something special ✨" }
      ]
    }
  ];

  // Create posts with realistic engagement
  for (const postData of samplePosts) {
    const recipe = getRecipeByName(postData.recipe);
    if (!recipe) continue;

    // Post creation time (within last week)
    const postCreatedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    // Create comments array with proper chronological order
    const comments = postData.comments.map((comment, index) => {
      // Each comment is created after the post and after previous comments
      const commentDelay = (index + 1) * (Math.random() * 4 + 1) * 60 * 60 * 1000; // 1-5 hours after each other
      return {
        author: comment.author._id,
        content: comment.content,
        createdAt: new Date(postCreatedAt.getTime() + commentDelay)
      };
    });

    // Get random users for likes (limited to max 4 since we have 5 users and author can't like own post)
    const maxLikes = Math.min(postData.likes, 4);
    const likedByUsers = getRandomUsers(maxLikes, postData.author);
    
    const post = new Post({
      content: postData.content,
      author: postData.author._id,
      recipe: recipe._id,
      image: recipe.image, // Copy the recipe's image to the post
      tags: postData.tags,
      likedBy: likedByUsers.map(u => u._id),
      likes: maxLikes,
      shares: postData.shares,
      comments: comments,
      createdAt: postCreatedAt
    });

    const savedPost = await post.save();
    posts.push(savedPost);
  }

  return posts;
};

const seedUserMealplans = async (users: any[], healthyTemplate: any) => {
  const mealplans = [];
  
  // Helper function to get ISO date string for a given week and day
  const getDateForWeekDay = (week: string, dayOfWeek: string) => {
    const weekNumber = parseInt(week.split('-W')[1]);
    
    // We know that Monday of Week 28 in 2025 is June 30th
    const week28Monday = new Date('2025-07-07');
    const weekDiff = weekNumber - 28;
    const date = new Date(week28Monday);
    date.setDate(date.getDate() + (weekDiff * 7));
    
    // Add days based on dayOfWeek
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayIndex = days.indexOf(dayOfWeek);
    date.setDate(date.getDate() + dayIndex);
    
    return date.toISOString().split('T')[0];
  };

  // Create mealplans for weeks 30 and 31 of 2025 for each user
  const weeks = ['2025-W28', '2025-W29', '2025-W30'];
  
  for (const user of users) {
    for (const week of weeks) {
      // Convert template slots to mealplan slots
      const slots = healthyTemplate.slots.map((templateSlot: any) => ({
        date: getDateForWeekDay(week, templateSlot.dayOfWeek),
        mealType: templateSlot.mealType,
        recipe: templateSlot.recipe,
        servings: templateSlot.servings
      }));

      const mealplan = new UserMealplan({
        user: user._id,
        week,
        slots,
        template: healthyTemplate._id
      });

      try {
        const savedMealplan = await mealplan.save();
        mealplans.push(savedMealplan);
      } catch (error: any) {
        console.error(`Failed to save mealplan for user ${user.username} week ${week}:`, error.message);
        throw error;
      }
    }
  }
  
  return mealplans;
};

// =================================
// MAIN SEEDING FUNCTION
// =================================
export const seedSimpleDatabase = async (clearFirst: boolean = true) => {
  try {
    validateConfig();
    await mongoose.connect(DATABASE_CONFIG.uri, DATABASE_CONFIG.options);

    if (clearFirst) {
      await clearDatabase();
    }

    // Create users
    const users = await seedUsers();
    
    // Create ingredients
    const ingredients = await seedIngredients();
    
    // Create recipes with ratings
    const recipes = await seedRecipes(users, ingredients);
    
    // Create meal plan templates
    const mealplanTemplates = await seedMealplanTemplates(users, recipes);
    
    // Get the healthy template
    const healthyTemplate = mealplanTemplates.find(template => 
      template.title === 'Healthy Balanced Lifestyle Template'
    );
    
    // Create user mealplans based on healthy template
    const userMealplans = await seedUserMealplans(users, healthyTemplate);
    
    // Create posts
    const posts = await seedPosts(users, recipes);
    
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Allow running this file directly
if (require.main === module) {
  const shouldClear = process.argv.includes('--no-clear') ? false : true;
  
  seedSimpleDatabase(shouldClear)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}