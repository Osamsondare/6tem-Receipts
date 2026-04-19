import React from "react";
import { Sparkles, Zap, Heart, Globe, Github, Twitter, Linkedin } from "lucide-react";
import { motion } from "motion/react";

export default function About() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tighter text-primary">About 6tem</h2>
        <p className="text-text-muted font-medium text-sm">Empowering entrepreneurs with professional invoicing.</p>
      </div>

      <div className="bg-primary rounded-3xl p-8 text-bg dark:text-bg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10 space-y-6">
          <Sparkles className="text-accent" size={40} />
          <p className="text-xl font-medium leading-relaxed tracking-tight">
            6tem Receipts was born from a simple mission: to make professional invoicing accessible, beautiful, and lightning-fast for small businesses and freelancers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard 
          icon={<Zap className="text-accent" />}
          title="Speed & Simplicity"
          description="Generate professional receipts in under 60 seconds. Our intuitive interface focuses on what matters—your transactions."
        />
        <FeatureCard 
          icon={<Heart className="text-accent" />}
          title="Crafted with Care"
          description="Every pixel, animation, and interaction is designed to make your daily operations feel more professional and enjoyable."
        />
      </div>

      <div className="bg-card p-8 rounded-2xl border border-border space-y-6">
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Our Vision</h3>
          <p className="text-sm font-medium text-text-main leading-relaxed">
            We believe that the tools you use should reflect the quality of the work you do. 6tem is more than just a receipt generator; it's a statement of professionalism for the modern economy.
          </p>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-border">
          <SocialLink icon={<Globe size={18} />} label="Website" />
          <SocialLink icon={<Twitter size={18} />} label="Twitter" />
          <SocialLink icon={<Github size={18} />} label="GitHub" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
      <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-2">
        <h4 className="font-black text-primary uppercase tracking-tight text-sm">{title}</h4>
        <p className="text-xs text-text-muted leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

function SocialLink({ icon, label }: any) {
  return (
    <a href="#" className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </a>
  );
}
