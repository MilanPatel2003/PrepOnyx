import 'regenerator-runtime/runtime';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { Interview as InterviewType, UserAnswer } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Loader2, MessageSquare, Lightbulb, CheckCircle2, Star } from 'lucide-react';
import { LoaderPage } from '@/pages/LoaderPage';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {  useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { llmModels } from '@/llm';
import { EmotionDetector } from '@/components/EmotionDetector';
import { Progress } from '@/components/ui/progress';


// Define types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface AIFeedbackResponse {
  ratings: {
    overall: number;
    relevance: number;
    clarity: number;
    depth: number;
    structure: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string;
    summary: string;
  };
  keywords: string[];
}

interface AIResponse {
  ratings: number;
  feedback: string;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
  }
}

interface InterviewMetrics {
  confidence: number;
  nervousness: number;
  engagement: number;
}

// Simplified emotion metrics calculation
const calculateInterviewMetrics = (emotions: { expression: string; probability: number }[]): InterviewMetrics => {
  const defaultMetrics: InterviewMetrics = {
    confidence: 50,
    nervousness: 30,
    engagement: 40
  };

  if (emotions.length === 0) return defaultMetrics;

  const emotionMap = emotions.reduce((acc, emotion) => {
    acc[emotion.expression] = emotion.probability;
    return acc;
  }, {} as Record<string, number>);

  const metrics = {
    confidence: (
      (emotionMap.happy || 0) * 150 +
      (emotionMap.neutral || 0) * 100 -
      (emotionMap.fearful || 0) * 200 -
      (emotionMap.sad || 0) * 100 + 50
    ),
    nervousness: (
      (emotionMap.fearful || 0) * 200 +
      (emotionMap.surprised || 0) * 120 +
      (emotionMap.angry || 0) * 80 -
      (emotionMap.neutral || 0) * 150 + 30
    ),
    engagement: (
      (emotionMap.neutral || 0) * 150 +
      (emotionMap.happy || 0) * 120 -
      (emotionMap.disgusted || 0) * 100 -
      (emotionMap.sad || 0) * 100 + 40
    )
  };

  return {
    confidence: Math.max(0, Math.min(100, metrics.confidence)),
    nervousness: Math.max(0, Math.min(100, metrics.nervousness)),
    engagement: Math.max(0, Math.min(100, metrics.engagement))
  };
};

const StartInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isWebcamOn, setIsWebcamOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [emotions, setEmotions] = useState<{[key: string]: number}>({});
  const [metrics, setMetrics] = useState<InterviewMetrics>({
    confidence: 0,
    nervousness: 0,
    engagement: 0
  });
  const { user } = useUser();
  
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Use transcript from useSpeechRecognition instead of local state
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Simplified fetch interview
  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, "interviews", id));
        if (docSnap.exists()) {
          setInterview({ id: docSnap.id, ...docSnap.data() } as InterviewType);
        } else {
          toast.error("Interview not found");
          navigate("/dashboard/mock-interview");
        }
      } catch (error) {
        console.error("Error fetching interview:", error);
        toast.error("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  // Simplified speech synthesis initialization
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      synthRef.current?.cancel();
      isRecording && SpeechRecognition.stopListening();
    };
  }, [isRecording]);

  // Speak question on change
  useEffect(() => {
    interview?.questions[currentQuestionIndex]?.question && speakQuestion();
  }, [currentQuestionIndex, interview]);

  const speakQuestion = () => {
    if (!interview?.questions[currentQuestionIndex]?.question || !synthRef.current) return;
    
    synthRef.current.cancel();
    setIsSpeaking(true);
    
    const question = interview.questions[currentQuestionIndex].question;
    const words = question.split(' ');
    const utterance = new SpeechSynthesisUtterance(question);
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightedWords(prev => [...words.slice(0, words.indexOf(prev[prev.length - 1]) + 2)]);
      }
    };

    utterance.onend = () => {
      setHighlightedWords(words);
      setIsSpeaking(false);
    };

    utterance.rate = 0.9;
    utterance.pitch = 1;
    synthRef.current.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
    setIsRecording(!isRecording);
  };

  const toggleWebcam = () => {
    setIsWebcamOn(!isWebcamOn);
  };

  // Add interval for continuous emotion detection
  useEffect(() => {
    let emotionInterval: NodeJS.Timeout;

    if (isWebcamOn && isRecording) {
      // Update emotions more frequently during recording
      emotionInterval = setInterval(() => {
        if (Object.keys(emotions).length > 0) {
          const emotionsArray = Object.entries(emotions).map(([expression, value]) => ({
            expression,
            probability: value / 100 // Convert percentage back to 0-1 range
          }));
          const newMetrics = calculateInterviewMetrics(emotionsArray);
          setMetrics(newMetrics);
        }
      }, 500); // Update every 500ms
    }

    return () => {
      if (emotionInterval) {
        clearInterval(emotionInterval);
      }
    };
  }, [isWebcamOn, isRecording, emotions]);

  const handleEmotionDetected = (newEmotions: {[key: string]: number}) => {
    setEmotions(newEmotions);
    const emotionsArray = Object.entries(newEmotions).map(([expression, probability]) => ({
      expression,
      probability: probability / 100 // Convert percentage back to 0-1 range
    }));
    const newMetrics = calculateInterviewMetrics(emotionsArray);
    setMetrics(newMetrics);
  };

  const saveUserAnswer = async (answer: Omit<UserAnswer, 'id' | 'createdAt' | 'updateAt'>) => {
    try {
      const userAnswersRef = collection(db, 'userAnswers');
      const q = query(
        userAnswersRef, 
        where('userId', '==', user?.id),
        where('mockIdRef', '==', interview?.id),
        where('questionIndex', '==', currentQuestionIndex)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Clean up the answer data by removing undefined values
      const cleanAnswer = Object.fromEntries(
        Object.entries({
          ...answer,
          questionIndex: currentQuestionIndex,
          updateAt: new Date()
        }).filter(([_, v]) => v !== undefined)
      );

      if (!querySnapshot.empty) {
        // Update existing answer
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'userAnswers', existingDoc.id), cleanAnswer);
      } else {
        // Create new answer
        await addDoc(userAnswersRef, {
          ...cleanAnswer,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  };

  const cleanJsonResponse = (responseText: string) => {
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/(json|```|`)/g, "");
    try {
      return JSON.parse(cleanText);
    } catch (error) {
      throw new Error("Invalid JSON format: " + (error as Error)?.message);
    }
  };

  const getAIFeedback = async (qst: string, userAns: string, qstAns: string): Promise<AIResponse> => {
    const prompt = `
      You are an expert interviewer and evaluator. Analyze the following interview response:

      Question: "${qst}"
      User's Answer: "${userAns}"
      Expected Answer Key Points: "${qstAns}"

      Provide a detailed evaluation in JSON format with the following structure:
      {
        "ratings": {
          "overall": number (1-10),
          "relevance": number (1-10),
          "clarity": number (1-10),
          "depth": number (1-10),
          "structure": number (1-10)
        },
        "feedback": {
          "strengths": string[] (list of strong points),
          "improvements": string[] (specific areas to improve),
          "suggestions": string (constructive advice),
          "summary": string (overall feedback)
        },
        "keywords": string[] (key technical terms or concepts mentioned)
      }

      Evaluation criteria:
      - Relevance: How well the answer addresses the question
      - Clarity: Communication clarity and articulation
      - Depth: Technical depth and understanding
      - Structure: Organization and flow of the response
      - Overall: Combined assessment of all aspects

      Be specific, constructive, and actionable in your feedback.
    `;

    try {
      const result = await llmModels.googleGemini.invoke(prompt);
      const aiResponse = cleanJsonResponse(result.content as string) as AIFeedbackResponse;
      
      // Format the response for our existing structure
      return {
        ratings: aiResponse.ratings.overall,
        feedback: `${aiResponse.feedback.summary}\n\nStrengths:\n${aiResponse.feedback.strengths.map((s: string) => `• ${s}`).join('\n')}\n\nAreas to Improve:\n${aiResponse.feedback.improvements.map((i: string) => `• ${i}`).join('\n')}\n\nSuggestions:\n${aiResponse.feedback.suggestions}`
      };
    } catch (error) {
      console.error('AI Processing Error:', error);
      throw error;
    }
  };

  const handleNextQuestion = async () => {
    if (!interview) return;
    
    setIsAIProcessing(true);
    const currentQuestion = interview.questions[currentQuestionIndex];
    
    try {
      const aiResponse = await getAIFeedback(
        currentQuestion.question,
        transcript,
        currentQuestion.answer
      );

      // Get the average emotions during the answer
      const emotionEntries = Object.entries(emotions);
      const emotionSummary = emotionEntries.length > 0 ? {
        expression: emotionEntries[0][0],
        confidence: emotionEntries[0][1] / 100,
        metrics: {
          confidence: metrics.confidence,
          nervousness: metrics.nervousness,
          engagement: metrics.engagement,
          overall: (metrics.confidence + (100 - metrics.nervousness) + metrics.engagement) / 3
        }
      } : null;

      // Save the answer
      await saveUserAnswer({
        mockIdRef: interview.id,
        question: currentQuestion.question,
        correct_ans: currentQuestion.answer,
        user_ans: transcript,
        feedback: aiResponse.feedback,
        rating: aiResponse.ratings,
        userId: user?.id || '',
        questionIndex: currentQuestionIndex,
        emotionalState: emotionSummary
      });

      // If this is the last question, navigate to results
      if (currentQuestionIndex === interview.questions.length - 1) {
        navigate(`/dashboard/mock-interview/results/${interview.id}`);
      } else {
        // Move to next question
        setCurrentQuestionIndex((prev) => prev + 1);
        resetTranscript();
        setEmotions({});
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      toast.error('Failed to process answer. Please try again.');
    } finally {
      setIsAIProcessing(false);
    }
  };

  if (loading) return <LoaderPage />;
  if (!interview) return <div>Interview not found</div>;

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser doesn't support speech recognition.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {loading ? (
        <LoaderPage />
      ) : !interview ? (
        <div>Interview not found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area - Takes up 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Display */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">
                  Question {currentQuestionIndex + 1} of {interview.questions.length}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-lg whitespace-pre-wrap">
                  {interview.questions[currentQuestionIndex]?.question}
                </p>
              </CardContent>
            </Card>

            {/* Webcam and Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  {isWebcamOn && (
                    <EmotionDetector onEmotionDetected={handleEmotionDetected} />
                  )}
                  {!isWebcamOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <VideoOff className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant={isWebcamOn ? "default" : "outline"}
                    onClick={toggleWebcam}
                  >
                    {isWebcamOn ? (
                      <>
                        <Video className="h-4 w-4" />
                        Camera On
                      </>
                    ) : (
                      <>
                        <VideoOff className="h-4 w-4" />
                        Camera Off
                      </>
                    )}
                  </Button>
                  <Button
                    variant={isRecording ? "default" : "outline"}
                    onClick={toggleRecording}
                  >
                    {isRecording ? (
                      <>
                        <Mic className="h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <MicOff className="h-4 w-4" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Answer Area */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Your Answer</h3>
              </CardHeader>
              <CardContent>
                <div className="min-h-[100px] p-4 rounded-lg bg-muted/50">
                  {transcript || "Your answer will appear here as you speak..."}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous Question
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={isAIProcessing}
                variant={currentQuestionIndex === interview.questions.length - 1 ? "default" : "outline"}
              >
                {isAIProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : currentQuestionIndex === interview.questions.length - 1 ? (
                  'Finish Interview'
                ) : (
                  'Next Question'
                )}
              </Button>
            </div>
          </div>

          {/* Real-time Emotions Display */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Real-time Emotions</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(emotions).map(([expression, value]) => (
                  <div key={expression} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{expression}</span>
                      <span>{value}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips Section */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Interview Tips</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-1" />
                  <p>Speak clearly and maintain a steady pace</p>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-1" />
                  <p>Use specific examples to support your answers</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <p>Stay focused and maintain good eye contact</p>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-purple-500 mt-1" />
                  <p>Show enthusiasm and positive energy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartInterview;