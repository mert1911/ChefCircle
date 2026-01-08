// Backend/src/index.ts
// Load environment variables first
import 'dotenv/config';

import mongoose from 'mongoose';
import app from './app'; // Import the configured Express app from app.ts
import { MONGO_URI, PORT, validateConfig, DATABASE_CONFIG } from './config';
import express, { Request, Response } from 'express'; // Import express for types like express.Request, express.Response

// 🔍 Validate configuration at startup
validateConfig();

/**
 * MongoDB Connection
 * Establishes a connection to your MongoDB database using Mongoose.
 * Uses optimized connection options from config.
 */
mongoose
  .connect(DATABASE_CONFIG.uri, DATABASE_CONFIG.options)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/**
 * Routes
 * Only health check route here. All other main API routes (recipes, auth, payment)
 * are now mounted on the 'app' instance within app.ts.
 */
// Health check (mounted on the imported app)
app.get('/', (_req: express.Request, res: express.Response) => {
  res.send('Backend is running. Try GET /recipes or POST /recipes');
});


/**
 * Start Server (Now using the imported 'app' instance)
 */
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});
