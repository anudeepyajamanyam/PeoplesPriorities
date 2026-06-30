import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Key, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword } from '../firebase';

export default function MPLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(email, password);
      toast.success("Welcome back, MP Representative!");
      navigate('/mp/dashboard');
    } catch (err) {
      console.warn("Real login error", err);
      if (email.includes("@") && password.length >= 6) {
        sessionStorage.setItem('demoUser', 'true');
        toast.success("Demo Mode: Signed in successfully");
        navigate('/mp/dashboard');
      } else {
        toast.error("Invalid email or password. Use at least 6 characters.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-6 font-sans">
      
      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-1.5 text-xs font-sans font-medium text-[#5F5E5A] hover:text-[#FF6B35] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to home
      </button>

      <div className="bg-white p-8 rounded-[14px] border border-[#ECE7DE] max-w-md w-full space-y-6">
        <div className="text-center space-y-2.5">
          {/* Lock icon badge: coral-tinted background, 38x38px, 10px radius */}
          <div className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#FFE8DC] text-[#FF6B35]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-[20px] font-sans font-medium text-[#1A1A1A]">Member of Parliament</h2>
          <p className="text-xs text-[#5F5E5A]">Access your constituency priorities dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-sans font-medium text-[#888780] uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#888780]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mp.office@parliament.in"
                className="w-full h-[44px] pl-11 pr-4 border border-[#ECE7DE] rounded-[10px] text-sm text-[#1A1A1A] placeholder-[#888780] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FFE8DC] outline-none font-sans font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium text-[#888780] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-[#888780]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[44px] pl-11 pr-4 border border-[#ECE7DE] rounded-[10px] text-sm text-[#1A1A1A] placeholder-[#888780] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FFE8DC] outline-none font-sans font-medium transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#FF6B35] hover:bg-[#B8431D] text-white rounded-[10px] text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in to dashboard
          </button>
        </form>

        {/* Demo helper box: soft amber-tinted info box */}
        <div className="bg-[#FEF3C7]/40 p-4 rounded-[10px] border border-[#ECE7DE] text-xs text-[#854F0B] text-center leading-relaxed">
          For demo testing: use any email and a password of at least 6 characters (e.g. <strong>mp@demo.in</strong> / <strong>admin123</strong>).
        </div>
      </div>
    </div>
  );
}
