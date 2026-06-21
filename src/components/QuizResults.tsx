/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attempt, Question, Quiz, QuestionType } from '../types';
import { motion } from 'motion/react';
import { 
  Award, 
  Calendar, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  XCircle, 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  ChevronRight,
  MessageSquareReply
} from 'lucide-react';

interface QuizResultsProps {
  attempt: Attempt;
  quiz: Quiz;
  onBackToDashboard: () => void;
}

export default function QuizResults({ attempt, quiz, onBackToDashboard }: QuizResultsProps) {
  // Format seconds to mm:ss
  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} menit ${secs} detik`;
  };

  const getQuestionResult = (q: Question) => {
    const userAnswer = attempt.answers[q.id] || '';
    if (q.type === QuestionType.ESSAY_CASE) {
      return 'essay'; // manual review
    }
    const isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    return isCorrect ? 'correct' : 'incorrect';
  };

  // Pre-calculate statistics
  const mcTfSaQuestions = quiz.questions.filter(q => q.type !== QuestionType.ESSAY_CASE);
  const essayQuestions = quiz.questions.filter(q => q.type === QuestionType.ESSAY_CASE);
  
  const correctCount = mcTfSaQuestions.filter(q => getQuestionResult(q) === 'correct').length;
  const totalAutoGraded = mcTfSaQuestions.length;

  // Percentage of automatically graded answers
  const finalPercent = totalAutoGraded > 0 ? Math.round((correctCount / totalAutoGraded) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
      {/* Return Button */}
      <div className="mb-6">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-natural-text-muted hover:text-natural-primary cursor-pointer transition-colors"
          id="btn_back_dash"
        >
          <ArrowLeft className="w-4 h-4 text-natural-accent" />
          Kembali ke Beranda
        </button>
      </div>

      {/* Main Score Premium Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-natural-border overflow-hidden mb-8 shadow-xs"
        id="results_score_card"
      >
        <div className="p-8 sm:p-10 text-center relative bg-natural-surface/30">
          <div className="absolute top-4 right-4 bg-white/90 border border-natural-border-dark rounded-md px-3 py-1 font-mono text-[10px] text-natural-text-dark flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-natural-primary" />
            {new Date(attempt.completedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            className="mx-auto w-16 h-16 rounded-full bg-natural-surface text-natural-accent border border-natural-border-dark flex items-center justify-center mb-4"
          >
            <Award className="w-8 h-8" />
          </motion.div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#5A5A40] tracking-tight leading-tight">
            Hasil Latihan Soal
          </h2>
          <p className="text-xs font-bold text-natural-primary mt-1 max-w-lg mx-auto uppercase tracking-wide">
            {quiz.title}
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {/* Auto-graded score */}
            <div className="bg-white rounded-2xl p-4 border border-natural-border shadow-2xs flex flex-col justify-center items-center">
              <span className="text-[9px] font-mono font-bold text-natural-text-muted tracking-wide uppercase">Skor Objektif</span>
              <span className="text-2xl font-extrabold text-[#5A5A40] mt-1">
                {totalAutoGraded > 0 ? `${finalPercent}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-natural-text-muted font-medium mt-0.5">
                ({correctCount} / {totalAutoGraded} Benar)
              </span>
            </div>

            {/* Total Duration */}
            <div className="bg-white rounded-2xl p-4 border border-natural-border shadow-2xs flex flex-col justify-center items-center">
              <span className="text-[9px] font-mono font-bold text-natural-text-muted tracking-wide uppercase">Durasi Pengerjaan</span>
              <span className="text-xs sm:text-sm font-bold text-natural-text-dark mt-2.5 flex items-center gap-1">
                <Clock className="w-4 h-4 text-natural-primary" />
                {Math.floor(attempt.durationSpentSeconds / 60)}m {attempt.durationSpentSeconds % 60}s
              </span>
              <span className="text-[9px] text-natural-text-muted/85 font-serif italic mt-1 leading-none">
                Limit: {quiz.durationMinutes} menit
              </span>
            </div>

            {/* Essay answered */}
            <div className="bg-white rounded-2xl p-4 border border-natural-border shadow-2xs flex flex-col justify-center items-center">
              <span className="text-[9px] font-mono font-bold text-natural-text-muted tracking-wide uppercase">Essay Diisi</span>
              <span className="text-2xl font-extrabold text-[#5A5A40] mt-1">
                {essayQuestions.length}
              </span>
              <span className="text-[9px] text-natural-primary font-bold mt-1 bg-natural-surface border border-natural-border-dark px-2 py-0.5 rounded-full">
                Review Mandiri
              </span>
            </div>

            {/* Status Peserta */}
            <div className="bg-white rounded-2xl p-4 border border-natural-border shadow-2xs flex flex-col justify-center items-center">
              <span className="text-[9px] font-mono font-bold text-natural-text-muted tracking-wide uppercase">Nama Peserta</span>
              <span className="text-xs sm:text-sm font-extrabold text-natural-primary mt-2.5 truncate max-w-full">
                {attempt.username}
              </span>
              <span className="text-[9px] text-natural-text-muted font-medium mt-1 leading-none">
                Selesai Belajar
              </span>
            </div>
          </div>

          <div className="mt-6 text-xs text-natural-text-muted font-serif italic leading-relaxed max-w-xl mx-auto">
            * Jawaban Anda disimpan secara lokal. <span className="font-sans font-bold text-natural-text-dark">Pilihan Ganda, Benar/Salah, & Isian Singkat</span> dinilai otomatis. Untuk <span className="font-sans font-bold text-[#9E5321]">Essay</span>, bandingkan nilai Anda dengan Kunci Evaluasi di bawah.
          </div>
        </div>
      </motion.div>

      {/* Review Section Title */}
      <h3 className="text-base font-extrabold text-[#5A5A40] mb-4 flex items-center gap-2 font-mono">
        <FileText className="w-5 h-5 text-natural-accent" />
        Analisis Lembar Jawaban & Pembahasan
      </h3>

      {/* Question Details List */}
      <div className="space-y-6">
        {quiz.questions.map((q, index) => {
          const result = getQuestionResult(q);
          const userAnswer = attempt.answers[q.id] || '';
          
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl border ${
                result === 'correct' 
                  ? 'border-emerald-200 bg-emerald-50/5' 
                  : result === 'incorrect' 
                    ? 'border-[#FFE3D1] bg-[#FFFBF7]' 
                    : 'border-natural-border'
              } p-5 shadow-2xs transition-all`}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Number Badge and Text */}
                <div className="flex items-start gap-3 flex-1">
                  <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                    result === 'correct' 
                      ? 'bg-emerald-600 text-white' 
                      : result === 'incorrect' 
                        ? 'bg-natural-accent text-white' 
                        : 'bg-natural-surface border border-natural-border-dark text-natural-primary'
                  }`}>
                    {index + 1}
                  </span>
                  
                  <div className="flex-1">
                    {/* Soal Type Badge */}
                    <span className="inline-block text-[10px] font-mono font-bold tracking-wide text-natural-text-muted uppercase mb-1">
                      {q.type === QuestionType.MULTIPLE_CHOICE && 'Pilihan Ganda'}
                      {q.type === QuestionType.TRUE_FALSE && 'Benar / Salah'}
                      {q.type === QuestionType.SHORT_ANSWER && 'Isian Singkat'}
                      {q.type === QuestionType.ESSAY_CASE && 'Essay Studi Kasus'}
                    </span>
                    <p className="text-natural-text-dark font-extrabold text-xs sm:text-sm leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* Options Preview for Multiple Choice */}
                    {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const optionLetter = opt.charAt(0);
                          const isUserSelected = userAnswer.toLowerCase() === optionLetter.toLowerCase();
                          const isCorrectOption = q.correctAnswer.toLowerCase() === optionLetter.toLowerCase();
                          
                          return (
                            <div 
                              key={opt}
                              className={`p-2.5 text-xs rounded-xl border font-medium ${
                                isCorrectOption 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' 
                                  : isUserSelected 
                                    ? 'bg-[#FFF6F0] border-natural-accent text-[#9E5321] font-bold' 
                                    : 'bg-natural-surface/40 border-natural-border text-natural-text-muted'
                              }`}
                            >
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* User Answer Container */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 pt-3.5 border-t border-natural-surface text-xs">
                      <div className="flex-1">
                        <span className="font-bold text-natural-text-muted block mb-1 font-sans">Jawaban Anda:</span>
                        <div className={`p-3 rounded-xl font-mono min-h-8 flex items-center ${
                          result === 'correct' 
                            ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-100' 
                            : result === 'incorrect' 
                              ? 'bg-[#FFF6F0] text-[#9E5321] font-bold border border-[#FFE3D1]' 
                              : 'bg-natural-surface/40 text-natural-text-dark border border-natural-border font-sans leading-relaxed'
                        }`}>
                          {userAnswer ? (
                            q.type === QuestionType.TRUE_FALSE 
                              ? (userAnswer === 'TRUE' ? 'Benar (True)' : 'Salah (False)') 
                              : userAnswer
                          ) : (
                            <span className="italic text-natural-text-muted font-serif">Tidak Dijawab</span>
                          )}
                        </div>
                      </div>

                      {/* Correct / Review Key Display */}
                      <div className="flex-1">
                        <span className="font-bold text-natural-text-muted block mb-1 font-sans">
                          {q.type === QuestionType.ESSAY_CASE ? 'Kunci Pembahasan / Indikator Ideal:' : 'Kunci Jawaban Benar:'}
                        </span>
                        <div className={`p-3 rounded-xl min-h-8 whitespace-pre-wrap ${
                          q.type === QuestionType.ESSAY_CASE 
                            ? 'bg-natural-surface/80 border border-natural-border text-natural-text-dark font-sans leading-relaxed text-xs' 
                            : 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200 font-mono'
                        }`}>
                          {q.type === QuestionType.TRUE_FALSE 
                            ? (q.correctAnswer === 'TRUE' ? 'Benar (True)' : 'Salah (False)') 
                            : q.correctAnswer}
                        </div>
                      </div>
                    </div>

                    {/* Word check helper for Essay responses */}
                    {q.type === QuestionType.ESSAY_CASE && userAnswer && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-natural-text-muted bg-natural-surface border border-natural-border-dark px-2.5 py-1 rounded max-w-fit font-mono">
                        <MessageSquareReply className="w-3.5 h-3.5 text-natural-accent" />
                        Panjang Jawaban: {userAnswer.trim().split(/\s+/).length} kata ({userAnswer.length} karakter)
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Icon/Badge on Right */}
                <div className="shrink-0 pt-0.5 select-none">
                  {result === 'correct' && (
                    <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 py-1 px-2.5 rounded-full text-xs font-bold font-sans">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Benar
                    </div>
                  )}
                  {result === 'incorrect' && (
                    <div className="flex items-center gap-1 text-[#9E5321] bg-[#FFF6F0] border border-[#FFE3D1] py-1 px-2.5 rounded-full text-xs font-bold font-sans">
                      <XCircle className="w-4 h-4 text-natural-accent" />
                      Salah
                    </div>
                  )}
                  {result === 'essay' && (
                    <div className="flex items-center gap-1 text-natural-primary bg-natural-surface border border-natural-border-dark py-1 px-2.5 rounded-full text-xs font-bold font-sans">
                      <HelpCircle className="w-4 h-4 text-natural-accent" />
                      Evaluasi
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Footer Back To Dashboard Button */}
      <div className="mt-10 mb-16 text-center">
        <button
          onClick={onBackToDashboard}
          className="px-6 py-3 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl shadow-xs text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <Award className="w-4 h-4" />
          Kelelahan Selesai? Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
