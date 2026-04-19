import React, { useState } from "react";
import { motion } from "motion/react";
import { ReceiptText, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AuthProps {
  onLogin: () => void;
  onViewChange: (view: any) => void;
}

export default function Auth({ onLogin, onViewChange }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; auth?: string; terms?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (mode === "signup" && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "signup" && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (mode === "signup" && !agreeToTerms) {
      newErrors.terms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err: any) {
      setErrors({ auth: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        if (mode === "login") {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        onLogin();
      } catch (err: any) {
        let message = "Authentication failed";
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          message = "Invalid email or password";
        } else if (err.code === 'auth/email-already-in-use') {
          message = "Email already in use";
        } else if (err.code === 'auth/invalid-credential') {
          message = "Invalid credentials";
        }
        setErrors({ auth: message });
      } finally {
        setLoading(false);
      }
    }
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    clearForm();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
            <ReceiptText size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tighter text-primary">6tem Receipts</h1>
            <p className="text-text-muted mt-1 font-medium">Your editorial digital ledger.</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-card p-2 rounded-xl shadow-sm border border-border">
          {/* Tabs */}
          <div className="flex p-1 bg-bg rounded-lg mb-6">
            <button
              onClick={toggleMode}
              className={`flex-1 py-2.5 text-sm font-semibold rounded transition-all ${
                mode === "login"
                  ? "bg-card text-primary shadow-sm"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              Log In
            </button>
            <button
              onClick={toggleMode}
              className={`flex-1 py-2.5 text-sm font-semibold rounded transition-all ${
                mode === "signup"
                  ? "bg-card text-primary shadow-sm"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              Sign Up
            </button>
          </div>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-card px-4 text-text-muted">
                  {mode === "login" ? "Or Login using" : "Or Sign up using"}
                </span>
              </div>
            </div>

            {/* Google Login */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-lg hover:bg-bg transition-colors font-semibold text-text-main disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
              Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-card px-4 text-text-muted">With Email</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.email ? 'text-error' : 'text-text-muted'}`} size={18} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 bg-bg border ${errors.email ? 'border-error focus:ring-error/10' : 'border-border focus:ring-accent/10 focus:border-accent'} rounded-lg outline-none text-text-main placeholder-text-muted text-sm transition-all`}
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-error uppercase tracking-widest ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest">Password</label>
                  {mode === "login" && (
                    <button type="button" className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wide">Forgot Password?</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.password ? 'text-error' : 'text-text-muted'}`} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-3 bg-bg border ${errors.password ? 'border-error focus:ring-error/10' : 'border-border focus:ring-accent/10 focus:border-accent'} rounded-lg outline-none text-text-main placeholder-text-muted text-sm transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] font-bold text-error uppercase tracking-widest ml-1">{errors.password}</p>}
              </div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-error' : 'text-text-muted'}`} size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-11 pr-12 py-3 bg-bg border ${errors.confirmPassword ? 'border-error focus:ring-error/10' : 'border-border focus:ring-accent/10 focus:border-accent'} rounded-lg outline-none text-text-main placeholder-text-muted text-sm transition-all`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] font-bold text-error uppercase tracking-widest ml-1">{errors.confirmPassword}</p>}
                </div>
              )}

              <div className="flex items-start gap-2 pt-1">
                <input 
                  type="checkbox"
                  id={mode === "login" ? "remember" : "terms"}
                  className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent"
                  checked={mode === "login" ? rememberMe : agreeToTerms}
                  onChange={(e) => mode === "login" ? setRememberMe(e.target.checked) : setAgreeToTerms(e.target.checked)}
                />
                <label 
                  htmlFor={mode === "login" ? "remember" : "terms"} 
                  className="text-xs text-text-muted font-medium cursor-pointer leading-tight select-none"
                >
                  {mode === "login" ? (
                    "Remember my login"
                  ) : (
                    <span>By clicking this button, you agree to our <button type="button" onClick={() => onViewChange("terms")} className="text-accent hover:underline font-bold">Terms of Service</button> and <button type="button" onClick={() => onViewChange("policy")} className="text-accent hover:underline font-bold">Privacy Policy</button></span>
                  )}
                </label>
              </div>
              {mode === "signup" && errors.terms && (
                <p className="text-[10px] font-bold text-error uppercase tracking-widest ml-1">{errors.terms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-200 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:bg-accent/70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? (loading ? "Signing In..." : "Log In") : (loading ? "Creating Account..." : "Create Account")}
            </button>
            {errors.auth && <p className="text-center text-[10px] font-bold text-error uppercase tracking-widest">{errors.auth}</p>}
          </form>
        </div>

        <div className="text-center space-y-4">
          <p className="text-xs text-text-muted">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="font-bold text-accent hover:underline"
            >
              {mode === "login" ? "Create one for free" : "Log in now"}
            </button>
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <button onClick={() => onViewChange("policy")} className="hover:text-text-main">Privacy Policy</button>
            <button onClick={() => onViewChange("terms")} className="hover:text-text-main">Terms of Service</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
