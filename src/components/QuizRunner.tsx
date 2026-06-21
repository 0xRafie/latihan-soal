/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quiz, Question, QuestionType } from '../types';
import MarkdownView from './MarkdownView';
import { 
  Clock, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare, 
  Maximize2, 
  Minimize2, 
  FileText, 
  AlertTriangle,
  Keyboard,
  CheckCircle2
} from 'lucide-react';

interface QuizRunnerProps {
  quiz: Quiz;
  username: string;
  onFinishQuiz: (answers: Record<string, string>, flags: Record<string, boolean>, durationSpentSeconds: number) => void;
  onCancelQuiz: () => void;
}

export default function QuizRunner({ quiz, username, onFinishQuiz, onCancelQuiz }: QuizRunnerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(quiz.durationMinutes * 60);
  const [showTimer, setShowTimer] = useState(true);
  const startTimeRef = useRef<number>(Date.now());

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'case' | 'question'>('case');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showShortcutsInfo, setShowShortcutsInfo] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion: Question = quiz.questions[currentIdx];
  const hasCaseStudy = !!currentQuestion?.caseStudyText;

  // Track time elapsed and decrement timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut inputs if the user is typing in a textarea or text input
      const tagName = document.activeElement?.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || document.activeElement?.getAttribute('contenteditable') === 'true') {
        // Allow ArrowKeys to switch questions if not focused inside text inputs, but let's be safe and let user write normally inside text fields.
        return;
      }

      const key = e.key.toUpperCase();

      // Navigation: ArrowRight / ArrowLeft
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }

      // Ragu-Ragu toggle: Key "R" or Spacebar
      if (key === 'R' || e.key === ' ') {
        e.preventDefault();
        toggleFlag();
      }

      // Multiple Choice selection: A, B, C, D
      if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE && ['A', 'B', 'C', 'D'].includes(key)) {
        const option = currentQuestion.options?.find(opt => opt.trim().toUpperCase().startsWith(key));
        if (option) {
          handleSelectAnswer(key);
        }
      }

      // True/False selection: T/F
      if (currentQuestion.type === QuestionType.TRUE_FALSE) {
        if (key === 'T' || key === 'B') {
          handleSelectAnswer('TRUE');
        } else if (key === 'F' || key === 'S') {
          handleSelectAnswer('FALSE');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, currentQuestion, answers, flags]);

  // Autofocus short answer inputs
  useEffect(() => {
    if (currentQuestion.type === QuestionType.SHORT_ANSWER && inputRef.current) {
      inputRef.current.focus();
    }
    // Auto shift mobile tab to Question if there is no Case Study
    if (!hasCaseStudy) {
      setActiveMobileTab('question');
    } else {
      setActiveMobileTab('case');
    }
  }, [currentIdx]);

  const handleSelectAnswer = (ans: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: ans,
    }));
  };

  const toggleFlag = () => {
    setFlags((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleForceSubmit = () => {
    const totalDurationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    onFinishQuiz(answers, flags, totalDurationSeconds);
  };

  const handleManualSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    const totalDurationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    onFinishQuiz(answers, flags, totalDurationSeconds);
  };

  // UI state derived calculations
  const totalQuestions = quiz.questions.length;
  const answeredCount = quiz.questions.filter((q) => answers[q.id]?.trim().length > 0).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Get question status classification
  const getQuestionStatus = (idx: number) => {
    const q = quiz.questions[idx];
    const isAnswered = !!answers[q.id] && answers[q.id].trim() !== '';
    const isFlagged = !!flags[q.id];

    if (isFlagged) return 'flagged'; // Yellow
    if (isAnswered) return 'answered'; // Green
    return 'unanswered'; // Grey
  };

  // Helper calculating word count for essays
  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans relative overflow-x-hidden select-text">
      {/* 1. Header Bar: Progress, Title, Timer */}
      <div className="bg-white border-b border-natural-border sticky top-0 z-30 px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Quiz metadata */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCancelQuiz}
              className="text-xs font-bold text-natural-text-muted hover:text-[#9E5321] border border-natural-border-dark rounded-lg px-2.5 py-1.5 hover:bg-[#FFF5ED] transition-all cursor-pointer"
              id="cancel_quiz_btn"
            >
              Keluar
            </button>
            <div className="h-6 w-px bg-natural-border-dark"></div>
            <div>
              <p className="text-[10px] font-mono font-bold text-natural-text-muted uppercase tracking-wider leading-none">Paket Latihan</p>
              <h2 className="text-sm sm:text-base font-extrabold text-natural-text-dark line-clamp-1 mt-0.5">{quiz.title}</h2>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3 flex-1 sm:max-w-xs md:max-w-md mx-0 sm:mx-6">
            <div className="w-full bg-natural-surface rounded-full h-2 overflow-hidden border border-natural-border">
              <div 
                className="bg-natural-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-mono font-bold text-white whitespace-nowrap bg-natural-primary px-2.5 py-0.5 rounded">
              {answeredCount} / {totalQuestions} Soal
            </span>
          </div>

          {/* Timer element with show/hide */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border font-mono text-xs font-bold shadow-xs transition-all ${
              timeLeft < 180 
                ? 'bg-[#FFF6F0] text-[#9E5321] border-[#FFE3D1] animate-pulse' 
                : 'bg-natural-surface text-natural-text-dark border-natural-border-dark'
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-[#9E5321]' : 'text-natural-primary'}`} />
              <span className={showTimer ? '' : 'blur-xs select-none'}>
                {formatTimer(timeLeft)}
              </span>
              <button
                onClick={() => setShowTimer(!showTimer)}
                className="text-natural-text-muted hover:text-natural-text-dark focus:outline-none ml-1 cursor-pointer"
                title={showTimer ? 'Sembunyikan Waktu' : 'Tampilkan Waktu'}
              >
                {showTimer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleManualSubmitClick}
              className="px-4 py-1.5 bg-natural-primary hover:bg-natural-primary-hover text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              id="submit_quiz_top"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcut floating guide helper button */}
      <div className="absolute top-26 right-4 sm:right-6 z-20">
        <button
          onClick={() => setShowShortcutsInfo(!showShortcutsInfo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur shadow-xs hover:bg-natural-surface border border-natural-border text-xs font-semibold text-natural-text-dark transition-all cursor-pointer hover:shadow-sm"
        >
          <Keyboard className="w-4 h-4 text-natural-accent" />
          <span className="hidden md:inline font-mono">Pintasan Keyboard</span>
        </button>
      </div>

      {/* Floating Keyboard Guide Pop-over */}
      <AnimatePresence>
        {showShortcutsInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-38 right-4 sm:right-6 z-40 bg-white rounded-2xl shadow-xl border border-natural-border p-4 max-w-xs font-sans text-xs text-natural-text-dark leading-relaxed"
          >
            <div className="flex justify-between items-center border-b border-natural-surface pb-2 mb-2">
              <span className="font-bold text-natural-primary flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-natural-accent" />
                Daftar Pintasan Keyboard
              </span>
              <button 
                onClick={() => setShowShortcutsInfo(false)}
                className="text-natural-text-muted hover:text-natural-text-dark font-bold"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1.5 font-sans">
              <li className="flex justify-between"><span className="font-mono bg-natural-surface px-1.5 py-0.5 rounded border border-natural-border-dark text-natural-text-dark">Panah Kiri</span> <span>Kembali</span></li>
              <li className="flex justify-between"><span className="font-mono bg-natural-surface px-1.5 py-0.5 rounded border border-natural-border-dark text-natural-text-dark">Panah Kanan</span> <span>Selanjutnya</span></li>
              <li className="flex justify-between"><span className="font-mono bg-natural-surface px-1.5 py-0.5 rounded border border-natural-border-dark text-natural-text-dark">A, B, C, D</span> <span>Pilih opsi PG</span></li>
              <li className="flex justify-between"><span className="font-mono bg-natural-surface px-1.5 py-0.5 rounded border border-natural-border-dark text-natural-text-dark">T / B</span> <span>Pilih Benar/True</span></li>
              <li className="flex justify-between"><span className="font-mono bg-natural-surface px-1.5 py-0.5 rounded border border-natural-border-dark text-natural-text-dark">F / S</span> <span>Pilih Salah/False</span></li>
              <li className="flex justify-between"><span className="font-mono bg-natural-surface px-1.5 py-0.5 rounded border border-natural-border-dark text-natural-text-dark">R</span> <span>Tandai Ragu-Ragu</span></li>
            </ul>
            <p className="text-[10px] text-natural-text-muted/80 mt-2 font-serif italic">
              * Non-aktif ketika Anda sedang fokus mengetik esai/jawaban isian.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Tab toggler when Case context exists */}
      {hasCaseStudy && (
        <div className="block sm:hidden bg-white border-b border-natural-border">
          <div className="grid grid-cols-2 text-center text-xs font-bold font-sans">
            <button
              onClick={() => setActiveMobileTab('case')}
              className={`py-3 flex justify-center items-center gap-1 border-b-2 transition-colors cursor-pointer ${
                activeMobileTab === 'case' 
                  ? 'border-natural-primary text-natural-primary bg-natural-surface/20' 
                  : 'border-transparent text-natural-text-muted hover:text-natural-text-dark'
              }`}
            >
              <FileText className="w-4 h-4" />
              1. Detail Kasus
            </button>
            <button
              onClick={() => setActiveMobileTab('question')}
              className={`py-3 flex justify-center items-center gap-1 border-b-2 transition-colors cursor-pointer ${
                activeMobileTab === 'question' 
                  ? 'border-natural-primary text-natural-primary bg-natural-surface/20' 
                  : 'border-transparent text-natural-text-muted hover:text-natural-text-dark'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              2. Soal & Jawaban
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          {/* A. Case Study Pane (Left column) - Rendered if active question has case study and active tab on mobile is correct */}
          {hasCaseStudy && (activeMobileTab === 'case' || window.innerWidth >= 640) && (
            <div className="flex-1 md:max-w-[48%] lg:max-w-[50%] border-r border-natural-border bg-white p-5 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar select-text">
              <div className="prose max-w-none text-natural-text-dark leading-relaxed text-sm">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-natural-primary uppercase bg-natural-surface border border-natural-border-dark px-2.5 py-0.5 rounded mb-3">
                  <FileText className="w-3 h-3 text-natural-accent" />
                  Materi Studi Kasus
                </span>
                
                <MarkdownView content={currentQuestion.caseStudyText || ''} className="text-xs sm:text-sm" />
              </div>
            </div>
          )}

          {/* B. Active Question area (Middle / Right Column) - Rendered if tab is current on mobile */}
          {(!hasCaseStudy || activeMobileTab === 'question' || window.innerWidth >= 640) && (
            <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-natural-bg">
              <div className="max-w-2xl mx-auto w-full space-y-6">
                
                {/* Question Info Title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-natural-text-muted uppercase tracking-wider">
                    <span>Soal Nomor {currentIdx + 1}</span>
                    <span>•</span>
                    <span className="text-white bg-natural-primary border border-natural-primary px-2 py-0.5 rounded text-[9px]">
                      {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && 'Pilihan Ganda'}
                      {currentQuestion.type === QuestionType.TRUE_FALSE && 'Benar / Salah'}
                      {currentQuestion.type === QuestionType.SHORT_ANSWER && 'Isian Singkat'}
                      {currentQuestion.type === QuestionType.ESSAY_CASE && 'Essay Studi Kasus'}
                    </span>
                  </div>
                  
                  <MarkdownView
                    content={currentQuestion.questionText}
                    className="text-base sm:text-lg font-extrabold text-[#5A5A40] leading-snug"
                  />
                </div>

                {/* 3. Question Form Types */}
                <div className="pt-2 select-text">
                  {/* A. MULTIPLE_CHOICE (4 Card buttons with big click area) */}
                  {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => {
                        const letter = option.trim().charAt(0); // A, B, C or D
                        const isSelected = answers[currentQuestion.id] === letter;
                        
                        return (
                          <button
                            key={option}
                            onClick={() => handleSelectAnswer(letter)}
                            className={`w-full py-3 px-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer hover:shadow-xs ${
                              isSelected 
                                ? 'bg-natural-surface border-natural-primary ring-1 ring-natural-primary font-bold' 
                                : 'bg-white border-natural-border hover:bg-natural-surface/40'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded text-[10px] font-mono font-black flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected 
                                ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs' 
                                : 'bg-natural-surface border-natural-border-dark text-[#5A5A40]'
                            }`}>
                              {letter}
                            </span>
                            <MarkdownView
                              content={option.substring(3).trim() || option}
                              className={`text-xs sm:text-sm leading-snug ${isSelected ? 'text-natural-text-dark font-extrabold' : 'text-natural-text-dark/95'}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* B. TRUE_FALSE (Large horizontal pill-shaped option buttons) */}
                  {currentQuestion.type === QuestionType.TRUE_FALSE && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* TRUE Button */}
                      <button
                        onClick={() => handleSelectAnswer('TRUE')}
                        className={`py-4 px-6 rounded-2xl border text-center font-bold text-xs tracking-wider transition-all cursor-pointer hover:shadow-xs flex flex-col items-center gap-1.5 focus:outline-none ${
                          answers[currentQuestion.id] === 'TRUE'
                            ? 'bg-emerald-50/40 border-emerald-500 ring-1 ring-emerald-500 text-natural-text-dark font-extrabold'
                            : 'bg-white border-natural-border hover:bg-natural-surface/30'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-black border uppercase shrink-0 transition-colors ${
                          answers[currentQuestion.id] === 'TRUE'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-natural-surface border-natural-border text-natural-text-muted'
                        }`}>
                          B
                        </span>
                        Benar (True)
                      </button>

                      {/* FALSE Button */}
                      <button
                        onClick={() => handleSelectAnswer('FALSE')}
                        className={`py-4 px-6 rounded-2xl border text-center font-bold text-xs tracking-wider transition-all cursor-pointer hover:shadow-xs flex flex-col items-center gap-1.5 focus:outline-none ${
                          answers[currentQuestion.id] === 'FALSE'
                            ? 'bg-[#FFF6F0] border-natural-accent ring-1 ring-natural-accent text-natural-text-dark font-extrabold'
                            : 'bg-white border-natural-border hover:bg-natural-surface/30'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-black border uppercase shrink-0 transition-colors ${
                          answers[currentQuestion.id] === 'FALSE'
                            ? 'bg-natural-accent border-natural-accent text-white'
                            : 'bg-natural-surface border-natural-border text-natural-text-muted'
                        }`}>
                          S
                        </span>
                        Salah / Palsu (False)
                      </button>
                    </div>
                  )}

                  {/* C. SHORT_ANSWER (Autofocus clean text input with prompt) */}
                  {currentQuestion.type === QuestionType.SHORT_ANSWER && (
                    <div className="space-y-3">
                      <div className="relative rounded-xl shadow-xs">
                        <input
                          ref={inputRef}
                          type="text"
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleSelectAnswer(e.target.value)}
                          placeholder="Masukkan draf jawaban singkat Anda di sini..."
                          className="block w-full px-4 py-3 bg-white border border-natural-border-dark rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary text-natural-text-dark text-xs sm:text-sm font-medium transition-all"
                        />
                      </div>
                      <div className="p-3.5 bg-[#FFF9F3] border border-[#FFE8D6] rounded-xl text-[#9E5321] text-xs flex items-start gap-2 leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-natural-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-0.5 font-sans">Petunjuk Format Jawaban otomatis:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[#9E5321]/90 text-[11px] font-sans">
                            <li>Ketik mengunakan huruf kecil semua (*lowercase*).</li>
                            <li>Tuliskan angka secara harfiah (misal: "1" bukan "satu"), tanpa titik ribu/koma.</li>
                            <li>Pastikan ejaan kata/kosakata sudah tepat sebelum berpindah.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* D. ESSAY_CASE (Auto expand resizable textarea with word/character counter) */}
                  {currentQuestion.type === QuestionType.ESSAY_CASE && (
                    <div className="space-y-2">
                      <div className="relative">
                        <textarea
                          rows={6}
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleSelectAnswer(e.target.value)}
                          placeholder="Tuliskan draf argumen / jawaban analisis studi kasus Anda secara detail..."
                          className="block w-full px-4 py-3 bg-white border border-natural-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary text-natural-text-dark text-xs sm:text-sm leading-relaxed transition-all resize-y select-text custom-scrollbar min-h-36"
                        />
                        
                        {/* Word counter positioning */}
                        <div className="absolute bottom-2.5 right-3 bg-natural-surface/90 backdrop-blur px-2.5 py-1 rounded-lg border border-natural-border-dark text-[10px] font-mono font-bold text-natural-text-dark flex items-center gap-1 select-none">
                          <span>{getWordCount(answers[currentQuestion.id] || '')} kata</span>
                          <span className="text-natural-border-dark">|</span>
                          <span>{(answers[currentQuestion.id] || '').length} karakter</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-natural-text-muted leading-relaxed pl-1 font-serif italic">
                        * Jawaban essay akan dievaluasi secara mandiri dibanding kunci evaluasi atau didiskusikan bersama tim belajar Anda usai mengumpulkan.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Active Question footer navigation */}
              <div className="max-w-2xl mx-auto w-full pt-6 border-t border-natural-border flex items-center justify-between gap-4 mt-8 bg-natural-bg z-10">
                <button
                  disabled={currentIdx === 0}
                  onClick={handlePrev}
                  className="px-3.5 py-2 hover:bg-natural-surface rounded-xl text-natural-text-dark disabled:opacity-45 disabled:hover:bg-transparent font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali
                </button>

                {/* RAGU RAGU TOGGLE */}
                <button
                  onClick={toggleFlag}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
                    flags[currentQuestion.id]
                      ? 'bg-natural-accent border-natural-accent text-white shadow-xs active:bg-natural-accent scale-98 font-bold'
                      : 'bg-white border-natural-border-dark text-[#5A5A40] hover:bg-natural-surface'
                  }`}
                  id="flag_btn_current"
                >
                  <Flag className={`w-3.5 h-3.5 ${flags[currentQuestion.id] ? 'fill-white text-white' : ''}`} />
                  Ragu-Ragu
                </button>

                {currentIdx < quiz.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleManualSubmitClick}
                    className="px-4 py-2 bg-natural-accent hover:bg-natural-accent-hover text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-98"
                    id="runner_finish_btn"
                  >
                    Kumpulkan
                    <CheckSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* C. Sidebar Navigator (Right column desktop) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block border-l border-natural-border bg-white h-[calc(100vh-76px)] sticky top-[76px] overflow-hidden select-none shrink-0"
              id="runner_navigation_sidebar"
            >
              <div className="p-5 space-y-5 h-full overflow-y-auto custom-scrollbar">
                <div className="border-b border-natural-surface pb-3">
                  <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider">Navigasi Soal</h4>
                  <p className="text-[10px] text-natural-text-muted mt-0.5 leading-relaxed font-sans">Klik nomor untuk melompat ke soal secara instan.</p>
                </div>

                {/* Question Numbers Grid layout */}
                <div className="grid grid-cols-4 gap-2">
                  {quiz.questions.map((q, idx) => {
                    const status = getQuestionStatus(idx);
                    const isCurrent = idx === currentIdx;

                    let classes = 'border border-natural-border text-natural-text-muted bg-natural-surface/30 hover:bg-natural-surface/80';

                    if (status === 'flagged') {
                      classes = 'bg-natural-accent border-natural-accent text-white font-bold hover:opacity-90 shadow-xs';
                    } else if (status === 'answered') {
                      classes = 'bg-natural-primary border-natural-primary text-white font-bold hover:opacity-95 shadow-xs';
                    }

                    if (isCurrent) {
                      classes += ' ring-2 ring-natural-primary ring-offset-2';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-full aspect-square rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${classes}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Color explanation legends */}
                <div className="pt-4 border-t border-natural-surface space-y-2 text-xs text-natural-text-muted font-sans font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-natural-surface/50 border border-natural-border-dark block"></span>
                    <span>Belum Dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-natural-primary block"></span>
                    <span>Sudah Dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-natural-accent block"></span>
                    <span>Ragu-Ragu (Flagged)</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-natural-surface text-[10px] text-natural-text-muted font-mono leading-relaxed">
                  Peserta Ujian: <span className="font-sans font-semibold text-natural-text-dark">{username}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Collapse Sidebar Pull Handle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute bottom-6 right-6 w-9 h-9 rounded-full bg-natural-primary text-white border border-natural-primary shadow-md hover:bg-natural-primary-hover items-center justify-center cursor-pointer transition-all hover:scale-105 z-20"
          title={isSidebarOpen ? 'Sembunyikan Menu Navigasi' : 'Tampilkan Menu Navigasi'}
          id="collapse_sidebar_handler"
        >
          {isSidebarOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 5. Mobile / Tablet navigation assistant row (Shows grid of numbers at bottom, ONLY if drawer is needed / screen is small) */}
      <div className="block lg:hidden bg-white border-t border-natural-border p-2 overflow-x-auto select-none">
        <div className="flex gap-1.5 max-w-full px-2">
          {quiz.questions.map((q, idx) => {
            const status = getQuestionStatus(idx);
            const isCurrent = idx === currentIdx;

            let classes = 'border border-natural-border bg-natural-surface/40 text-natural-text-muted';

            if (status === 'flagged') {
              classes = 'bg-natural-accent border-natural-accent text-white';
            } else if (status === 'answered') {
              classes = 'bg-natural-primary border-natural-primary text-white';
            }

            if (isCurrent) {
              classes += ' ring-2 ring-natural-primary';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg shrink-0 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${classes}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Double Confirmation Modal Panel before finishing the exam */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="fixed inset-0 bg-[#5A5A40]/30 backdrop-blur-xs"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-natural-border z-10 relative font-sans text-center"
            >
              <div className="w-12 h-12 bg-natural-surface text-natural-accent border border-natural-border-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-extrabold text-natural-text-dark leading-tight">Apakah Anda yakin ingin Mengumpulkan?</h3>
              <p className="text-xs text-natural-text-muted mt-2 leading-relaxed font-sans">
                Anda telah menjawab <span className="font-semibold text-natural-text-dark">{answeredCount} dari {totalQuestions} soal</span>. Setelah dikirim, jawaban Anda akan dinilai dan draf essay dapat dicocokkan bersama anggota kelompok belajar lainnya.
              </p>

              {/* Warnings for incomplete answers */}
              {answeredCount < totalQuestions && (
                <div className="mt-3 bg-[#FFF6F0] rounded-xl p-3 border border-[#FFE3D1] text-left text-xs text-[#9E5321] font-medium leading-relaxed font-sans">
                  ⚠️ Ada <span className="font-bold">{totalQuestions - answeredCount} soal yang belum Anda isi/jawab</span>. Sangat disarankan untuk mengulas seluruh lembar jawaban sebelum mengakhiri ujian.
                </div>
              )}

              {/* Flags explanation warnings */}
              {Object.values(flags).filter(Boolean).length > 0 && (
                <div className="mt-2 bg-[#FFF6F0] rounded-xl p-3 border border-[#FFE3D1] text-left text-xs text-[#9E5321] font-medium leading-relaxed font-sans">
                  ⚠️ Ada <span className="font-bold">{Object.values(flags).filter(Boolean).length} soal bertanda RAGU-RAGU</span> yang masih bertanda kuning.
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-natural-surface text-natural-text-dark hover:bg-natural-surface-dark border border-natural-border-dark rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Ulas Lembar Soal
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 py-2.5 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  id="confirm_submit_btn"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Kumpulkan Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
