# ChefCircle

ChefCircle is a comprehensive recipe management and social cooking platform that empowers users to discover recipes, plan meals, analyze nutrition, and connect with a vibrant community of food enthusiasts.

## Features

### 🍳 Recipe Management
- **Discover & Browse**: extensive recipe catalog with advanced filtering options (cuisine, difficulty, preparation time, tags).
- **Create & Edit**: Rich text editor for creating detailed recipes with ingredients, steps, and photos.
- **Nutrition Analysis**: Detailed nutritional breakdown for recipes to help users track their intake.
- **Favorites**: Save and organize your favorite recipes for quick access.

### 📅 Meal Planning
- **MyWeek**: Interactive weekly calendar to schedule breakfast, lunch, and dinner.
- **Meal Plans**: Create, save, and reuse complete meal plans (e.g., "Weight Loss", "High Protein").
- **Smart Integration**: Seamlessly add recipes from the catalog to your schedule.

### 🤝 Social & Community
- **Community Hub**: Share culinary moments, tips, and photos with other users.
- **Chef Profiles**: Custom user profiles showcasing created recipes and activity.
- **Following System**: Follow favorite chefs and creators to stay updated with their latest content.
- **Interactions**: Like, comment on, and rate recipes and posts.

### 💎 Premium & AI
- **ChefCircle Premium**: Subscription service integrated with Stripe for exclusive features.
- **AI Culinary Assistant**: Integrated AI Agent for personalized cooking advice, recipe suggestions, and technique tips.
- **Advanced Insights**: Premium-only nutritional data and advanced filtering capabilities.

## Tech Stack

### Frontend
- **Core**: React 19, TypeScript, Vite
- **UI/Styling**: Tailwind CSS, Shadcn UI (Radix Primitives), Lucide Icons
- **State & Data**: React Query (@tanstack/react-query), Axios
- **Forms**: React Hook Form, Zod validation
- **Visualization**: Recharts for nutrition data
- **Payments**: Stripe Elements (@stripe/stripe-js)

### Backend
- **Runtime**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with Refresh Token Rotation, Bcrypt for hashing
- **File Handling**: Multer for image uploads
- **Security**: Helmet, CORS, Rate Limiting (implied)

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Multi-container setup for Frontend, Backend, and MongoDB

## System Design

ChefCircle follows a modular Client-Server architecture:

1.  **Frontend (SPA)**: 
    - Built as a responsive Single Page Application.
    - Consumes the REST API for all data operations.
    - Handles client-side routing and state management.

2.  **Backend (REST API)**:
    - Exposes a structured API structure (`/api/recipes`, `/api/auth`, `/api/payment`, etc.).
    - Implements Middleware patterns for Authentication (`auth.ts`), Uploads (`multerUpload.ts`), and Validation.
    - Connects to external services (Stripe, OpenAI) via secure service layers.

3.  **Database Layer**:
    - **MongoDB**: Used for storing flexible document structures like Recipes, Users, and Activity Logs.
    - **Volumes**: Docker volumes persist database data and user uploads.

## Getting Started

### Prerequisites
- Docker & Docker Compose (Recommended)
- Node.js v18+ (for local development)

### Quick Start (Docker)

The easiest way to run the application is using Docker Compose, which spins up the Frontend, Backend, and Database simultaneously.

```bash
# Start all services
docker-compose up --build
```

Access the application:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080`
- **MongoDB**: `localhost:27017`

### Local Development

If you prefer running services individually:

**Backend:**
```bash
cd Backend
npm install
# Ensure .env is configured
npm run dev
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

## Project Structure

```
ChefCircle/
├── Backend/                 # Express API
│   ├── src/
│   │   ├── controllers/     # Route logic
│   │   ├── models/          # Mongoose Schemas
│   │   ├── routes/          # API Endpoints
│   │   ├── services/        # Business logic & External APIs
│   │   └── middleware/      # Auth & Uploads
├── Frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page views
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities & Config
├── docker-compose.yml       # Container orchestration
└── README.md                # Project documentation
```

