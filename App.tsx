import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { api } from './services/api';
import { User, Loan } from './types';
import { Dashboard } from './pages/Dashboard';
import { CreateLoan } from './pages/CreateLoan';
import { LoanDetail } from './pages/LoanDetail';
import { Profile } from './pages/Profile';
import { translations, Language } from './translations';
import { LogOut, Wallet, ShieldCheck, PieChart, ArrowRight, Globe, Eye, EyeOff, AlertCircle, Loader2, User as UserIcon } from 'lucide-react';

// --- Landing Page ---
const LandingPage = ({ onAuth, lang }: { onAuth: (type: 'in' | 'up') => void, lang: Language }) => {
  const t = translations[lang];
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-aqua-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full py-12 lg:py-20 z-10">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          {t.tagline}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
          {t.sub_tagline}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0 justify-center">
          <button onClick={() => onAuth('up')} className="bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2 w-full sm:w-auto shadow-xl shadow-gray-200/50 transition-all hover:scale-105 active:scale-95">
            {t.start_lending} <ArrowRight size={20}/>
          </button>
          <button onClick={() => onAuth('in')} className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 w-full sm:w-auto hover:border-gray-300 transition-colors">
            {t.sign_in}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-20 text-left w-full">
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-aqua-50 text-aqua-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900">{t.feature_verified}</h3>
            <p className="text-gray-500 leading-relaxed">{t.feature_verified_desc}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <PieChart size={28} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900">{t.feature_tracking}</h3>
            <p className="text-gray-500 leading-relaxed">{t.feature_tracking_desc}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Wallet size={28} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900">{t.feature_impact}</h3>
            <p className="text-gray-500 leading-relaxed">{t.feature_impact_desc}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Auth Page ---
interface AuthProps {
  type: 'in' | 'up';
  onSuccess: (user: User) => void;
  onSwitch: () => void;
  lang: Language;
}

const AuthPage = ({ type, onSuccess, onSwitch, lang }: AuthProps) => {
  const t = translations[lang];
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Backend Requirement: We must generate a unique email for Supabase Auth to work.
      // We hide this from the user to provide a "Phone + Password" experience.
      const generatedEmail = `${formData.phone}@kjeyluy.local`;

      if (type === 'up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: generatedEmail,
          password: formData.password,
          options: { 
            data: { name: formData.name, phone: formData.phone, role: 'lender' }
          }
        });
        
        if (signUpError) throw signUpError;

        if (data.user) {
          // Immediately sync to 'profiles' table with password
          // Note: The database trigger handles the initial row creation, but we update it here to ensure password is saved
          // and to handle any race conditions with the trigger.
          try {
              await api.updateProfile(
                data.user.id, 
                formData.name, 
                formData.phone, 
                formData.password, 
                'lender'
              );
          } catch (profileError) {
              console.warn("Profile update warning (likely race condition with trigger):", profileError);
          }

          if (!data.session) {
             // If email confirmation is on (unlikely for fake email), this catches it.
             setError("Account created but requires verification. Please contact support.");
             setLoading(false);
             return;
          }

          onSuccess({ 
            id: data.user.id,
            name: formData.name,
            phone: formData.phone,
            joinedDate: new Date().toISOString(),
            role: 'lender'
          });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: generatedEmail,
          password: formData.password
        });
        if (signInError) throw signInError;

        // Fetch strict profile data from DB
        let profileData;
        try {
            const { data: profile } = await api.getProfile(data.user.id);
            if (!profile) {
                // Auto-heal: If profile missing in DB, recreate it
                const meta = data.user.user_metadata;
                await api.updateProfile(
                    data.user.id, 
                    meta.name || 'Lender', 
                    meta.phone || formData.phone, 
                    formData.password, 
                    'lender'
                );
                profileData = { name: meta.name, phone: meta.phone, role: 'lender', created_at: new Date().toISOString() };
            } else {
                profileData = profile;
            }
        } catch (err) {
            console.error("Profile sync error", err);
            // Fallback to metadata if DB read fails
            profileData = { 
                name: data.user.user_metadata?.name, 
                phone: data.user.user_metadata?.phone,
                role: 'lender',
                created_at: new Date().toISOString()
            };
        }

        onSuccess({ 
          id: data.user.id,
          name: profileData.name || 'Lender',
          phone: profileData.phone || formData.phone,
          joinedDate: profileData.created_at || new Date().toISOString(),
          role: profileData.role || 'lender'
        });
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication failed.';
      // Helper for the specific error user is facing
      if (msg.includes("Database error saving new user")) {
        msg = "System Update Required: Please run the SQL trigger fix in Supabase Database.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-white ring-1 ring-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">{type === 'in' ? t.login_title : t.signup_title}</h2>
        <form className="space-y-5 mt-6" onSubmit={handleSubmit}>
          {type === 'up' && (
            <input 
              type="text"
              placeholder={t.full_name}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-aqua-500 outline-none"
              required
            />
          )}
          <input 
            type="tel"
            placeholder={t.phone_number}
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-aqua-500 outline-none"
            required
          />
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder={t.password}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-aqua-500 outline-none"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0"/> <span>{error}</span></div>}
          <button 
            disabled={loading} 
            type="submit"
            className="w-full bg-aqua-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-aqua-700 transition-colors shadow-lg shadow-aqua-500/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : (type === 'in' ? t.sign_in : t.sign_up)}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={onSwitch} className="text-sm text-gray-600 hover:text-aqua-600 underline-offset-4 hover:underline">{type === 'in' ? t.no_account : t.have_account}</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
