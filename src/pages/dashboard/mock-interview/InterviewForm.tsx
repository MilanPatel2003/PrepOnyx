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
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { LoaderPage } from "@/pages/LoaderPage";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import { llmModels } from "@/llm"; // Import the llmModels
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { trackFeatureUsage } from "@/utils/featureTracker";

const formSchema = z.object({
  position: z.string().min(1, "Position is required"),
  description: z.string().min(1, "Description is required"),
  experience: z.coerce.number().min(0, "Experience must be a positive number"),
  techStack: z.string().min(1, "Tech stack is required"),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  interviewType: z.enum(["technical", "behavioral", "system-design"]),
  numberOfQuestions: z.coerce.number().min(1).max(20),
  specificTopics: z.string().optional(),
  keySkills: z.string().min(1, "Key skills are required"),
  interviewGoals: z.string().min(1, "Interview goals are required"),
});

type FormValues = z.infer<typeof formSchema>;

const cleanAiResponse = (responseText: string) => {
  try {
    const cleanText = responseText.trim().replace(/(json|```|`)/g, "");
    const jsonArrayMatch = cleanText.match(/\[.*\]/s);
    return jsonArrayMatch ? JSON.parse(jsonArrayMatch[0]) : [];
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Invalid response format");
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const InterviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(id);

  // Use the feature usage hook to check limits
  const mockInterviewUsage = useFeatureUsage("mockInterview");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: "",
      description: "",
      experience: 0,
      techStack: "",
      difficultyLevel: "intermediate",
      interviewType: "technical",
      numberOfQuestions: 5,
      specificTopics: "",
      keySkills: "",
      interviewGoals: "",
    },
  });

  const generateQuestionsAndAnswers = async (data: FormValues) => {
    const prompt = `
      As an expert technical interviewer, generate a comprehensive interview question set based on the following parameters:

      Job Details:
      - Position: ${data.position}
      - Description: ${data.description}
      - Experience Level: ${data.experience} years
      - Tech Stack: ${data.techStack}
      - Difficulty Level: ${data.difficultyLevel}
      - Interview Type: ${data.interviewType}
      - Number of Questions: ${data.numberOfQuestions}
      - Key Skills: ${data.keySkills}
      - Specific Topics: ${data.specificTopics || 'Not specified'}
      - Interview Goals: ${data.interviewGoals}

      Generate exactly ${data.numberOfQuestions} questions that:
      1. Match the difficulty level and experience requirements
      2. Focus on conceptual understanding and problem-solving
      3. Include system design considerations for relevant questions
      4. Add behavioral scenarios for soft skills assessment
      5. Test understanding without code implementation
      6. Progress in difficulty
      7. Cover both theory and practical experience
      8. Include targeted follow-up questions

      Return in JSON format:
      [
        {
          "question": "Question text",
          "answer": "Answer including:
                    - Key concepts
                    - Expected points
                    - Design considerations
                    - Common misconceptions
                    - Follow-up questions
                    - Good/poor response examples"
        }
      ]
    `;

    const result = await llmModels.googleGemini.invoke(prompt);
    return cleanAiResponse(result.content as string);
  };

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
              difficultyLevel: data.difficultyLevel,
              interviewType: data.interviewType,
              numberOfQuestions: data.numberOfQuestions,
              specificTopics: data.specificTopics,
              keySkills: data.keySkills,
              interviewGoals: data.interviewGoals,
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

  useEffect(() => {
    if (!isEditMode && !mockInterviewUsage.loading) {
      if (typeof mockInterviewUsage.limit === "number" && mockInterviewUsage.usage >= mockInterviewUsage.limit) {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>You've reached your Mock Interview limit. Please upgrade your plan for more interviews.</span>
          </div>, 
          { duration: 5000 }
        );
        navigate("/dashboard");
      }
    }
  }, [isEditMode, mockInterviewUsage.loading, mockInterviewUsage.usage, mockInterviewUsage.limit, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;

    setLoading(true);
    try {
      const questions = await generateQuestionsAndAnswers(values);

      const interviewData = {
        ...values,
        userId,
        questions,
        updateAt: serverTimestamp(),
      };

      if (isEditMode && id) {
        // Update existing interview
        await updateDoc(doc(db, "interviews", id!), {
          ...interviewData,
          questions,
          updatedAt: serverTimestamp(),
        });
        toast.success("Interview updated successfully");
      } else {
        // Create new interview
        const docRef = await addDoc(collection(db, "interviews"), {
          ...interviewData,
          questions,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Track feature usage when creating a new interview
        await trackFeatureUsage(
          userId,
          "mockInterview",
          "created_mock_interview",
          { interviewId: docRef.id, position: values.position }
        );
        
        toast.success("Interview created successfully");
        navigate(`/dashboard/mock-interview/${docRef.id}/start`);
      }
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
    <motion.div 
      className="max-w-3xl mx-auto space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Heading
          title={isEditMode ? "Edit Interview" : "Create New Interview"}
          description={
            isEditMode
              ? "Update your interview details"
              : "Set up a new mock interview with your requirements"
          }
        />
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <motion.div 
            className="space-y-6 rounded-lg border border-border/50 p-6 backdrop-blur-sm bg-card/30"
            variants={itemVariants}
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Frontend Developer" {...field} />
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
            </div>

            {/* Interview Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interview Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interviewType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select interview type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="system-design">System Design</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficultyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="20" {...field} />
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
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technical Requirements</h3>
              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Stack</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. React, Node.js, TypeScript" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keySkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Problem Solving, System Design, API Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specificTopics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Topics (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. State Management, Performance Optimization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interview Goals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interview Goals</h3>
              <FormField
                control={form.control}
                name="interviewGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goals & Focus Areas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What specific skills or qualities should this interview assess?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          <motion.div 
            className="flex gap-4 justify-end"
            variants={itemVariants}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/mock-interview")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditMode ? "Update Interview" : "Create Interview"}</>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
};

export default InterviewForm; 