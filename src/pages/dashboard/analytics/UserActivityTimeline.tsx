import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { 
  FileText, 
  Brain, 
  MessageSquare, 
  RefreshCw, 
  Clock, 
  Trash2, 
  List,
  Award} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Activity {
  id: string;
  userId: string;
  action: string;
  timestamp: { seconds: number; nanoseconds: number } | null;
  details?: Record<string, any>;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  // Mock Interview actions
  view_mock_interview_list: <List className="h-4 w-4 text-blue-500" />,
  delete_mock_interview: <Trash2 className="h-4 w-4 text-red-500" />,
  increment_mockInterview: <MessageSquare className="h-4 w-4 text-blue-500" />,
  reset_mockInterview: <RefreshCw className="h-4 w-4 text-blue-500" />,
  
  // PDF Analysis actions
  upload_pdf: <FileText className="h-4 w-4 text-amber-500" />,
  pdf_analysis_complete: <FileText className="h-4 w-4 text-amber-500" />,
  start_pdf_quiz: <FileText className="h-4 w-4 text-amber-500" />,
  complete_pdf_quiz: <Award className="h-4 w-4 text-amber-500" />,
  increment_pdfAnalyze: <FileText className="h-4 w-4 text-amber-500" />,
  reset_pdfAnalyze: <RefreshCw className="h-4 w-4 text-amber-500" />,
  
  // SkribbleAI actions
  solve_equation: <Brain className="h-4 w-4 text-purple-500" />,
  solved_equation: <Brain className="h-4 w-4 text-purple-500" />,
  increment_skribbleAI: <Brain className="h-4 w-4 text-purple-500" />,
  reset_skribbleAI: <RefreshCw className="h-4 w-4 text-purple-500" />,
  
  // General actions
  reset_all_features: <RefreshCw className="h-4 w-4 text-gray-500" />,
};

const ACTION_LABELS: Record<string, string> = {
  // Mock Interview actions
  view_mock_interview_list: "Viewed interview list",
  delete_mock_interview: "Deleted interview",
  increment_mockInterview: "Started interview",
  reset_mockInterview: "Reset interview usage",
  
  // PDF Analysis actions
  upload_pdf: "Uploaded PDF",
  pdf_analysis_complete: "Analyzed PDF",
  start_pdf_quiz: "Started PDF quiz",
  complete_pdf_quiz: "Completed PDF quiz",
  increment_pdfAnalyze: "Analyzed PDF",
  reset_pdfAnalyze: "Reset PDF analysis usage",
  
  // SkribbleAI actions
  solve_equation: "Solved equation",
  solved_equation: "Solved equation",
  increment_skribbleAI: "Used SkribbleAI",
  reset_skribbleAI: "Reset SkribbleAI usage",
  
  // General actions
  reset_all_features: "Reset all feature usage",
};

export default function UserActivityTimeline({ 
  userId, 
  excludeActions = [],
  limit = 15
}: { 
  userId: string | null | undefined;
  excludeActions?: string[];
  limit?: number;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        // Use the top-level user_activity collection with userId field
        const activitiesRef = collection(db, "user_activity");
        // If there are actions to exclude, we need to fetch more and filter client-side
        // since Firestore doesn't support "not in" queries directly
        const fetchLimit = excludeActions.length > 0 ? limit * 2 : limit;
        
        // Build query with filters
        let activitiesQuery = query(
          activitiesRef,
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          firestoreLimit(fetchLimit) // Use the calculated fetch limit
        );

        // Get documents with potentially higher limit to account for excluded actions
        const snapshot = await getDocs(activitiesQuery);
        let activitiesList: Activity[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];
        
        // Filter out excluded actions if any
        if (excludeActions.length > 0) {
          activitiesList = activitiesList
            .filter(activity => !excludeActions.includes(activity.action))
            .slice(0, limit); // Re-apply the limit after filtering
        }

        setActivities(activitiesList);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No activity recorded yet</p>
        <p className="text-sm">Your activities will appear here as you use PrepOnyx features</p>
      </div>
    );
  }

  // Group activities by date
  const groupedActivities: Record<string, Activity[]> = {};
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const date = format(new Date(activity.timestamp.seconds * 1000), 'yyyy-MM-dd');
      if (!groupedActivities[date]) {
        groupedActivities[date] = [];
      }
      groupedActivities[date].push(activity);
    }
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date} className="space-y-3">
          <div className="sticky top-0 bg-background pt-1 pb-2 z-10">
            <h3 className="text-sm font-medium text-muted-foreground">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <Separator className="mt-2" />
          </div>
          
          <div className="space-y-4">
            {dateActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = ACTION_ICONS[activity.action] || <Clock className="h-4 w-4 text-gray-500" />;
  const label = ACTION_LABELS[activity.action] || activity.action;
  
  const time = activity.timestamp 
    ? formatDistanceToNow(new Date(activity.timestamp.seconds * 1000), { addSuffix: true })
    : "Unknown time";
  
  // Get details to display based on action type
  const getDetails = () => {
    if (!activity.details) return null;
    
    switch (activity.action) {
      case "upload_pdf":
      case "pdf_analysis_complete":
        return activity.details.fileName ? (
          <Badge variant="outline" className="text-xs font-normal">
            {activity.details.fileName}
          </Badge>
        ) : null;
        
      case "complete_pdf_quiz":
        return activity.details.score !== undefined ? (
          <Badge variant="outline" className="text-xs font-normal">
            Score: {activity.details.score}/{activity.details.totalQuestions}
          </Badge>
        ) : null;
        
      case "solved_equation":
        return activity.details.firstExpression ? (
          <Badge variant="outline" className="text-xs font-normal max-w-[200px] truncate">
            {activity.details.firstExpression}
          </Badge>
        ) : null;
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {getDetails()}
        </div>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
