/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Quiz, Question, QuestionType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  Users, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Edit3, 
  RefreshCw,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface CollaborativeEditorProps {
  quiz: Quiz;
  username: string;
  groupCode: string;
  onSaveQuiz: (updatedQuiz: Quiz) => void;
  onCancel: () => void;
}

interface CollabEvent {
  id: string;
  time: string;
  text: string;
  user: string;
  avatarColor: string;
}

interface SuggestedQuestion {
  id: string;
  user: string;
  question: Question;
}

export default function CollaborativeEditor({ quiz, username, groupCode, onSaveQuiz, onCancel }: CollaborativeEditorProps) {
  // Current active questions list
  const [questions, setQuestions] = useState<Question[]>(() => quiz.questions || []);
  
  // Quiz General Meta
  const [quizTitle, setQuizTitle] = useState(quiz.title);
  const [quizDesc, setQuizDesc] = useState(quiz.description);
  const [quizDuration, setQuizDuration] = useState(String(quiz.durationMinutes));

  // Current selected question index to edit (null means we're creating a new one)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(
    quiz.questions.length > 0 ? 0 : null
  );

  // Question Form State (Center Column)
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

  // Notifications and messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Simulated Collaborative Peers State
  const [peers, setPeers] = useState([
    { name: 'Siti Rahma', status: 'Mengetik kuis...', color: 'bg-emerald-500' },
    { name: 'Budi Santoso', status: 'Membaca Soal #2', color: 'bg-amber-500' },
    { name: 'Andi Wijaya', status: 'Aktif', color: 'bg-sky-500' }
  ]);

  // Live Activity feed states
  const [events, setEvents] = useState<CollabEvent[]>([
    {
      id: 'e1',
      time: 'Baru saja',
      text: 'bergabung ke ruang sunting kuis.',
      user: 'Siti Rahma',
      avatarColor: 'bg-emerald-600'
    },
    {
      id: 'e2',
      time: '1 menit lalu',
      text: 'melihat pratinjau lembar studi kasus.',
      user: 'Budi Santoso',
      avatarColor: 'bg-amber-600'
    }
  ]);

  // Peer question suggestions pipeline
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([
    {
      id: 'sug1',
      user: 'Andi Wijaya',
      question: {
        id: `sug_q_${Date.now()}_1`,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Manakah perintah SQL untuk mengambil kolom unik / menghilangkan duplikasi baris?',
        options: [
          'A. SELECT UNIQUE',
          'B. SELECT DISTINCT',
          'C. SELECT EXCLUDE',
          'D. SELECT GROUP'
        ],
        correctAnswer: 'B',
        points: 20
      }
    },
    {
      id: 'sug2',
      user: 'Siti Rahma',
      question: {
        id: `sug_q_${Date.now()}_2`,
        type: QuestionType.TRUE_FALSE,
        questionText: 'Di dalam CSS Flexbox, properti `justify-content` bertugas mengatur perataan item sepanjang "cross axis" (sumbu silang).',
        correctAnswer: 'FALSE',
        points: 20
      }
    }
  ]);

  // Load a question into form editor
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    if (selectedQuestionIndex !== null && questions[selectedQuestionIndex]) {
      const q = questions[selectedQuestionIndex];
      setQText(q.questionText);
      setQType(q.type);
      
      if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
        // Strip options letters prefix
        setOptA(q.options[0]?.substring(3) || '');
        setOptB(q.options[1]?.substring(3) || '');
        setOptC(q.options[2]?.substring(3) || '');
        setOptD(q.options[3]?.substring(3) || '');
        setMcCorrect(q.correctAnswer || 'A');
      } else if (q.type === QuestionType.TRUE_FALSE) {
        setTfCorrect(q.correctAnswer || 'TRUE');
      } else if (q.type === QuestionType.SHORT_ANSWER) {
        setSaCorrect(q.correctAnswer || '');
      } else if (q.type === QuestionType.ESSAY_CASE) {
        setEssayCaseContent(q.caseStudyText || '');
        setEssayCorrect(q.correctAnswer || '');
      }
    } else {
      // Setup default for fresh new question addition
      setQText('');
      setQType(QuestionType.MULTIPLE_CHOICE);
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setMcCorrect('A');
      setTfCorrect('TRUE');
      setSaCorrect('');
      setEssayCaseContent('');
      setEssayCorrect('');
    }
  }, [selectedQuestionIndex, questions]);

  // Simulated peer collaborative activity stream generator
  useEffect(() => {
    const peerActions = [
      () => {
        const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const names = ['Siti Rahma', 'Budi Santoso', 'Andi Wijaya'];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const comments = [
          'mengubah draf judul soal ujian...',
          'menilai opsi ganda pada lembar editor.',
          'mengoptimalkan ejaan kunci jawaban.',
          'mereview format kuis isian tingkat lanjut.',
          'menyimpan revisi draf pertanyaan.'
        ];
        const randomComment = comments[Math.floor(Math.random() * comments.length)];
        
        setEvents(prev => [
          {
            id: `event_${Date.now()}`,
            time: timestamp,
            text: randomComment,
            user: randomName,
            avatarColor: randomName === 'Siti Rahma' ? 'bg-emerald-600' : randomName === 'Budi Santoso' ? 'bg-amber-600' : 'bg-sky-600'
          },
          ...prev.slice(0, 5) // Keep last 6 events
        ]);
        
        // Update peer status label
        setPeers(prev => prev.map(p => 
          p.name === randomName 
            ? { ...p, status: randomComment.substring(0, 20) + (randomComment.length > 20 ? '...' : '') }
            : p
        ));
      },
      () => {
        // Occasionally propose a bot suggestion question based on popular subjects
        const generatorOptions = [
          {
            user: 'Budi Santoso',
            question: {
              id: `sug_q_${Date.now()}_3`,
              type: QuestionType.SHORT_ANSWER,
              questionText: 'Apakah nama protokol transfer data yang terenkripsi dan aman di web browser?',
              correctAnswer: 'https',
              points: 20
            }
          },
          {
            user: 'Siti Rahma',
            question: {
              id: `sug_q_${Date.now()}_4`,
              type: QuestionType.ESSAY_CASE,
              caseStudyText: '## ANALISIS SISTEM INFORMASI\nSebuah start-up e-commerce sering mengalami "crash" sistem data pada momentum kampanye tanggal kembar (seperti 12.12). Server database MySQL mereka kehabisan memori buffer.',
              questionText: 'Berikan solusi infrastruktur yang ringkas untuk mengatasi lonjakan trafik tersebut tanpa mengandalkan server terpusat!',
              correctAnswer: 'Mengimplementasikan Load Balancer dengan fitur auto-scaling, mengaktifkan Redis untuk caching query berulang, serta memproses antrean order secara asinkron menggunakan message broker seperti RabbitMQ.',
              points: 50
            }
          }
        ];

        // Only inject if suggestions count is less than 4
        setSuggestions(prev => {
          if (prev.length < 4) {
            const nextSug = generatorOptions[Math.floor(Math.random() * generatorOptions.length)];
            return [...prev, { ...nextSug, id: `sug_${Date.now()}` }];
          }
          return prev;
        });
      }
    ];

    const interval = setInterval(() => {
      const action = peerActions[Math.floor(Math.random() * peerActions.length)];
      action();
    }, 11000);

    return () => clearInterval(interval);
  }, []);

  // Save changes to current selected question (or create a new one)
  const handleSaveQuestionForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!qText.trim()) {
      setErrorMsg('Teks pertanyaan utama tidak boleh kosong.');
      return;
    }

    let compiledCorrectAnswer = '';
    let options: string[] | undefined = undefined;
    let caseStudyText: string | undefined = undefined;

    if (qType === QuestionType.MULTIPLE_CHOICE) {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        setErrorMsg('Harap lengkapi semua 4 pilihan opsi (A, B, C, D) untuk Pilihan Ganda.');
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
        setErrorMsg('Harap tentukan kata kunci jawaban yang benar.');
        return;
      }
      compiledCorrectAnswer = saCorrect.trim().toLowerCase();
    } else if (qType === QuestionType.ESSAY_CASE) {
      if (!essayCaseContent.trim()) {
        setErrorMsg('Studi kasus wajib memiliki materi cerita pengantar.');
        return;
      }
      caseStudyText = essayCaseContent.trim();
      compiledCorrectAnswer = essayCorrect.trim() || 'Pembahasan orisinal dari peserta kelompok.';
    }

    const updatedQuestion: Question = {
      id: selectedQuestionIndex !== null && questions[selectedQuestionIndex] 
        ? questions[selectedQuestionIndex].id 
        : `custom_q_${Date.now()}`,
      type: qType,
      questionText: qText.trim(),
      options,
      correctAnswer: compiledCorrectAnswer,
      caseStudyText,
      points: qType === QuestionType.ESSAY_CASE ? 50 : 20
    };

    if (selectedQuestionIndex !== null) {
      // Editing Mode
      const updatedList = [...questions];
      updatedList[selectedQuestionIndex] = updatedQuestion;
      setQuestions(updatedList);
      setSuccessMsg(`Berhasil memperbarui Soal Nomor ${selectedQuestionIndex + 1}!`);
    } else {
      // Adding Mode
      setQuestions((prev) => [...prev, updatedQuestion]);
      setSelectedQuestionIndex(questions.length); // auto-select the newly added question
      setSuccessMsg('Sukses menambahkan soal baru ke daftar kuis bersama!');
    }
  };

  // Remove a question
  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Kuis harus memiliki minimal 1 soal. Anda tidak bisa menghapus seluruh soal.');
      return;
    }
    
    if (window.confirm(`Yakin ingin menghapus Soal Nomor ${idx + 1}?`)) {
      const filtered = questions.filter((_, i) => i !== idx);
      setQuestions(filtered);
      
      // select previous or first
      if (selectedQuestionIndex !== null) {
        if (selectedQuestionIndex >= filtered.length) {
          setSelectedQuestionIndex(filtered.length - 1);
        } else if (selectedQuestionIndex === idx) {
          setSelectedQuestionIndex(0);
        }
      }
      setSuccessMsg('Soal berhasil dihapus.');
    }
  };

  // Trigger loading a mock peer suggestion directly into the list
  const handleAcceptSuggestion = (sug: SuggestedQuestion) => {
    const freshQuestion = {
      ...sug.question,
      id: `accepted_q_${Date.now()}`
    };

    setQuestions(prev => [...prev, freshQuestion]);
    
    // Remote from suggestion list
    setSuggestions(prev => prev.filter(s => s.id !== sug.id));
    
    // Add edit feed log
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setEvents(prev => [
      {
        id: `event_${Date.now()}`,
        time: timestamp,
        text: `berhasil mengusulkan Soal #${questions.length + 1} dan disetujui untuk ditambahkan ke kuis!`,
        user: sug.user,
        avatarColor: sug.user === 'Siti Rahma' ? 'bg-emerald-600' : 'bg-sky-600'
      },
      ...prev
    ]);

    // Select the newly added question
    setSelectedQuestionIndex(questions.length);
    setSuccessMsg(`Soal usulan dari ${sug.user} berhasil diimpor!`);
  };

  // Save the entire quiz package modifications
  const handleFinalPublish = () => {
    if (!quizTitle.trim()) {
      alert('Judul kuis tidak boleh kosong.');
      return;
    }

    const duration = parseInt(quizDuration);
    if (isNaN(duration) || duration < 1 || duration > 300) {
      alert('Durasi waktu ujian harus berkisar antara 1 s/d 300 menit.');
      return;
    }

    if (questions.length === 0) {
      alert('Anda harus memiliki minimal 1 pertanyaan aktif.');
      return;
    }

    const finalizedQuiz: Quiz = {
      ...quiz,
      title: quizTitle.trim(),
      description: quizDesc.trim() || 'Hasil suntingan kolaboratif kelompok.',
      durationMinutes: duration,
      questions: questions,
      createdAt: new Date().toISOString() // refresh timestamp
    };

    onSaveQuiz(finalizedQuiz);
    alert(`Sukses memperbarui "${finalizedQuiz.title}" secara sinkron bagi seluruh anggota grup!`);
    onCancel();
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans select-text pb-10">
      
      {/* 1. Collaboration Header Panel */}
      <div className="bg-white border-b border-natural-border sticky top-0 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="text-xs font-bold text-natural-text-muted hover:text-natural-accent border border-natural-border-dark rounded-lg px-2.5 py-1.5 hover:bg-[#FFF5ED] transition-all cursor-pointer flex items-center gap-1"
              id="back_to_dashboard_collab"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
            <div className="h-6 w-px bg-natural-border-dark"></div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black uppercase bg-natural-primary text-white px-2 py-0.5 rounded">
                  RUANG EDIT BERSAMA ({groupCode})
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-natural-text-dark line-clamp-1 mt-0.5">
                Kolaborasi: {quizTitle || quiz.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Live Peer Overviews */}
            <div className="flex items-center -space-x-1.5 bg-natural-surface border border-natural-border-dark rounded-lg p-1 px-2">
              <Users className="w-3.5 h-3.5 text-natural-primary mr-1 bg-white p-0.5 rounded" />
              {peers.map((peer, pIdx) => (
                <div 
                  key={peer.name} 
                  className={`w-5 h-5 rounded-full text-[9px] font-mono font-black text-white flex items-center justify-center cursor-help shadow-xs ${
                    pIdx === 0 ? 'bg-emerald-600' : pIdx === 1 ? 'bg-amber-600' : 'bg-sky-600'
                  }`}
                  title={`${peer.name} - ${peer.status}`}
                >
                  {peer.name[0]}
                </div>
              ))}
              <span className="text-[9px] font-mono font-bold text-natural-text-dark pl-2">
                +{peers.length} Teman Kelompok Aktif
              </span>
            </div>

            {/* Final Save Button */}
            <button
              onClick={handleFinalPublish}
              className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              id="publish_collaborative_quiz_btn"
            >
              <Save className="w-4 h-4" />
              Simpan & Terapkan
            </button>
          </div>

        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: LEFT SIDEBAR - QUESTIONS LISTS (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          <div className="bg-white rounded-2xl border border-natural-border p-4 shadow-xs">
            <div className="border-b border-natural-surface pb-3 mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider">
                  Struktur Paket ({questions.length} Soal)
                </h4>
                <p className="text-[10px] text-natural-text-muted mt-0.5">Urutan soal aktif dalam paket</p>
              </div>

              <button
                onClick={() => setSelectedQuestionIndex(null)}
                className="p-1.5 bg-[#FFF5ED] hover:bg-natural-accent hover:text-white border border-natural-border-dark text-natural-accent rounded-lg transition-all cursor-pointer"
                title="Tambah Soal Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Simple scrollable list */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar">
              {questions.map((q, idx) => {
                const isSelected = selectedQuestionIndex === idx;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-natural-surface border-natural-primary ring-1 ring-natural-primary' 
                        : 'bg-white border-natural-border hover:bg-natural-surface/40'
                    }`}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <span className={`w-5 h-5 rounded text-[10px] font-mono font-black flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-[#5A5A40] border-[#5A5A40] text-white' 
                          : 'bg-natural-surface border-natural-border-dark text-[#5A5A40]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-[9px] font-mono font-bold uppercase block text-natural-accent mb-0.5">
                          {q.type === QuestionType.MULTIPLE_CHOICE && 'Pilihan Ganda'}
                          {q.type === QuestionType.TRUE_FALSE && 'Benar / Salah'}
                          {q.type === QuestionType.SHORT_ANSWER && 'Isian Singkat'}
                          {q.type === QuestionType.ESSAY_CASE && 'Essay Kasus'}
                        </span>
                        <p className="text-xs text-natural-text-dark font-medium truncate">
                          {q.questionText}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className="text-natural-text-muted hover:text-natural-accent p-1 rounded-md hover:bg-natural-surface transition-colors cursor-pointer"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-natural-surface text-[10px] text-natural-text-muted leading-relaxed">
              💡 Klik soal di atas untuk mengedit teks pertanyaan, opsi jawaban, jenis soal, atau kunci jawaban secara terperinci.
            </div>
          </div>

          {/* Quick Quiz Meta Configuration Block */}
          <div className="bg-white rounded-2xl border border-natural-border p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider border-b border-natural-surface pb-2">
              Konfigurasi Umum Paket
            </h4>
            
            <div>
              <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Judul Ujian Utama</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Masukkan Judul..."
                className="w-full px-2.5 py-1.5 border border-natural-border-dark rounded-lg text-xs bg-natural-surface/20 text-natural-text-dark focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-natural-text-dark mb-1 font-sans">Deskripsi Ringkas</label>
              <textarea
                value={quizDesc}
                onChange={(e) => setQuizDesc(e.target.value)}
                placeholder="Petunjuk paket kuis..."
                rows={2}
                className="w-full px-2.5 py-1.5 border border-natural-border-dark rounded-lg text-xs bg-natural-surface/20 text-natural-text-dark focus:bg-white focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Durasi Pengerjaan (Menit)</label>
              <input
                type="number"
                value={quizDuration}
                onChange={(e) => setQuizDuration(e.target.value)}
                min={1}
                max={300}
                className="w-full px-2.5 py-1.5 border border-natural-border-dark rounded-lg text-xs bg-natural-surface/20 text-natural-text-dark focus:bg-white focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* COLUMN 2: CENTER WORKSPACE - DETAILED EDIT FORM (Span 5) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-natural-border p-5 sm:p-6 shadow-xs select-text">
            
            <div className="flex border-b border-natural-surface pb-3 mb-5 justify-between items-center">
              <div>
                <span className="inline-block text-[10px] font-bold tracking-wider text-natural-accent uppercase font-mono">
                  {selectedQuestionIndex !== null ? 'SUNTING SOAL AKTIF' : 'TAMBAHKAN SOAL BARU'}
                </span>
                <h3 className="text-sm font-extrabold text-[#5A5A40]">
                  {selectedQuestionIndex !== null ? `Mendetailkan Soal #${selectedQuestionIndex + 1}` : 'Mengonstruksi Lembar Soal Draf Baru'}
                </h3>
              </div>

              {selectedQuestionIndex !== null && (
                <button
                  onClick={() => setSelectedQuestionIndex(null)}
                  className="px-2.5 py-1 text-[10px] font-bold text-natural-primary border border-natural-border bg-natural-surface rounded hover:bg-natural-surface-dark cursor-pointer transition-all"
                >
                  Beralih Buat Baru
                </button>
              )}
            </div>

            {/* Error and Success Alerters */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-[#FFF6F0] text-[#9E5321] text-xs border border-[#FFE3D1] rounded-xl flex items-center gap-2 mb-4"
                >
                  <AlertTriangle className="w-4 h-4 text-natural-accent shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-emerald-50 text-emerald-950 text-xs border border-emerald-100 rounded-xl flex items-center gap-2 mb-4"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSaveQuestionForm} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Tipe Soal</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="block w-full px-2.5 py-2.5 bg-white border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary font-bold"
                  >
                    <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda (4 Opsi)</option>
                    <option value={QuestionType.TRUE_FALSE}>Benar / Salah (True/False)</option>
                    <option value={QuestionType.SHORT_ANSWER}>Isian Singkat (Auto-grade)</option>
                    <option value={QuestionType.ESSAY_CASE}>Essay Studi Kasus (Split-Screen)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Teks Pertanyaan Utama</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Berapa hasil perkalian 12 x 12?"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary"
                  />
                </div>
              </div>

              {/* DYNAMIC FORM SEGMENTS */}
              <div className="pt-2 border-t border-natural-surface">
                
                {/* A. MULTIPLE CHOICE CONFIG */}
                {qType === QuestionType.MULTIPLE_CHOICE && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono font-bold text-natural-text-muted uppercase tracking-wider mb-2">Konfigurasi Opsi PG</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Opsi A</label>
                        <input
                          type="text"
                          required
                          placeholder="Jawaban untuk A..."
                          value={optA}
                          onChange={(e) => setOptA(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Opsi B</label>
                        <input
                          type="text"
                          required
                          placeholder="Jawaban untuk B..."
                          value={optB}
                          onChange={(e) => setOptB(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Opsi C</label>
                        <input
                          type="text"
                          required
                          placeholder="Jawaban untuk C..."
                          value={optC}
                          onChange={(e) => setOptC(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Opsi D</label>
                        <input
                          type="text"
                          required
                          placeholder="Jawaban untuk D..."
                          value={optD}
                          onChange={(e) => setOptD(e.target.value)}
                          className="block w-full px-3 py-2 border border-natural-border rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-3 bg-natural-surface p-3 rounded-xl border border-natural-border">
                      <label className="block text-[10px] font-bold text-natural-text-dark mb-1.5 uppercase font-mono tracking-wide">Pilihan Kunci Jawaban Benar</label>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {['A', 'B', 'C', 'D'].map((letter) => (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => setMcCorrect(letter)}
                            className={`py-2 font-black rounded-lg border cursor-pointer transition-all ${
                              mcCorrect === letter
                                ? 'bg-natural-primary border-natural-primary text-white font-extrabold shadow-sm'
                                : 'bg-white border-natural-border-dark text-natural-text-dark hover:bg-natural-surface/50'
                            }`}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* B. TRUE / FALSE CONFIG */}
                {qType === QuestionType.TRUE_FALSE && (
                  <div className="space-y-2 p-4 bg-natural-surface/60 rounded-xl border border-natural-border text-center">
                    <label className="block text-[10px] font-black tracking-wider uppercase text-natural-text-dark mb-2">Tentukan Kunci Kebenaran Soal</label>
                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() => setTfCorrect('TRUE')}
                        className={`py-3 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          tfCorrect === 'TRUE'
                            ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-xs'
                            : 'bg-white border-natural-border text-natural-text-muted hover:bg-natural-surface/40'
                        }`}
                      >
                        Benar (True)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTfCorrect('FALSE')}
                        className={`py-3 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          tfCorrect === 'FALSE'
                            ? 'bg-natural-accent text-white border-natural-accent font-extrabold shadow-xs'
                            : 'bg-white border-natural-border text-natural-text-muted hover:bg-natural-surface/40'
                        }`}
                      >
                        Salah (False)
                      </button>
                    </div>
                  </div>
                )}

                {/* C. SHORT ANSWER CONFIG */}
                {qType === QuestionType.SHORT_ANSWER && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Kata Kunci Pembahasan Benar (Huruf Kecil Semua)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 'indonesia', '500', 'surabaya'"
                      value={saCorrect}
                      onChange={(e) => setSaCorrect(e.target.value)}
                      className="block w-full px-3 py-2 border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary font-mono"
                    />
                    <p className="text-[10px] text-natural-text-muted italic leading-relaxed pl-1">
                      * Sistem pencocokan otomatis akan membandingkan entri input peserta dalam format huruf kecil tanpa spasi berlebih.
                    </p>
                  </div>
                )}

                {/* D. ESSAY CASE STUDY CONFIG */}
                {qType === QuestionType.ESSAY_CASE && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Materi Pendahuluan Studi Kasus (Markdown diperbolehkan)</label>
                      <textarea
                        required
                        placeholder="Tuliskan latar belakang masalah studi kasus di sini. Gunakan ## untuk sub judul atau - untuk daftar poin."
                        value={essayCaseContent}
                        onChange={(e) => setEssayCaseContent(e.target.value)}
                        rows={6}
                        className="block w-full px-3 py-2 border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary resize-y font-sans leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-natural-text-dark mb-1">Draf Solusi Ideal / Kunci Jawaban Acuan</label>
                      <textarea
                        required
                        placeholder="Contoh solusi ideal: 1) Strategi pemindahan logistik..., 2)..."
                        value={essayCorrect}
                        onChange={(e) => setEssayCorrect(e.target.value)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-natural-border-dark rounded-xl text-xs text-natural-text-dark focus:outline-none focus:ring-1 focus:ring-natural-primary resize-y font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Form Action Controls */}
              <div className="pt-4 border-t border-natural-surface flex items-center justify-between gap-3">
                <p className="text-[10px] text-natural-text-muted leading-relaxed max-w-[50%]">
                  Setelah klik "Simpan Soal", daftar di kolom sebelah kiri akan terupdate otomatis.
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Soal
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* COLUMN 3: RIGHT PANEL - LIVE FEED & BOT SUGGESTIONS (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. Live Peer Suggestions Box */}
          <div className="bg-white rounded-2xl border border-natural-border p-4 shadow-xs">
            <div className="border-b border-natural-surface pb-3 mb-3 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-natural-accent animate-pulse" />
              <div>
                <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider">
                  Usulan Soal dari Teman ({suggestions.length})
                </h4>
                <p className="text-[9.5px] text-natural-text-muted">Rekomendasi dari Siti, Budi, & Andi</p>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {suggestions.length === 0 ? (
                <div className="p-6 text-center text-natural-text-muted text-xs italic font-serif">
                  Belum ada draf baru yang diusulkan. Teman kelompok Anda sedang menyusun ide...
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((sug) => (
                    <motion.div
                      key={sug.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 bg-natural-surface/40 border border-natural-border rounded-xl text-xs space-y-2"
                    >
                      <div className="flex justify-between items-center bg-white/75 border border-natural-border rounded-lg p-1.5 px-2">
                        <span className="text-[9.5px] font-bold text-natural-primary flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-natural-accent" />
                          Ide: {sug.user}
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-[#FFF5ED] text-natural-accent border border-natural-border-dark px-1.5 rounded uppercase">
                          {sug.question.type === QuestionType.MULTIPLE_CHOICE && 'PG'}
                          {sug.question.type === QuestionType.TRUE_FALSE && 'B/S'}
                          {sug.question.type === QuestionType.SHORT_ANSWER && 'Isian'}
                          {sug.question.type === QuestionType.ESSAY_CASE && 'Essay'}
                        </span>
                      </div>

                      <p className="text-natural-text-dark font-semibold leading-relaxed text-xs">
                        "{sug.question.questionText}"
                      </p>

                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-[9.5px] text-natural-text-muted italic leading-none font-serif">
                          Jawaban: {sug.question.correctAnswer.toUpperCase()}
                        </span>
                        
                        <button
                          onClick={() => handleAcceptSuggestion(sug)}
                          className="px-2.5 py-1 bg-white border border-natural-border hover:bg-natural-primary hover:text-white rounded-lg text-[10px] font-bold text-natural-primary cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          Tinjau & Impor
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* B. Live Activity Event Logs Stream */}
          <div className="bg-white rounded-2xl border border-natural-border p-4 shadow-xs flex-1 flex flex-col">
            <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider border-b border-natural-surface pb-3 mb-3 flex items-center justify-between">
              <span>Aktivitas Kolaborasi Stream</span>
              <RefreshCw className="w-3.5 h-3.5 text-natural-text-muted animate-spin" />
            </h4>

            {/* Event list */}
            <div className="space-y-2.5 flex-1 max-h-[350px] overflow-y-auto custom-scrollbar pr-0.5">
              {events.map((evt) => (
                <div key={evt.id} className="text-xs flex items-start gap-2.5 bg-natural-surface/20 hover:bg-natural-surface/50 p-2 rounded-xl border border-transparent hover:border-natural-border/40 transition-all select-text">
                  <div className={`w-6 h-6 rounded-full text-[9px] font-mono font-extrabold text-white flex items-center justify-center shrink-0 shadow-3xs ${evt.avatarColor}`}>
                    {evt.user[0]}
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-natural-text-dark text-[11px] leading-tight font-sans">
                        {evt.user}
                      </span>
                      <span className="text-[8px] font-mono text-natural-text-muted shrink-0">
                        {evt.time}
                      </span>
                    </div>
                    <p className="text-natural-text-muted text-[10.5px] leading-relaxed mt-0.5">
                      {evt.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-natural-surface bg-natural-surface/40 p-2.5 rounded-xl border border-natural-border text-[9.5px] text-natural-text-muted leading-relaxed font-sans text-center">
              🛡️ Semua draf edit disinkronkan secara aman di local storage kelompok. Klik <strong>Simpan & Terapkan</strong> untuk merilis versi final!
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