type ViewState = 'landing' | 'login' | 'register' | 'dashboard' | 'create-loan' | 'loan-detail' | 'profile';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Attempt to fetch profile
        api.getProfile(session.user.id).then(({ data }) => {
           const meta = session.user.user_metadata;
           setUser({
            id: session.user.id,
            name: data?.name || meta?.name || 'Lender',
            phone: data?.phone || meta?.phone || '',
            joinedDate: data?.created_at || session.user.created_at,
            role: data?.role || 'lender'
          });
          setView('dashboard');
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setView('landing');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoadingLoans(true);
      api.getLoans(user.id)
        .then(data => setLoans(data))
        .catch(console.error)
        .finally(() => setLoadingLoans(false));
    } else setLoans([]);
  }, [user]);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setView('dashboard');
  };

  const navigate = (target: ViewState, id?: string) => {
    if (id) setSelectedLoanId(id);
    setView(target);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  const handleSaveLoan = async (loan: Loan) => {
    if (!user) return;
    try {
      await api.createLoan(loan, user.id);
      const updatedLoans = await api.getLoans(user.id);
      setLoans(updatedLoans);
      setView('dashboard');
    } catch (e: any) {
      console.error("Failed to save loan", e);
      // Enhanced error alerting to show detailed message instead of [object Object]
      const errorMessage = e?.message || e?.details || JSON.stringify(e);
      alert(`Failed to save loan: ${errorMessage}. Check if user profile exists.`);
    }
  };

  const handleRepay = async (loanId: string, paymentId: string, amount: number, note: string) => {
      if (!user) return;
      
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      // Optimistic update
      const updatedLoans = loans.map(l => {
        if (l.id !== loanId) return l;
        const updatedSchedule = l.repaymentSchedule.map(item => 
             item.id === paymentId ? { ...item, actualAmount: amount, status: (amount >= item.amount ? 'Paid' : 'Partial') as 'Paid' | 'Partial' } : item
        );
        const newTotalRepaid = updatedSchedule.reduce((acc, curr) => acc + (curr.actualAmount || 0), 0);
        return { ...l, amountRepaid: newTotalRepaid, repaymentSchedule: updatedSchedule };
      });
      setLoans(updatedLoans);

      // DB Update
      const loanRef = updatedLoans.find(l => l.id === loanId);
      const isCompleted = loanRef ? loanRef.amountRepaid >= (loanRef.totalRepayment - 0.5) : false;
      
      try {
         await api.updateRepayment(loanId, paymentId, amount, note, loanRef?.amountRepaid || 0, isCompleted);
      } catch (e) {
         console.error("DB Update failed", e);
         const originalLoans = await api.getLoans(user.id);
         setLoans(originalLoans);
         alert("Failed to save payment. Please try again.");
      }
  };

  const t = translations[lang];

  const renderContent = () => {
    if (view === 'landing') return <LandingPage onAuth={(t) => setView(t === 'in' ? 'login' : 'register')} lang={lang} />;
    if (view === 'login' || view === 'register') return <AuthPage type={view === 'login' ? 'in' : 'up'} onSuccess={handleAuthSuccess} onSwitch={() => setView(view === 'login' ? 'register' : 'login')} lang={lang} />;
    
    // Only show loader if we are SUPPOSED to be in dashboard mode but data is loading
    if (user && loadingLoans && loans.length === 0 && view !== 'profile') return <div className="flex-1 flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-aqua-600" size={40}/></div>;
    
    if (view === 'dashboard') return <Dashboard loans={loans} onNavigate={navigate} lang={lang} />;
    if (view === 'create-loan') return <CreateLoan onSave={handleSaveLoan} onCancel={() => setView('dashboard')} lang={lang} />;
    if (view === 'loan-detail' && selectedLoanId) {
      const selectedLoan = loans.find(l => l.id === selectedLoanId);
      if (selectedLoan) {
          return <LoanDetail loan={selectedLoan} onBack={() => setView('dashboard')} onRepay={handleRepay} lang={lang} />;
      }
    }
    if (view === 'profile' && user) return <Profile user={user} onBack={() => setView('dashboard')} onUpdate={handleAuthSuccess} lang={lang} />;
    
    return <Dashboard loans={loans} onNavigate={navigate} lang={lang} />;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm p-4 flex justify-between items-center z-40">
        <div className="font-bold text-xl text-aqua-600 cursor-pointer flex items-center gap-2" onClick={() => user ? setView('dashboard') : setView('landing')}>
          <div className="bg-aqua-100 p-1.5 rounded-lg"><Wallet size={20} className="fill-current"/></div> {t.app_name}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(lang === 'en' ? 'km' : 'en')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border hover:bg-gray-100 transition-colors text-sm font-medium">{lang === 'en' ? 'English' : 'ខ្មែរ'} <Globe size={14}/></button>
          
          {user && (
            <>
              <button 
                onClick={() => setView('profile')} 
                className={`p-2 rounded-full transition-colors ${view === 'profile' ? 'bg-aqua-50 text-aqua-600' : 'text-gray-400 hover:text-aqua-600 hover:bg-gray-50'}`}
                title={t.profile}
              >
                <UserIcon size={20}/>
              </button>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title={t.logout}><LogOut size={20}/></button>
            </>
          )}
        </div>
      </header>
      
      {/* 
         LAYOUT FIX: 
         We only apply the dashboard container constraints (max-w-7xl, padding) if we are NOT on the landing page.
         Landing page needs to be full width.
      */}
      <div className={`flex-1 flex flex-col w-full ${view !== 'landing' && view !== 'login' && view !== 'register' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
}