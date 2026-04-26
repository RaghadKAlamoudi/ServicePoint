import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ADMIN_EMAILS } from '../constants';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthPageProps {
  onLogin: (user: User) => void;
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  t: (key: any) => string;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, language, onLanguageChange, t }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = result.user;
        
        let userDoc;
        try {
          userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data() as User;
          const isAuthorizedAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
          
          let finalUserData = { ...userData };

          // Auto-upgrade to admin if authorized but currently customer
          if (isAuthorizedAdmin && userData.role !== 'admin') {
            finalUserData.role = 'admin';
            try {
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
            } catch (err) {
              console.error("Failed to upgrade user to admin in AuthPage:", err);
            }
          }

          if (finalUserData.role !== role && !isAuthorizedAdmin) {
            await auth.signOut();
            setError(`This account is not registered as a ${role}.`);
            setLoading(false);
            return;
          }
          onLogin(finalUserData);
        } else {
          // Auto-create profile for hardcoded admins if missing
          if (role === 'admin' && ADMIN_EMAILS.includes(firebaseUser.email || '')) {
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Admin User',
              email: firebaseUser.email!,
              role: 'admin'
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                walletBalance: 0
              });
              onLogin(newUser);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
            }
          } else {
            setError('User profile not found.');
            await auth.signOut();
          }
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = result.user;
        
        const newUser: User = {
          id: firebaseUser.uid,
          name: formData.name || (role === 'admin' ? 'Admin User' : 'Valued Client'),
          email: formData.email,
          role: role
        };

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            walletBalance: role === 'admin' ? 0 : 250.00
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }
        
        onLogin(newUser);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase. Please enable it in the Firebase Console.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    if (!login) {
      setRole('customer'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full -mr-64 -mt-64 blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full -ml-48 -mb-48 blur-3xl opacity-50"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-100 mb-6 transform hover:rotate-12 transition-transform duration-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex justify-center mb-4">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => onLanguageChange('ar')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${language === 'ar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                AR
              </button>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tighter leading-none">ServicePoint</h1>
          <p className="text-gray-500 mt-1 font-medium text-xs leading-none">
            {isLogin ? t('login') : t('getStarted')}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex bg-gray-50/50 p-2 border-b border-gray-100">
            <button 
              disabled={loading}
              onClick={() => handleModeSwitch(true)}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Sign In
            </button>
            <button 
              disabled={loading}
              onClick={() => handleModeSwitch(false)}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Create Account
            </button>
          </div>

          <div className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-2 p-1.5 bg-gray-100 rounded-xl mb-2">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${role === 'customer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Customer
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Admin
                </button>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Your Full Name</label>
                  <input 
                    required 
                    type="text" 
                    disabled={loading}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-black font-bold"
                    placeholder="e.g. Tala Ahmed"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  disabled={loading}
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-black font-bold"
                  placeholder="Tala.Ahmed@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                </div>
                <input 
                  required 
                  type="password" 
                  disabled={loading}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-black font-bold"
                  placeholder="Choose a strong password"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create My Account'
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-10 text-center space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              disabled={loading}
              onClick={() => handleModeSwitch(!isLogin)}
              className="ml-2 text-indigo-600 hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          
          {isLogin && role === 'admin' && (
            <div className="text-[10px] text-gray-300 font-medium italic">
              <p>Note: Admin accounts must be pre-authorized in the database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
