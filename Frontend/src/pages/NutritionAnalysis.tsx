import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentWeek } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getAuthHeaders } from "@/lib/api";
import clsx from "clsx";
import { getWeightHistory, addWeightForWeek } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Helper to get previous week string in 'YYYY-Www' format
function getPreviousWeek(week: string, offset: number = 1) {
  const [yearStr, weekNumStr] = week.split("-W");
  let year = parseInt(yearStr, 10);
  let weekNum = parseInt(weekNumStr, 10) - offset;
  while (weekNum < 1) {
    year -= 1;
    // 52 or 53 weeks in previous year
    const lastWeek = new Date(year, 11, 28);
    const weekCount = getISOWeek(lastWeek);
    weekNum += weekCount;
  }
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}
function getISOWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper to check if a week is in the future
function isWeekInFuture(week: string): boolean {
  const currentWeek = getCurrentWeek();
  const [currentYear, currentWeekNum] = currentWeek.split('-W').map(Number);
  const [weekYear, weekNum] = week.split('-W').map(Number);
  
  if (weekYear > currentYear) return true;
  if (weekYear < currentYear) return false;
  return weekNum > currentWeekNum;
}

// Helper to get the number of weeks difference
function getWeekDifference(week: string): number {
  const currentWeek = getCurrentWeek();
  const [currentYear, currentWeekNum] = currentWeek.split('-W').map(Number);
  const [weekYear, weekNum] = week.split('-W').map(Number);
  
  if (weekYear === currentYear) {
    return weekNum - currentWeekNum;
  } else if (weekYear > currentYear) {
    // Calculate weeks from current week to end of current year, then add weeks in future year
    const weeksInCurrentYear = 52; // Approximate
    return (weeksInCurrentYear - currentWeekNum) + weekNum;
  } else {
    // Past year
    return weekNum - currentWeekNum;
  }
}

