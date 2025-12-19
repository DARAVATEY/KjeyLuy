import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { translations, Language } from '../translations';
import { User as UserIcon, Phone, Calendar, Save, Loader2, ArrowLeft, Lock, Shield } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onBack: () => void;
  lang: Language;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onBack, lang }) => {
  const t = translations[lang];
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: 'success' });

    try {
      await api.updateProfile(user.id, name, user.phone, password || undefined, user.role || 'lender');
      
      // Update local state
      onUpdate({ ...user, name });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setPassword(''); // Clear password field
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="group flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm mb-4 px-1"
      >
        <div className="bg-gray-100 p-1.5 rounded-full mr-2 group-hover:bg-gray-200 transition-colors">
          <ArrowLeft size={14} />
        </div>
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-aqua-600 to-aqua-700 px-8 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 text-white border-2 border-white/30">
             <UserIcon size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-aqua-100 text-sm font-medium flex items-center justify-center gap-2 mt-1">
            <Shield size={14} /> {user.role === 'lender' ? 'Lender Account' : 'Borrower Account'}
          </p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">{t.full_name}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-400"><UserIcon size={18} /></span>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">{t.phone_number}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-400"><Phone size={18} /></span>
                  <input 
                    type="text" 
                    value={user.phone}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 ml-1">Phone number cannot be changed.</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-gray-700 block">New Password (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-400"><Lock size={18} /></span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Calendar size={16} />
                  <span>Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
              </div>
           </div>

           {message.text && (
             <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {message.type === 'success' ? <Shield size={16}/> : <Lock size={16}/>}
                {message.text}
             </div>
           )}

           <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 rounded-xl bg-aqua-600 text-white hover:bg-aqua-700 font-bold shadow-lg shadow-aqua-500/20 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg"
           >
               {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {t.save_profile}</>}
           </button>
        </form>
      </div>
    </div>
  );
};