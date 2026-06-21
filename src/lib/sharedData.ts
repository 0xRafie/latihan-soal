import { Attempt, Quiz } from '../types';
import { supabase } from './supabase';

type QuizRow = {
  id: string;
  group_code: string;
  title: string;
  description: string;
  duration_minutes: number;
  created_by: string;
  created_at: string;
  questions: Quiz['questions'];
};

type AttemptRow = {
  id: string;
  group_code: string;
  quiz_id: string;
  quiz_title: string;
  username: string;
  score: number;
  correct_count: number;
  total_questions: number;
  duration_spent_seconds: number;
  completed_at: string;
  answers: Record<string, string>;
  flags: Record<string, boolean>;
};

const toQuiz = (row: QuizRow): Quiz => ({
  id: row.id,
  title: row.title,
  description: row.description,
  durationMinutes: row.duration_minutes,
  createdBy: row.created_by,
  createdAt: row.created_at,
  questions: row.questions,
});

const toQuizRow = (quiz: Quiz, groupCode: string): QuizRow => ({
  id: quiz.id,
  group_code: groupCode,
  title: quiz.title,
  description: quiz.description,
  duration_minutes: quiz.durationMinutes,
  created_by: quiz.createdBy,
  created_at: quiz.createdAt,
  questions: quiz.questions,
});

const toAttempt = (row: AttemptRow): Attempt => ({
  id: row.id,
  quizId: row.quiz_id,
  quizTitle: row.quiz_title,
  username: row.username,
  score: row.score,
  correctCount: row.correct_count,
  totalQuestions: row.total_questions,
  durationSpentSeconds: row.duration_spent_seconds,
  completedAt: row.completed_at,
  answers: row.answers ?? {},
  flags: row.flags ?? {},
});

const toAttemptRow = (attempt: Attempt, groupCode: string): AttemptRow => ({
  id: attempt.id,
  group_code: groupCode,
  quiz_id: attempt.quizId,
  quiz_title: attempt.quizTitle,
  username: attempt.username,
  score: attempt.score,
  correct_count: attempt.correctCount,
  total_questions: attempt.totalQuestions,
  duration_spent_seconds: attempt.durationSpentSeconds,
  completed_at: attempt.completedAt,
  answers: attempt.answers,
  flags: attempt.flags,
});

export async function fetchQuizzes(groupCode: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('group_code', groupCode)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as QuizRow[]).map(toQuiz);
}

export async function fetchAttempts(groupCode: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('group_code', groupCode)
    .order('completed_at', { ascending: true });

  if (error) throw error;
  return (data as AttemptRow[]).map(toAttempt);
}

export async function upsertQuiz(quiz: Quiz, groupCode: string) {
  if (!supabase) return;

  const { error } = await supabase
    .from('quizzes')
    .upsert(toQuizRow(quiz, groupCode), { onConflict: 'id' });

  if (error) throw error;
}

export async function upsertQuizzes(quizzes: Quiz[], groupCode: string) {
  if (!supabase || quizzes.length === 0) return;

  const { error } = await supabase
    .from('quizzes')
    .upsert(quizzes.map((quiz) => toQuizRow(quiz, groupCode)), { onConflict: 'id' });

  if (error) throw error;
}

export async function insertAttempt(attempt: Attempt, groupCode: string) {
  if (!supabase) return;

  const { error } = await supabase.from('attempts').insert(toAttemptRow(attempt, groupCode));
  if (error) throw error;
}

export async function clearAttempts(groupCode: string) {
  if (!supabase) return;

  const { error } = await supabase.from('attempts').delete().eq('group_code', groupCode);
  if (error) throw error;
}

export function subscribeToGroupData(
  groupCode: string,
  onQuizzesChanged: () => void,
  onAttemptsChanged: () => void
) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`latihsoal:${groupCode}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quizzes', filter: `group_code=eq.${groupCode}` },
      onQuizzesChanged
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attempts', filter: `group_code=eq.${groupCode}` },
      onAttemptsChanged
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
