
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Sparkles, ArrowRight, BookOpen, FileText, Brain } from "lucide-react";
import { plans } from "@/config/plans";
import { useNavigate } from "react-router-dom";

interface UsageDataProps {
  mockInterview: {
    usage: number;
    limit: number | "unlimited";
    percentage: number;
  };
  pdfAnalyze: {
    usage: number;
    limit: number | "unlimited";
    percentage: number;
  };
  skribbleAI: {
    usage: number;
    limit: number | "unlimited";
    percentage: number;
  };
}

export default function PlanRecommendation({ 
  currentPlan, 
  usageData 
}: { 
  currentPlan: string; 
  usageData: UsageDataProps;
}) {
  const navigate = useNavigate();
  
  // Find the current plan in the plans array
  const currentPlanData = plans.find(p => p.name === currentPlan) || plans[0];
  
  // Determine if user is approaching limits
  const isApproachingMockLimit = 
    typeof usageData.mockInterview.limit === "number" && 
    usageData.mockInterview.percentage >= 80;
    
  const isApproachingPdfLimit = 
    typeof usageData.pdfAnalyze.limit === "number" && 
    usageData.pdfAnalyze.percentage >= 80;
    
  const isApproachingAnyLimit = isApproachingMockLimit || isApproachingPdfLimit;
  
  // Determine recommended plan based on usage patterns
  const getRecommendedPlan = () => {
    // If on free plan and approaching limits, recommend premium
    if (currentPlan === "Free" && isApproachingAnyLimit) {
      return plans.find(p => p.id === "premium");
    }
    
    // If on premium plan and using a lot, recommend pro
    if (currentPlan === "Premium" && 
        (usageData.mockInterview.percentage > 90 || usageData.pdfAnalyze.percentage > 90)) {
      return plans.find(p => p.id === "pro");
    }
    
    // If already on pro plan, no recommendation needed
    if (currentPlan === "Pro") {
      return null;
    }
    
    // Default to premium if no specific recommendation
    return plans.find(p => p.id === "premium");
  };
  
  const recommendedPlan = getRecommendedPlan();
  
  // If already on the highest plan, show different content
  if (currentPlan === "Pro") {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              You're on the Pro Plan
            </CardTitle>
            <CardDescription>
              You have unlimited access to all PrepOnyx features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Unlimited Mock Interviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Unlimited PDF Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Unlimited SkribbleAI</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Priority Support</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
              Manage Subscription
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Enjoying PrepOnyx?</h3>
          <p className="text-sm text-muted-foreground">
            Share your experience with friends and colleagues
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" size="sm">
              Share via Email
            </Button>
            <Button variant="outline" size="sm">
              Copy Referral Link
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If no recommendation (shouldn't happen) or no recommended plan found
  if (!recommendedPlan) {
    return (
      <div className="text-center py-8">
        <p>Your current plan is working well for your usage patterns.</p>
      </div>
    );
  }
  
  // Show recommendation
  return (
    <div className="space-y-6">
      {/* Current Plan Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Current Plan</CardTitle>
          <CardDescription>
            {currentPlanData.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Mock Interviews</span>
              </div>
              <Badge variant="outline">
                {typeof usageData.mockInterview.limit === "number" 
                  ? `${usageData.mockInterview.usage}/${usageData.mockInterview.limit}` 
                  : "Unlimited"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                <span className="text-sm">PDF Analysis</span>
              </div>
              <Badge variant="outline">
                {typeof usageData.pdfAnalyze.limit === "number" 
                  ? `${usageData.pdfAnalyze.usage}/${usageData.pdfAnalyze.limit}` 
                  : "Unlimited"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm">SkribbleAI</span>
              </div>
              <Badge variant="outline">
                {typeof usageData.skribbleAI.limit === "number" 
                  ? `${usageData.skribbleAI.usage}/${usageData.skribbleAI.limit}` 
                  : "Unlimited"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Recommended Plan */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Recommended Upgrade
        </h3>
        <p className="text-sm text-muted-foreground">
          Based on your usage patterns, we recommend upgrading to:
        </p>
      </div>
      
      <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{recommendedPlan.name} Plan</CardTitle>
              <CardDescription>
                {recommendedPlan.description}
              </CardDescription>
            </div>
            <Badge>{recommendedPlan.isPopular ? "Popular" : recommendedPlan.isBestValue ? "Best Value" : ""}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendedPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>
                  {feature.feature === "mockInterview" ? "Mock Interviews" : 
                   feature.feature === "pdfAnalyze" ? "PDF Analysis" : 
                   "SkribbleAI"}: {feature.limit === "unlimited" ? "Unlimited" : feature.limit}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-background/80 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Monthly</p>
                <p className="text-2xl font-bold">
                  ${(recommendedPlan.priceMonthly / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Yearly</p>
                <p className="text-2xl font-bold">
                  ${(recommendedPlan.priceYearly / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/year</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => navigate("/pricing")}>
            Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      
      {/* Why Upgrade Section */}
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">Why Upgrade?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isApproachingMockLimit && (
            <div className="flex items-start gap-3">
              <div className="mt-1 h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="h-3 w-3 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-sm">More Mock Interviews</p>
                <p className="text-xs text-muted-foreground">
                  You're using {usageData.mockInterview.percentage}% of your interview limit
                </p>
              </div>
            </div>
          )}
          
          {isApproachingPdfLimit && (
            <div className="flex items-start gap-3">
              <div className="mt-1 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <FileText className="h-3 w-3 text-amber-700" />
              </div>
              <div>
                <p className="font-medium text-sm">More PDF Analysis</p>
                <p className="text-xs text-muted-foreground">
                  You're using {usageData.pdfAnalyze.percentage}% of your PDF analysis limit
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3 w-3 text-green-700" />
            </div>
            <div>
              <p className="font-medium text-sm">Priority Support</p>
              <p className="text-xs text-muted-foreground">
                Get faster responses to your questions
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-purple-700" />
            </div>
            <div>
              <p className="font-medium text-sm">Advanced Features</p>
              <p className="text-xs text-muted-foreground">
                Access to upcoming premium features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
