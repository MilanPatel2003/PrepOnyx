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
import { Loader2 } from "lucide-react";
import { llmModels } from "@/llm"; // Import the llmModels

const formSchema = z.object({
  position: z.string().min(1, "Position is required"),
  description: z.string().min(1, "Description is required"),
  experience: z.coerce.number().min(0, "Experience must be a positive number"),
  techStack: z.string().min(1, "Tech stack is required"),
});

type FormValues = z.infer<typeof formSchema>;

const cleanAiResponse = (responseText: string) => {
  // Step 1: Trim any surrounding whitespace
  let cleanText = responseText.trim();

  // Step 2: Remove any occurrences of "json" or code block symbols (``` or `)
  cleanText = cleanText.replace(/(json|```|`)/g, "");

  // Step 3: Extract a JSON array by capturing text between square brackets
  const jsonArrayMatch = cleanText.match(/\[.*\]/s);
  if (jsonArrayMatch) {
    cleanText = jsonArrayMatch[0];
  } else {
    throw new Error("No JSON array found in response");
  }

  // Step 4: Parse the clean JSON text into an array of objects
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    throw new Error("Invalid JSON format: " + (error as Error)?.message);
  }
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

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

  const generateQuestionsAndAnswers = async (data: FormValues) => {
    const prompt = `
      As an experienced prompt engineer, generate a JSON array containing 5 technical interview questions along with detailed answers based on the following job information. Each object in the array should have the fields "question" and "answer", formatted as follows:

      [
        { "question": "<Question text>", "answer": "<Answer text>" },
        ...
      ]

      Job Information:
      - Job Position: ${data.position}
      - Job Description: ${data.description}
      - Years of Experience Required: ${data.experience}
      - Tech Stacks: ${data.techStack}

      The questions should assess skills in ${data.techStack} development and best practices, problem-solving, and experience handling complex requirements. Please format the output strictly as an array of JSON objects without any additional labels, code blocks, or explanations. Return only the JSON array with questions and answers.
    `;

    try {
      const result = await llmModels.googleGemini.invoke(prompt);
      return cleanAiResponse(result.content as string);
    } catch (error) {
      console.error("Error generating questions and answers:", error);
      throw new Error("Failed to generate questions and answers");
    }
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
      const questions = await generateQuestionsAndAnswers(values);

      const interviewData = {
        ...values,
        userId,
        questions, // Add the generated questions here
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
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Position</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Senior Frontend Developer" 
                      className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the role and requirements"
                      className="min-h-[120px] text-base resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Years of Experience</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="e.g. 3"
                        className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Tech Stack</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. React, Node.js, TypeScript"
                        className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          <motion.div 
            className="flex gap-4 justify-end pt-4"
            variants={itemVariants}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/mock-interview")}
              className="h-12 px-6 text-base hover:bg-secondary/80"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-12 px-8 text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all duration-300"
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