import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RouteProtection from "@/components/RouteProtection";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import CreateRecipe from "./pages/CreateRecipe";
import Community from "./pages/Community";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound";
import ProfileCreation from "./pages/ProfileCreation";
import AIChatbot from "./pages/AIChatbot";
import RecipeDetailPage from "./pages/RecipeDetailPage"; 
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PremiumRegister from "./pages/PremiumRegister";
// CRUCIAL: Import the UserPage component for the user-specific profile route
import UserPage from "./pages/UserPage"; 
import MyWeek from './pages/MyWeek';
import NutritionAnalysis from "./pages/NutritionAnalysis";
import EditRecipe from "./pages/EditRecipe";
import Tag from "./pages/Tag";  
import Browse from "./pages/Browse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteProtection>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recipes/:id/edit" element={<EditRecipe />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/create" element={<CreateRecipe />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/community" element={<Community />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/ai-chatbot" element={<AIChatbot />} />
            <Route path="/profile-creation" element={<ProfileCreation />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/premium-register" element={<PremiumRegister />} />
            <Route path="/community/tag/:tag" element={<Tag />} />
            {/* CRUCIAL: Add the route for user-specific profile pages */}
            <Route path="/users/:userId" element={<UserPage />} /> 
            <Route path="/nutrition-analysis" element={<NutritionAnalysis />} />
            <Route path="/browse" element={<Browse />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
             {/* Add MyWeek and MealPlans routes */}
          <Route path="/my-week" element={<MyWeek />} />
          </Routes>
        </RouteProtection>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
