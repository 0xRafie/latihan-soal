/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, LogOut, User, Users } from 'lucide-react';

interface NavbarProps {
  username: string;
  groupCode: string;
  onLogout: () => void;
  onNavigateToHome: () => void;
}

export default function Navbar({ username, groupCode, onLogout, onNavigateToHome }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-natural-border backdrop-blur-md bg-white/95 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div 
            onClick={onNavigateToHome} 
            className="flex items-center gap-2.5 cursor-pointer group active:scale-98 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-natural-primary flex items-center justify-center text-white shadow-md group-hover:bg-natural-primary-hover transition-all font-bold text-lg">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold text-natural-text-dark tracking-tight leading-tight">LatihSoal</h1>
              <p className="text-[10px] text-natural-text-muted uppercase tracking-wider font-semibold">Latihan Soal Kolaboratif</p>
            </div>
          </div>

          {/* User Profile Dashboard Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-natural-text-muted flex items-center gap-1 justify-end">
                <Users className="w-3.5 h-3.5 text-natural-text-muted/70" />
                Grup: <span className="text-natural-accent font-bold uppercase">{groupCode}</span>
              </span>
            </div>

            <div className="h-4 w-px bg-natural-border hidden sm:block"></div>

            <div className="flex items-center gap-2 bg-natural-surface border border-natural-border-dark rounded-full py-1 pl-3 pr-1 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white border border-natural-border-dark flex items-center justify-center text-natural-text-dark">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-natural-text-dark pr-1.5 max-w-[120px] truncate">{username}</span>
              </div>
              
              <button
                onClick={onLogout}
                title="Keluar Akun"
                className="w-7 h-7 rounded-full text-natural-text-muted hover:text-natural-accent hover:bg-white/85 flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-natural-border"
                id="logout_btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
