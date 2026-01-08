import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Users, Calendar, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: <ChefHat className="h-8 w-8 text-emerald-600" />,
      title: "Smart Recipe Discovery",
      description: "Find recipes based on your dietary preferences and available ingredients"
    },
    {
      icon: <Calendar className="h-8 w-8 text-emerald-600" />,
      title: "Intelligent Meal Planning",
      description: "Create weekly meal plans with automatic grocery lists and nutrition tracking"
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-600" />,
      title: "Vibrant Community",
      description: "Share your culinary creations and get inspired by fellow cooking enthusiasts"
    }
  ];

  const premiumFeatures = [
    {
      title: "Advanced nutrition analytics",
      description: "Track macronutrients, calories, and dietary goals with detailed visual insights"
    },
    {
      title: "AI recipe assistant",
      description: "Get personalized recipe suggestions based on your available ingredients"
    },
    {
      title: "Advanced recipe discovery",
      description: "Detailed filtering for your goals with personalized recommendations"
    },
    {
      title: "Enhanced meal planning",
      description: "Detailed insights, custom meal plan creation and unlimited number of saves"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">

      {/* Hero Section with Background Image */}
      <section className="relative h-screen py-20 px-8 flex items-center">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2653&q=80')" 
          }}
        ></div>
        <div className="absolute inset-0 bg-black/50 z-1"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Join our global community of passionate home chefs
          </Badge>
          <div className="flex items-center justify-center space-x-4 mb-8">
            <ChefHat className="h-20 w-20 text-emerald-400 drop-shadow-lg" />
            <span className="text-8xl font-bold text-emerald-400 drop-shadow-lg">
              Chef Circle
            </span>
          </div>
          <h1 className="text-6xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
            Cooking Made Easy,
            <br />
            Personalized for You
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Discover personalized recipes, plan nutritious meals and connect with our passionate 
            community of chefs. Transform your kitchen into a place of creativity and wellness.
          </p>
          <div className="flex flex-col gap-6 justify-center items-center">
            <div className="flex flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <Button variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-emerald-600 px-8 py-3 text-lg backdrop-blur-sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="flex flex-col items-center text-white/80 mt-4">
              <ArrowDown className="h-6 w-6 mb-2 animate-bounce" />
              <span className="text-sm font-medium">Scroll to explore (premium) features</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Cook Better
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From recipe discovery to meal planning, we've got all the tools to make your culinary journey effortless and enjoyable.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-emerald-100 hover:border-emerald-300">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-emerald-50 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-20 px-8 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            Premium Features
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Unlock Your Full Culinary Potential
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Take your cooking to the next level with advanced nutrition tracking, 
            AI-powered recommendations and personalized meal planning designed for your goals.
          </p>
          <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-gray-900 font-semibold mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ChefHat className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold">Chef Circle</span>
          </div>
          <p className="text-gray-400">© 2025 Chef Circle. Making cooking accessible for everyone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
