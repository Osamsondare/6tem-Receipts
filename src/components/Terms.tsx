import React from "react";
import { FileText, Scale, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

export default function Terms() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tighter text-primary">Terms of Service</h2>
        <p className="text-text-muted font-medium text-sm italic">Last updated: April 2026</p>
      </div>

      <div className="grid gap-6">
        <TermsSection 
          icon={<Scale size={20} className="text-accent" />}
          title="1. Acceptance of Terms"
          description="By accessing or using 6tem Receipts, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not use the service."
        />
        
        <TermsSection 
          icon={<FileText size={20} className="text-accent" />}
          title="2. Service Description"
          description="6tem Receipts provides a digital platform for generating, managing, and storing business receipts. We offer cloud synchronization and local drafting tools to streamline your invoicing process."
        />

        <TermsSection 
          icon={<AlertCircle size={20} className="text-accent" />}
          title="3. User Responsibilities"
          description="You are responsible for maintaining the accuracy of the data you enter. 6tem Receipts is a tool for record-keeping; it is your responsibility to ensure you comply with local tax laws and regulations."
        />

        <TermsSection 
          icon={<CheckCircle2 size={20} className="text-accent" />}
          title="4. Data Ownership"
          description="You retain full ownership of the data you enter into the application. We serve as a processor of this data, providing the storage and tools necessary to manage it according to your instructions."
        />
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">5. Termination</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
      </div>
    </div>
  );
}

function TermsSection({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
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
        <h3 className="text-sm font-black text-primary tracking-tight uppercase">{title}</h3>
      </div>
      <p className="text-sm text-text-muted font-medium leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
