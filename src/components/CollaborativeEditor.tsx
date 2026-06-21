/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Quiz, Question, QuestionSuggestion, QuestionType } from '../types';
import {
  fetchQuestionSuggestions,
  submitQuestionSuggestion,
  subscribeToQuestionSuggestions,
  updateQuestionSuggestionStatus,
} from '../lib/sharedData';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface CollaborativeEditorProps {
  quiz: Quiz;
  username: string;
  groupCode: string;
  onSaveQuiz: (updatedQuiz: Quiz) => void | Promise<void>;
  onCancel: () => void;
}

interface CollabEvent {
  id: string;
  time: string;
  text: string;
  user: string;
  avatarColor: string;
}

interface Peer {
  name: string;
  status: string;
  color: string;
}

type PresenceMeta = {
  username?: string;
  status?: string;
  onlineAt?: string;
};

const peerColors = ['bg-emerald-600', 'bg-amber-600', 'bg-sky-600', 'bg-violet-600', 'bg-rose-600'];

const getPeerColor = (name: string) => {
  const total = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return peerColors[total % peerColors.length];
};

export default function CollaborativeEditor({ quiz, username, groupCode, onSaveQuiz, onCancel }: CollaborativeEditorProps) {
  const isCreator = !quiz.createdBy || quiz.createdBy === username;

  // Current active questions list
  const [questions, setQuestions] = useState<Question[]>(() => quiz.questions || []);
  const [pendingSuggestions, setPendingSuggestions] = useState<QuestionSuggestion[]>([]);
  
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
  const [peers, setPeers] = useState<Peer[]>([
    { name: username, status: 'Sedang mengedit', color: getPeerColor(username) }
  ]);

  // Live Activity feed states
  const [events] = useState<CollabEvent[]>([
    {
      id: 'e1',
      time: 'Baru saja',
      text: 'membuka ruang sunting kuis.',
      user: username,
      avatarColor: 'bg-emerald-600'
    }
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadSuggestions = async () => {
      try {
        const suggestions = await fetchQuestionSuggestions(groupCode, quiz.id);
        if (isMounted && suggestions) {
          setPendingSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Gagal memuat usulan soal:', error);
      }
    };

    void loadSuggestions();
    const unsubscribe = subscribeToQuestionSuggestions(groupCode, quiz.id, loadSuggestions);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [groupCode, quiz.id]);

  useEffect(() => {
    if (!supabase) {
      setPeers([{ name: username, status: 'Sedang mengedit', color: getPeerColor(username) }]);
      return;
    }

    const channel = supabase.channel(`latihsoal:presence:${groupCode}:${quiz.id}`, {
      config: {
        presence: {
          key: username,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState() as Record<string, PresenceMeta[]>;
        const activePeers = Object.values(presenceState)
          .flat()
          .reduce<Peer[]>((list, meta) => {
            const name = meta.username || username;
            if (!list.some((peer) => peer.name === name)) {
              list.push({
                name,
                status: meta.status || 'Sedang mengedit',
                color: getPeerColor(name),
              });
            }
            return list;
          }, []);

        setPeers(activePeers.length > 0 ? activePeers : [{ name: username, status: 'Sedang mengedit', color: getPeerColor(username) }]);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            username,
            status: 'Sedang mengedit',
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupCode, quiz.id, username]);

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

  // Save changes to current selected question (or create a new one)
  const handleSaveQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isCreator && selectedQuestionIndex !== null) {
      setErrorMsg('Hanya pembuat paket yang bisa mengubah soal aktif. Pilih "Beralih Buat Baru" untuk mengirim usulan soal.');
      return;
    }

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
      points: qType === QuestionType.ESSAY_CASE ? 50 : 20,
      createdBy: selectedQuestionIndex !== null && questions[selectedQuestionIndex]
        ? questions[selectedQuestionIndex].createdBy || username
        : username
    };

    if (selectedQuestionIndex !== null) {
      // Editing Mode
      const updatedList = [...questions];
      updatedList[selectedQuestionIndex] = updatedQuestion;
      setQuestions(updatedList);
      setSuccessMsg(`Berhasil memperbarui Soal Nomor ${selectedQuestionIndex + 1}!`);
    } else {
      // Adding Mode
      if (!isCreator) {
        try {
          await submitQuestionSuggestion(groupCode, quiz.id, username, updatedQuestion);
          setSuccessMsg('Usulan soal terkirim ke pembuat paket untuk ditinjau dan diimpor.');
          setSelectedQuestionIndex(null);
        } catch (error) {
          console.error('Gagal mengirim usulan soal:', error);
          setErrorMsg('Gagal mengirim usulan soal. Coba lagi beberapa saat.');
        }
        return;
      }

      setQuestions((prev) => [...prev, updatedQuestion]);
      setSelectedQuestionIndex(questions.length); // auto-select the newly added question
      setSuccessMsg('Sukses menambahkan soal baru ke daftar kuis bersama!');
    }
  };

  // Remove a question
  const handleDeleteQuestion = (idx: number) => {
    if (!isCreator) {
      setErrorMsg('Hanya pembuat paket yang bisa menghapus soal aktif.');
      return;
    }

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

  const buildFinalizedQuiz = (nextQuestions: Question[]): Quiz => ({
    ...quiz,
    title: quizTitle.trim(),
    description: quizDesc.trim() || 'Hasil suntingan kolaboratif kelompok.',
    durationMinutes: parseInt(quizDuration) || quiz.durationMinutes,
    questions: nextQuestions,
    createdAt: new Date().toISOString()
  });

  const handleImportSuggestion = async (suggestion: QuestionSuggestion) => {
    if (!isCreator) return;

    const importedQuestion: Question = {
      ...suggestion.question,
      id: `suggested_q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdBy: suggestion.suggestedBy
    };
    const nextQuestions = [...questions, importedQuestion];

    try {
      setQuestions(nextQuestions);
      await onSaveQuiz(buildFinalizedQuiz(nextQuestions));
      await updateQuestionSuggestionStatus(groupCode, suggestion.id, 'imported', username);
      setPendingSuggestions((prev) => prev.filter((item) => item.id !== suggestion.id));
      setSelectedQuestionIndex(nextQuestions.length - 1);
      setSuccessMsg(`Usulan dari ${suggestion.suggestedBy} berhasil diimpor ke paket.`);
    } catch (error) {
      console.error('Gagal mengimpor usulan soal:', error);
      setQuestions(questions);
      setErrorMsg('Gagal mengimpor usulan soal. Coba lagi beberapa saat.');
    }
  };

  const handleRejectSuggestion = async (suggestion: QuestionSuggestion) => {
    if (!isCreator) return;

    try {
      await updateQuestionSuggestionStatus(groupCode, suggestion.id, 'rejected', username);
      setPendingSuggestions((prev) => prev.filter((item) => item.id !== suggestion.id));
      setSuccessMsg(`Usulan dari ${suggestion.suggestedBy} ditolak.`);
    } catch (error) {
      console.error('Gagal menolak usulan soal:', error);
      setErrorMsg('Gagal menolak usulan soal. Coba lagi beberapa saat.');
    }
  };

  // Save the entire quiz package modifications
  const handleFinalPublish = () => {
    if (!isCreator) {
      alert('Hanya pembuat paket yang bisa menerapkan perubahan final.');
      return;
    }

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

    const finalizedQuiz = buildFinalizedQuiz(questions);

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
                <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                  isCreator ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isCreator ? 'Pembuat Paket' : 'Kontributor'}
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
              {peers.map((peer) => (
                <div 
                  key={peer.name} 
                  className={`w-5 h-5 rounded-full text-[9px] font-mono font-black text-white flex items-center justify-center cursor-help shadow-xs ${peer.color}`}
                  title={`${peer.name} - ${peer.status}`}
                >
                  {peer.name[0]}
                </div>
              ))}
              <span className="text-[9px] font-mono font-bold text-natural-text-dark pl-2">
                {peers.length} Editor Aktif
              </span>
            </div>

            {/* Final Save Button */}
            <button
              onClick={handleFinalPublish}
              disabled={!isCreator}
              className={`px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                isCreator
                  ? 'bg-natural-primary hover:bg-natural-primary-hover cursor-pointer'
                  : 'bg-natural-border-dark cursor-not-allowed'
              }`}
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
                        <span className="text-[9px] text-natural-text-muted font-medium truncate block mt-0.5">
                          Dibuat oleh: {q.createdBy || quiz.createdBy || 'Pembuat awal'}
                        </span>
                      </div>
                    </div>

                    {isCreator && (
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
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-natural-surface text-[10px] text-natural-text-muted leading-relaxed">
              {isCreator
                ? '💡 Klik soal di atas untuk mengedit. Usulan dari teman bisa diimpor lewat panel kanan.'
                : '💡 Kamu bisa melihat soal aktif, tetapi penambahan soal baru akan masuk ke antrean tinjauan pembuat paket.'}
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
                  {selectedQuestionIndex !== null
                    ? `Mendetailkan Soal #${selectedQuestionIndex + 1}`
                    : isCreator
                      ? 'Mengonstruksi Lembar Soal Draf Baru'
                      : 'Mengirim Usulan Soal untuk Ditinjau'}
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
                  {isCreator
                    ? 'Setelah klik "Simpan Soal", daftar di kolom sebelah kiri akan terupdate otomatis.'
                    : 'Usulan soal tidak langsung masuk paket. Pembuat paket harus meninjau dan mengimpor dulu.'}
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isCreator || selectedQuestionIndex !== null ? 'Simpan Soal' : 'Kirim Usulan'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* COLUMN 3: RIGHT PANEL - ACTIVITY FEED (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-natural-border p-4 shadow-xs">
            <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider border-b border-natural-surface pb-3 mb-3 flex items-center justify-between">
              <span>Usulan Soal dari Teman</span>
              <MessageSquare className="w-3.5 h-3.5 text-natural-accent" />
            </h4>

            {!isCreator && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-900 leading-relaxed">
                Buat soal baru di form tengah, lalu klik <strong>Kirim Usulan</strong>. Usulanmu akan menunggu tinjauan pembuat paket.
              </div>
            )}

            {pendingSuggestions.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-natural-text-muted bg-natural-surface/30 rounded-xl border border-natural-border">
                Belum ada usulan soal yang menunggu tinjauan.
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {pendingSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 rounded-xl border border-natural-border bg-natural-surface/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-mono font-black uppercase text-natural-accent">
                          {suggestion.question.type}
                        </span>
                        <p className="text-xs font-bold text-natural-text-dark leading-snug mt-0.5">
                          {suggestion.question.questionText}
                        </p>
                        <p className="text-[10px] text-natural-text-muted mt-1">
                          Diusulkan oleh: <strong>{suggestion.suggestedBy}</strong>
                        </p>
                      </div>
                    </div>

                    {isCreator && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => void handleImportSuggestion(suggestion)}
                          className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Impor
                        </button>
                        <button
                          onClick={() => void handleRejectSuggestion(suggestion)}
                          className="flex-1 px-3 py-1.5 bg-white hover:bg-[#FFF5ED] text-natural-accent border border-natural-border-dark rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-natural-border p-4 shadow-xs flex-1 flex flex-col">
            <h4 className="text-xs font-mono font-bold text-natural-text-dark uppercase tracking-wider border-b border-natural-surface pb-3 mb-3 flex items-center justify-between">
              <span>Log Aktivitas Editor</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
