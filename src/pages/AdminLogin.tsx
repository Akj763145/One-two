import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!supabase) {
      // Offline / Local fallback logic via backend
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          localStorage.setItem('movieWallah_admin', 'true');
          navigate('/');
        } else {
          setErrorMsg('Invalid email or password');
        }
      } catch (err) {
        setErrorMsg('Failed to connect to authentication server');
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (data.session) {
        localStorage.setItem('movieWallah_admin', 'true');
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass-panel rounded-3xl p-8 relative bg-white/10 border border-white/10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock size={32} className="text-red-500" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-center mb-2">Admin Portal</h3>
        <p className="text-white/50 text-center text-[10px] mb-8 uppercase tracking-[0.2em] font-bold">Authorized Personnel Only</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Admin Email" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono text-sm"
              required 
            />
          </div>
          <div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono text-sm"
              required
            />
          </div>
          
          {errorMsg && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">{errorMsg}</p>}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-black font-black uppercase tracking-widest rounded-xl py-4 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 mt-4 shadow-xl active:scale-[0.98]"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
