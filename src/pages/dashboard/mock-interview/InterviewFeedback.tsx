import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { UserAnswer, Interview } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Award, Target, Briefcase, Code2, CheckCircle2, User, Bot } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const InterviewFeedback = () => {
  const { id } = useParams();
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch both interview and answers in parallel
        const [interviewDoc, answersSnapshot] = await Promise.all([
          getDoc(doc(db, 'interviews', id)),
          getDocs(query(collection(db, 'userAnswers'), where('mockIdRef', '==', id)))
        ]);

        if (!interviewDoc.exists()) {
          throw new Error('Interview not found');
        }

        const interviewData = { id: interviewDoc.id, ...interviewDoc.data() } as Interview;
        setInterview(interviewData);

        const answersData = answersSnapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id }))
          .sort((a, b) => a.questionIndex - b.questionIndex) as UserAnswer[];
        
        setAnswers(answersData);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Memoize computed values
  const stats = answers.reduce((acc, curr) => ({
    average: acc.average + curr.rating / answers.length,
    highest: Math.max(acc.highest, curr.rating)
  }), { average: 0, highest: 0 });

  const performanceLevel = stats.average >= 8 ? 'Excellent' : stats.average >= 6 ? 'Good' : 'Needs Improvement';
  const performanceColor = stats.average >= 8 ? "success" : stats.average >= 6 ? "warning" : "destructive";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Interview not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Overall Score Card */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">
              {stats.average.toFixed(1)}/10
            </div>
            <Progress value={stats.average * 10} className="h-2" />
            <Badge variant={performanceColor}>
              {performanceLevel}
            </Badge>
          </CardContent>
        </Card>

        {/* Enhanced Interview Details Card */}
        <Card className="col-span-full md:col-span-1 overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Interview Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/10 transition-colors hover:bg-secondary/20">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Position</p>
                  <p className="text-sm text-muted-foreground">{interview?.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/10 transition-colors hover:bg-secondary/20">
                <Code2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Tech Stack</p>
                  <p className="text-sm text-muted-foreground">{interview?.techStack}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/10 transition-colors hover:bg-secondary/20">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Progress</p>
                  <p className="text-sm text-muted-foreground">
                    {answers.length}/{interview?.questions.length} Questions Completed
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Statistics Card */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <Award className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="font-medium">Highest Score</span>
                  </div>
                  <span className="text-xl font-bold text-green-500">
                    {stats.highest}/10
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/20">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <span className="font-medium">Average Score</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-500">
                    {stats.average.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Detailed Feedback Section */}
      <Card className="col-span-full">
        <CardHeader className="bg-primary/5">
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {answers.map((answer, index) => (
              <AccordionItem key={answer.id} value={`question-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="font-medium">Question {index + 1}</span>
                    </div>
                    <Badge variant={
                      answer.rating >= 8 ? "success" : 
                      answer.rating >= 6 ? "warning" : "destructive"
                    }>
                      {answer.rating}/10
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-6">
                  <div className="rounded-lg border bg-card p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      Question
                    </h4>
                    <p className="text-sm text-muted-foreground">{answer.question}</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-card p-4">
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Your Answer
                      </h4>
                      <p className="text-sm text-muted-foreground">{answer.user_ans}</p>
                    </div>
                    
                    <div className="rounded-lg border bg-card p-4">
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-green-500" />
                        Correct Answer
                      </h4>
                      <p className="text-sm text-muted-foreground">{answer.correct_ans}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-primary/5 p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-primary" />
                      AI Feedback
                    </h4>
                    <p className="text-sm text-muted-foreground">{answer.feedback}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewFeedback;