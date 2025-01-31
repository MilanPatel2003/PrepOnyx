import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { chatSession } from '@/gemini';
import { Award, FileText, RefreshCw, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

const PDFAnalyzer: React.FC = () => {
  const [summary, setSummary] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [results, setResults] = useState<{ score: number; totalQuestions: number } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      const pdfUrl = uploadData.secure_url;

      const prompt = `Analyze this PDF (${pdfUrl}). First, provide a concise summary. Then, create 10 multiple choice questions based on the content. Format your response as follows:

      SUMMARY:
      [your summary here]

      QUESTIONS:
      [JSON array of question objects with 'question', 'options' (array of 4 strings), and 'correctAnswer' (index 0-3)]`;

      const result = await chatSession.sendMessage(prompt);
      const response = await result.response;
      const text = await response.text();

      console.log('Full Response Text:', text);

      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);

      const cleanSummary = parsedResponse.SUMMARY.trim();
      setSummary(cleanSummary);

      const parsedQuestions = parsedResponse.QUESTIONS;
      setQuestions(parsedQuestions);

    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    const score = answers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);

    setResults({
      score,
      totalQuestions: questions.length
    });
    setQuizStarted(false);
  };

  const handleRetry = () => {
    setQuestions([]);
    setAnswers([]);
    setResults(null);
    setCurrentQuestion(0);
  };

  console.log('Questions:', questions);
  console.log('Quiz Started:', quizStarted);
  console.log('Results:', results);

  return (
 
    <div className="container mx-auto p-6 max-w-screen-2xl">
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          PDF Analyzer
        </CardTitle>
        <CardDescription>
          Upload your PDF document for analysis and quiz generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="h-12 w-12 mb-4 text-gray-400" />
            <span className="text-sm font-medium mb-1">
              Drop your PDF here or click to upload
            </span>
            <span className="text-xs text-gray-500">
              Supported format: PDF
            </span>
          </label>
        </div>

        {isLoading && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span className="text-sm">Processing PDF...</span>
            </div>
            <Progress value={66} />
          </div>
        )}

        {summary && (
          <ScrollArea className="mt-6 h-48 rounded-md border p-4 bg-gray-100 shadow-md">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Document Summary</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {summary}
              </p>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>

    {questions.length > 0 && !quizStarted && !results && (
      <Button 
        onClick={() => setQuizStarted(true)}
        className="w-full mb-8"
        size="lg"
      >
        Begin Assessment
        <Award className="ml-2 h-4 w-4" />
      </Button>
    )}

    {quizStarted && questions[currentQuestion] && (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Question {currentQuestion + 1}</span>
            <span className="text-sm font-normal text-gray-500">
              {currentQuestion + 1} of {questions.length}
            </span>
          </CardTitle>
          <Progress 
            value={(currentQuestion / questions.length) * 100} 
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-lg font-medium">
            {questions[currentQuestion].question}
          </p>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option: string, index: number) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                variant={answers[currentQuestion] === index ? "default" : "outline"}
                className="w-full text-left justify-start p-6 h-auto"
              >
                <span className="mr-4">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleNextQuestion}
            className="mt-8 w-full"
            size="lg"
            disabled={answers[currentQuestion] === undefined}
          >
            {currentQuestion === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
          </Button>
        </CardContent>
      </Card>
    )}

    {results && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Your Score</p>
            <p className="text-4xl font-bold">
              {((results.score / results.totalQuestions) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {results.score} out of {results.totalQuestions} correct
            </p>
          </div>
          <Progress 
            value={(results.score / results.totalQuestions) * 100}
            className="mb-6"
          />
          <Button 
            onClick={handleRetry}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )}
  </div>
  );
};

export default PDFAnalyzer;