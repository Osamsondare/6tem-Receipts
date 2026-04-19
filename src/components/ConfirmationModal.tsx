import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireText?: string;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText = "Cancel",
  variant = 'danger',
  requireText
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

  const isConfirmDisabled = requireText 
    ? inputValue.trim().toUpperCase() !== requireText.toUpperCase() 
    : false;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-error text-white hover:bg-red-600 shadow-red-900/20';
      case 'warning': return 'bg-accent text-white hover:bg-blue-700 shadow-blue-900/20';
      default: return 'bg-primary text-white hover:bg-slate-800 shadow-slate-900/20';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-error/10 text-error';
      case 'warning': return 'bg-accent/10 text-accent';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-card w-full max-w-md rounded-2xl border border-border p-8 shadow-2xl space-y-6 overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 ${getIconStyles()} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <AlertTriangle size={32} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-primary tracking-tight uppercase">{title}</h3>
              <p className="text-sm text-text-muted font-bold leading-relaxed">
                {message}
              </p>
            </div>

            {requireText && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center">
                  Type <span className="text-error">"{requireText}"</span> to proceed
                </p>
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Type ${requireText} here...`}
                  className="w-full bg-bg border border-border px-4 py-3 rounded-xl text-center font-black tracking-widest text-primary focus:border-accent outline-none transition-all uppercase"
                />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                disabled={isConfirmDisabled}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full py-4 ${getVariantStyles()} rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-bg text-primary border border-border rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-border transition-all active:scale-[0.98]"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
