/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_QUIZZES, MOCK_ACTIVITIES } from './data/defaultQuizzes';
import { Quiz, Attempt, QuestionType } from './types';
import { isSupabaseConfigured } from './lib/supabase';
import {
  clearAttempts,
  fetchAttempts,
  fetchQuizzes,
  insertAttempt,
  subscribeToGroupData,
  upsertQuiz,
  upsertQuizzes,
} from './lib/sharedData';

// Importing Custom Layout Components
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import QuizRunner from './components/QuizRunner';
import QuizResults from './components/QuizResults';
import CollaborativeEditor from './components/CollaborativeEditor';

export default function App() {
  // 1. Session state persistence
  const [session, setSession] = useState<{ username: string; groupCode: string } | null>(() => {
    try {
      const persisted = localStorage.getItem('latih_soal_session');
      return persisted ? JSON.parse(persisted) : null;
    } catch {
      return null;
    }
  });

  // 2. Quiz packages storage with defaults
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    try {
      const persisted = localStorage.getItem('latih_soal_quizzes');
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch {}
    return DEFAULT_QUIZZES;
  });

  // 3. User attempts history ledger
  const [attempts, setAttempts] = useState<Attempt[]>(() => {
    try {
      const persisted = localStorage.getItem('latih_soal_attempts');
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch {}
    
    // Map default pre-loaded mock activities
    return MOCK_ACTIVITIES.map((act) => ({
      id: act.id,
      quizId: act.quizTitle.includes('Kopi') ? '2' : '1',
      quizTitle: act.quizTitle,
      username: act.username,
      score: act.score,
      correctCount: Math.round((act.score / 100) * 5),
      totalQuestions: 5,
      durationSpentSeconds: 245,
      completedAt: act.completedAt,
      answers: {},
      flags: {}
    }));
  });

  // Navigation route controls
  const [activeView, setActiveView] = useState<'login' | 'dashboard' | 'runner' | 'results' | 'collab'>(() => {
    const tempSession = localStorage.getItem('latih_soal_session');
    return tempSession ? 'dashboard' : 'login';
  });

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const loadSharedGroupData = async (groupCode: string) => {
    if (!isSupabaseConfigured) return;

    setIsSyncing(true);
    setSyncNotice('');

    try {
      const [remoteQuizzes, remoteAttempts] = await Promise.all([
        fetchQuizzes(groupCode),
        fetchAttempts(groupCode),
      ]);

      if (remoteQuizzes && remoteQuizzes.length > 0) {
        setQuizzes(remoteQuizzes);
      } else {
        await upsertQuizzes(DEFAULT_QUIZZES, groupCode);
        setQuizzes(DEFAULT_QUIZZES);
      }

      if (remoteAttempts) {
        setAttempts(remoteAttempts);
      }
    } catch (error) {
      console.error('Failed to sync Supabase data', error);
      setSyncNotice('Gagal sinkron Supabase. Data lokal browser tetap dipakai sementara.');
    } finally {
      setIsSyncing(false);
    }
  };

  const reloadQuizzes = async (groupCode: string) => {
    try {
      const remoteQuizzes = await fetchQuizzes(groupCode);
      if (remoteQuizzes) setQuizzes(remoteQuizzes);
    } catch (error) {
      console.error('Failed to reload quizzes', error);
    }
  };

  const reloadAttempts = async (groupCode: string) => {
    try {
      const remoteAttempts = await fetchAttempts(groupCode);
      if (remoteAttempts) setAttempts(remoteAttempts);
    } catch (error) {
      console.error('Failed to reload attempts', error);
    }
  };

  // Sync state modifications with LocalStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('latih_soal_quizzes', JSON.stringify(quizzes));
    } catch (e) {
      console.error('Failed to write quizzes to cache', e);
    }
  }, [quizzes]);

  useEffect(() => {
    try {
      localStorage.setItem('latih_soal_attempts', JSON.stringify(attempts));
    } catch (e) {
      console.error('Failed to write attempts to cache', e);
    }
  }, [attempts]);

  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;

    void loadSharedGroupData(session.groupCode);

    return subscribeToGroupData(
      session.groupCode,
      () => void reloadQuizzes(session.groupCode),
      () => void reloadAttempts(session.groupCode)
    );
  }, [session?.groupCode]);

  // Auth triggers
  const handleLogin = (username: string, groupCode: string) => {
    const userSession = { username: username.trim(), groupCode: groupCode.toUpperCase() };
    setSession(userSession);
    localStorage.setItem('latih_soal_session', JSON.stringify(userSession));
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('latih_soal_session');
    setActiveView('login');
  };

  const handleStartQuiz = (quizId: string) => {
    const selected = quizzes.find((q) => q.id === quizId);
    if (!selected) {
      alert('Maaf, paket latihan soal tidak ditemukan.');
      return;
    }
    setActiveQuizId(quizId);
    setActiveView('runner');
  };

  const handleFinishedQuizAttempt = async (
    answers: Record<string, string>,
    flags: Record<string, boolean>,
    durationSpentSeconds: number
  ) => {
    const targetQuiz = quizzes.find((q) => q.id === activeQuizId);
    if (!targetQuiz || !session) return;

    // Filter automatic correctness for MCQ, T/F and Short Answer
    const objectiveQuestions = targetQuiz.questions.filter((q) => q.type !== QuestionType.ESSAY_CASE);
    let correctCount = 0;

    objectiveQuestions.forEach((q) => {
      const uAnswer = (answers[q.id] || '').trim();
      const idealAnswer = q.correctAnswer.trim();
      
      if (uAnswer.toLowerCase() === idealAnswer.toLowerCase()) {
        correctCount++;
      }
    });

    const totalObjective = objectiveQuestions.length;
    // Math logic: if all questions are essays, award generic 100% since grading is self-guided
    const percentScore = totalObjective > 0 ? Math.round((correctCount / totalObjective) * 100) : 100;

    const newAttempt: Attempt = {
      id: `attempt_${Date.now()}`,
      quizId: targetQuiz.id,
      quizTitle: targetQuiz.title,
      username: session.username,
      score: percentScore,
      correctCount: correctCount,
      totalQuestions: targetQuiz.questions.length,
      durationSpentSeconds,
      completedAt: new Date().toISOString(),
      answers,
      flags
    };

    // Save and append
    setAttempts((prev) => [...prev, newAttempt]);
    setCurrentAttempt(newAttempt);
    setActiveView('results');

    if (isSupabaseConfigured) {
      try {
        await insertAttempt(newAttempt, session.groupCode);
      } catch (error) {
        console.error('Failed to save attempt to Supabase', error);
        setSyncNotice('Nilai tersimpan lokal, tetapi gagal dikirim ke Supabase.');
      }
    }
  };

  const handleAddNewPublishedQuiz = async (newQuiz: Quiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);

    if (session && isSupabaseConfigured) {
      try {
        await upsertQuiz(newQuiz, session.groupCode);
      } catch (error) {
        console.error('Failed to save quiz to Supabase', error);
        setSyncNotice('Kuis tersimpan lokal, tetapi gagal dikirim ke Supabase.');
      }
    }
  };

  const handleClearAttemptsHistory = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat aktivitas nilai kelompok? Tindakan ini tidak dapat dibatalkan.')) {
      setAttempts([]);

      if (session && isSupabaseConfigured) {
        try {
          await clearAttempts(session.groupCode);
        } catch (error) {
          console.error('Failed to clear attempts in Supabase', error);
          setSyncNotice('Riwayat lokal sudah kosong, tetapi gagal menghapus data Supabase.');
        }
      }
    }
  };

  const handleEditQuizCollab = (quizId: string) => {
    setActiveQuizId(quizId);
    setActiveView('collab');
  };

  const handleSaveCollabQuiz = async (updatedQuiz: Quiz) => {
    setQuizzes((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));

    if (session && isSupabaseConfigured) {
      try {
        await upsertQuiz(updatedQuiz, session.groupCode);
      } catch (error) {
        console.error('Failed to update quiz in Supabase', error);
        setSyncNotice('Perubahan tersimpan lokal, tetapi gagal dikirim ke Supabase.');
      }
    }
  };

  const handleNavigateToHome = () => {
    if (session) {
      setActiveView('dashboard');
    }
  };

  // Find active entity values
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans text-natural-text-dark antialiased selection:bg-natural-surface selection:text-natural-primary select-text">
      {/* Show beautiful navbar ONLY on active non-login, non-runner, non-collab scopes */}
      {session && activeView !== 'login' && activeView !== 'runner' && activeView !== 'collab' && (
        <Navbar
          username={session.username}
          groupCode={session.groupCode || 'BELAJAR123'}
          onLogout={handleLogout}
          onNavigateToHome={handleNavigateToHome}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {session && activeView === 'dashboard' && (isSyncing || syncNotice) && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="rounded-xl border border-natural-border bg-white px-4 py-3 text-xs font-semibold text-natural-text-muted">
              {isSyncing ? 'Menyinkronkan data grup dari Supabase...' : syncNotice}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeView === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Login onLogin={handleLogin} />
            </motion.div>
          )}

          {activeView === 'dashboard' && session && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Dashboard
                quizzes={quizzes}
                attempts={attempts}
                username={session.username}
                onStartQuiz={handleStartQuiz}
                onAddQuiz={handleAddNewPublishedQuiz}
                onClearHistory={handleClearAttemptsHistory}
                onEditQuizCollab={handleEditQuizCollab}
              />
            </motion.div>
          )}

          {activeView === 'collab' && activeQuiz && session && (
            <motion.div
              key="collab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CollaborativeEditor
                quiz={activeQuiz}
                username={session.username}
                groupCode={session.groupCode || 'BELAJAR123'}
                onSaveQuiz={handleSaveCollabQuiz}
                onCancel={handleNavigateToHome}
              />
            </motion.div>
          )}

          {activeView === 'runner' && activeQuiz && session && (
            <motion.div
              key="runner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-natural-bg"
            >
              <QuizRunner
                quiz={activeQuiz}
                username={session.username}
                onFinishQuiz={handleFinishedQuizAttempt}
                onCancelQuiz={handleNavigateToHome}
              />
            </motion.div>
          )}

          {activeView === 'results' && currentAttempt && activeQuiz && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QuizResults
                attempt={currentAttempt}
                quiz={activeQuiz}
                onBackToDashboard={handleNavigateToHome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Exquisite Footer footer watermark bar */}
      {activeView !== 'runner' && activeView !== 'collab' && (
        <footer className="bg-white border-t border-natural-border py-6">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs text-natural-text-muted font-sans font-medium">
              © 2026 LatihSoal • Kelompok Belajar Digital. Premiumly designed for smart, collaborative local learning groups.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
