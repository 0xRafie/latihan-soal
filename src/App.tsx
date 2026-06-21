/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_QUIZZES, MOCK_ACTIVITIES } from './data/defaultQuizzes';
import { Quiz, Attempt, QuestionType } from './types';

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

  // Sync state modifications with LocalStorage
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

  const handleFinishedQuizAttempt = (
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
  };

  const handleAddNewPublishedQuiz = (newQuiz: Quiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
  };

  const handleClearAttemptsHistory = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat aktivitas nilai kelompok? Tindakan ini tidak dapat dibatalkan.')) {
      setAttempts([]);
    }
  };

  const handleEditQuizCollab = (quizId: string) => {
    setActiveQuizId(quizId);
    setActiveView('collab');
  };

  const handleSaveCollabQuiz = (updatedQuiz: Quiz) => {
    setQuizzes((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));
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
