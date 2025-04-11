import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { useAuth } from "@clerk/clerk-react";
import { Interview } from "@/types";
import { FeatureHeader } from "@/components/FeatureHeader";
import { EmptyState } from "@/components/EmptyState";
import { MessageSquare } from "lucide-react";
import InterviewCard from "./InterviewCard";

const MockInterview = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const navigate = useNavigate();

  const fetchInterviews = useCallback(async () => {
    if (!userId) return;
    
    try {
      const q = query(
        collection(db, "interviews"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const interviewData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Interview[];
      
      setInterviews(interviewData.sort((a, b) => 
        b.createdAt.toMillis() - a.createdAt.toMillis()
      ));
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleDeleteInterview = async (id: string) => {
    try {
      const batch = writeBatch(db);
      
      // Get all user answers for this interview
      const userAnswersSnapshot = await getDocs(
        query(collection(db, 'userAnswers'), where('mockIdRef', '==', id))
      );
      
      // Add all deletes to batch
      userAnswersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add interview delete to batch
      batch.delete(doc(db, "interviews", id));
      
      // Execute all deletes in one atomic operation
      await batch.commit();
      
      // Update local state
      setInterviews(prev => prev.filter(interview => interview.id !== id));
      toast.success("Interview deleted successfully");
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("Failed to delete interview");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[250px] sm:h-[280px] lg:h-[300px] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (interviews.length === 0) {
      return (
        <EmptyState
          icon={MessageSquare}
          title="No interviews yet"
          description="Create your first mock interview to get started"
          action={{
            label: "Create Interview",
            onClick: () => navigate("/dashboard/mock-interview/create"),
          }}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {interviews.map((interview) => (
          <InterviewCard 
            key={interview.id} 
            interview={interview}
            onDelete={handleDeleteInterview}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <FeatureHeader
        title="AI Mock Interview"
        description="Simulate interviews based on your resume with AI-generated questions and detailed feedback."
        icon={<MessageSquare className="h-6 w-6" />}
        usageSteps={[
          "Create a new interview with your desired position",
          "Answer AI-generated questions in real-time",
          "Get instant feedback and emotion insights",
          "Review your performance metrics"
        ]}
        showAddButton
        onAddClick={() => navigate("/dashboard/mock-interview/create")}
        className="mb-6"
      />

      {renderContent()}
    </div>
  );
};

export default MockInterview;
