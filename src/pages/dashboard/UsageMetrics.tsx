import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, FileText, Pencil, RotateCw, AlertCircle } from "lucide-react";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function UsageMetrics() {
  const mockInterviewUsage = useFeatureUsage("mockInterview");
  const pdfAnalyzeUsage = useFeatureUsage("pdfAnalyze");
  const skribbleAIUsage = useFeatureUsage("skribbleAI");
  
  const { plan } = useUserPlan();
  const [refreshing, setRefreshing] = useState(false);
  
  // Function to refresh all usage data
  const refreshUsageData = async () => {
    try {
      setRefreshing(true);
      // The actual refresh happens automatically through the onSnapshot listeners
      // in the useFeatureUsage hooks, but we'll add a small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Usage data refreshed");
    } catch (error) {
      console.error("Error refreshing usage data:", error);
      toast.error("Failed to refresh usage data");
    } finally {
      setRefreshing(false);
    }
  };

  function FeatureUsageBar({ 
    title, 
    icon, 
    usage, 
    limit, 
    percentage,
    remaining,
    onReset
  }: { 
    title: string; 
    icon: React.ReactNode;
    usage: number; 
    limit: number | "unlimited"; 
    percentage: number;
    remaining: number | "unlimited";
    onReset: () => Promise<void>;
  }) {
    const isUnlimited = limit === "unlimited";
    
    return (
      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-300">{icon}</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isUnlimited ? "Unlimited" : `${usage} / ${limit}`}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={onReset}
              title="Reset usage"
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <Progress 
          value={percentage} 
          className={`h-2 ${percentage > 80 ? "[&>div]:bg-red-500" : percentage > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
        />
        
        <div className="mt-1 flex justify-between items-center">
          {percentage > 80 && !isUnlimited ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              You're approaching your limit
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isUnlimited ? "Unlimited usage" : `${remaining} ${remaining === 1 ? 'use' : 'uses'} remaining`}
            </p>
          )}
          
          {percentage > 80 && !isUnlimited && (
            <Button 
              variant="link" 
              className="text-xs p-0 h-auto" 
              onClick={() => window.open('/pricing', '_blank')}
            >
              Upgrade plan
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Feature Usage</h2>
        <div className="flex items-center gap-2">
          {plan && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1">
              {plan.planName} Plan
              {plan.subscriptionStatus === "active" && <span className="h-2 w-2 bg-green-500 rounded-full"></span>}
            </div>
          )}
        </div>
      </div>
      
      {mockInterviewUsage.loading || pdfAnalyzeUsage.loading || skribbleAIUsage.loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <FeatureUsageBar 
            title="Mock Interviews" 
            icon={<User className="h-5 w-5" />}
            usage={mockInterviewUsage.usage} 
            limit={mockInterviewUsage.limit} 
            percentage={mockInterviewUsage.percentage}
            remaining={mockInterviewUsage.remaining}
            onReset={mockInterviewUsage.resetUsage}
          />
          
          <FeatureUsageBar 
            title="PDF Analysis" 
            icon={<FileText className="h-5 w-5" />}
            usage={pdfAnalyzeUsage.usage} 
            limit={pdfAnalyzeUsage.limit} 
            percentage={pdfAnalyzeUsage.percentage}
            remaining={pdfAnalyzeUsage.remaining}
            onReset={pdfAnalyzeUsage.resetUsage}
          />
          
          <FeatureUsageBar 
            title="SkribbleAI" 
            icon={<Pencil className="h-5 w-5" />}
            usage={skribbleAIUsage.usage} 
            limit={skribbleAIUsage.limit} 
            percentage={skribbleAIUsage.percentage}
            remaining={skribbleAIUsage.remaining}
            onReset={skribbleAIUsage.resetUsage}
          />
          
          <div className="mt-6 flex justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center gap-1" 
              onClick={refreshUsageData}
              disabled={refreshing}
            >
              <RotateCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Refreshing..." : "Refresh Usage Data"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
