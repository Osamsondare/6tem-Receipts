import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AdminPinGateProps {
  onAuthenticated: () => void;
}

export default function AdminPinGate({ onAuthenticated }: AdminPinGateProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const adminDoc = await getDoc(doc(db, "users", user.uid));
      const adminData = adminDoc.data();
      
      // Default to 7269 if no PIN is set in Firestore yet
      const correctPin = adminData?.adminPin || "7269";

      if (pin === correctPin) {
        onAuthenticated();
      } else {
        setError("Invalid Access PIN");
        setPin("");
      }
    } catch (err) {
      setError("Authorization failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-bg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-card p-8 rounded-2xl border border-border shadow-xl space-y-8"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent ring-4 ring-accent/5">
            <Lock size={32} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-primary">
              <ShieldCheck size={16} />
              <h2 className="text-xl font-black uppercase tracking-widest text-sm">Restricted Area</h2>
            </div>
            <p className="text-xs font-medium text-text-muted leading-relaxed">
              Please enter your Master PIN to access the Platform Command Center.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-center relative">
          <div className="relative inline-block">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`w-12 h-16 bg-bg rounded-xl border-2 flex items-center justify-center transition-all ${
                    pin.length > i ? 'border-accent text-accent' : 'border-border'
                  } ${error ? 'border-error animate-shake' : ''}`}
                >
                  {pin.length > i ? (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  ) : (
                    <span className="text-text-muted/20">-</span>
                  )}
                </div>
              ))}
            </div>

            <input 
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 4) setPin(val);
                if (error) setError(null);
              }}
              className="absolute inset-0 opacity-0 cursor-text w-full z-10"
              style={{ fontSize: '16px' }} // Prevent iOS zoom
            />
          </div>

          <div className="min-h-[20px]">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 text-error text-[10px] font-bold uppercase tracking-widest"
              >
                <AlertCircle size={12} />
                {error}
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || isLoading}
            className="w-full py-4 bg-primary text-bg rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-accent transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Unlock Dashboard
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">
          Master PIN: 7269
        </p>
      </motion.div>
    </div>
  );
}
