import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import * as z from "zod";
import { Interview } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Heading from "@/components/Heading";
import { useAuth } from "@clerk/clerk-react";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { LoaderPage } from "@/pages/LoaderPage";
import { toast } from "sonner";

const formSchema = z.object({
  position: z.string().min(1, "Position is required"),
  description: z.string().min(1, "Description is required"),
  experience: z.coerce.number().min(0, "Experience must be a positive number"),
  techStack: z.string().min(1, "Tech stack is required"),
});

type FormValues = z.infer<typeof formSchema>;

const InterviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: "",
      description: "",
      experience: 0,
      techStack: "",
    },
  });

  useEffect(() => {
    const fetchInterview = async () => {
      if (isEditMode && id) {
        setLoading(true);
        try {
          const docRef = doc(db, "interviews", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as Interview;
            form.reset({
              position: data.position,
              description: data.description,
              experience: data.experience,
              techStack: data.techStack,
            });
          } else {
            toast.error("Interview not found");
            navigate("/dashboard/mock-interview");
          }
        } catch (error) {
          console.error("Error fetching interview:", error);
          toast.error("Failed to fetch interview details");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInterview();
  }, [id, isEditMode, form, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const interviewData = {
        ...values,
        userId,
        updateAt: serverTimestamp(),
      };

      if (isEditMode && id) {
        // Update existing interview
        await updateDoc(doc(db, "interviews", id), interviewData);
        toast.success("Interview updated successfully");
      } else {
        // Create new interview
        await addDoc(collection(db, "interviews"), {
          ...interviewData,
          createdAt: serverTimestamp(),
        });
        toast.success("Interview created successfully");
      }

      navigate("/dashboard/mock-interview");
    } catch (error) {
      console.error("Error saving interview:", error);
      toast.error("Failed to save interview");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoaderPage />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Heading
        title={isEditMode ? "Edit Interview" : "Create New Interview"}
        description={
          isEditMode
            ? "Update your interview details"
            : "Set up a new mock interview with your requirements"
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Senior Frontend Developer" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the role and requirements"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience Required</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 3"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="techStack"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tech Stack</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. React, Node.js, TypeScript (comma separated)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/mock-interview")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Interview" : "Create Interview"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InterviewForm; 