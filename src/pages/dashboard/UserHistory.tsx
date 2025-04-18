import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@clerk/clerk-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { Clock, FileText, Trash2, List, Brain, MessageSquare } from "lucide-react";

interface Activity {
  id: string;
  userId: string;
  action: string;
  timestamp: { seconds: number } | null;
  details?: Record<string, any>;
}

const ACTION_LABELS: Record<string, string> = {
  view_mock_interview_list: "Viewed Mock Interview List",
  delete_mock_interview: "Deleted Mock Interview",
  upload_pdf: "Uploaded PDF for Analysis",
  solved_equation: "Used SkribbleAI",
  increment_mockInterview: "Started Mock Interview",
  increment_pdfAnalyze: "Analyzed PDF",
  increment_skribbleAI: "Used SkribbleAI",
  reset_mockInterview: "Reset Mock Interview Usage",
  reset_pdfAnalyze: "Reset PDF Analysis Usage",
  reset_skribbleAI: "Reset SkribbleAI Usage",
  reset_all_features: "Reset All Feature Usage",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  view_mock_interview_list: <List className="w-4 h-4 text-muted-foreground" />,
  delete_mock_interview: <Trash2 className="w-4 h-4 text-destructive" />,
  upload_pdf: <FileText className="w-4 h-4 text-primary" />,
  solved_equation: <Brain className="w-4 h-4 text-primary" />,
  increment_mockInterview: <MessageSquare className="w-4 h-4 text-primary" />,
  increment_pdfAnalyze: <FileText className="w-4 h-4 text-primary" />,
  increment_skribbleAI: <Brain className="w-4 h-4 text-primary" />,
  reset_mockInterview: <MessageSquare className="w-4 h-4 text-muted-foreground" />,
  reset_pdfAnalyze: <FileText className="w-4 h-4 text-muted-foreground" />,
  reset_skribbleAI: <Brain className="w-4 h-4 text-muted-foreground" />,
  reset_all_features: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export default function UserHistory(): React.ReactElement {
  const { userId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        // Use the top-level user_activity collection with userId field
        const activitiesRef = collection(db, "user_activity");
        const activitiesQuery = query(
          activitiesRef,
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          limit(50) // Limit to most recent 50 activities
        );

        const snapshot = await getDocs(activitiesQuery);
        const activitiesList: Activity[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];

        setActivities(activitiesList);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  return (
    <Card className="w-full max-w-xl mx-auto mt-8 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-2">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No recent activity yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-100/70 hover:bg-slate-200 transition p-3"
                >
                  <span>{ACTION_ICONS[activity.action] || <Clock className="w-4 h-4" />}</span>
                  <span className="flex-1">
                    <span className="font-medium">
                      {ACTION_LABELS[activity.action] || activity.action}
                    </span>
                    {activity.details?.fileName && (
                      <span className="ml-2 text-xs text-muted-foreground">{activity.details.fileName}</span>
                    )}
                    {activity.details?.interviewId && (
                      <span className="ml-2 text-xs text-muted-foreground">Interview ID: {activity.details.interviewId}</span>
                    )}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {activity.timestamp?.seconds
                      ? new Date(activity.timestamp.seconds * 1000).toLocaleString()
                      : "Just now"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
