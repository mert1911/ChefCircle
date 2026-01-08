import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, ChevronRight, ChevronLeft, Target, Scale, Activity, ChevronsRight, TrendingDown, TrendingUp, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { userAPI } from "@/lib/api";
import { addWeightForWeek } from "@/lib/api";
import { getCurrentWeek } from "@/lib/utils";

const PremiumRegister = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Fitness Goal
    fitnessGoal: "",
    
    // Step 2: Physical Data
    weight: "",
    height: "",
    biologicalGender: "",
    age: "",
    activityLevel: "",
    
    // Step 3: Calculated Macros (will be calculated)
    dailyCalories: 0,
    dailyProteins: 0,
    dailyCarbs: 0,
    dailyFats: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { user, updateUserData } = useAuth();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Macronutrition calculation logic
  const calculateMacros = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);

    if (!weight || !height || !age || !formData.biologicalGender || !formData.activityLevel) {
      return;
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (formData.biologicalGender === "male") {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Ensure BMR doesn't go below minimum threshold
    bmr = Math.max(1200, bmr);

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[formData.activityLevel];

    // Adjust calories based on fitness goal
    let dailyCalories;
    switch (formData.fitnessGoal) {
      case "weight_loss":
        dailyCalories = Math.max(1200, tdee - 500); // Never go below 1200 calories
        break;
      case "weight_gain":
        dailyCalories = tdee + 300;
        break;
      case "health":
        dailyCalories = tdee;
        break;
      default:
        dailyCalories = tdee;
    }

    // Calculate macros with minimum thresholds
    // Protein: 2.2g per kg of body weight, minimum 45g
    const dailyProteins = Math.max(45, weight * 2.2);
    
    // Fats: 25% of total calories, minimum 20g
    const dailyFats = Math.max(20, (dailyCalories * 0.25) / 9);
    
    // Carbs: remaining calories, minimum 45g
    const proteinCalories = dailyProteins * 4;
    const fatCalories = dailyFats * 9;
    const remainingCalories = Math.max(0, dailyCalories - proteinCalories - fatCalories);
    const dailyCarbs = Math.max(45, remainingCalories / 4);

    setFormData(prev => ({
      ...prev,
      dailyCalories: Math.max(1200, Math.round(dailyCalories)),
      dailyProteins: Math.max(45, Math.round(dailyProteins)),
      dailyCarbs: Math.max(45, Math.round(dailyCarbs)),
      dailyFats: Math.max(20, Math.round(dailyFats))
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.fitnessGoal) {
          toast({
            title: "Please select your fitness goal",
            description: "Choose the goal that best describes your current objective.",
            variant: "destructive"
          });
          return false;
        }
        return true;
      case 2:
        const weight = parseFloat(formData.weight);
        const height = parseFloat(formData.height);
        const age = parseFloat(formData.age);

        if (!weight || !height || !formData.biologicalGender || !age || !formData.activityLevel) {
          toast({
            title: "Please fill in all fields",
            description: "We need your physical data to calculate accurate nutrition targets.",
            variant: "destructive"
          });
          return false;
        }

        if (weight < 30 || weight > 300) {
          toast({
            title: "Invalid Weight",
            description: "Please enter a weight between 30kg and 300kg.",
            variant: "destructive"
          });
          return false;
        }

        if (height < 100 || height > 250) {
          toast({
            title: "Invalid Height",
            description: "Please enter a height between 100cm and 250cm.",
            variant: "destructive"
          });
          return false;
        }

        if (age < 16 || age > 120) {
          toast({
            title: "Invalid Age",
            description: "You must be between 16 and 120 years old.",
            variant: "destructive"
          });
          return false;
        }

        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        calculateMacros();
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Get current user data and merge with premium data
      const premiumData = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        bio: user?.bio || '',
        profileImage: user?.profileImage || '',
        // Premium fitness/nutrition data
        fitnessGoal: formData.fitnessGoal as "weight_loss" | "weight_gain" | "health",
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        biologicalGender: formData.biologicalGender as "male" | "female",
        age: parseInt(formData.age),
        activityLevel: formData.activityLevel as "sedentary" | "light" | "moderate" | "active" | "very_active",
        dailyCalories: formData.dailyCalories,
        dailyProteins: formData.dailyProteins,
        dailyCarbs: formData.dailyCarbs,
        dailyFats: formData.dailyFats
      };

      // Save to MongoDB via API
      const updatedUser = await userAPI.updateProfile(premiumData);
      
      // Add initial weight for this week
      try {
        await addWeightForWeek({ week: getCurrentWeek(), value: parseFloat(formData.weight) });
      } catch (err: any) {
        toast({
          title: "Weight not saved",
          description: err.message || "Could not save initial weight entry.",
          variant: "destructive",
        });
      }
      
      // Update auth context with new data
      updateUserData(updatedUser);
      
      // Force a small delay to ensure the state update is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      toast({
        title: "Premium Registration Complete!",
        description: "Your personalized nutrition targets have been set. Welcome to Premium Chef Circle!",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Premium registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during premium registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <ChefHat className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Chef Circle
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Premium Setup
          </h1>
          <p className="text-gray-600">
            Let's personalize your nutrition journey with custom macro targets
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">
              {currentStep === 1 ? "Fitness Goals" : 
               currentStep === 2 ? "Physical Data" : 
               "Nutrition Targets"}
            </span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="border-emerald-100 shadow-lg">
          {/* Step 1: Fitness Goal */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-center text-emerald-700 flex items-center justify-center gap-2">
                  <Target className="h-5 w-5" />
                  What's Your Fitness Goal?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.fitnessGoal === "weight_loss" 
                        ? "border-red-300 bg-red-50 shadow-md" 
                        : "border-gray-200 hover:border-red-200 hover:bg-red-25"
                    }`}
                    onClick={() => handleInputChange("fitnessGoal", "weight_loss")}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        formData.fitnessGoal === "weight_loss" ? "bg-red-100" : "bg-gray-100"
                      }`}>
                        <TrendingDown className={`h-6 w-6 ${
                          formData.fitnessGoal === "weight_loss" ? "text-red-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${
                          formData.fitnessGoal === "weight_loss" ? "text-red-800" : "text-gray-800"
                        }`}>Weight Loss</h3>
                        <p className={`text-sm ${
                          formData.fitnessGoal === "weight_loss" ? "text-red-600" : "text-gray-600"
                        }`}>Lose weight through a controlled calorie deficit</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.fitnessGoal === "weight_gain" 
                        ? "border-blue-300 bg-blue-50 shadow-md" 
                        : "border-gray-200 hover:border-blue-200 hover:bg-blue-25"
                    }`}
                    onClick={() => handleInputChange("fitnessGoal", "weight_gain")}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        formData.fitnessGoal === "weight_gain" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        <TrendingUp className={`h-6 w-6 ${
                          formData.fitnessGoal === "weight_gain" ? "text-blue-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${
                          formData.fitnessGoal === "weight_gain" ? "text-blue-800" : "text-gray-800"
                        }`}>Weight/Muscle Gain</h3>
                        <p className={`text-sm ${
                          formData.fitnessGoal === "weight_gain" ? "text-blue-600" : "text-gray-600"
                        }`}>Build muscle and gain healthy weight</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.fitnessGoal === "health" 
                        ? "border-emerald-300 bg-emerald-50 shadow-md" 
                        : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-25"
                    }`}
                    onClick={() => handleInputChange("fitnessGoal", "health")}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        formData.fitnessGoal === "health" ? "bg-emerald-100" : "bg-gray-100"
                      }`}>
                        <Heart className={`h-6 w-6 ${
                          formData.fitnessGoal === "health" ? "text-emerald-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${
                          formData.fitnessGoal === "health" ? "text-emerald-800" : "text-gray-800"
                        }`}>General Health</h3>
                        <p className={`text-sm ${
                          formData.fitnessGoal === "health" ? "text-emerald-600" : "text-gray-600"
                        }`}>Maintain current weight and improve overall health</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={nextStep}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-6"
                >
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2: Physical Data */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  Your Physical Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input 
                      id="weight" 
                      type="number"
                      value={formData.weight} 
                      onChange={(e) => handleInputChange("weight", e.target.value)} 
                      placeholder="70"
                      className="border-emerald-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input 
                      id="height" 
                      type="number"
                      value={formData.height} 
                      onChange={(e) => handleInputChange("height", e.target.value)} 
                      placeholder="175"
                      className="border-emerald-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input 
                      id="age" 
                      type="number"
                      value={formData.age} 
                      onChange={(e) => handleInputChange("age", e.target.value)} 
                      placeholder="25"
                      className="border-emerald-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="biologicalGender">Biological Gender</Label>
                    <Select value={formData.biologicalGender} onValueChange={(value) => handleInputChange("biologicalGender", value)}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="activityLevel">Activity Level</Label>
                  <Select value={formData.activityLevel} onValueChange={(value) => handleInputChange("activityLevel", value)}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select your activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                      <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                      <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                      <SelectItem value="very_active">Very Active (very hard exercise, physical job)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-emerald-600 text-emerald-600">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Calculate Targets
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
          
          {/* Step 3: Macronutrition Targets */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Your Personalized Nutrition Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Based on your goal of <span className="font-semibold text-emerald-600">
                      {formData.fitnessGoal === 'weight_loss' ? 'Weight Loss' :
                       formData.fitnessGoal === 'weight_gain' ? 'Weight/Muscle Gain' : 'General Health'}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-emerald-700">{formData.dailyCalories}</div>
                    <div className="text-sm text-emerald-600 font-medium">Daily Calories</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">{formData.dailyProteins}g</div>
                    <div className="text-sm text-blue-600 font-medium">Protein</div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-700">{formData.dailyCarbs}g</div>
                    <div className="text-sm text-orange-600 font-medium">Carbohydrates</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{formData.dailyFats}g</div>
                    <div className="text-sm text-purple-600 font-medium">Fats</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    These targets are calculated based on your personal data and fitness goals. 
                    You can adjust them anytime in your profile settings.
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-emerald-600 text-emerald-600">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isLoading ? "Finalizing..." : "Complete Premium Setup"}
                    {!isLoading && <ChevronsRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PremiumRegister;
