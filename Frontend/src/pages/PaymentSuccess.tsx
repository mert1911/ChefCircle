import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center border-emerald-100 shadow-lg">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-emerald-100 rounded-full">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </CardTitle>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Crown className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Welcome to Premium</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Congratulations! Your payment has been processed successfully and your Premium subscription is now active.
              </p>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-700">
                  You now have access to all Premium features including:
                </p>
                <ul className="text-sm text-emerald-700 mt-2 space-y-1 italic">
                  <li>Advanced nutrition analytics</li>
                  <li>AI recipe assistant</li>
                  <li>Unlimited saved recipes</li>
                  <li>Custom meal plans</li>
                  <li>Weight progress tracking</li>
                </ul>
              </div>
              <div className="pt-4">
                <Link to="/premium-register">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold">
                    Continue to Premium Registration
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess; 