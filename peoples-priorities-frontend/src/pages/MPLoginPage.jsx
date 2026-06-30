import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Key, Loader2 } from 'lucide-react';
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
      // Hackathon demo convenience check: allow login bypass with correct fields or fake auth validation
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
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-50 text-primary border border-teal-100">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Member of Parliament</h2>
          <p className="text-xs text-gray-500 font-medium">Access your constituency priorities board dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Email Address:
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mp.office@parliament.in"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Password:
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In to Dashboard
          </button>
        </form>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-400 text-center leading-normal">
          For demo testing: use any email and a password of at least 6 characters (e.g. mp@demo.in / admin123).
        </div>
      </div>
    </div>
  );
}
