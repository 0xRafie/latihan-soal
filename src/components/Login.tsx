/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Key, User, ShieldAlert } from 'lucide-react';
import { formatGroupCodes, isValidGroupCode, normalizeGroupCode, VALID_GROUP_CODES } from '../lib/groupCodes';

interface LoginProps {
  onLogin: (username: string, groupCode: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedCode = groupCode.trim();

    if (!trimmedUsername) {
      setError('Silakan masukkan nama panggilan Anda.');
      return;
    }
    if (trimmedUsername.length < 2) {
      setError('Nama panggilan minimal terdiri dari 2 karakter.');
      return;
    }
    if (!trimmedCode) {
      setError('Silakan masukkan Kode Akses Grup.');
      return;
    }

    const normalizedCode = normalizeGroupCode(trimmedCode);
    if (!isValidGroupCode(normalizedCode)) {
      setError(`Kode akses grup salah! Gunakan kode akses ${formatGroupCodes()} untuk masuk.`);
      return;
    }

    onLogin(trimmedUsername, normalizedCode);
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-natural-primary text-white natural-shadow-lg mb-4"
        >
          <BookOpen className="w-8 h-8" />
        </motion.div>
        
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-serif font-bold text-natural-text-dark tracking-tight"
        >
          LatihSoal
        </motion.h2>
        
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-sm text-natural-text-muted max-w-xs mx-auto"
        >
          Belajar mandiri & diskusi studi kasus bersama kelompok belajar Anda secara interaktif.
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 natural-shadow rounded-2xl border border-natural-border sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-natural-text-dark mb-1">
                Nama Panggilan
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-natural-text-muted">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Contoh: Andi, Rian, Budi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-natural-border-dark rounded-xl bg-natural-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary text-natural-text-dark text-sm placeholder-natural-text-muted/65 font-medium transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-natural-text-muted">
                Nama ini akan dicatat pada riwayat aktivitas belajar grup.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="groupCode" className="block text-sm font-semibold text-natural-text-dark">
                  Kode Akses Grup
                </label>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-natural-surface text-natural-primary uppercase border border-natural-border">
                  {VALID_GROUP_CODES[0]}
                </span>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-natural-text-muted">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  id="groupCode"
                  name="groupCode"
                  type="text"
                  required
                  placeholder="Masukkan kode akses grup..."
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-natural-border-dark rounded-xl bg-natural-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary text-natural-text-dark text-sm placeholder-natural-text-muted/65 font-medium tracking-wide uppercase transition-all"
                />
              </div>
              <p className="mt-1.5 text-xs text-natural-text-muted leading-relaxed">
                Tanyakan kode akses kepada teman Anda atau ketik {VALID_GROUP_CODES.map((code, index) => (
                  <React.Fragment key={code}>
                    {index > 0 ? ' atau ' : ''}
                    <span className="font-semibold text-natural-accent bg-natural-surface px-1 py-0.2 rounded border border-natural-border">{code}</span>
                  </React.Fragment>
                ))} untuk demo.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-[#FFF6F0] p-3.5 border border-[#FFE3D1] flex items-start gap-2 text-[#9E5321]"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-natural-accent mt-0.5" />
                <span className="text-xs font-medium leading-relaxed">{error}</span>
              </motion.div>
            )}

            <div>
              <button
                type="submit"
                className="w-full h-11 flex justify-center items-center py-2 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-natural-primary hover:bg-natural-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-natural-primary transition-all cursor-pointer hover:shadow-lg active:scale-[0.98]"
              >
                Masuk Sekarang
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-natural-text-muted mt-6 font-mono">
          LatihSoal v1.0.0 • Data grup dapat tersinkron lewat Supabase.
        </p>
      </motion.div>
    </div>
  );
}
