import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { userAPI, addWeightForWeek } from '@/lib/api';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { useAuth } from '@/hooks/use-auth';
import { getCurrentWeek } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Shield,
  Lock,
  Trash2,
  Target,
  Activity,
  TrendingUp,
  Crown // Add Crown icon
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ImageCropper from '@/components/ImageCropper';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

// Update the nutrition schema to match PremiumRegister
const nutritionSchema = z.object({
  fitnessGoal: z.enum(['weight_loss', 'weight_gain', 'health']),
  weight: z.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be less than 300 kg'),
  height: z.number().min(100, 'Height must be at least 100 cm').max(250, 'Height must be less than 250 cm'),
  biologicalGender: z.enum(['male', 'female']),
  age: z.number().min(16, 'Age must be at least 16').max(120, 'Age must be less than 120'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type NutritionFormValues = z.infer<typeof nutritionSchema>;

const Profile = () => {
  const { toast } = useToast();
  const { updateUserData, user, getAccessToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingNutrition, setIsEditingNutrition] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculatedMacros, setCalculatedMacros] = useState({
    dailyCalories: 0,
    dailyProteins: 0,
    dailyCarbs: 0,
    dailyFats: 0,
  });

  // Check if user is premium
  const isPremium = user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
    },
  });

  const nutritionForm = useForm<NutritionFormValues>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: {
      fitnessGoal: 'health',
      weight: 70,
      height: 170,
      biologicalGender: 'male',
      age: 25,
      activityLevel: 'moderate',
    },
  });

  // Update calculateMacros to match PremiumRegister logic
  const calculateMacros = (formData: NutritionFormValues) => {
    const { weight, height, age, biologicalGender, activityLevel, fitnessGoal } = formData;

    if (!weight || !height || !age || !biologicalGender || !activityLevel) {
      return;
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (biologicalGender === "male") {
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

    const tdee = bmr * activityMultipliers[activityLevel];

    // Adjust calories based on fitness goal
    let dailyCalories;
    switch (fitnessGoal) {
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

    const newMacros = {
      dailyCalories: Math.max(1200, Math.round(dailyCalories)),
      dailyProteins: Math.max(45, Math.round(dailyProteins)),
      dailyCarbs: Math.max(45, Math.round(dailyCarbs)),
      dailyFats: Math.max(20, Math.round(dailyFats))
    };

    setCalculatedMacros(newMacros);
    return newMacros;
  };

  // Watch form changes and recalculate macros
  const watchedValues = nutritionForm.watch();
  useEffect(() => {
    if (watchedValues.weight && watchedValues.height && watchedValues.age && 
        watchedValues.biologicalGender && watchedValues.activityLevel && watchedValues.fitnessGoal) {
      calculateMacros(watchedValues);
    }
  }, [watchedValues.weight, watchedValues.height, watchedValues.age, watchedValues.biologicalGender, watchedValues.activityLevel, watchedValues.fitnessGoal]);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await userAPI.getCurrentUser();
        setUserData(user);
        setProfileImage(user.profileImage || '');
        
        // Update form with user data
        form.reset({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          bio: user.bio || '',
        });

        // Update nutrition form with user data if premium
        if (isPremium && user.fitnessGoal) {
          // Get current weight from weight history (latest entry)
          const currentWeight = user.weightHistory && user.weightHistory.length > 0 
            ? user.weightHistory[user.weightHistory.length - 1].value 
            : 70;
            
          const formData = {
            fitnessGoal: user.fitnessGoal || 'health',
            weight: currentWeight,
            height: user.height || 170,
            biologicalGender: user.biologicalGender || 'male',
            age: user.age || 25,
            activityLevel: user.activityLevel || 'moderate',
          };
          
          nutritionForm.reset(formData);
          // Calculate initial macros
          calculateMacros(formData);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [form, nutritionForm, toast, isPremium]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        bio: data.bio || '',
        profileImage: profileImage,
      };
      const updatedUser = await userAPI.updateProfile(profileData);
      setUserData(updatedUser);
      // Update the auth context with new user data
      updateUserData(updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const onNutritionSubmit = async (data: NutritionFormValues) => {
    try {
      // Calculate final macros before submission
      const macros = calculateMacros(data);
      if (!macros) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Update profile data with calculated macros
      const nutritionData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        bio: userData.bio || '',
        profileImage: profileImage,
        // Premium nutrition data with calculated macros
        fitnessGoal: data.fitnessGoal,
        height: data.height,
        biologicalGender: data.biologicalGender,
        age: data.age,
        activityLevel: data.activityLevel,
        dailyCalories: macros.dailyCalories,
        dailyProteins: macros.dailyProteins,
        dailyCarbs: macros.dailyCarbs,
        dailyFats: macros.dailyFats,
      };
      
      const updatedUser = await userAPI.updateProfile(nutritionData);
      
      // Update weight separately in weight history
      try {
        await addWeightForWeek({ week: getCurrentWeek(), value: data.weight });
        toast({
          title: "Weight updated",
          description: "Your weight has been added to your history.",
        });
      } catch (weightError: any) {
        toast({
          title: "Weight update failed",
          description: weightError.message || "Could not update weight history.",
          variant: "destructive",
        });
      }
      
      setUserData(updatedUser);
      // Update the auth context with new user data
      updateUserData(updatedUser);
      toast({
        title: "Nutrition goals updated",
        description: "Your nutrition goals have been successfully updated.",
      });
      setIsEditingNutrition(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update nutrition goals",
        variant: "destructive",
      });
    }
  };

  const handleImageCropped = async (croppedImageUrl: string) => {
    try {
      setProfileImage(croppedImageUrl);
      
      // Immediately save the profile image to the backend
      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        bio: userData.bio || '',
        profileImage: croppedImageUrl,
      };
      
      const updatedUser = await userAPI.updateProfile(profileData);
      setUserData(updatedUser);
      // Update the auth context with new user data
      updateUserData(updatedUser);
      
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo",
        variant: "destructive",
      });
      // Revert the image on error
      setProfileImage(userData.profileImage || '');
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true);
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    
    const firstNameInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const lastNameInitial = user.username ? user.username.charAt(0).toUpperCase() : '';
    
    return firstNameInitial + lastNameInitial;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
            >
              {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage} alt="Profile" />
                <AvatarFallback className="bg-emerald-100 text-emerald-600 text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{form.watch('firstName')} {form.watch('lastName')}</h3>
                <p className="text-gray-600">{form.watch('email')}</p>
                {user && user.subscriptionType !== 'free' && user.subscriptionStatus === 'active' ? (
                  <Badge className="mt-2 bg-emerald-600 text-white">Premium Member</Badge>
                ) : (
                  <Badge variant="secondary" className="mt-2 bg-gray-200 text-gray-600">Free Plan</Badge>
                )}
              </div>
              {isEditing && (
                <ImageCropper 
                  onImageCropped={handleImageCropped}
                  currentImage={profileImage}
                />
              )}
            </div>

            <Separator />

            {/* Profile Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="email" disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          disabled={!isEditing}
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description for your profile. Maximum 500 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Subscription Management Card - NEW */}
        {isPremium && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-emerald-600" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage your premium subscription and billing settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={async () => {
                  try {
                    const token = getAccessToken();
                    if (!token) {
                      throw new Error('Please log in to manage your subscription');
                    }
                    
                    const response = await fetch('http://localhost:8080/api/payment/create-portal-session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      throw new Error('Failed to create portal session');
                    }

                    const { url } = await response.json();
                    window.location.href = url;
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to open subscription management. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Nutrition Goals Card */}
        {isPremium && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  Nutrition Goals
                </CardTitle>
                <CardDescription>
                  Set your daily nutrition goals for optimal health and fitness.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNutrition(!isEditingNutrition)}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
              >
                {isEditingNutrition ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                {isEditingNutrition ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Form {...nutritionForm}>
                <form onSubmit={nutritionForm.handleSubmit(onNutritionSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={nutritionForm.control}
                      name="fitnessGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fitness Goal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditingNutrition}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select your fitness goal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weight_loss">Weight Loss</SelectItem>
                              <SelectItem value="weight_gain">Weight Gain</SelectItem>
                              <SelectItem value="health">Health</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nutritionForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!isEditingNutrition} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={nutritionForm.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!isEditingNutrition} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nutritionForm.control}
                      name="biologicalGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biological Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditingNutrition}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={nutritionForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={!isEditingNutrition} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nutritionForm.control}
                      name="activityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditingNutrition}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select your activity level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                              <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                              <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                              <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                              <SelectItem value="very_active">Very Active (exercise 2x/day)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Calculated Nutrition Targets */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        Your Calculated Nutrition Targets
                      </h4>
                      <p className="text-gray-600 mt-2">
                        Based on your goal of <span className="font-semibold text-emerald-600">
                          {nutritionForm.watch('fitnessGoal') === 'weight_loss' ? 'Weight Loss' :
                           nutritionForm.watch('fitnessGoal') === 'weight_gain' ? 'Weight/Muscle Gain' : 'General Health'}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-emerald-700">{calculatedMacros.dailyCalories}</div>
                        <div className="text-sm text-emerald-600 font-medium">Daily Calories</div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-700">{calculatedMacros.dailyProteins}g</div>
                        <div className="text-sm text-blue-600 font-medium">Protein</div>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-700">{calculatedMacros.dailyCarbs}g</div>
                        <div className="text-sm text-orange-600 font-medium">Carbohydrates</div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-700">{calculatedMacros.dailyFats}g</div>
                        <div className="text-sm text-purple-600 font-medium">Fats</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        These targets are automatically calculated based on your personal data and fitness goals.
                        {isEditingNutrition && " Adjust the values above to see updated calculations."}
                      </p>
                    </div>
                  </div>

                  {isEditingNutrition && (
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Security & Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Security & Account
            </CardTitle>
            <CardDescription>
              Manage your account security and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium">Account Created</h4>
                  <p className="text-sm text-gray-600">Member since January 2024</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Deactivate Account</h4>
                  <p className="text-sm text-red-700">This process deletes your account</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteAccount}
              >
                Deactivate Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Profile;
