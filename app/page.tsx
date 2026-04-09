"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Fingerprint, ShieldAlert, UserPlus, LogIn, User, Hash, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, register } from '@/services/authService';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    user_emp_id: '',
    user_emp_name: '',
    user_role: 'viewer' as 'administrator' | 'viewer' | 'master manager'
  });

  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter (a–z)', met: /[a-z]/.test(formData.password) },
    { label: 'One number (0–9)', met: /\d/.test(formData.password) },
    { label: 'One symbol (@, #, or $)', met: /[@#$]/.test(formData.password) },
  ], [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await login(formData.username, formData.password);
        localStorage.setItem("user_name", response.emp_name);
        localStorage.setItem("user_role", response.role);
        localStorage.setItem("username", response.username);
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("token_type", response.token_type);

        toast.success(`Welcome back, ${response.emp_name}!`);
        router.push('/dashboard');
      } else {
        await register({
          username: formData.username,
          pass: formData.password,
          user_emp_id: parseInt(formData.user_emp_id),
          user_emp_name: formData.user_emp_name,
          user_role: formData.user_role
        });
        toast.success("Account created successfully. Please sign in.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-200">

        {/* Left Side: Security & Branding Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-12 flex flex-col justify-between relative overflow-hidden">

          {/* Background Security Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-12 p-10 justify-center items-center">
            <ShieldCheck size={120} />
            <Lock size={80} />
            <Fingerprint size={100} />
            <ShieldAlert size={90} />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SULZER</h1>
            <div className="h-1 w-12 bg-blue-400 rounded-full mb-4"></div>
            <p className="text-blue-100 text-sm font-medium">Internal Asset Management & Security</p>
          </div>

          <div className="relative z-10 space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3 text-blue-100/80 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="text-blue-400" size={24} />
              <p className="text-xs font-semibold uppercase tracking-wider">Secure Access Portal</p>
            </div>
            <p className="text-[10px] text-blue-300/60 uppercase tracking-widest px-1">
              Authorized Personnel Only • IP Logged
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center items-center bg-white overflow-y-auto">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                {isLogin ? <Lock size={24} /> : <UserPlus size={24} />}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {isLogin ? "Sign In" : "Crete Account samyak"}
              </h2>
              <p className="text-slate-500 text-xs">
                {isLogin ? "Welcome to Sulzer Service Portal" : "Join the Asset Management System"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      name="username"
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Requirements - Register only */}
                {!isLogin && formData.password.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password Requirements</p>
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2">
                        {check.met
                          ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          : <XCircle size={13} className="text-slate-300 shrink-0" />}
                        <span className={`text-xs font-medium ${check.met ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!isLogin && (
                  <>
                    {/* Employee ID */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required
                          name="user_emp_id"
                          type="number"
                          placeholder="e.g. 1001"
                          value={formData.user_emp_id}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Employee Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employee Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required
                          name="user_emp_name"
                          type="text"
                          placeholder="Full Name"
                          value={formData.user_emp_name}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">User Role</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                          name="user_role"
                          value={formData.user_role}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="administrator">Administrator</option>
                          <option value="viewer">Viewer</option>
                          <option value="master manager">Master Manager</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Register")}
                {!loading && (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  {isLogin ? "Need an account? Create one" : "Already have an account? Sign in"}
                </button>
                <p className="text-[10px] text-slate-400">
                  Authorized access only. Technical issues? <span className="text-blue-600 font-bold cursor-pointer">Contact Support</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}