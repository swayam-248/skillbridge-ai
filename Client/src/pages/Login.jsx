import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/api";
import { RisingSpanLogo, RisingSpanMark } from "../components/RisingSpanLogo";

const Login = () => {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("worker");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handle OAuth callback if redirected from Google (secure one-time code exchange)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    const tokenParam = params.get("token");

    if (codeParam) {
      setLoading(true);
      axios.post(`${API_BASE_URL}/api/auth/exchange-code`, { code: codeParam })
        .then((res) => {
          login(res.data.token, res.data.user);
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("OAuth code exchange error:", err);
          setErrorMessage(err.response?.data?.message || "Failed to complete Google authentication.");
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (tokenParam) {
      // Backward-compatible fallback for legacy query parameter tokens
      const emailParam = params.get("email");
      const roleParam = params.get("role");
      const isCompleteParam = params.get("isComplete") === "true";

      if (emailParam && roleParam) {
        login(tokenParam, {
          email: emailParam,
          role: roleParam,
          isComplete: isCompleteParam,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/dashboard");
      }
    }
  }, [login, navigate]);

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google?role=${role}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (mode === "register" && cleanPassword !== confirmPassword.trim()) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
          email: cleanEmail,
          password: cleanPassword,
          role,
        });
        login(res.data.token, res.data.user);
        navigate("/dashboard");
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: cleanEmail,
          password: cleanPassword,
        });
        login(res.data.token, res.data.user);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Authentication failed. Please verify your details and try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 flex items-center justify-center text-slate-900">
      <div className="mx-auto grid min-h-[620px] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left Side: The Rising Span Brand Experience */}
        <section className="flex flex-col justify-between bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-950 p-8 text-white md:p-12 relative overflow-hidden">
          {/* Subtle architectural radial lighting */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          {/* Header Link */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center group">
              <RisingSpanLogo size={42} showTagline={true} theme="dark" />
            </Link>
          </div>

          {/* Center Brand Statement */}
          <div className="my-10 relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-cyan-200 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              THE RISING SPAN IDENTITY
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight leading-tight text-white">
              Turn hands-on skill into verified market equity.
            </h2>

            <p className="text-sm leading-relaxed text-blue-100 max-w-md font-medium">
              Join the real-time marketplace bridging certified trades with active recruiters. Speak your work history, turn online for dispatch, and elevate your reputation.
            </p>

            {/* Metric pill cards */}
            <div className="grid grid-cols-2 gap-3 pt-3 max-w-sm">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                <span className="block font-mono text-xl font-black text-cyan-300">42+</span>
                <span className="text-[11px] text-blue-200 font-semibold">Certified Trades</span>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                <span className="block font-mono text-xl font-black text-teal-300">0s</span>
                <span className="text-[11px] text-blue-200 font-semibold">Zero OTP Hassle</span>
              </div>
            </div>
          </div>

          {/* Bottom Features */}
          <div className="grid gap-3 border-t border-white/15 pt-6 text-xs text-blue-100 sm:grid-cols-3 relative z-10">
            <div className="flex items-center gap-2 font-medium">
              <span>🎙️</span> Voice AI Skills
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span>⚡</span> Live Dispatch
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span>🔒</span> Direct Access
            </div>
          </div>
        </section>

        {/* Right Side: Clean Email & Password Form */}
        <section className="flex items-center p-8 md:p-12 bg-white">
          <div className="w-full">
            {/* Mode Switcher Tabs */}
            <div className="mb-7">
              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage("");
                  }}
                  className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                    mode === "login"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage("");
                  }}
                  className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                    mode === "register"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <h2 className="font-display text-2xl font-black text-slate-950 mt-5">
                {mode === "login" ? "Welcome Back" : "Join SkillBridge"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {mode === "login"
                  ? "Enter your email and password to access your dashboard."
                  : "Sign up with your email to start booking or working immediately."}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-bold text-rose-800 flex items-start justify-between gap-2 shadow-2xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-rose-400 hover:text-rose-700 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Role Selector (Register mode only) */}
              {mode === "register" && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    I want to join as a:
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                    {[
                      { id: "worker", label: "🛠️ Skilled Worker", sub: "Build voice profile" },
                      { id: "recruiter", label: "💼 Recruiter", sub: "Hire & dispatch talent" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setRole(option.id)}
                        className={`rounded-xl p-2.5 text-left transition-all ${
                          role === option.id
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                        }`}
                      >
                        <span className="block text-xs font-black">{option.label}</span>
                        <span
                          className={`text-[10px] block ${
                            role === option.id ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {option.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    {showPassword ? "Hide password" : "Show password"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                />
              </div>

              {/* Confirm Password (Register mode only) */}
              {mode === "register" && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-sm py-3.5 shadow-md shadow-blue-500/20 mt-2"
              >
                {loading
                  ? mode === "login"
                    ? "Authenticating..."
                    : "Creating Account..."
                  : mode === "login"
                  ? "Log In to SkillBridge →"
                  : "Create SkillBridge Account →"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  OR
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google OAuth Option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="btn-secondary w-full text-xs flex items-center justify-center gap-2 py-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              {/* Bottom Mode Switch Link */}
              <div className="pt-2 text-center">
                {mode === "login" ? (
                  <p className="text-xs text-slate-500 font-medium">
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setErrorMessage("");
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700 underline"
                    >
                      Sign up now
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMessage("");
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700 underline"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;

