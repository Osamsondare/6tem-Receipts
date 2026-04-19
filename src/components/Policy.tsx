import React from "react";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import { motion } from "motion/react";

export default function Policy() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tighter text-primary">Privacy Policy</h2>
        <p className="text-text-muted font-medium text-sm italic">Last updated: April 2026</p>
      </div>

      <div className="grid gap-6">
        <PolicySection 
          icon={<Shield size={20} className="text-accent" />}
          title="Data Security"
          description="We take your business data seriously. All receipt data and business profiles are stored securely using Firebase's encrypted cloud storage. We never sell or share your transaction history with third parties."
        />
        
        <PolicySection 
          icon={<Lock size={20} className="text-accent" />}
          title="User Privacy"
          description="Your personal information, including your email and business details, is only used to personalize your experience and generate professional receipts. We use industry-standard authentication (Firebase Auth) to protect your account."
        />

        <PolicySection 
          icon={<Eye size={20} className="text-accent" />}
          title="Data Collection"
          description="We only collect the data you explicitly provide: business details, customer information, and receipt items. We use local storage to save drafts of your work so you don't lose progress if you close the app."
        />

        <PolicySection 
          icon={<FileText size={20} className="text-accent" />}
          title="Your Rights"
          description="You have full control over your data. You can export your receipts as PNG or PDF at any time. You also have the absolute right to delete your entire account and all associated transaction history using our 'Clear All App Data' feature."
        />
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <p className="text-xs text-text-muted leading-relaxed">
          By using 6tem Receipts, you agree to these terms. We aim to provide a transparent, secure, and professional invoicing tool for modern entrepreneurs.
        </p>
      </div>
    </div>
  );
}

function PolicySection({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-md font-black text-primary tracking-tight uppercase">{title}</h3>
      </div>
      <p className="text-sm text-text-muted font-medium leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
