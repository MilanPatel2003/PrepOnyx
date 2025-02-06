import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { useAuth } from "@clerk/clerk-react";
import { Interview } from "@/types";
import Heading from "@/components/Heading";
import { EmptyState } from "@/components/EmptyState";
import { MessageSquare } from "lucide-react";
import InterviewCard from "./InterviewCard";

const MockInterview = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
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
        
        setInterviews(interviewData);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [userId]);

  const handleDeleteInterview = async (id: string) => {
    try {
      // First delete all user answers associated with this interview
      const userAnswersRef = collection(db, 'userAnswers');
      const q = query(userAnswersRef, where('mockIdRef', '==', id));
      const querySnapshot = await getDocs(q);
      
      // Delete each user answer document
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Then delete the interview itself
      await deleteDoc(doc(db, "interviews", id));
      
      // Update local state
      setInterviews(prev => prev.filter(interview => interview.id !== id));
      toast.success("Interview and associated answers deleted successfully");
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("Failed to delete interview");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <Heading
        title="AI Mock Interview"
        description="Simulate interviews based on your resume with AI-generated questions and detailed feedback."
        showAddButton
        onAddClick={() => navigate("/dashboard/mock-interview/create")}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[250px] sm:h-[280px] lg:h-[300px] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No interviews yet"
          description="Create your first mock interview to get started"
          action={{
            label: "Create Interview",
            onClick: () => navigate("/dashboard/mock-interview/create"),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {interviews.map((interview) => (
            <InterviewCard 
              key={interview.id} 
              interview={interview}
              onDelete={handleDeleteInterview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MockInterview;
