import React, { useState, useContext } from 'react';
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