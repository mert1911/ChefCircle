import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Eye, EyeOff, Camera, ChevronRight, ChevronLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageCropper from "@/components/ImageCropper";
import { useAuth } from "@/hooks/use-auth";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { validatePasswordClient } from "@/utils/password-validator";

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Registration
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    
    // Profile Details
    firstName: "",
    lastName: "",
    bio: "",
    profileImage: "",
    
    // Dietary Preferences (detailed)
    dietaryPreferences: {
      vegan: false,
      vegetarian: false,
      glutenFree: false,
      dairyFree: false,
      keto: false,
      paleo: false,
      lowCarb: false,
      highProtein: false
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCropped = (croppedImageUrl: string) => {
    setFormData(prev => ({ ...prev, profileImage: croppedImageUrl }));
  };

  const handleDietaryChange = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: {
        ...prev.dietaryPreferences,
        [preference]: !prev.dietaryPreferences[preference as keyof typeof prev.dietaryPreferences]
      }
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.agreeTerms) {
          toast({
            title: "Error",
            description: "Please fill in all required fields and accept the terms.",
            variant: "destructive"
          });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match.",
            variant: "destructive"
          });
          return false;
        }
        
        // Validate password strength
        const passwordValidation = validatePasswordClient(formData.password, undefined, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        
        if (!passwordValidation.isValid) {
          toast({
            title: "Password Requirements Not Met",
            description: "Please ensure your password meets all security requirements.",
            variant: "destructive"
          });
          return false;
        }
        
        return true;
      case 2:
        if (!formData.firstName || !formData.lastName) {
          toast({
            title: "Error",
            description: "Please provide your first and last name.",
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
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const registerData = {
        username: formData.firstName,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        profileImage: formData.profileImage,
        dietaryPreferences: formData.dietaryPreferences,
      };

      await register(registerData);

      toast({
        title: "Welcome to Chef Circle!",
        description: "Your account and profile have been created successfully.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle password validation errors specifically
      if (error.message && error.message.includes('Password does not meet security requirements')) {
        toast({
          title: "Password Requirements Not Met",
          description: "Please ensure your password meets all security requirements shown below.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "An error occurred during registration. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 3;

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <ChefHat className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Chef Circle
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 1 ? "Join Chef Circle" : "Create Your Chef Profile"}
          </h1>
          <p className="text-gray-600">
            {currentStep === 1 
              ? "Start your personalized culinary journey today" 
              : "Tell us about your culinary preferences so we can personalize your experience"
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">
              {currentStep === 1 ? "Account Details" : 
               currentStep === 2 ? "Personal Details" : 
               "Dietary Preferences"}
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
          {/* Step 1: Basic Registration */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-center text-emerald-700">Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        className="border-emerald-200 focus:border-emerald-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {/* Password Strength Indicator */}
                    <PasswordStrengthIndicator
                      password={formData.password}
                      userInfo={{
                        email: formData.email,
                        firstName: formData.firstName,
                        lastName: formData.lastName
                      }}
                      showRequirements={true}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        required
                        className="border-emerald-200 focus:border-emerald-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                    {/* Terms of Service and Privacy Policy Agreement */}
                    <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeTerms", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{" "}
                      <button
                      type="button"
                      className="text-emerald-600 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
                      onClick={() => setShowTerms(true)}
                      >
                      Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                      type="button"
                      className="text-emerald-600 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
                      onClick={() => setShowPrivacy(true)}
                      >
                      Privacy Policy
                      </button>
                    </Label>
                    </div>

                    {/* Terms of Service Modal */}
                    {showTerms && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                      <h2 className="text-lg font-bold mb-2">Terms of Service</h2>
                      <p className="text-gray-700 text-sm mb-4">
                        By using Chef Circle, you agree to use the platform responsibly and respect other users. All content is for informational purposes only.
                      </p>
                      <Button
                        onClick={() => setShowTerms(false)}
                        className="absolute top-2 right-2"
                        size="icon"
                        variant="ghost"
                      >
                        ✕
                      </Button>
                      <Button
                        onClick={() => setShowTerms(false)}
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Close
                      </Button>
                      </div>
                    </div>
                    )}

                    {/* Privacy Policy Modal */}
                    {showPrivacy && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                      <h2 className="text-lg font-bold mb-2">Privacy Policy</h2>
                      <p className="text-gray-700 text-sm mb-4">
                        Chef Circle values your privacy. We only collect information necessary to provide our services and do not share your data with third parties.
                      </p>
                      <Button
                        onClick={() => setShowPrivacy(false)}
                        className="absolute top-2 right-2"
                        size="icon"
                        variant="ghost"
                      >
                        ✕
                      </Button>
                      <Button
                        onClick={() => setShowPrivacy(false)}
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Close
                      </Button>
                      </div>
                    </div>
                    )}

                  <Button
                    onClick={nextStep}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Next Step
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Let's Get To Know You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <ImageCropper 
                    onImageCropped={handleImageCropped}
                    currentImage={formData.profileImage}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName} 
                      onChange={(e) => handleInputChange("firstName", e.target.value)} 
                      placeholder="Your first name"
                      className="border-emerald-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName} 
                      onChange={(e) => handleInputChange("lastName", e.target.value)} 
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
                    value={formData.bio} 
                    onChange={(e) => handleInputChange("bio", e.target.value)} 
                    placeholder="Tell us a bit about your cooking journey..."
                    className="min-h-[100px] border-emerald-200"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-emerald-600 text-emerald-600">
                    <ChevronLeft className="mr-2 h-4 w-4" />
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
          
          {/* Step 3: Dietary Preferences */}
          {currentStep === 3 && (
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
                    {Object.entries({
                      vegan: "Vegan",
                      vegetarian: "Vegetarian",
                      glutenFree: "Gluten Free",
                      dairyFree: "Dairy Free",
                      keto: "Keto",
                      paleo: "Paleo",
                      lowCarb: "Low Carb",
                      highProtein: "High Protein"
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox 
                          id={key} 
                          checked={formData.dietaryPreferences[key as keyof typeof formData.dietaryPreferences]}
                          onCheckedChange={() => handleDietaryChange(key)}
                          className="text-emerald-600 border-emerald-400"
                        />
                        <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
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
                    {isLoading ? "Creating Profile..." : "Complete Registration"}
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

export default Register;
