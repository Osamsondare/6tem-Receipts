import { motion } from "motion/react";
import { ReceiptText } from "lucide-react";

export default function Splash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg flex flex-col items-center justify-center p-8 z-50"
    >
      <div className="relative mb-12">
        <div className="w-24 h-24 bg-card rounded-[2rem] shadow-xl flex items-center justify-center relative overflow-visible">
          <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center transform rotate-0 shadow-lg">
            <ReceiptText size={40} className="text-white" />
          </div>
          {/* Notification Badge from screenshot */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-warning rounded-full flex items-center justify-center border-4 border-bg text-white text-xs font-bold shadow-md">
            6
          </div>
        </div>
      </div>

      <div className="text-center space-y-2 mb-16">
        <h1 className="text-4xl font-extrabold tracking-tighter text-primary">
          6tem <span className="text-accent">Receipts</span>
        </h1>
        <p className="text-text-muted text-lg font-medium">
          Professional Receipts in Seconds
        </p>
      </div>

      <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden mb-8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-full bg-accent"
        />
      </div>

      <div className="mt-12">
        <p className="text-[#94A3B8] text-[10px] tracking-[0.2em] font-bold uppercase">
          The Digital Ledger © 2024
        </p>
      </div>
    </motion.div>
  );
}
