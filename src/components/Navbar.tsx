import React from 'react';
import { AppSection, UserRole, User } from '../types';

interface NavbarProps {
  currentSection: AppSection;
  setSection: (section: AppSection) => void;
  cartCount: number;
  role: UserRole;
  user: User | null;
  walletBalance: number;
  onLogout: () => void;
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  t: (key: any) => string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentSection, setSection, cartCount, role, user, walletBalance, onLogout, language, onLanguageChange, t 
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 px-6 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setSection(role === 'admin' ? AppSection.ADMIN : AppSection.BROWSE)}
        >
          <div className="bg-brand text-white p-2.5 rounded-2xl shadow-lg shadow-brand/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-brand transition-colors duration-300">
            Service<span className="text-brand">Point</span>
          </span>
        </div>

        <div className="flex items-center gap-5 sm:gap-10">
          <div className="hidden sm:flex items-center bg-slate-50 p-1.5 rounded-[1.25rem] border border-slate-100/50">
            <button 
              onClick={() => onLanguageChange('en')}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${language === 'en' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              EN
            </button>
            <button 
              onClick={() => onLanguageChange('ar')}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${language === 'ar' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              AR
            </button>
          </div>

          {role === 'customer' ? (
            <div className="hidden md:flex items-center gap-10">
              <button 
                onClick={() => setSection(AppSection.BROWSE)}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative group/link ${currentSection === AppSection.BROWSE ? 'text-brand' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {t('services')}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand transition-all duration-300 ${currentSection === AppSection.BROWSE ? 'w-full' : 'w-0 group-hover/link:w-2/3'}`}></span>
              </button>
              <button 
                onClick={() => setSection(AppSection.MY_BOOKINGS)}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative group/link ${currentSection === AppSection.MY_BOOKINGS ? 'text-brand' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {t('myBookings')}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand transition-all duration-300 ${currentSection === AppSection.MY_BOOKINGS ? 'w-full' : 'w-0 group-hover/link:w-2/3'}`}></span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-10">
              <button 
                onClick={() => setSection(AppSection.ADMIN)}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative group/link ${currentSection === AppSection.ADMIN ? 'text-brand' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {t('admin')}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand transition-all duration-300 ${currentSection === AppSection.ADMIN ? 'w-full' : 'w-0 group-hover/link:w-2/3'}`}></span>
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-slate-200/60"></div>

          <div className="flex items-center gap-4 sm:gap-6">
            {role === 'customer' && (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('balance')}</span>
                  <span className="text-sm font-black text-slate-900 tracking-tight leading-none">{walletBalance.toFixed(2)} <span className="text-[10px] text-slate-400">{t('sar')}</span></span>
                </div>
                <button 
                  onClick={() => setSection(AppSection.CART)}
                  className="relative p-3 bg-white rounded-2xl text-slate-400 hover:text-brand hover:bg-slate-50 transition-all duration-300 border border-slate-100/80 group/cart"
                >
                  <svg className="w-5 h-5 group-hover/cart:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white ring-4 ring-white shadow-lg shadow-brand/20 animate-in zoom-in duration-500">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-5 pl-2">
              <button 
                onClick={() => setSection(AppSection.PROFILE)}
                className={`text-right hidden md:block group/profile transition-all duration-300`}
              >
                <p className="text-xs font-black text-slate-900 leading-tight group-hover/profile:text-brand transition-colors">{user?.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{role === 'admin' ? t('admin') : t('profile')}</p>
              </button>
              
              <button 
                onClick={onLogout}
                className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-5 sm:h-11 bg-slate-900 hover:bg-brand text-white rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-95 group/logout"
              >
                <span className="hidden sm:inline mr-2">{t('logout')}</span>
                <svg className="w-4 h-4 group-hover/logout:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
