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

  const { error } = await supabase.rpc('upsert_quiz_merge_questions', {
    p_id: quiz.id,
    p_group_code: groupCode,
    p_title: quiz.title,
    p_description: quiz.description,
    p_duration_minutes: quiz.durationMinutes,
    p_created_by: quiz.createdBy,
    p_created_at: quiz.createdAt,
    p_questions: quiz.questions,
  });

  if (error) throw error;
}

export async function upsertQuizzes(quizzes: Quiz[], groupCode: string) {
  if (!supabase || quizzes.length === 0) return;

  await Promise.all(quizzes.map((quiz) => upsertQuiz(quiz, groupCode)));
}

export async function deleteQuiz(quizId: string, groupCode: string, username: string) {
  if (!supabase) return;

  const { error } = await supabase.rpc('delete_quiz_if_creator', {
    p_id: quizId,
    p_group_code: groupCode,
    p_username: username,
  });

  if (error) throw error;
}

export async function insertAttempt(attempt: Attempt, groupCode: string) {
  if (!supabase) return;

  const { error } = await supabase.from('attempts').insert(toAttemptRow(attempt, groupCode));
  if (error) throw error;
}

export async function upsertAttempts(attempts: Attempt[], groupCode: string) {
  if (!supabase || attempts.length === 0) return;

  const { error } = await supabase
    .from('attempts')
    .upsert(attempts.map((attempt) => toAttemptRow(attempt, groupCode)), { onConflict: 'group_code,id' });

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
