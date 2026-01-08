// Backend/src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import recipeRoutes from './routes/recipe.routes';
import authRoutes from './routes/auth.routes'; // CRUCIAL: Import auth routes
import paymentRoutes from './routes/payment.routes'; // CRUCIAL: Import payment routes
import postRoutes from './routes/post.routes';
import chefRoutes from "./routes/chef.routes";
import tagRoutes from "./routes/tag.routes";
import chatbotRoutes from './routes/chatbot.routes';
import path from 'path';
import fs from 'fs'; // Required for manual image serving route, if you keep it.
                      // If using express.static for uploads, fs is not strictly needed here.
import mealplanRoutes from './routes/mealplan.routes';
import userRoutes from './routes/user.routes';

// Initialize express app
const app = express();

// 🔒 SECURITY: Apply helmet middleware first for security headers
// This should be one of the first middleware to ensure all responses get security headers
app.use(helmet({
  // Enable cross-origin resource loading for static files (fixes image loading issues)
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // enables image loading from your frontend
  // Use default configuration for other security headers:
  // - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
  // - X-Frame-Options: deny (prevents clickjacking)
  // - X-Powered-By: removed (hides Express framework info)
  // - Strict-Transport-Security: enforces HTTPS
  // - X-XSS-Protection: enables XSS protection
  // - Content-Security-Policy: helps prevent XSS attacks
  // - And more security headers
}));

// Configure CORS - this needs to come after helmet
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow both development and Docker frontend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Add cookie parser middleware
app.use(cookieParser());

// Apply JSON parsing to all routes EXCEPT webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    next(); // Skip JSON parsing for webhook
  } else {
    express.json({ limit: '10mb' })(req, res, next); // Apply JSON parsing for other routes
  }
});

app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 🔒 SECURITY: Safe request logging (development only, no sensitive data)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Only log basic request info, never log request bodies that might contain passwords
    const sensitiveRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/reset-password', '/api/auth/change-password'];
    const isSensitiveRoute = sensitiveRoutes.some(route => req.originalUrl.includes(route));
    
    if (isSensitiveRoute) {
      console.log(`🔍 ${req.method} ${req.originalUrl} - [SENSITIVE ROUTE - BODY NOT LOGGED]`);
    } else {
      console.log(`🔍 ${req.method} ${req.originalUrl}`);
    }
    next();
  });
}

// --- STATIC FILE SERVING FOR UPLOADS (using express.static is preferred) ---
// This middleware makes files in the 'uploads' directory accessible via the '/uploads' URL path.
// For example, if an image is saved as 'uploads/my-image.jpg', it will be served at
// 'http://localhost:8080/uploads/my-image.jpg'
const uploadsPath = path.join(__dirname, '../uploads');
console.log('[App Config] Serving static files from uploads:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));
// --- END STATIC FILE SERVING FOR UPLOADS ---

// --- STATIC FILE SERVING FOR DEFAULT IMAGES (for images intended for Git) ---
// This makes files in the 'default_images' directory accessible via the '/default_images' URL path.
// Ensure you have a folder named 'default_images' in your 'Backend' root directory (sibling to 'src' and 'uploads')
// and place your default image file(s) there.
const defaultImagesPath = path.join(__dirname, '../default_images');
console.log('[App Config] Serving static files from default_images:', defaultImagesPath);
app.use('/default_images', express.static(defaultImagesPath));
// --- END STATIC FILE SERVING FOR DEFAULT IMAGES ---


// CRUCIAL: Mount API routes for recipes
// This connects the specific API endpoints (like /recipes, /recipes/:id)
// defined in recipe.routes.ts to your Express application.
app.use('/recipes', recipeRoutes);

// Mount Mealplan Routes
app.use('/mealplan', mealplanRoutes);

// CRUCIAL: Mount Authentication Routes
// This ensures that routes like /api/auth/register and /api/auth/user are handled.
app.use('/api/auth', authRoutes);

// CRUCIAL: Mount Payment Routes
// This ensures payment-related routes are handled.
app.use('/api/payment', paymentRoutes);

// mount the posts router at /posts
app.use('/api/posts', postRoutes)

app.use("/api/chefs", chefRoutes);
app.use("/api/tags", tagRoutes);
app.use('/user', userRoutes);

// CRUCIAL: Mount Chatbot Routes
app.use('/api/chatbot', chatbotRoutes);


// CRUCIAL (for robust applications): 404 Not Found Handler
// This middleware catches any requests that haven't been handled by previous routes or static handlers.
// It's important for gracefully handling non-existent paths.
app.use((req, res, next) => {
  console.log(`[404 Handler] No route matched for: ${req.method} ${req.originalUrl}`);
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`);
});

// CRUCIAL (for robust applications): Global Error Handling Middleware
// This is the last middleware in the chain and catches any unhandled errors
// that occur during request processing. It prevents your server from crashing
// and provides a generic error response.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler] Caught error:', err.stack);
  res.status(500).send('An unexpected error occurred!');
});


// CRUCIAL: Exports the configured app instance
// This makes the 'app' object available for 'index.ts' to import and start listening on.
export default app;
