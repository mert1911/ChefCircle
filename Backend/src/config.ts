// Load environment variables from .env file
import 'dotenv/config';

// =================================
// 🔧 CONFIGURATION VALIDATION HELPERS
// =================================

/**
 * Gets a required environment variable or throws an error
 */
const getRequiredEnv = (key: string, description?: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `❌ Missing required environment variable: ${key}` + 
      (description ? ` (${description})` : '') +
      `\n💡 Please add ${key} to your .env file`
    );
  }
  return value;
};

/**
 * Gets an optional environment variable with a safe default
 */
const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * Validates and parses a numeric environment variable
 */
const getNumericEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`❌ Invalid numeric value for ${key}: ${value}`);
  }
  return parsed;
};

// =================================
// 🌍 ENVIRONMENT & SERVER CONFIG
// =================================

export const NODE_ENV: string = getOptionalEnv('NODE_ENV', 'development');
export const PORT: number = getNumericEnv('PORT', 8080);
export const IS_PRODUCTION: boolean = NODE_ENV === 'production';
export const IS_DEVELOPMENT: boolean = NODE_ENV === 'development';

// =================================
// 📊 DATABASE CONFIGURATION
// =================================

export const MONGO_URI: string = getOptionalEnv(
  'MONGODB_URI', 
  'mongodb://localhost:27017/chefcircle'
);

// =================================
// 🔐 AUTHENTICATION CONFIGURATION
// =================================

export const JWT_SECRET: string = getRequiredEnv(
  'JWT_SECRET', 
  'JWT signing secret'
);

export const JWT_REFRESH_SECRET: string = getRequiredEnv(
  'JWT_REFRESH_SECRET', 
  'JWT refresh token secret'
);

// =================================
// 🤖 AI API CONFIGURATION
// =================================

export const OPENAI_API_KEY: string = getRequiredEnv(
  'OPENAI_API_KEY', 
  'OpenAI API key for chatbot functionality'
);

// =================================
// 💳 STRIPE PAYMENT CONFIGURATION
// =================================

export const STRIPE_SECRET_KEY: string = getRequiredEnv(
  'STRIPE_SECRET_KEY', 
  'Stripe secret key for payment processing'
);

export const STRIPE_PUBLIC_KEY: string = getRequiredEnv(
  'STRIPE_PUBLISHABLE_KEY', 
  'Stripe publishable key'
);

export const STRIPE_WEBHOOK_SECRET: string = getRequiredEnv(
  'STRIPE_WEBHOOK_SECRET', 
  'Stripe webhook secret for event verification'
);

// =================================
// 🍎 NUTRITIONIX API CONFIGURATION
// =================================

export const NUTRITIONIX_APP_ID: string = getRequiredEnv(
  'NUTRITIONIX_APP_ID', 
  'Nutritionix app ID for nutrition data'
);

export const NUTRITIONIX_APP_KEY: string = getRequiredEnv(
  'NUTRITIONIX_APP_KEY', 
  'Nutritionix app key'
);

// =================================
// 📧 EMAIL CONFIGURATION
// =================================

export const MAIL_USER: string = getRequiredEnv(
  'MAIL_USER',
  'Gmail account for sending emails'
);

export const MAIL_PASS: string = getRequiredEnv(
  'MAIL_PASS',
  'Gmail app password for email sending'
);

// =================================
// 🌐 FRONTEND & CORS CONFIGURATION
// =================================

export const FRONTEND_URL: string = getOptionalEnv(
  'FRONTEND_URL', 
  'http://localhost:3000'
);

// =================================
// 📁 FILE UPLOAD CONFIGURATION
// =================================

export const MAX_FILE_SIZE: number = getNumericEnv('MAX_FILE_SIZE', 5000000); // 5MB default
export const UPLOAD_PATH: string = getOptionalEnv('UPLOAD_PATH', './uploads');

// =================================
// 🏗️ COMPUTED CONFIGURATIONS
// =================================

/**
 * CORS configuration based on environment
 */
export const CORS_CONFIG = {
  origin: IS_PRODUCTION 
    ? [FRONTEND_URL] 
    : [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Cookie configuration based on environment
 */
export const COOKIE_CONFIG = {
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: IS_PRODUCTION ? 100 : 1000, // Stricter in production
  message: 'Too many requests, please try again later.',
};

/**
 * Database connection options
 */
export const DATABASE_CONFIG = {
  uri: MONGO_URI,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

// =================================
// 🚀 STARTUP VALIDATION
// =================================

/**
 * Validates all required environment variables at startup
 */
export const validateConfig = (): void => {
  console.log('🔍 Validating configuration...');
  
  try {
    // Test all required variables
    getRequiredEnv('JWT_SECRET');
    getRequiredEnv('JWT_REFRESH_SECRET');
    getRequiredEnv('OPENAI_API_KEY');
    getRequiredEnv('STRIPE_SECRET_KEY');
    getRequiredEnv('STRIPE_PUBLISHABLE_KEY');
    getRequiredEnv('STRIPE_WEBHOOK_SECRET');
    getRequiredEnv('NUTRITIONIX_APP_ID');
    getRequiredEnv('NUTRITIONIX_APP_KEY');
    getRequiredEnv('MAIL_USER');
    getRequiredEnv('MAIL_PASS');
    
    console.log('✅ Configuration validation passed!');
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🚪 Port: ${PORT}`);
    console.log(`🎨 Frontend URL: ${FRONTEND_URL}`);
    
  } catch (error) {
    console.error('❌ Configuration validation failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};