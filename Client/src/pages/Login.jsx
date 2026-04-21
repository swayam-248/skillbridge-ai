import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Send Email, 2: Verify OTP
  const { login } = useContext(AuthContext);



  const handleSendOtp = async (e) => {
    e.preventDefault(); // 🛑 Stops the page from refreshing
    try {
      await axios.post("http://localhost:5000/api/auth/send-otp", { email });
      setStep(2);
      alert("Check your email for the code!");
    } catch (err) {
      console.log(err); // This helps you see the real error in F12
      alert("Error sending OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); // 🛑 Stops the page from refreshing
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        { email, code: otp },
      );
      login(res.data.token, res.data.user);
      alert("Logged in successfully!");
    } catch (err) {
      alert("Invalid Code");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>{step === 1 ? "Login to SkillBridge" : "Enter Verification Code"}</h2>
      
      {step === 1 ? (
        <>
          <input type="email" placeholder="Enter Gmail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={handleSendOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button onClick={handleVerifyOtp}>Verify & Enter</button>
        </>
      )}
    </div>
  );
};

export default Login;