import 'regenerator-runtime/runtime';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { Interview as InterviewType, UserAnswer } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Webcam from 'react-webcam';
import { Mic, MicOff, Play, Video, VideoOff, Loader2, MessageSquare, Lightbulb, CheckCircle2, Star } from 'lucide-react';
import { LoaderPage } from '@/pages/LoaderPage';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {  useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { llmModels } from '@/llm';


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

const StartInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isWebcamOn, setIsWebcamOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const { user } = useUser();
  
  const webcamRef = useRef<Webcam>(null);
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

  // Fetch interview data
  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "interviews", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInterview({ id: docSnap.id, ...docSnap.data() } as InterviewType);
        }
      } catch (error) {
        console.error("Error fetching interview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  // Initialize speech synthesis
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    // Speak first question when component mounts
    if (interview?.questions[0]?.question) {
      const utterance = new SpeechSynthesisUtterance(interview.questions[0].question);
      synthRef.current?.speak(utterance);
    }

    return () => {
      synthRef.current?.cancel();
      if (isRecording) {
        SpeechRecognition.stopListening();
      }
    };
  }, [interview]);

  // Speak question whenever currentQuestionIndex changes
  useEffect(() => {
    if (interview?.questions[currentQuestionIndex]?.question) {
      speakQuestion();
    }
  }, [currentQuestionIndex, interview]);

  const speakQuestion = () => {
    if (!interview?.questions[currentQuestionIndex]?.question || !synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    setIsSpeaking(true);
    setHighlightedWords([]);
    
    const question = interview.questions[currentQuestionIndex].question;
    const words = question.split(' ');
    const utterance = new SpeechSynthesisUtterance(question);
    
    let wordIndex = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightedWords(words.slice(0, wordIndex + 1));
        wordIndex++;
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
      
      const answerData = {
        ...answer,
        questionIndex: currentQuestionIndex,
        updateAt: new Date()
      };

      if (!querySnapshot.empty) {
        // Update existing answer
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'userAnswers', existingDoc.id), answerData);
      } else {
        // Create new answer
        await addDoc(userAnswersRef, {
          ...answerData,
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

  const getAIFeedback = async (qst: string, userAns: string, qstAns: string) => {
    const prompt = `
      Question: "${qst}"
      User Answer: "${userAns}"
      Correct Answer: "${qstAns}"
      Please compare the user's answer to the correct answer, and provide a rating (from 1 to 10) based on answer quality, and offer feedback for improvement.
      Return the result in JSON format with the fields "ratings" (number) and "feedback" (string).
    `;

    try {
      const result = await llmModels.googleGemini.invoke(prompt);
      const aiResponse = cleanJsonResponse(result.content as string) as AIResponse;
      return aiResponse;
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

      const userAnswer: Omit<UserAnswer, 'id' | 'createdAt' | 'updateAt'> = {
        mockIdRef: interview.id,
        question: currentQuestion.question,
        correct_ans: currentQuestion.answer,
        user_ans: transcript,
        feedback: aiResponse.feedback,
        rating: aiResponse.ratings,
        userId: user?.id || '',
        questionIndex: currentQuestionIndex
      };

      await saveUserAnswer(userAnswer);
      toast.success('Answer saved successfully');

      if (currentQuestionIndex < interview.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        resetTranscript();
      } else {
        toast.success('Interview completed!');
        navigate(`/dashboard/mock-interview/${interview.id}/feedback`);
      }
    } catch (error) {
      toast.error('Failed to process your answer. Please try again.');
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
    <div className="container mx-auto p-4 lg:p-8 min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-500 via-primary to-indigo-500 bg-clip-text text-transparent">
              {interview.position}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              <Badge variant="default" className="px-3 py-1.5">
                {interview.experience}+ YOE
              </Badge>
              {interview.techStack.split(',').map((tech, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="px-3 py-1.5 bg-white/5 border border-primary/10"
                >
                  {tech.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="interview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="interview" className="text-base">Interview</TabsTrigger>
            <TabsTrigger value="preparation" className="text-base">Preparation</TabsTrigger>
          </TabsList>

          <TabsContent value="interview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Webcam Section */}
              <Card className="border border-primary/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Video Feed</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleWebcam}
                    className="hover:bg-primary/10"
                  >
                    {isWebcamOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="aspect-video bg-black/20 rounded-xl overflow-hidden border border-primary/10">
                    {isWebcamOn && (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Question and Answer Section */}
              <Card className="border border-primary/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          Question {currentQuestionIndex + 1} of {interview.questions.length}
                        </h3>
                        <p className="text-sm text-muted-foreground">Answer clearly and concisely</p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <Badge variant="outline" className="bg-primary/5">
                        {Math.round((currentQuestionIndex / interview.questions.length) * 100)}% Complete
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Question Display */}
                  <div className="rounded-lg p-4 bg-primary/5 border border-primary/10">
                    <p className="text-lg break-words whitespace-pre-wrap leading-relaxed">
                      {interview.questions[currentQuestionIndex]?.question.split(' ').map((word, index) => (
                        <span
                          key={index}
                          className={`${
                            highlightedWords.includes(word)
                              ? 'bg-primary/20 text-primary'
                              : ''
                          } transition-colors duration-200 mr-1 inline-block`}
                        >
                          {word}
                        </span>
                      ))}
                    </p>
                  </div>
                  
                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={speakQuestion} 
                        disabled={isSpeaking}
                        className="flex-1 sm:flex-none bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isSpeaking ? 'Speaking...' : 'Replay Question'}
                      </Button>
                      <Button 
                        onClick={toggleRecording} 
                        variant={isRecording ? "destructive" : "default"}
                        className="flex-1 sm:flex-none"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-4 w-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Answer Display */}
                    <div className="min-h-[150px] p-4 border rounded-lg bg-white/5 backdrop-blur-sm">
                      <div className="text-sm text-muted-foreground mb-2">Your Answer:</div>
                      <div className="text-base leading-relaxed">
                        {transcript || "Start speaking to record your answer..."}
                      </div>
                    </div>
                    
                    {/* Next Button */}
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleNextQuestion}
                        disabled={isAIProcessing}
                        className="bg-gradient-to-r from-violet-500 to-primary hover:from-violet-600 hover:to-primary/90 text-white shadow-lg hover:shadow-primary/25 transition-all duration-300"
                      >
                        {isAIProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preparation" className="mt-6">
            <Card className="border border-primary/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Interview Tips & Guidelines</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Technical Tips</h4>
                    <ul className="space-y-3">
                      {[
                        'Ensure stable internet connection',
                        'Test audio before starting',
                        'Position camera at eye level',
                        'Choose a well-lit environment',
                        'Minimize background noise'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Interview Best Practices</h4>
                    <ul className="space-y-3">
                      {[
                        'Speak clearly and confidently',
                        'Maintain eye contact with camera',
                        'Take brief pauses when needed',
                        'Structure your answers logically',
                        'Ask for clarification if needed'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StartInterview;