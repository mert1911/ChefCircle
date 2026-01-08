
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Camera, ArrowRight, ChevronRight, ChevronsRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const ProfileCreation = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "Sarah",
    lastName: "Thompson",
    bio: "Health-conscious vegan food enthusiast eager to explore plant-based cooking. I care deeply about nutritious meals that taste amazing.",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2687&q=80",
    dietaryPreferences: {
      vegan: true,
      vegetarian: false,
      glutenFree: false,
      dairyFree: true,
      keto: false,
      paleo: false,
      lowCarb: false,
      highProtein: true
    },
    cookingFrequency: "3-5 times per week",
    cookingSkillLevel: "Intermediate",
    favoriteCuisines: ["Mediterranean", "Asian", "Mexican"],
    foodAllergies: ["Dairy"],
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDietaryChange = (preference: string) => {
    setFormData({
      ...formData,
      dietaryPreferences: {
        ...formData.dietaryPreferences,
        [preference]: !formData.dietaryPreferences[preference as keyof typeof formData.dietaryPreferences]
      }
    });
  };

  const handleSubmit = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      toast({
        title: "Profile created!",
        description: "Your profile has been successfully created.",
      });
      
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-emerald-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Chef Circle
            </span>
          </div>
        </div>
      </div>
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Chef Profile</h1>
          <p className="text-gray-600">Tell us about your culinary preferences so we can personalize your experience</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Step {step} of 3</span>
            <span className="text-sm text-gray-500">
              {step === 1 ? "Personal Details" : step === 2 ? "Dietary Preferences" : "Cooking Habits"}
            </span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>
        
        <Card className="border-emerald-100 shadow-md">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Let's Get To Know You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-emerald-200">
                    <AvatarImage src={formData.profileImage} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-lg">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    <span>Upload Photo</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      value={formData.firstName} 
                      onChange={handleInputChange} 
                      placeholder="Your first name"
                      className="border-emerald-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      value={formData.lastName} 
                      onChange={handleInputChange} 
                      placeholder="Your last name"
                      className="border-emerald-200"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">
                    Bio <span className="text-xs text-gray-500">(optional)</span>
                  </Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange} 
                    placeholder="Tell us a bit about your cooking journey..."
                    className="min-h-[100px] border-emerald-200"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Next Step
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
          
          {/* Step 2: Dietary Preferences */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Your Dietary Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Select all that apply to you:</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="vegan" 
                        checked={formData.dietaryPreferences.vegan}
                        onCheckedChange={() => handleDietaryChange('vegan')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="vegan" className="cursor-pointer">Vegan</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="vegetarian" 
                        checked={formData.dietaryPreferences.vegetarian}
                        onCheckedChange={() => handleDietaryChange('vegetarian')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="vegetarian" className="cursor-pointer">Vegetarian</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="glutenFree" 
                        checked={formData.dietaryPreferences.glutenFree}
                        onCheckedChange={() => handleDietaryChange('glutenFree')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="glutenFree" className="cursor-pointer">Gluten Free</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="dairyFree" 
                        checked={formData.dietaryPreferences.dairyFree}
                        onCheckedChange={() => handleDietaryChange('dairyFree')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="dairyFree" className="cursor-pointer">Dairy Free</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="keto" 
                        checked={formData.dietaryPreferences.keto}
                        onCheckedChange={() => handleDietaryChange('keto')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="keto" className="cursor-pointer">Keto</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="paleo" 
                        checked={formData.dietaryPreferences.paleo}
                        onCheckedChange={() => handleDietaryChange('paleo')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="paleo" className="cursor-pointer">Paleo</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lowCarb" 
                        checked={formData.dietaryPreferences.lowCarb}
                        onCheckedChange={() => handleDietaryChange('lowCarb')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="lowCarb" className="cursor-pointer">Low Carb</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="highProtein" 
                        checked={formData.dietaryPreferences.highProtein}
                        onCheckedChange={() => handleDietaryChange('highProtein')}
                        className="text-emerald-600 border-emerald-400"
                      />
                      <Label htmlFor="highProtein" className="cursor-pointer">High Protein</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foodAllergies">
                    Food Allergies <span className="text-xs text-gray-500">(if any)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.foodAllergies.map((allergy, index) => (
                      <Badge key={index} variant="secondary" className="bg-red-100 text-red-700">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                  <Input 
                    placeholder="Type and press Enter to add"
                    className="border-emerald-200"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-emerald-600 text-emerald-600">
                    Back
                  </Button>
                  <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Next Step
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
          
          {/* Step 3: Cooking Habits */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Your Cooking Habits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>How often do you cook?</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {["Daily", "3-5 times per week", "1-2 times per week", "Rarely"].map((frequency) => (
                      <div 
                        key={frequency}
                        className={`border p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.cookingFrequency === frequency 
                            ? "border-emerald-600 bg-emerald-50" 
                            : "border-gray-200 hover:border-emerald-200"
                        }`}
                        onClick={() => setFormData({...formData, cookingFrequency: frequency})}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{frequency}</span>
                          {formData.cookingFrequency === frequency && (
                            <div className="h-4 w-4 rounded-full bg-emerald-600"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Your cooking skill level</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {["Beginner", "Intermediate", "Advanced", "Professional"].map((level) => (
                      <div 
                        key={level}
                        className={`border p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.cookingSkillLevel === level 
                            ? "border-emerald-600 bg-emerald-50" 
                            : "border-gray-200 hover:border-emerald-200"
                        }`}
                        onClick={() => setFormData({...formData, cookingSkillLevel: level})}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{level}</span>
                          {formData.cookingSkillLevel === level && (
                            <div className="h-4 w-4 rounded-full bg-emerald-600"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Favorite cuisines</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.favoriteCuisines.map((cuisine, index) => (
                      <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                  <Input 
                    placeholder="Type and press Enter to add"
                    className="border-emerald-200"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-emerald-600 text-emerald-600">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? "Creating Profile..." : "Complete Profile"}
                    {!loading && <ChevronsRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export default ProfileCreation;
