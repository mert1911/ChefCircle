import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center border-red-100 shadow-lg">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 rounded-full">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Payment Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Your payment was cancelled. No charges have been made to your account.
              </p>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-700">
                  Don't worry! You can still access all the free features of Chef Circle. 
                  When you're ready to upgrade, you can always return to the Premium page.
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <Link to="/premium">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Go Back to Premium
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

export default PaymentCancel; 