const NutritionAnalysis = () => {
  const [goals, setGoals] = useState<any>(null);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [errorGoals, setErrorGoals] = useState<string | null>(null);

  // Week navigation: limit to 2 weeks before and 2 weeks after the current week
  const initialWeek = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState(initialWeek);
  const [trendWindow, setTrendWindow] = useState<string[]>([]);

  // Helper to get all allowed weeks for navigation
  function getAllowedWeeks(centerWeek: string) {
    const weeks: string[] = [];
    for (let i = 2; i > 0; i--) weeks.push(getPreviousWeek(centerWeek, i));
    weeks.push(centerWeek);
    weeks.push(getPreviousWeek(centerWeek, -1));
    weeks.push(getPreviousWeek(centerWeek, -2));
    return weeks;
  }
  const allowedWeeks = getAllowedWeeks(initialWeek);

  // Only allow navigation within allowedWeeks
  const handlePrevWeek = () => {
    const idx = allowedWeeks.indexOf(selectedWeek);
    if (idx > 0) setSelectedWeek(allowedWeeks[idx - 1]);
  };
  const handleNextWeek = () => {
    const idx = allowedWeeks.indexOf(selectedWeek);
    if (idx < allowedWeeks.length - 1) setSelectedWeek(allowedWeeks[idx + 1]);
  };
  const isPrevDisabled = allowedWeeks.indexOf(selectedWeek) === 0;
  const isNextDisabled = allowedWeeks.indexOf(selectedWeek) === allowedWeeks.length - 1;

  const [nutritionData, setNutritionData] = useState<any>(null);
  const [loadingNutrition, setLoadingNutrition] = useState(true);
  const [errorNutrition, setErrorNutrition] = useState<string | null>(null);

  // Macro Trends: Always show the same 5-week window centered on the initial current week
  const [macroTrends, setMacroTrends] = useState<any[]>([]); // Array of { week, protein, carbs, fat }
  const [loadingTrends, setLoadingTrends] = useState(true);

  // On mount, set the trend window (5 weeks: 2 before, current, 2 after)
  useEffect(() => {
    const window: string[] = [];
    for (let i = 2; i > 0; i--) window.push(getPreviousWeek(initialWeek, i));
    window.push(initialWeek);
    window.push(getPreviousWeek(initialWeek, -1));
    window.push(getPreviousWeek(initialWeek, -2));
    setTrendWindow(window);
  }, [initialWeek]);

  // Fetch macro trends for the fixed window
  useEffect(() => {
    if (trendWindow.length !== 5) return;
    const fetchTrends = async () => {
      setLoadingTrends(true);
      const results = await Promise.all(
        trendWindow.map(async (w) => {
          try {
            const headers = await getAuthHeaders();
            const res = await fetch(`http://localhost:8080/mealplan/nutrition?week=${w}`, {
              headers,
              credentials: "include",
            });
            if (!res.ok) return { week: w };
            const data = await res.json();
            // Aggregate macros for the week
            let protein = 0, carbs = 0, fat = 0;
            Object.values(data).forEach((d: any) => {
              protein += d.protein || 0;
              carbs += d.carbs || 0;
              fat += d.fat || 0;
            });
            return { week: w, protein: Math.round(protein / 7), carbs: Math.round(carbs / 7), fat: Math.round(fat / 7) };
          } catch {
            return { week: w };
          }
        })
      );
      setMacroTrends(results);
      setLoadingTrends(false);
    };
    fetchTrends();
  }, [trendWindow]);

  // Fetch user goals
  useEffect(() => {
    const fetchGoals = async () => {
      setLoadingGoals(true);
      setErrorGoals(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("http://localhost:8080/user/goals", {
          headers,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch goals");
        const data = await res.json();
        setGoals(data);
      } catch (err: any) {
        setErrorGoals(err.message || "Failed to fetch goals");
      } finally {
        setLoadingGoals(false);
      }
    };
    fetchGoals();
  }, []);

  // Fetch nutrition data for selected week
  useEffect(() => {
    const fetchNutrition = async () => {
      setLoadingNutrition(true);
      setErrorNutrition(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`http://localhost:8080/mealplan/nutrition?week=${selectedWeek}`, {
          headers,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch nutrition data");
        const data = await res.json();
        setNutritionData(data);
      } catch (err: any) {
        setErrorNutrition(err.message || "Failed to fetch nutrition data");
      } finally {
        setLoadingNutrition(false);
      }
    };
    fetchNutrition();
  }, [selectedWeek]);

  // Fetch weight for the selected week and previous week
  const [weight, setWeight] = useState<number | null>(null);
  const [prevWeight, setPrevWeight] = useState<number | null>(null);
  const [loadingWeight, setLoadingWeight] = useState(true);
  const [weightChange, setWeightChange] = useState<number | null>(null);
  const [weightChangePercent, setWeightChangePercent] = useState<number | null>(null);
  const [weightStatus, setWeightStatus] = useState<string>("");
  const [weightMessage, setWeightMessage] = useState<string>("");
  const { user, isLoading: authLoading } = useAuth();
  const [fitnessGoal, setFitnessGoal] = useState<string | null>(null);

  // Weight input state
  const [weightInput, setWeightInput] = useState<string>("");
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchWeight = async () => {
      setLoadingWeight(true);
      try {
        const [current, previous] = await Promise.all([
          getWeightHistory(selectedWeek),
          getWeightHistory(getPreviousWeek(selectedWeek, 1)),
        ]);
        setWeight(Array.isArray(current) && current.length > 0 ? current[0].value : null);
        setPrevWeight(Array.isArray(previous) && previous.length > 0 ? previous[0].value : null);
        // Reset weight input when weight is found
        if (Array.isArray(current) && current.length > 0) {
          setWeightInput("");
        }
      } catch {
        setWeight(null);
        setPrevWeight(null);
      } finally {
        setLoadingWeight(false);
      }
    };
    fetchWeight();
  }, [selectedWeek]);

  // Fetch fitness goal from user context
  useEffect(() => {
    console.log('User context:', user);
    console.log('User fitness goal:', user?.fitnessGoal);
    if (user && user.fitnessGoal) {
      setFitnessGoal(user.fitnessGoal);
    } else {
      setFitnessGoal(null);
    }
  }, [user]);

  // Handle weight input submission
  const handleAddWeight = async () => {
    // Prevent adding weight for future weeks
    if (isWeekInFuture(selectedWeek)) {
      toast({
        title: "Cannot add weight for future weeks",
        description: "You can only add weight entries for current or past weeks.",
        variant: "destructive",
      });
      return;
    }

    const weightValue = parseFloat(weightInput);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight value.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingWeight(true);
    try {
      await addWeightForWeek({ week: selectedWeek, value: weightValue });
      setWeight(weightValue);
      setWeightInput("");
      toast({
        title: "Weight saved",
        description: `Weight of ${weightValue} kg has been saved for this week.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to save weight",
        description: error.message || "An error occurred while saving your weight.",
        variant: "destructive",
      });
    } finally {
      setIsAddingWeight(false);
    }
  };

  // Calculate weight change and status
  useEffect(() => {
    console.log('Weight feedback calculation:', {
      weight,
      prevWeight,
      fitnessGoal,
      weightMessage,
      weightStatus,
      authLoading,
      user: user ? 'loaded' : 'not loaded'
    });
    
    // Don't calculate feedback if auth is still loading
    if (authLoading) {
      return;
    }
    
    if (weight !== null && prevWeight !== null && fitnessGoal) {
      const diff = weight - prevWeight;
      setWeightChange(diff);
      let percent = null;
      if (prevWeight !== 0) {
        percent = (diff / prevWeight) * 100;
        setWeightChangePercent(Math.round(percent));
      } else {
        setWeightChangePercent(null);
      }
      // Feedback logic
      if (fitnessGoal === "weight_loss") {
        if (diff > 0) {
          setWeightStatus("danger");
          setWeightMessage("Try to reduce Fat and Carbohydrates to lose weight");
        } else {
          setWeightStatus("success");
          setWeightMessage("Good job!");
        }
      } else if (fitnessGoal === "weight_gain") {
        if (diff < 0) {
          setWeightStatus("danger");
          setWeightMessage("Try to increase Fat and Carbohydrates to gain weight");
        } else {
          setWeightStatus("success");
          setWeightMessage("Good job!");
        }
      } else if (fitnessGoal === "health") {
        if (percent !== null && percent > 2.5) {
          setWeightStatus("danger");
          setWeightMessage("Try to reduce Fat and Carbohydrates to keep weight");
        } else if (percent !== null && percent < -2.5) {
          setWeightStatus("danger");
          setWeightMessage("Try to increase Fat and Carbohydrates to keep weight");
        } else {
          setWeightStatus("success");
          setWeightMessage("Good job!");
        }
      } else {
        setWeightStatus("");
        setWeightMessage("");
      }
    } else {
      setWeightChange(null);
      setWeightChangePercent(null);
      setWeightStatus("");
      setWeightMessage("");
    }
  }, [weight, prevWeight, fitnessGoal, authLoading]);

  // Calculate averages for week overview (always divide by 7)
  let avg = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (nutritionData) {
    const days: any[] = Object.values(nutritionData);
    total.calories = days.reduce((a: number, b: any) => a + (typeof b.calories === 'number' ? b.calories : 0), 0);
    total.protein = days.reduce((a: number, b: any) => a + (typeof b.protein === 'number' ? b.protein : 0), 0);
    total.carbs = days.reduce((a: number, b: any) => a + (typeof b.carbs === 'number' ? b.carbs : 0), 0);
    total.fat = days.reduce((a: number, b: any) => a + (typeof b.fat === 'number' ? b.fat : 0), 0);
    avg.calories = Math.round(total.calories / 7);
    avg.protein = Math.round(total.protein / 7);
    avg.carbs = Math.round(total.carbs / 7);
    avg.fat = Math.round(total.fat / 7);
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation - headline left, buttons right */}
        <div className="flex flex-row items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Week: {selectedWeek}</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrevWeek} variant="outline" disabled={isPrevDisabled}>Previous Week</Button>
            <Button onClick={handleNextWeek} variant="outline" disabled={isNextDisabled}>Next Week</Button>
          </div>
        </div>

        {/* Weight for current week and feedback as cards in a grid */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Weight Card */}
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle>Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWeight ? (
                <span>Loading...</span>
              ) : weight !== null ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{weight} kg</span>
                  {prevWeight !== null && (
                    <div className="mt-2 text-base">
                      <span className={weightChange && weightChange > 0 ? "text-emerald-600" : weightChange && weightChange < 0 ? "text-red-600" : "text-gray-600"}>
                        {weightChange > 0 ? "+" : ""}{weightChangePercent !== null ? `${weightChangePercent}%` : ""} since last week
                      </span>
                    </div>
                  )}
                </div>
              ) : isWeekInFuture(selectedWeek) ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <span className="text-gray-500">No weight entry for this week</span>
                  <div className="text-center">
                    {(() => {
                      const weekDiff = getWeekDifference(selectedWeek);
                      if (weekDiff === 1) {
                        return <span className="text-sm text-gray-600">Come back next week to add your weight</span>;
                      } else {
                        return <span className="text-sm text-gray-600">Come back in {weekDiff} weeks to add your weight</span>;
                      }
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <span className="text-gray-500">No weight entry for this week</span>
                  <div className="flex flex-col items-center space-y-2">
                    <Label htmlFor="weight-input" className="text-sm text-gray-700">Enter your weight for this week:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="weight-input"
                        type="number"
                        step="0.1"
                        min="0"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && weightInput.trim() && !isAddingWeight) {
                            handleAddWeight();
                          }
                        }}
                        className="w-24 text-center"
                      />
                      <span className="text-sm text-gray-600">kg</span>
                      <Button 
                        onClick={handleAddWeight} 
                        disabled={isAddingWeight || !weightInput.trim()}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isAddingWeight ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Weight Feedback Card */}
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle>Weight Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWeight || authLoading ? (
                <span>Loading...</span>
              ) : prevWeight === null ? (
                <span className="text-gray-500">Come back next week to see progress and feedback.</span>
              ) : weightMessage ? (
                <div className={"text-lg font-medium " + (weightStatus === "success" ? "text-emerald-700" : weightStatus === "danger" ? "text-red-600" : "text-orange-600")}>{weightMessage}</div>
              ) : (
                <span className="text-gray-500">No feedback available.</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Week Overview - Small Fields in Card */}
        <Card className="border-emerald-100 mb-8">
          <CardHeader>
              <CardTitle>Week Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-emerald-50 p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-emerald-700">{avg.calories}</span>
                <span className="text-emerald-700 font-medium">Calories</span>
              </div>
              <div className="rounded-xl bg-violet-50 p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-violet-700">{avg.protein}g</span>
                <span className="text-violet-700 font-medium">Protein</span>
              </div>
              <div className="rounded-xl bg-orange-50 p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-orange-700">{avg.carbs}g</span>
                <span className="text-orange-700 font-medium">Carbohydrates</span>
              </div>
              <div className="rounded-xl bg-purple-50 p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-purple-700">{avg.fat}g</span>
                <span className="text-purple-700 font-medium">Fats</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macro Trends Chart - Always 5 weeks, current in center */}
        <div className="mb-8">
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle>Weekly Macro Trends (5 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <p>Loading...</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={macroTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="protein" stroke="#1d4ed8" name="Protein (g)" strokeWidth={3} />
                      <Line type="monotone" dataKey="carbs" stroke="#f59e42" name="Carbs (g)" strokeWidth={3} />
                      <Line type="monotone" dataKey="fat" stroke="#a78bfa" name="Fat (g)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goal Progress - Show total for the week */}
        <div className="mb-8">
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle>Goal Progress (Total for Week)</CardTitle>
            </CardHeader>
            <CardContent>
              {goals && !loadingGoals ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between"><span>Calories</span><span>{Math.round(total.calories)}/{goals.dailyCalories ? Math.round(goals.dailyCalories * 7) : '-'} kcal</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-emerald-600 h-2.5 rounded-full" style={{width: goals.dailyCalories ? `${Math.min(100, (total.calories/(goals.dailyCalories*7))*100)}%` : '0%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between"><span>Protein</span><span>{Math.round(total.protein)}/{goals.dailyProteins ? Math.round(goals.dailyProteins * 7) : '-'}g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-[#1d4ed8] h-2.5 rounded-full" style={{width: goals.dailyProteins ? `${Math.min(100, (total.protein/(goals.dailyProteins*7))*100)}%` : '0%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between"><span>Carbs</span><span>{Math.round(total.carbs)}/{goals.dailyCarbs ? Math.round(goals.dailyCarbs * 7) : '-'}g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-orange-500 h-2.5 rounded-full" style={{width: goals.dailyCarbs ? `${Math.min(100, (total.carbs/(goals.dailyCarbs*7))*100)}%` : '0%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between"><span>Fat</span><span>{Math.round(total.fat)}/{goals.dailyFats ? Math.round(goals.dailyFats * 7) : '-'}g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-purple-500 h-2.5 rounded-full" style={{width: goals.dailyFats ? `${Math.min(100, (total.fat/(goals.dailyFats*7))*100)}%` : '0%'}}></div></div>
                  </div>
                </div>
              ) : loadingGoals ? <p>Loading...</p> : <p>No goals set.</p>}
            </CardContent>
          </Card>
        </div>


      </main>
    </div>
  );
};

export default NutritionAnalysis; 