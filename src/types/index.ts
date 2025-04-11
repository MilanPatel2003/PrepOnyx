import { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  createdAt: Timestamp | FieldValue;
  updateAt: Timestamp | FieldValue;
}

export interface Interview {
  id: string;
  position: string;
  description: string;
  experience: number;
  userId: string;
  techStack: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  interviewType: "technical" | "behavioral" | "system-design";
  numberOfQuestions: number;
  specificTopics?: string;
  keySkills: string;
  interviewGoals: string;
  questions: {
    question: string;
    answer: string;
    keyPoints?: string[];
    commonPitfalls?: string[];
    followUpQuestions?: string[];
    conceptsTested?: string[];
  }[];
  createdAt: Timestamp;
  updateAt: Timestamp;
}

export interface UserAnswer {
  id: string;
  mockIdRef: string;
  userId: string;
  question: string;
  correct_ans: string;
  user_ans: string;
  feedback: string;
  rating: number;
  questionIndex: number;
  createdAt: Timestamp;
  updateAt: Timestamp;
  emotionalState: {
    expression: string;
    confidence: number;
    metrics: {
      confidence: number;
      nervousness: number;
      engagement: number;
      overall: number;
    };
  } | null;
}

export type Tool = 'pen' | 'eraser';