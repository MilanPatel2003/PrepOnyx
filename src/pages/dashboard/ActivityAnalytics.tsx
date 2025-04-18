import { Card } from "@/components/ui/card";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
// Import components for dashboard
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  userId: string;
  action: string;
  timestamp: Timestamp | null;
  details?: Record<string, any>;
}

// Activity types with colors for the pie chart (dark mode compatible)
const ACTIVITY_TYPES = {
  view_mock_interview_list: { label: "View Interviews", color: "#a78bfa", feature: "mockInterview" },  // Purple
  delete_mock_interview: { label: "Delete Interview", color: "#f87171", feature: "mockInterview" },    // Red
  upload_pdf: { label: "Upload PDF", color: "#34d399", feature: "pdfAnalyze" },                     // Green
  start_mock_interview: { label: "Start Interview", color: "#60a5fa", feature: "mockInterview" },      // Blue
  complete_mock_interview: { label: "Complete Interview", color: "#fbbf24", feature: "mockInterview" }, // Yellow
  ai_response: { label: "AI Response", color: "#ec4899", feature: "skribbleAI" },                    // Pink
  generate_ai_content: { label: "AI Content", color: "#8b5cf6", feature: "skribbleAI" },             // Violet
};

export default function ActivityAnalytics() {
  const { userId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get feature usage data
  const mockInterviewUsage = useFeatureUsage("mockInterview");
  const pdfAnalyzeUsage = useFeatureUsage("pdfAnalyze");
  const skribbleAIUsage = useFeatureUsage("skribbleAI");

  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    
    // Use onSnapshot for real-time updates
    const q = query(
      collection(db, "user_activity"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Activity[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      setActivities(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activities:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [userId]);

  // Process data for pie chart - count activities by type
  const pieData = Object.entries(
    activities.reduce((acc, activity) => {
      const type = activity.action;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => {
    // Use the predefined label if available, otherwise format the action name
    const formattedName = ACTIVITY_TYPES[name as keyof typeof ACTIVITY_TYPES]?.label || 
      name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return { 
      name: formattedName, 
      value,
      color: ACTIVITY_TYPES[name as keyof typeof ACTIVITY_TYPES]?.color || '#94a3b8' // Default color
    };
  });

  // Process data for bar chart - activities by day
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  // Group activities by day and by type
  const activityByDay = activities.reduce((acc, activity) => {
    if (!activity.timestamp) return acc;
    
    const activityDate = new Date(activity.timestamp.toDate()).toISOString().split('T')[0];
    if (!acc[activityDate]) {
      acc[activityDate] = { total: 0 };
    }
    
    // Count total activities for this day
    acc[activityDate].total += 1;
    
    // Count by activity type
    const actionType = activity.action;
    if (!acc[activityDate][actionType]) {
      acc[activityDate][actionType] = 0;
    }
    acc[activityDate][actionType] += 1;
    
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Create data for the stacked bar chart
  const barData = last7Days.map(day => {
    const dayData = activityByDay[day] || { total: 0 };
    const result: Record<string, any> = {
      date: day.split('-').slice(1).join('/'), // Format as MM/DD
      total: dayData.total,
    };
    
    // Add counts for each activity type
    Object.keys(ACTIVITY_TYPES).forEach(actionType => {
      result[actionType] = dayData[actionType] || 0;
    });
    
    return result;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-4 bg-card">
          <Skeleton className="h-[200px] w-full" />
        </Card>
        <Card className="p-4 bg-card">
          <Skeleton className="h-[200px] w-full" />
        </Card>
      </div>
    );
  }

  // Calculate feature usage trends
  const getFeatureUsageTrend = () => {
    const featureUsage = {
      mockInterview: { usage: mockInterviewUsage.usage, limit: mockInterviewUsage.limit },
      pdfAnalyze: { usage: pdfAnalyzeUsage.usage, limit: pdfAnalyzeUsage.limit },
      skribbleAI: { usage: skribbleAIUsage.usage, limit: skribbleAIUsage.limit },
    };
    
    // Group activities by feature
    const featureActivities = activities.reduce((acc, activity) => {
      const actionType = activity.action;
      const feature = ACTIVITY_TYPES[actionType as keyof typeof ACTIVITY_TYPES]?.feature || "other";
      
      if (!acc[feature]) {
        acc[feature] = [];
      }
      
      acc[feature].push(activity);
      return acc;
    }, {} as Record<string, Activity[]>);
    
    return { featureUsage, featureActivities };
  };
  
  // Get feature usage data
  const { featureUsage, featureActivities } = getFeatureUsageTrend();
  
  // Create time-series data for feature usage over time
  const createTimeSeriesData = () => {
    // Last 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    // Count activities by date and feature
    return dates.map(date => {
      const result: Record<string, any> = { date };
      
      // Add counts for each feature
      Object.keys(featureActivities).forEach(feature => {
        const count = featureActivities[feature]?.filter(activity => {
          if (!activity.timestamp) return false;
          return new Date(activity.timestamp.toDate()).toISOString().split('T')[0] === date;
        }).length || 0;
        
        result[feature] = count;
      });
      
      return result;
    });
  };
  
  const timeSeriesData = createTimeSeriesData();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Activity by Type - Pie Chart */}
          <Card className="p-4 bg-card">
            <h3 className="text-lg font-medium mb-4">Activity by Type</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => {
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Activity by Day - Bar Chart */}
          <Card className="p-4 bg-card">
            <h3 className="text-lg font-medium mb-4">Activity Last 7 Days</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  {/* Create a stacked bar chart with different activity types */}
                  {Object.entries(ACTIVITY_TYPES).map(([key, { label, color }]) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      stackId="a" 
                      fill={color} 
                      name={label} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        {/* Feature Usage Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card className="p-4 bg-card">
            <h3 className="text-lg font-medium mb-4">Feature Usage vs. Limits</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { 
                      name: 'Mock Interviews', 
                      usage: featureUsage.mockInterview.usage,
                      limit: typeof featureUsage.mockInterview.limit === 'number' ? featureUsage.mockInterview.limit : 0,
                      unlimited: featureUsage.mockInterview.limit === 'unlimited'
                    },
                    { 
                      name: 'PDF Analysis', 
                      usage: featureUsage.pdfAnalyze.usage,
                      limit: typeof featureUsage.pdfAnalyze.limit === 'number' ? featureUsage.pdfAnalyze.limit : 0,
                      unlimited: featureUsage.pdfAnalyze.limit === 'unlimited'
                    },
                    { 
                      name: 'Skribble AI', 
                      usage: featureUsage.skribbleAI.usage,
                      limit: typeof featureUsage.skribbleAI.limit === 'number' ? featureUsage.skribbleAI.limit : 0,
                      unlimited: featureUsage.skribbleAI.limit === 'unlimited'
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    formatter={(value, name: string) => {
                      if (name === 'limit' && value === 0) {
                        return ['Unlimited', 'Limit'];
                      }
                      return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="usage" fill="#60a5fa" name="Usage" />
                  <Bar dataKey="limit" fill="#f87171" name="Limit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card className="p-4 bg-card">
            <h3 className="text-lg font-medium mb-4">Activity Distribution by Feature</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Mock Interviews', value: featureActivities.mockInterview?.length || 0, color: '#60a5fa' },
                      { name: 'PDF Analysis', value: featureActivities.pdfAnalyze?.length || 0, color: '#34d399' },
                      { name: 'Skribble AI', value: featureActivities.skribbleAI?.length || 0, color: '#a78bfa' },
                      { name: 'Other', value: featureActivities.other?.length || 0, color: '#94a3b8' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Mock Interviews', value: featureActivities.mockInterview?.length || 0, color: '#60a5fa' },
                      { name: 'PDF Analysis', value: featureActivities.pdfAnalyze?.length || 0, color: '#34d399' },
                      { name: 'Skribble AI', value: featureActivities.skribbleAI?.length || 0, color: '#a78bfa' },
                      { name: 'Other', value: featureActivities.other?.length || 0, color: '#94a3b8' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="p-4 bg-card">
            <h3 className="text-lg font-medium mb-4">Feature Usage Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => {
                      const date = new Date(tick);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    ticks={timeSeriesData.filter((_, i) => i % 5 === 0).map(d => d.date)}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="mockInterview" 
                    stackId="1"
                    stroke="#60a5fa" 
                    fill="#60a5fa" 
                    name="Mock Interviews" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pdfAnalyze" 
                    stackId="1"
                    stroke="#34d399" 
                    fill="#34d399" 
                    name="PDF Analysis" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="skribbleAI" 
                    stackId="1"
                    stroke="#a78bfa" 
                    fill="#a78bfa" 
                    name="Skribble AI" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card className="p-4 bg-card">
            <h3 className="text-lg font-medium mb-4">Activity Trends</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => {
                      const date = new Date(tick);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    ticks={timeSeriesData.filter((_, i) => i % 5 === 0).map(d => d.date)}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="mockInterview" 
                    stroke="#60a5fa" 
                    name="Mock Interviews" 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pdfAnalyze" 
                    stroke="#34d399" 
                    name="PDF Analysis" 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="skribbleAI" 
                    stroke="#a78bfa" 
                    name="Skribble AI" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
