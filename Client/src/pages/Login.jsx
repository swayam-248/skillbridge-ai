import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from "axios";
import { API_BASE_URL } from '../utils/api';

import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1: Send Email, 2: Verify OTP
  const [role, setRole] = useState('worker'); // 'worker' or 'recruiter'
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');
    const roleParam = params.get('role');
    const isCompleteParam = params.get('isComplete') === 'true';

    if (tokenParam && emailParam && roleParam) {
      login(tokenParam, {
        email: emailParam,
        role: roleParam,
        isComplete: isCompleteParam
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("Logged in successfully with Google!");
      navigate('/dashboard');
    }
  }, [login, navigate]);

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google?role=${role}`;
  };

  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue.slice(-1);
    setOtpDigits(newDigits);
    setOtp(newDigits.join(''));

    if (cleanValue !== '' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
      setOtp(newDigits.join(''));
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newDigits = pastedData.split('');
      setOtpDigits(newDigits);
      setOtp(pastedData);
      document.getElementById('otp-input-5')?.focus();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault(); 
    try {
      await axios.post(`${API_BASE_URL}/api/auth/send-otp`, { email: email.trim().toLowerCase() });
      setStep(2);
      alert("Check your email for the code!");
    } catch (err) {
      console.log(err); 
      alert("Error sending OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); 
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/verify-otp`,
        { email: email.trim().toLowerCase(), code: otp.trim(), role },
      );
      login(res.data.token, res.data.user);
      alert("Logged in successfully!");
      navigate('/dashboard');
    } catch (err) {
      alert("Invalid Code");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] font-sans px-4 animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-slate-800/50">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2 tracking-tight">
            SkillBridge<span className="text-white">AI</span>
          </h2>
          <p className="text-slate-400 font-medium">
            {step === 1 ? "Sign in or create an account" : "Verify your identity"}
          </p>
        </div>
        
        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleSendOtp}>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wider">I am a...</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole('worker')}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${role === 'worker' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                >
                  👷 Worker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${role === 'recruiter' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                >
                  🔍 Recruiter
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="name@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Continue with Email
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-sm font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </button>
          </form>
        ) : (
          <form className="space-y-6 animate-in slide-in-from-right-8 duration-500" onSubmit={handleVerifyOtp}>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-4 ml-1 uppercase tracking-wider text-center">Verification Code</label>
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    required
                    pattern="\d"
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white font-black text-center text-xl transition-all"
                    maxLength={1}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">We sent a secure code to <span className="text-blue-400">{email}</span></p>
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Verify & Secure Login
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-slate-400 font-medium hover:text-white transition-colors text-sm"
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;