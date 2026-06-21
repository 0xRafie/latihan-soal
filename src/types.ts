/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY_CASE = 'ESSAY_CASE',
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // 4 options for MCQ
  correctAnswer: string; // Correct choice letter (A/B/C/D), 'TRUE'/'FALSE', or exact text
  caseStudyText?: string; // Text for split-screen case reference (mostly for Essay, but can genericise)
  points?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  createdBy: string;
  createdAt: string;
  questions: Question[];
}

export interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  username: string;
  score: number; // Percent score or correct count depending on review
  correctCount: number;
  totalQuestions: number;
  durationSpentSeconds: number;
  completedAt: string;
  answers: Record<string, string>; // Map questionId -> user response
  flags: Record<string, boolean>; // Map questionId -> isFlagged (ragu-ragu)
}

export interface GroupSession {
  username: string;
  groupCode: string;
  loginTime: string;
}
