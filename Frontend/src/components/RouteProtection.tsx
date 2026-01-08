import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Route configuration
const ROUTES = {
  PUBLIC: ['/', '/login', '/register', '/forgot-password', '/reset-password'] as const,
  PREMIUM: ['/ai-chatbot'] as const,
  ONBOARDING: ['/payment/success', '/premium-register'] as const
} as const;

type PublicRoute = typeof ROUTES.PUBLIC[number];
type PremiumRoute = typeof ROUTES.PREMIUM[number];
type OnboardingRoute = typeof ROUTES.ONBOARDING[number];

// Toast messages
const TOAST_MESSAGES = {
  ALREADY_LOGGED_IN: {
    title: "Already logged in",
    description: "You're already logged in. Redirecting to your dashboard."
  },
  AUTH_REQUIRED: {
    title: "Authentication required",
    description: "Please log in to access this page."
  },
  PREMIUM_SETUP_REQUIRED: {
    title: "Complete your premium setup",
    description: "Please finish setting up your nutrition targets."
  },
  SETUP_COMPLETED: {
    title: "Setup already completed",
    description: "You've already completed your premium setup. Welcome back!"
  },
  ALREADY_PREMIUM: {
    title: "You're already premium!",
    description: "You already have premium access. Enjoy your premium features!"
  },
  PREMIUM_REQUIRED: {
    title: "Premium feature",
    description: "This feature requires a premium subscription. Upgrade now to access it!"
  },
  PREMIUM_SUBSCRIPTION_REQUIRED: {
    title: "Premium setup required",
    description: "You need a premium subscription to access the premium setup. Upgrade now!"
  }
} as const;

interface RouteProtectionProps {
  children: React.ReactNode;
}

const RouteProtection = ({ children }: RouteProtectionProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const showToastAndRedirect = (message: keyof typeof TOAST_MESSAGES, redirectPath: string) => {
    toast(TOAST_MESSAGES[message]);
    navigate(redirectPath, { replace: true });
  };

  const isPremiumUser = user?.subscriptionType !== 'free';
  
  const hasCompletedPremiumSetup = isPremiumUser && Boolean(
    user?.fitnessGoal &&
    user?.height &&
    user?.age &&
    user?.biologicalGender &&
    user?.activityLevel &&
    user?.dailyCalories
  );

  // Type guard functions to check route types
  const isPublicRoute = (path: string): path is PublicRoute => 
    ROUTES.PUBLIC.includes(path as PublicRoute);
  
  const isPremiumRoute = (path: string): path is PremiumRoute => 
    ROUTES.PREMIUM.includes(path as PremiumRoute);
  
  const isOnboardingRoute = (path: string): path is OnboardingRoute => 
    ROUTES.ONBOARDING.includes(path as OnboardingRoute);

  useEffect(() => {
    if (isLoading) return;

    const currentPath = location.pathname;

    // Rule 1: Logged in users can't access public routes
    if (isAuthenticated && isPublicRoute(currentPath)) {
      showToastAndRedirect('ALREADY_LOGGED_IN', '/dashboard');
      return;
    }

    // Rule 2: Non-logged in users can only access public routes
    if (!isAuthenticated && !isPublicRoute(currentPath)) {
      showToastAndRedirect('AUTH_REQUIRED', '/login');
      return;
    }

    // Rule 3: Premium users must complete setup
    if (isAuthenticated && isPremiumUser && !hasCompletedPremiumSetup) {
      if (!isOnboardingRoute(currentPath)) {
        showToastAndRedirect('PREMIUM_SETUP_REQUIRED', '/premium-register');
        return;
      }
    }

    // Rule 4: Premium users with completed setup
    if (isAuthenticated && hasCompletedPremiumSetup) {
      if (currentPath === '/premium-register') {
        showToastAndRedirect('SETUP_COMPLETED', '/dashboard');
        return;
      }
      if (currentPath === '/premium') {
        showToastAndRedirect('ALREADY_PREMIUM', '/dashboard');
        return;
      }
    }

    // Rule 5: Non-premium users can't access premium routes
    if (isAuthenticated && !isPremiumUser) {
      if (isPremiumRoute(currentPath)) {
        showToastAndRedirect('PREMIUM_REQUIRED', '/premium');
        return;
      }
      if (currentPath === '/premium-register') {
        showToastAndRedirect('PREMIUM_SUBSCRIPTION_REQUIRED', '/premium');
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    isPremiumUser,
    hasCompletedPremiumSetup,
    location.pathname,
    navigate,
    toast,
    isPublicRoute,
    isPremiumRoute,
    isOnboardingRoute
  ]);

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteProtection; 