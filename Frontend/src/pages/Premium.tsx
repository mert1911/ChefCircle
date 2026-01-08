import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Target, MessageCircle, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const Premium = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessToken } = useAuth();

  // Function to handle payment => Creating checkout session and redirecting to Stripe
  const handlePayment = async (priceId: string, plan: string) => {
    setIsLoading(true);
    
    try {
      // Get auth token to check if user is logged in
      const token = getAccessToken();
      if (!token) {
        throw new Error('Please log in to upgrade to premium');
      }
      
      const response = await fetch('http://localhost:8080/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ priceId, plan }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Payment Error: ${errorMessage}\n\nPlease make sure the backend server is running and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Target className="h-6 w-6 text-emerald-600" />,
      title: "Advanced nutrition analytics",
      description: "Track macronutrients, calories, and dietary goals with detailed visual insights"
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-emerald-600" />,
      title: "AI recipe assistant",
      description: "Get personalized recipe suggestions based on your available ingredients"
    },
    {
      icon: <Sparkles className="h-6 w-6 text-emerald-600" />,
      title: "Advanced recipe discovery",
      description: "Detailed filtering for your goals with personalized recommendations"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
      title: "Enhanced meal planning",
      description: "Detailed insights, custom meal plan creation and unlimited number of saves"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with meal planning",
      features: [
        "Basic recipe discovery",
        "Simple meal planning",
        "Community access",
      ],
      buttonText: "Current Plan",
      buttonDisabled: true,
      popular: false,
      priceId: null,
      plan: "free"
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "month",
      description: "Unlock your full culinary potential",
      features: [
        "Advanced nutrition analytics",
        "AI recipe assistant",
        "Advanced recipe discovery",
        "Enhanced meal planning",
        "Weight progress tracking"
      ],
      buttonText: "Upgrade Now",
      buttonDisabled: false,
      popular: true,
      priceId: "price_1RXKhqR0ns7Y7OiCNz8ftzvg",
      plan: "monthly"
    },
    {
      name: "Premium Annual",
      price: "$99.99",
      period: "year",
      originalPrice: "$119.88",
      description: "Best value for serious home chefs",
      features: [
        "20% annual savings",
        "Advanced nutrition analytics",
        "AI recipe assistant",
        "Advanced recipe discovery",
        "Enhanced meal planning",
        "Weight progress tracking"
      ],
      buttonText: "Get Annual",
      buttonDisabled: false,
      popular: false,
      priceId: "price_1RXKj2R0ns7Y7OiCxzG3tZlg",
      plan: "annual"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <Crown className="h-4 w-4 mr-1" />
            Premium Features
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
            Unlock Your Full
            <br />
            Chef Potential
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Take your cooking journey to the next level with advanced nutrition tracking, 
            AI-powered recommendations, and personalized meal planning designed for your unique goals.
          </p>
        </div>

        {/* Premium Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Premium Features That Make a Difference
          </h2>
          <div className="grid grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-emerald-100 hover:shadow-lg transition-all duration-300 relative">
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white px-3 py-1 text-xs font-medium">
                    Premium
                  </div>
                </div>
                <CardHeader>
                  <div className="p-3 bg-emerald-50 rounded-full w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg leading-relaxed">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`border-emerald-100 relative ${plan.popular ? 'ring-2 ring-emerald-600 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 ml-1">/{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="line-through">{plan.originalPrice}</span>
                        <span className="text-emerald-600 font-medium ml-2">Save 20%</span>
                      </p>
                    )}
                  </div>
                  <p className="text-gray-600 mt-4">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : plan.buttonDisabled
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    disabled={plan.buttonDisabled || isLoading}
                    onClick={() => plan.priceId && handlePayment(plan.priceId, plan.plan)}
                  >
                    {isLoading && (plan.buttonText === "Upgrade Now" || plan.buttonText === "Get Annual") 
                      ? "Processing..." 
                      : plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Our Premium Members Say
          </h2>
          <div className="grid grid-cols-3 gap-8">
            <Card className="border-emerald-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-2xl">
                  ⭐⭐⭐⭐⭐
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The AI recipe assistant is incredible! It perfectly suggests recipes based on what I have in my fridge. The nutrition tracking has helped me reach my fitness goals faster than ever."
                </p>
                <div className="font-semibold text-gray-900">Kim</div>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-2xl">
                  ⭐⭐⭐⭐⭐
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "I love the advanced recipe discovery feature! The detailed filtering helps me find exactly what I need for my dietary restrictions. Premium has completely transformed my meal planning."
                </p>
                <div className="font-semibold text-gray-900">Bengisu</div>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-2xl">
                  ⭐⭐⭐⭐⭐
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The enhanced meal planning with unlimited saves is a game-changer! I can organize my entire week effortlessly and the nutrition insights keep me on track with my health goals."
                </p>
                <div className="font-semibold text-gray-900">Mert</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Premium;
