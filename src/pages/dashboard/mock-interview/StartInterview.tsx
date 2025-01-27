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
import { Mic, MicOff, Play, Video, VideoOff, Loader2 } from 'lucide-react';
import { LoaderPage } from '@/pages/LoaderPage';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {  useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { chatSession } from '@/gemini';


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
      const result = await chatSession.sendMessage(prompt);
      const response = await result.response;
      const aiResponse = cleanJsonResponse(response.text()) as AIResponse;
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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">{interview.position}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{interview.experience}+ YOE</Badge>
          {interview.techStack.split(',').map((tech, index) => (
            <Badge key={index} variant="secondary">{tech.trim()}</Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="interview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="preparation">Preparation</TabsTrigger>
        </TabsList>

        <TabsContent value="interview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Webcam Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="text-lg font-semibold">Video Feed</h3>
                <Button variant="outline" size="icon" onClick={toggleWebcam}>
                  {isWebcamOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {isWebcamOn && (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    className="w-full rounded-lg"
                  />
                )}
              </CardContent>
            </Card>

            {/* Question and Answer Section */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Question {currentQuestionIndex + 1} of {interview.questions.length}
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[200px] overflow-y-auto rounded-lg p-4 bg-muted/50">
                  <p className="text-lg break-words whitespace-pre-wrap">
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
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button onClick={speakQuestion} disabled={isSpeaking}>
                      <Play className="h-4 w-4 mr-2" />
                      {isSpeaking ? 'Speaking...' : 'Replay Question'}
                    </Button>
                    <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"}>
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
                  
                  <div className="min-h-[100px] p-3 border rounded-lg bg-muted/50">
                    {transcript || "Your answer will appear here..."}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={handleNextQuestion}
                      disabled={isAIProcessing}
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

        <TabsContent value="preparation">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Preparation Tips</h3>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Ensure you're in a quiet environment</li>
                <li>Test your microphone and camera</li>
                <li>Have a glass of water nearby</li>
                <li>Take deep breaths and stay calm</li>
                <li>Listen to each question carefully</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StartInterview;