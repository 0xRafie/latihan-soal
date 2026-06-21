/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Quiz, Question, QuestionType, Attempt } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  FileText, 
  Calendar, 
  BookOpen, 
  Check, 
  Award, 
  ChevronRight, 
  HelpCircle, 
  Clock, 
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Edit3
} from 'lucide-react';

interface DashboardProps {
  quizzes: Quiz[];
  attempts: Attempt[];
  username: string;
  onStartQuiz: (quizId: string) => void;
  onAddQuiz: (quiz: Quiz) => void;
  onClearHistory: () => void;
  onEditQuizCollab: (quizId: string) => void;
  onDeleteQuiz: (quizId: string) => void;
}

export default function Dashboard({ quizzes, attempts, username, onStartQuiz, onAddQuiz, onClearHistory, onEditQuizCollab, onDeleteQuiz }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'create' | 'history'>('quizzes');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Quiz Creator
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState('15');
  
  // Question states inside Quiz Creator
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [mcCorrect, setMcCorrect] = useState('A');
  
  const [tfCorrect, setTfCorrect] = useState('TRUE');
  const [saCorrect, setSaCorrect] = useState('');
  
  const [essayCaseContent, setEssayCaseContent] = useState('');
  const [essayCorrect, setEssayCorrect] = useState('');

  const [creatorError, setCreatorError] = useState('');
  const [creatorSuccess, setCreatorSuccess] = useState('');

  // Process and push a single question block inside current draft quiz
  const handleAddQuestionToDraft = () => {
    setCreatorError('');
    setCreatorSuccess('');

    if (!qText.trim()) {
      setCreatorError('Silakan ketik pertanyaan utama sebelum menambahkan.');
      return;
    }

    let compiledCorrectAnswer = '';
    let options: string[] | undefined = undefined;
    let caseStudyText: string | undefined = undefined;

    if (qType === QuestionType.MULTIPLE_CHOICE) {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        setCreatorError('Harap lengkapi semua 4 pilihan opsi (A, B, C, D).');
        return;
      }
      options = [
        `A. ${optA.trim()}`,
        `B. ${optB.trim()}`,
        `C. ${optC.trim()}`,
        `D. ${optD.trim()}`
      ];
      compiledCorrectAnswer = mcCorrect;
    } else if (qType === QuestionType.TRUE_FALSE) {
      compiledCorrectAnswer = tfCorrect;
    } else if (qType === QuestionType.SHORT_ANSWER) {
      if (!saCorrect.trim()) {
        setCreatorError('Harap tentukan kata kunci jawaban benar untuk isian singkat.');
        return;
      }
      compiledCorrectAnswer = saCorrect.trim().toLowerCase();
    } else if (qType === QuestionType.ESSAY_CASE) {
      if (!essayCaseContent.trim()) {
        setCreatorError('Tipe Essay Studi Kasus wajib memiliki tulisan materi studi kasus pengantar (pada kolom sebelah kiri).');
        return;
      }
      caseStudyText = essayCaseContent.trim();
      compiledCorrectAnswer = essayCorrect.trim() || 'Pembahasan akan merujuk ke analisis orisinal oleh pengguna.';
    }

    const newQuestion: Question = {
      id: `custom_q_${Date.now()}_${questions.length + 1}`,
      type: qType,
      questionText: qText.trim(),
      options,
      correctAnswer: compiledCorrectAnswer,
      caseStudyText,
      points: 20
    };

    setQuestions((prev) => [...prev, newQuestion]);
    
    // Clear question form fields for convenient next question insertion
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setMcCorrect('A');
    setTfCorrect('TRUE');
    setSaCorrect('');
    setEssayCorrect('');
    
    setCreatorSuccess(`Soal #${questions.length + 1} berhasil ditambahkan ke draf!`);
  };

  // Remove single question from current draft
  const handleRemoveDraftQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Compile entire package and publish
  const handlePublishQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorError('');
    setCreatorSuccess('');

    if (!quizTitle.trim()) {
      setCreatorError('Silakan masukkan judul latihan soal.');
      return;
    }

    if (questions.length === 0) {
      setCreatorError('Anda wajib membuat & menambahkan minimal 1 soal ke draf.');
      return;
    }

    const minutes = parseInt(quizDuration);
    if (isNaN(minutes) || minutes < 1 || minutes > 300) {
      setCreatorError('Durasi ujian harus berkisar antara 1 s/d 300 menit.');
      return;
    }

    const newQuiz: Quiz = {
      id: `custom_quiz_${Date.now()}`,
      title: quizTitle.trim(),
      description: quizDesc.trim() || 'Paket latihan soal buatan anggota grup.',
      durationMinutes: minutes,
      createdBy: username,
      createdAt: new Date().toISOString(),
      questions: questions
    };

    onAddQuiz(newQuiz);

    // Reset all form properties
    setQuizTitle('');
    setQuizDesc('');
    setQuizDuration('15');
    setQuestions([]);
    
    setActiveTab('quizzes');
    alert('Paket latihan soal baru berhasil dipublikasikan di halaman depan!');
  };

  // Export Quiz to JSON File
  const handleExportQuiz = (quiz: Quiz) => {
    try {
      const dataStr = JSON.stringify(quiz, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `LatihSoal_${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert('Maaf, gagal mengekspor berkas soal.');
    }
  };

  // Import Quiz from JSON File
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        
        // Basic schema validations
        if (!jsonContent.title || !jsonContent.questions || !Array.isArray(jsonContent.questions)) {
          alert('Format JSON salah! Pastikan berkas adalah hasil ekspor dari website LatihSoal.');
          return;
        }

        // Remap ID if duplicate
        const importedQuiz: Quiz = {
          ...jsonContent,
          id: `imported_${Date.now()}`,
          createdBy: username,
          createdAt: new Date().toISOString()
        };

        onAddQuiz(importedQuiz);
        alert(`Sukses mengimpor paket soal: "${importedQuiz.title}" dengan ${importedQuiz.questions.length} soal!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert('Gagal membaca berkas JSON. Format data tidak valid.');
      }
    };

    fileReader.readAsText(files[0]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Visual Welcome Banner */}
      <div className="bg-natural-primary rounded-3xl p-6 sm:p-8 text-white natural-shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6">
          <BookOpen className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/95 text-[10.5px] font-bold tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-natural-accent" />
            Ruang Belajar Kolaboratif
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Selamat Belajar, <span className="text-natural-accent font-black">{username}</span>!
          </h2>
          <p className="text-xs sm:text-sm text-natural-bg/90 leading-relaxed mt-2 text-balance">
            Temukan latihan soal pilihan ganda, benar/salah, isian singkat, dan pemecahan kasus bermodel split-screen. Cari tahu skor temanmu, buat paket kuis unikmu, atau kirim (.json) ke tim belajarmu.
          </p>
        </div>
      </div>

      {/* Main Dashboard Navigation Tabs */}
      <div className="flex border-b border-natural-border mb-6 gap-2">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'quizzes' 
              ? 'border-natural-primary text-natural-primary font-extrabold' 
              : 'border-transparent text-natural-text-muted hover:text-natural-text-dark'
          }`}
        >
          Daftar Paket Kuis ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'create' 
              ? 'border-natural-primary text-natural-primary font-extrabold' 
              : 'border-transparent text-natural-text-muted hover:text-natural-text-dark'
          }`}
          id="tab_create_quiz"
        >
          Format & Buat Soal Baru
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'history' 
              ? 'border-natural-primary text-natural-primary font-extrabold' 
              : 'border-transparent text-natural-text-muted hover:text-natural-text-dark'
          }`}
        >
          Riwayat Nilai Kelompok ({attempts.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        {/* TAB 1: QUIZZES GRID */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            
            {/* Quick Helper Subheader & Import Area */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-natural-border p-4 rounded-2xl gap-3 shadow-xs">
              <div className="text-natural-text-dark/95 leading-relaxed text-xs">
                <span className="font-bold text-natural-primary flex items-center gap-1.5 mb-0.5">
                  <Info className="w-4 h-4 text-natural-accent" />
                  Mencari Soal Baru?
                </span>
                Minta berkas <span className="font-semibold text-natural-accent">.json</span> hasil ekspor buatan teman Anda, lalu impor di sebelah kanan.
              </div>
              
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJsonFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={triggerFileInput}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-natural-primary hover:bg-natural-primary-hover border border-transparent rounded-xl hover:shadow-sm transition-all active:scale-98"
                  id="import_quiz_file_btn"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Impor Berkas Soal
                </button>
              </div>
            </div>

            {/* Quiz grid lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => {
                const totalQuestionsCount = quiz.questions.length;
                const essayQs = quiz.questions.filter(q => q.type === QuestionType.ESSAY_CASE).length;
                const canDeleteQuiz = quiz.createdBy === username;
                
                return (
                  <motion.div
                    key={quiz.id}
                    layoutId={quiz.id}
                    className="bg-white rounded-2xl border border-natural-border p-6 flex flex-col justify-between natural-shadow hover:shadow-md hover:border-natural-border-dark transition-all group animate-fade-in"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-natural-text-dark group-hover:text-natural-primary transition-colors text-base font-sans">
                            {quiz.title}
                          </h3>
                          <p className="text-xs text-natural-text-muted flex items-center gap-1 font-sans">
                            <span>Dibuat oleh: <span className="font-bold text-natural-text-dark">{quiz.createdBy}</span></span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleExportQuiz(quiz)}
                            title="Ekspor Paket Soal (Kirim ke Teman)"
                            className="w-8 h-8 rounded-full text-natural-text-muted hover:text-natural-primary hover:bg-natural-surface flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {canDeleteQuiz && (
                            <button
                              onClick={() => onDeleteQuiz(quiz.id)}
                              title="Hapus Paket Soal"
                              className="w-8 h-8 rounded-full text-natural-text-muted hover:text-red-700 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-natural-text-dark/85 leading-relaxed line-clamp-2">
                        {quiz.description}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1.5 font-mono text-[9px]">
                        <span className="inline-flex items-center gap-1 font-bold bg-natural-surface border border-natural-border rounded-md px-2 py-0.5 text-natural-text-dark">
                          <Clock className="w-3 h-3 text-natural-text-muted" />
                          {quiz.durationMinutes} MENIT
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold bg-[#FDFCF0] border border-natural-border rounded-md px-2 py-0.5 text-natural-primary">
                          <Layers className="w-3 h-3 text-natural-text-muted/80" />
                          {totalQuestionsCount} SOAL UTAMA
                        </span>
                        {essayQs > 0 && (
                          <span className="inline-flex items-center gap-1 font-bold bg-natural-accent/15 border border-natural-accent/30 rounded-md px-2 py-0.5 text-natural-accent-hover">
                            <FileText className="w-3 h-3 text-natural-accent/80" />
                            {essayQs} ESSAY KASUS
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-natural-surface flex items-center justify-between gap-2">
                      <span className="text-[10px] text-natural-text-muted font-bold tracking-wider font-mono hidden sm:inline">
                        STATUS: READY
                      </span>

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => onEditQuizCollab(quiz.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 border border-natural-border-dark text-natural-primary hover:bg-[#FFF5ED] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-natural-accent" />
                          Edit Bersama
                        </button>

                        <button
                          onClick={() => onStartQuiz(quiz.id)}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
                        >
                          Kerjakan Soal
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE NEW QUIZ FORM */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-3xl border border-natural-border p-6 sm:p-8 natural-shadow">
            <h3 className="text-lg font-serif font-extrabold text-natural-text-dark border-b border-natural-border pb-3 mb-6">
              Arsitek Paket Soal (Kuis Kreator)
            </h3>

            <form onSubmit={handlePublishQuiz} className="space-y-8 select-text">
              
              {/* Part 1: General Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-natural-text-muted uppercase tracking-wider">1. Info Umum Paket Soal</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-natural-text-dark mb-1">Judul Latihan Soal</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Try Out Ujian Bisnis, Ulangan Harian Fisika"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-natural-border-dark rounded-xl text-sm text-natural-text-dark bg-natural-bg/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-natural-text-dark mb-1">Durasi Pengerjaan (Menit)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={300}
                      value={quizDuration}
                      onChange={(e) => setQuizDuration(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-natural-border-dark rounded-xl text-sm text-natural-text-dark bg-natural-bg/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-text-dark mb-1">Deskripsi Tambahan / Petunjuk Ujian</label>
                  <input
                    type="text"
                    placeholder="Contoh: Soal mencakup materi bab 1 s/d bab 3 dasar akuntansi."
                    value={quizDesc}
                    onChange={(e) => setQuizDesc(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-natural-border-dark rounded-xl text-sm text-natural-text-dark bg-natural-bg/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary"
                  />
                </div>
              </div>

              {/* Part 2: Active Draft List */}
              {questions.length > 0 && (
                <div className="space-y-3 bg-natural-surface/60 rounded-2xl p-4 border border-natural-border">
                  <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider flex justify-between items-center">
                    <span>Soal dalam draf ({questions.length})</span>
                    <span className="text-[10px] text-natural-text-muted">Tekan ikon sampah untuk menghapus dari draf</span>
                  </h4>

                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="bg-white border border-natural-border p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="truncate flex-1 pr-4 flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-natural-primary px-1.5 py-0.5 rounded bg-natural-surface border border-natural-border">{idx + 1}</span>
                          <span className="font-bold uppercase text-[9px] bg-natural-primary text-white px-2 py-0.5 rounded-full">
                            {q.type === QuestionType.MULTIPLE_CHOICE && 'PG'}
                            {q.type === QuestionType.TRUE_FALSE && 'B/S'}
                            {q.type === QuestionType.SHORT_ANSWER && 'Isian'}
                            {q.type === QuestionType.ESSAY_CASE && 'Essay Kasus'}
                          </span>
                          <span className="text-natural-text-dark font-medium truncate">{q.questionText}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftQuestion(idx)}
                          className="text-[#9E5321] hover:text-white p-1 rounded-full hover:bg-natural-accent transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 3: Question Constructor Section */}
              <div className="border border-natural-border bg-natural-surface/40 rounded-3xl p-5 sm:p-6 space-y-4">
                <h4 className="text-xs font-extrabold text-natural-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-natural-accent" />
                  Tambahkan Soal ke Draf
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-natural-text-dark mb-1">Tipe Pertanyaan</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as QuestionType)}
                      className="block w-full px-3 py-2.5 bg-white border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary font-bold"
                    >
                      <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda (4 Opsi)</option>
                      <option value={QuestionType.TRUE_FALSE}>True / False (Benar atau Salah)</option>
                      <option value={QuestionType.SHORT_ANSWER}>Isian Singkat (Auto-grade)</option>
                      <option value={QuestionType.ESSAY_CASE}>Essay Studi Kasus (Split-Screen)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-natural-text-dark mb-1">Pertanyaan Utama</label>
                    <input
                      type="text"
                      placeholder="Contoh: Berapa hasil perkalian 12 x 12?"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary"
                    />
                  </div>
                </div>

                {/* Subform configurations according to Question Type */}
                <div className="pt-2">
                  
                  {/* A. Options for Multiple Choice */}
                  {qType === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-3 p-4 bg-white rounded-2xl border border-natural-border">
                      <p className="text-[10px] font-mono font-bold text-natural-text-muted uppercase tracking-wider mb-1">Pilihan & Jawaban Benar (A, B, C, D)</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-natural-text-dark mb-0.5">Opsi A</label>
                          <input
                            type="text"
                            placeholder="Jawaban A..."
                            value={optA}
                            onChange={(e) => setOptA(e.target.value)}
                            className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-natural-text-dark mb-0.5">Opsi B</label>
                          <input
                            type="text"
                            placeholder="Jawaban B..."
                            value={optB}
                            onChange={(e) => setOptB(e.target.value)}
                            className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-natural-text-dark mb-0.5">Opsi C</label>
                          <input
                            type="text"
                            placeholder="Jawaban C..."
                            value={optC}
                            onChange={(e) => setOptC(e.target.value)}
                            className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-natural-text-dark mb-0.5">Opsi D</label>
                          <input
                            type="text"
                            placeholder="Jawaban D..."
                            value={optD}
                            onChange={(e) => setOptD(e.target.value)}
                            className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary"
                          />
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-natural-surface flex items-center justify-between">
                        <span className="text-[11px] font-bold text-natural-text-dark">Pilihan Jawaban yang Benar:</span>
                        <select
                          value={mcCorrect}
                          onChange={(e) => setMcCorrect(e.target.value)}
                          className="px-3 py-1.5 bg-natural-surface border border-natural-border-dark text-natural-primary rounded-lg text-xs font-bold focus:outline-none"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* B. Settings for True/False */}
                  {qType === QuestionType.TRUE_FALSE && (
                    <div className="p-4 bg-white rounded-2xl border border-natural-border flex justify-between items-center">
                      <span className="text-[11px] font-bold text-natural-text-dark">Pernyataan di atas bernilai:</span>
                      <select
                        value={tfCorrect}
                        onChange={(e) => setTfCorrect(e.target.value)}
                        className="px-4 py-1.5 bg-natural-surface border border-natural-border-dark text-natural-primary font-bold rounded-xl text-xs focus:outline-none"
                      >
                        <option value="TRUE">Benar (TRUE)</option>
                        <option value="FALSE">Salah (FALSE)</option>
                      </select>
                    </div>
                  )}

                  {/* C. Setting for Short Answer */}
                  {qType === QuestionType.SHORT_ANSWER && (
                    <div className="p-4 bg-white rounded-2xl border border-natural-border space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-natural-text-dark mb-1">Kunci Jawaban Benar (Hanya kata kunci penting saja)</label>
                        <input
                          type="text"
                          placeholder="Ketik dalam huruf kecil semua (contoh: 'piston', '150')"
                          value={saCorrect}
                          onChange={(e) => setSaCorrect(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-2 focus:ring-natural-primary"
                        />
                      </div>
                      <p className="text-[10px] text-[#A35212] font-semibold font-serif italic">
                        * Keterangan: Koreksi akan mengabaikan spasi berlebih dan huruf besar/kecil. Pengguna disarankan mengisi jawaban singkat yang pasti.
                      </p>
                    </div>
                  )}

                  {/* D. Settings for Essay Case Study */}
                  {qType === QuestionType.ESSAY_CASE && (
                    <div className="space-y-4 p-4 bg-white rounded-2xl border border-natural-border">
                      <div>
                        <label className="block text-xs font-bold text-natural-text-dark mb-1 font-sans">
                          Naskah Studi Kasus / Bacaan Referensi (Akan tampil pada sisi kiri Split-Screen)
                        </label>
                        <textarea
                          rows={5}
                          placeholder="Masukkan cerita latar belakang, data survei, atau analisis skenario secara detail di sini..."
                          value={essayCaseContent}
                          onChange={(e) => setEssayCaseContent(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark leading-relaxed min-h-24 focus:outline-none focus:ring-2 focus:ring-natural-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-natural-text-dark mb-1 font-sans">
                          Kunci Pembahasan / Parameter Evaluasi (Sebagai bahan pembanding review mandiri)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Tuliskan kata kunci penting atau poin ideal jawaban yang membedakan jawaban benar dan salah..."
                          value={essayCorrect}
                          onChange={(e) => setEssayCorrect(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark min-h-16 focus:outline-none focus:ring-2 focus:ring-natural-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm single questions additions buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddQuestionToDraft}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-natural-accent hover:bg-natural-accent-hover rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Masukkan Soal ke Draf
                  </button>
                </div>
              </div>

              {/* Error messages if any */}
              {creatorError && (
                <div className="p-3.5 bg-[#FFF6F0] border border-[#FFE3D1] rounded-xl text-xs text-[#9E5321] font-semibold leading-relaxed">
                  ⚠️ {creatorError}
                </div>
              )}

              {creatorSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl text-xs text-emerald-850 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 font-extrabold" />
                  {creatorSuccess}
                </div>
              )}

              {/* Publish Total package Action */}
              <div className="pt-6 border-t border-natural-border flex flex-col sm:flex-row gap-3 justify-between items-center">
                <p className="text-xs text-natural-text-muted leading-normal max-w-sm">
                  Setelah selesai menyisipkan seluruh soal, klik tombol di sebelah kanan untuk menyimpannya ke daftar kuis aktif.
                </p>
                
                <button
                  type="submit"
                  className="w-full sm:w-auto h-11 px-6 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  id="final_publish_quiz_btn"
                >
                  <BookOpen className="w-4 h-4" />
                  Selesai & Publikasikan Paket Soal ({questions.length} Soal)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: WORK HISTORY LEDGER */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            
            {/* Table or Card of attempts */}
            <div className="bg-white rounded-2xl border border-natural-border p-6 natural-shadow overflow-hidden">
              <div className="flex justify-between items-center border-b border-natural-surface pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-natural-text-dark leading-tight">Performa Nilai & Akurasi Belajar Seri Kelompok</h3>
                  <p className="text-xs text-natural-text-muted mt-1 font-sans">Daftar nilai terkini dari Anda dan rekan dalam grup ini.</p>
                </div>

                {attempts.length > 3 && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs font-bold text-[#9E5321] hover:bg-[#FFF5ED] border border-[#FFE3D1] px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Bersihkan Riwayat
                  </button>
                )}
              </div>

              {attempts.length === 0 ? (
                <div className="py-12 text-center text-natural-text-muted/70 font-medium space-y-2">
                  <Award className="w-12 h-12 text-natural-border-dark mx-auto" />
                  <p className="text-sm">Belum ada rekam pengerjaan kuis.</p>
                  <p className="text-xs text-natural-text-muted max-w-xs mx-auto">Mulailah salah satu paket kuis di atas untuk melihat pencatatan nilai interaktif Anda di sini!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.slice().reverse().map((att) => {
                    const elapsedMins = Math.floor(att.durationSpentSeconds / 60);
                    const elapsedSecs = att.durationSpentSeconds % 60;
                    
                    return (
                      <div 
                        key={att.id}
                        className="p-4 border border-natural-border rounded-2xl bg-natural-surface/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-natural-surface/65 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <span className="inline-block text-[9px] font-bold px-2.5 py-0.5 rounded bg-natural-primary text-white uppercase mb-1.5 tracking-wider font-mono">
                            {att.quizTitle}
                          </span>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-extrabold text-natural-text-dark">{att.username}</span>
                            <span className="text-natural-border-dark">•</span>
                            <span className="text-[11px] text-natural-text-muted font-medium flex items-center gap-0.5">
                              <Clock className="w-3.5 h-3.5 text-natural-border-dark" />
                              Waktu: {elapsedMins}m {elapsedSecs}s
                            </span>
                            <span className="text-natural-border-dark">•</span>
                            <span className="text-[11px] text-natural-text-muted font-medium">
                              Selesai: {new Date(att.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Real-time score indicator */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-natural-border-dark font-mono text-center flex flex-col justify-center min-w-[72px]">
                            <span className="text-[9px] font-bold text-natural-text-muted leading-none">AKURASI</span>
                            <span className="text-sm font-extrabold text-natural-primary mt-0.5">{att.score}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Simulated Live Learning group Leaderboards */}
            <div className="bg-natural-surface/75 rounded-2xl p-6 border border-natural-border">
              <h4 className="text-xs font-extrabold text-natural-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-natural-accent" />
                Papan Akurasi Tertinggi
              </h4>
              <p className="text-xs text-natural-text-muted leading-relaxed mb-4">
                Peringkat didasarkan pada skor modul kuis objektif (Pilihan Ganda, Benar/Salah, Isian Singkat) yang tersimpan secara kolektif.
              </p>

              {attempts.length === 0 ? (
                <p className="text-xs text-natural-text-muted italic">Akumulasikan skor grup untuk menyalakan papan kepemimpinan belajar...</p>
              ) : (
                <div className="space-y-2 max-w-md">
                  {/* Derive leaderboard from attempts sorted by score */}
                  {Array.from(new Set(attempts.map(a => a.username)))
                    .map(name => {
                      // Get best score for this user
                      const userAttempts = attempts.filter(a => a.username === name);
                      const bestScore = Math.max(...userAttempts.map(a => a.score));
                      return { name, bestScore };
                    })
                    .sort((a, b) => b.bestScore - a.bestScore)
                    .map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-natural-border text-xs font-semibold shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                            index === 0 ? 'bg-natural-accent text-white' : index === 1 ? 'bg-natural-border-dark text-natural-primary' : 'bg-natural-bg border border-natural-border-dark text-natural-text-muted'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-natural-text-dark font-extrabold">{item.name}</span>
                        </div>
                        <span className="font-mono text-natural-primary font-bold">{item.bestScore}%</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
