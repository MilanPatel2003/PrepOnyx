import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { useUserPlan } from "@/hooks/useUserPlan";
import { toast } from "sonner";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  FileText,
  LayoutDashboard,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Zap,
  Clock,
  Award,
  TrendingUp,
  Sparkles
} from "lucide-react";
import UserActivityTimeline from "./analytics/UserActivityTimeline";
import FeatureUsageInsights from "./analytics/FeatureUsageInsights";
import PlanRecommendation from "./analytics/PlanRecommendation";

export default function DashboardV2() {
  const { userId } = useAuth();
  const { user } = useUser();
  const { plan, loading: planLoading } = useUserPlan();
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // Get usage data for all features
  const mockInterviewUsage = useFeatureUsage("mockInterview");
  const pdfAnalyzeUsage = useFeatureUsage("pdfAnalyze");
  const skribbleAIUsage = useFeatureUsage("skribbleAI");
  
  // Function to refresh all usage data
  const refreshUsageData = async () => {
    try {
      setRefreshing(true);
      // The actual refresh happens automatically through the onSnapshot listeners
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Dashboard data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate overall usage percentage
  const calculateOverallUsage = () => {
    let totalUsed = 0;
    let totalLimit = 0;
    
    if (typeof mockInterviewUsage.limit === "number") {
      totalUsed += mockInterviewUsage.usage;
      totalLimit += mockInterviewUsage.limit;
    }
    
    if (typeof pdfAnalyzeUsage.limit === "number") {
      totalUsed += pdfAnalyzeUsage.usage;
      totalLimit += pdfAnalyzeUsage.limit;
    }
    
    if (typeof skribbleAIUsage.limit === "number") {
      totalUsed += skribbleAIUsage.usage;
      totalLimit += skribbleAIUsage.limit;
    }
    
    return totalLimit > 0 ? Math.min(Math.round((totalUsed / totalLimit) * 100), 100) : 0;
  };

  // Determine user's most used feature
  const getMostUsedFeature = () => {
    const features = [
      { name: "Mock Interviews", usage: mockInterviewUsage.usage, icon: <BookOpen className="h-4 w-4" /> },
      { name: "PDF Analysis", usage: pdfAnalyzeUsage.usage, icon: <FileText className="h-4 w-4" /> },
      { name: "SkribbleAI", usage: skribbleAIUsage.usage, icon: <Brain className="h-4 w-4" /> }
    ];
    
    return features.sort((a, b) => b.usage - a.usage)[0];
  };
  
  const mostUsedFeature = getMostUsedFeature();
  const overallUsagePercentage = calculateOverallUsage();
  
  // Calculate days left in current billing period based on subscription data
  const calculateDaysLeft = () => {
    if (!plan || planLoading) return 0;
    // Use subscriptionEndDate if present
    if (plan.subscriptionEndDate) {
      let end: Date;
      // Duck typing for Firestore Timestamp
      if (
        typeof plan.subscriptionEndDate === 'object' &&
        plan.subscriptionEndDate !== null &&
        typeof (plan.subscriptionEndDate as any).toDate === 'function'
      ) {
        end = (plan.subscriptionEndDate as any).toDate();
      } else if (plan.subscriptionEndDate instanceof Date) {
        end = plan.subscriptionEndDate;
      } else {
        end = new Date(plan.subscriptionEndDate);
      }
      if (!isNaN(end.getTime())) {
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(diff, 0);
      }
    }
    // Fallback: If it's a paid plan, estimate days left in month
    if (plan.plan !== 'free' && plan.subscriptionStatus === 'active') {
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return lastDayOfMonth - today.getDate();
    }
    // For free plan or inactive subscription
    return 0;
  };
  
  const daysLeft = calculateDaysLeft();
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Dashboard Header with User Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
            <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.firstName || "there"}!
            </h1>
            <p className="text-muted-foreground text-sm">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Badge variant={planLoading ? "outline" : "default"} className="px-3 py-1">
            {planLoading ? "Loading..." : plan?.planName || "Free Plan"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={refreshUsageData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Usage Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Overall Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-bold">
                {overallUsagePercentage}%
              </div>
              <p className="text-xs text-muted-foreground">
                of your plan limits used
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 text-xs p-0 h-auto">
              View details <ChevronRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Most Used Feature Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Most Used Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {mostUsedFeature.name}
                </div>
                {mostUsedFeature.icon}
              </div>
              <p className="text-xs text-muted-foreground">
                {mostUsedFeature.usage} times used
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 text-xs p-0 h-auto">
              View insights <ChevronRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Subscription Status Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">
                {daysLeft} days left
              </div>
              <p className="text-xs text-muted-foreground">
                Current billing period
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 text-xs p-0 h-auto">
              Manage plan <ChevronRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Recent Activity Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">
                Just now
              </div>
              <p className="text-xs text-muted-foreground">
                Dashboard viewed
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 text-xs p-0 h-auto">
              View timeline <ChevronRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-background border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-background">
            <TrendingUp className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-background">
            <Sparkles className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature Usage Cards */}
            <Card className="lg:col-span-2 shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Feature Usage
                </CardTitle>
                <CardDescription>
                  Track your usage across all PrepOnyx features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FeatureUsageCard
                  title="Mock Interviews"
                  icon={<BookOpen className="h-5 w-5" />}
                  usage={mockInterviewUsage.usage}
                  limit={mockInterviewUsage.limit}
                  percentage={mockInterviewUsage.percentage}
                  loading={mockInterviewUsage.loading}
                  color="blue"
                />
                
                <FeatureUsageCard
                  title="PDF Analysis"
                  icon={<FileText className="h-5 w-5" />}
                  usage={pdfAnalyzeUsage.usage}
                  limit={pdfAnalyzeUsage.limit}
                  percentage={pdfAnalyzeUsage.percentage}
                  loading={pdfAnalyzeUsage.loading}
                  color="amber"
                />
                
                <FeatureUsageCard
                  title="SkribbleAI"
                  icon={<Brain className="h-5 w-5" />}
                  usage={skribbleAIUsage.usage}
                  limit={skribbleAIUsage.limit}
                  percentage={skribbleAIUsage.percentage}
                  loading={skribbleAIUsage.loading}
                  color="purple"
                />
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={refreshUsageData} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Usage Data
                </Button>
              </CardFooter>
            </Card>
            
            {/* Activity Timeline Card */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions on PrepOnyx
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] overflow-auto pr-2">
                <UserActivityTimeline 
                  userId={userId} 
                  excludeActions={['dashboard_viewed']} // Exclude dashboard views from timeline
                  limit={10} // Show more meaningful activities
                />
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/dashboard?tab=activity')}
                >
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Usage Insights
                </CardTitle>
                <CardDescription>
                  Detailed analysis of your feature usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureUsageInsights userId={userId} />
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Achievement Progress
                </CardTitle>
                <CardDescription>
                  Track your learning milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <AchievementItem 
                    title="Interview Master" 
                    description="Complete 10 mock interviews" 
                    progress={mockInterviewUsage.usage} 
                    target={10}
                  />
                  <AchievementItem 
                    title="Document Analyzer" 
                    description="Analyze 15 PDF documents" 
                    progress={pdfAnalyzeUsage.usage} 
                    target={15}
                  />
                  <AchievementItem 
                    title="Math Wizard" 
                    description="Solve 20 equations with SkribbleAI" 
                    progress={skribbleAIUsage.usage} 
                    target={20}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Get the most out of PrepOnyx based on your usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanRecommendation 
                currentPlan={plan?.planName || "Free"} 
                usageData={{
                  mockInterview: mockInterviewUsage,
                  pdfAnalyze: pdfAnalyzeUsage,
                  skribbleAI: skribbleAIUsage
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Feature Usage Card Component
function FeatureUsageCard({ 
  title, 
  icon, 
  usage, 
  limit, 
  percentage, 
  loading,
  color = "blue"
}: { 
  title: string; 
  icon: React.ReactNode; 
  usage: number; 
  limit: number | "unlimited"; 
  percentage: number;
  loading: boolean;
  color?: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const isUnlimited = limit === "unlimited";
  const colorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500"
  };
  
  const bgColor = colorMap[color] || colorMap.blue;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <div className="text-sm font-medium">
          {loading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : (
            <span>
              {usage} / {isUnlimited ? "∞" : limit}
            </span>
          )}
        </div>
      </div>
      
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        {!loading && (
          <motion.div 
            className={`h-full ${bgColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${isUnlimited ? 15 : percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          {isUnlimited ? "Unlimited access" : `${percentage}% used`}
        </span>
        {!isUnlimited && percentage >= 80 && (
          <span className="text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Approaching limit
          </span>
        )}
      </div>
    </div>
  );
}

// Achievement Item Component
function AchievementItem({ 
  title, 
  description, 
  progress, 
  target 
}: { 
  title: string; 
  description: string; 
  progress: number; 
  target: number;
}) {
  const percentage = Math.min(Math.round((progress / target) * 100), 100);
  const isCompleted = percentage >= 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <Award className="h-3 w-3 text-white" />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center">
              <Award className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
        <Badge variant={isCompleted ? "default" : "outline"}>
          {progress}/{target}
        </Badge>
      </div>
      
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${isCompleted ? "bg-green-500" : "bg-blue-500"} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
