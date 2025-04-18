import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { BookOpen, FileText, Brain, TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

interface Activity {
  id: string;
  userId: string;
  action: string;
  timestamp: { seconds: number; nanoseconds: number };
  details?: Record<string, any>;
}

interface UsageData {
  date: string;
  mockInterview: number;
  pdfAnalyze: number;
  skribbleAI: number;
}

export default function FeatureUsageInsights({ userId }: { userId: string | null | undefined }) {
  
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("week");
  const [_, setActivities] = useState<Activity[]>([]); 

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        // Get all user activities from the last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const timestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
        
        const activitiesRef = collection(db, "user_activity");
        const activitiesQuery = query(
          activitiesRef,
          where("userId", "==", userId),
          where("timestamp", ">=", { seconds: timestamp, nanoseconds: 0 }),
          orderBy("timestamp", "asc")
        );

        const snapshot = await getDocs(activitiesQuery);
        const activitiesList: Activity[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];

        setActivities(activitiesList);
        
        // Process activities into daily usage data
        processActivitiesData(activitiesList);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  const processActivitiesData = (activities: Activity[]) => {
    // Create a map of dates to feature counts
    const dateMap: Record<string, { mockInterview: number; pdfAnalyze: number; skribbleAI: number }> = {};
    
    // Initialize the last 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      dateMap[dateString] = { mockInterview: 0, pdfAnalyze: 0, skribbleAI: 0 };
    }
    
    // Count activities by feature and date
    activities.forEach(activity => {
      if (!activity.timestamp) return;
      
      const date = format(new Date(activity.timestamp.seconds * 1000), 'yyyy-MM-dd');
      if (!dateMap[date]) return;
      
      if (activity.action.includes('mockInterview') || 
          activity.action.includes('interview')) {
        dateMap[date].mockInterview += 1;
      } else if (activity.action.includes('pdfAnalyze') || 
                activity.action.includes('pdf')) {
        dateMap[date].pdfAnalyze += 1;
      } else if (activity.action.includes('skribbleAI') || 
                activity.action.includes('equation')) {
        dateMap[date].skribbleAI += 1;
      }
    });
    
    // Convert to array and sort by date
    const result = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      ...counts
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    setUsageData(result);
  };

  const getFilteredData = () => {
    const today = new Date();
    
    switch (activeTab) {
      case "week": {
        // Get data for current week
        const startDay = startOfWeek(today);
        const endDay = endOfWeek(today);
        
        // Create array of all days in the week
        const daysInWeek = eachDayOfInterval({ start: startDay, end: endDay });
        
        // Map each day to its data, or zero if no data
        return daysInWeek.map(day => {
          const dateString = format(day, 'yyyy-MM-dd');
          const existingData = usageData.find(d => d.date === dateString);
          
          return existingData || {
            date: dateString,
            mockInterview: 0,
            pdfAnalyze: 0,
            skribbleAI: 0
          };
        });
      }
      
      case "month":
        // Return all data (last 30 days)
        return usageData;
        
      case "day":
        // Return just today's data
        const todayString = format(today, 'yyyy-MM-dd');
        const todayData = usageData.find(d => d.date === todayString);
        
        return todayData ? [todayData] : [{
          date: todayString,
          mockInterview: 0,
          pdfAnalyze: 0,
          skribbleAI: 0
        }];
        
      default:
        return usageData;
    }
  };

  const filteredData = getFilteredData();
  
  // Calculate totals for each feature
  const totals = filteredData.reduce((acc, day) => ({
    mockInterview: acc.mockInterview + day.mockInterview,
    pdfAnalyze: acc.pdfAnalyze + day.pdfAnalyze,
    skribbleAI: acc.skribbleAI + day.skribbleAI
  }), { mockInterview: 0, pdfAnalyze: 0, skribbleAI: 0 });
  
  // Find most active day
  const mostActiveDay = filteredData.reduce((max, day) => {
    const dayTotal = day.mockInterview + day.pdfAnalyze + day.skribbleAI;
    const maxTotal = max.mockInterview + max.pdfAnalyze + max.skribbleAI;
    
    return dayTotal > maxTotal ? day : max;
  }, { date: '', mockInterview: 0, pdfAnalyze: 0, skribbleAI: 0 });
  
  // Calculate most used feature
  const mostUsedFeature = 
    totals.mockInterview > totals.pdfAnalyze && totals.mockInterview > totals.skribbleAI
      ? { name: "Mock Interviews", count: totals.mockInterview, icon: <BookOpen className="h-4 w-4" /> }
      : totals.pdfAnalyze > totals.skribbleAI
        ? { name: "PDF Analysis", count: totals.pdfAnalyze, icon: <FileText className="h-4 w-4" /> }
        : { name: "SkribbleAI", count: totals.skribbleAI, icon: <Brain className="h-4 w-4" /> };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard 
          title="Total Activities" 
          value={totals.mockInterview + totals.pdfAnalyze + totals.skribbleAI} 
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          description={`In the selected period`}
        />
        
        <InsightCard 
          title="Most Used Feature" 
          value={mostUsedFeature.name} 
          icon={mostUsedFeature.icon}
          description={`Used ${mostUsedFeature.count} times`}
        />
        
        <InsightCard 
          title="Most Active Day" 
          value={mostActiveDay.date ? format(new Date(mostActiveDay.date), 'EEEE, MMM d') : 'None'} 
          icon={<Calendar className="h-4 w-4 text-green-500" />}
          description={mostActiveDay.date ? `${mostActiveDay.mockInterview + mostActiveDay.pdfAnalyze + mostActiveDay.skribbleAI} activities` : 'No activity'}
        />
      </div>
      
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">Activity Distribution</h3>
        <div className="h-64 relative">
          <UsageBarChart data={filteredData} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard 
          title="Mock Interviews" 
          count={totals.mockInterview}
          icon={<BookOpen className="h-5 w-5 text-blue-500" />}
          color="blue"
        />
        
        <FeatureCard 
          title="PDF Analysis" 
          count={totals.pdfAnalyze}
          icon={<FileText className="h-5 w-5 text-amber-500" />}
          color="amber"
        />
        
        <FeatureCard 
          title="SkribbleAI" 
          count={totals.skribbleAI}
          icon={<Brain className="h-5 w-5 text-purple-500" />}
          color="purple"
        />
      </div>
    </div>
  );
}

function InsightCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ 
  title, 
  count, 
  icon,
  color = "blue"
}: { 
  title: string; 
  count: number;
  icon: React.ReactNode;
  color?: "blue" | "amber" | "purple" | "green";
}) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-700 border-blue-200",
    amber: "bg-amber-500/10 text-amber-700 border-amber-200",
    purple: "bg-purple-500/10 text-purple-700 border-purple-200",
    green: "bg-green-500/10 text-green-700 border-green-200"
  };
  
  const bgClass = colorMap[color] || colorMap.blue;
  
  return (
    <div className={`rounded-lg border p-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold">{count}</div>
      <p className="text-xs opacity-70 mt-1">Total uses in period</p>
    </div>
  );
}

function UsageBarChart({ data }: { data: UsageData[] }) {
  // Find the maximum value to scale the chart
  const maxValue = data.reduce((max, day) => {
    const dayTotal = day.mockInterview + day.pdfAnalyze + day.skribbleAI;
    return Math.max(max, dayTotal);
  }, 0);
  
  // If no data or all zeros, show empty state
  if (maxValue === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No activity data available</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex items-end justify-between gap-1">
      {data.map((day) => {

        // Calculate heights for each feature
        const mockHeight = maxValue > 0 ? (day.mockInterview / maxValue) * 100 : 0;
        const pdfHeight = maxValue > 0 ? (day.pdfAnalyze / maxValue) * 100 : 0;
        const skribbleHeight = maxValue > 0 ? (day.skribbleAI / maxValue) * 100 : 0;
        
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center">
            <div className="w-full h-[calc(100%-24px)] flex flex-col-reverse">
              {/* SkribbleAI */}
              {skribbleHeight > 0 && (
                <div 
                  className="w-full bg-purple-500 rounded-t-sm" 
                  style={{ height: `${skribbleHeight}%` }}
                  title={`SkribbleAI: ${day.skribbleAI}`}
                />
              )}
              
              {/* PDF Analysis */}
              {pdfHeight > 0 && (
                <div 
                  className={`w-full bg-amber-500 ${skribbleHeight === 0 ? 'rounded-t-sm' : ''}`}
                  style={{ height: `${pdfHeight}%` }}
                  title={`PDF Analysis: ${day.pdfAnalyze}`}
                />
              )}
              
              {/* Mock Interview */}
              {mockHeight > 0 && (
                <div 
                  className={`w-full bg-blue-500 ${pdfHeight === 0 && skribbleHeight === 0 ? 'rounded-t-sm' : ''}`}
                  style={{ height: `${mockHeight}%` }}
                  title={`Mock Interviews: ${day.mockInterview}`}
                />
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 w-full text-center truncate">
              {format(new Date(day.date), data.length <= 7 ? 'EEE' : 'MM/dd')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
