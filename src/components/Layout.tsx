import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Home, History, PlusCircle, User, LogOut, Sun, Moon, X, Shield, Info, FileText, ShieldCheck } from "lucide-react";
import { useBusiness } from "../contexts/BusinessContext";
import { useTheme } from "../contexts/ThemeContext";
import { auth } from "../lib/firebase";

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: any) => void;
  onLogout: () => void;
}

export default function Layout({ children, currentView, onViewChange, onLogout }: LayoutProps) {
  const { businessInfo } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const isAdmin = auth.currentUser?.email === "emerandaglobalinvestment@gmail.com";

  const initials = businessInfo.name
    ? businessInfo.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "6T";

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-bg text-text-main relative transition-colors duration-300 overflow-x-hidden border-x border-border shadow-2xl shadow-slate-900/10">
      {/* Sidebar Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm max-w-lg mx-auto"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-8 flex flex-col h-full">
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
                        <PlusCircle size={24} />
                      </div>
                      <span className="font-black text-primary tracking-tighter">6tem Menu</span>
                    </div>
                    <button 
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 text-text-muted hover:bg-bg rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <SidebarItem 
                      icon={<Home size={20} />} 
                      label="Dashboard" 
                      isActive={currentView === "dashboard"}
                      onClick={() => { onViewChange("dashboard"); setIsMenuOpen(false); }}
                    />
                    <SidebarItem 
                      icon={<History size={20} />} 
                      label="Transaction History" 
                      isActive={currentView === "history"}
                      onClick={() => { onViewChange("history"); setIsMenuOpen(false); }}
                    />
                    <SidebarItem 
                      icon={<PlusCircle size={20} />} 
                      label="Create Receipt" 
                      isActive={currentView === "new"}
                      onClick={() => { onViewChange("new"); setIsMenuOpen(false); }}
                    />
                    <SidebarItem 
                      icon={<User size={20} />} 
                      label="Business Profile" 
                      isActive={currentView === "profile"}
                      onClick={() => { onViewChange("profile"); setIsMenuOpen(false); }}
                    />
                    {isAdmin && (
                      <div className="pt-2">
                        <SidebarItem 
                          icon={<ShieldCheck size={20} />} 
                          label="Admin Command Center" 
                          isActive={currentView === "admin"}
                          onClick={() => { onViewChange("admin"); setIsMenuOpen(false); }}
                        />
                      </div>
                    )}
                  </div>

                <div className="pt-6 border-t border-border space-y-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-3 mb-2">Information</p>
                  <SidebarItem 
                    icon={<Shield size={20} />} 
                    label="Privacy Policy" 
                    isActive={currentView === "policy"}
                    onClick={() => { onViewChange("policy"); setIsMenuOpen(false); }}
                  />
                  <SidebarItem 
                    icon={<FileText size={20} />} 
                    label="Terms of Service" 
                    isActive={currentView === "terms"}
                    onClick={() => { onViewChange("terms"); setIsMenuOpen(false); }}
                  />
                  <SidebarItem 
                    icon={<Info size={20} />} 
                    label="About Us" 
                    isActive={currentView === "about"}
                    onClick={() => { onViewChange("about"); setIsMenuOpen(false); }}
                  />
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-3">Preferences</p>
                  <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-bg transition-colors group"
                  >
                    <div className="flex items-center gap-3 text-sm font-bold text-text-main">
                      {theme === "light" ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-accent" />}
                      <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-accent" : "bg-border"}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </button>
                </div>

                <div className="pt-6 border-t border-border">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-error/5 text-error transition-colors text-sm font-bold"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-center">
                <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-40">Version 1.2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -ml-2 text-primary hover:bg-bg rounded-lg transition-colors"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xl font-extrabold tracking-tighter text-primary leading-none">6tem Receipts</span>
          <span className="text-[8px] font-bold text-accent uppercase tracking-[0.3em] mt-1">{businessInfo.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange("profile")}
            className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-bg font-bold text-[10px] shadow-sm hover:scale-105 transition-transform overflow-hidden"
          >
            {businessInfo.logo ? (
              <img src={businessInfo.logo} className="w-full h-full object-cover" alt="logo" referrerPolicy="no-referrer" />
            ) : initials}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-text-muted hover:text-accent transition-colors"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto bg-bg">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-bg border-t border-border px-6 py-3 flex items-center justify-between z-40 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <NavItem
          icon={<Home size={22} />}
          label="HOME"
          isActive={currentView === "dashboard"}
          onClick={() => onViewChange("dashboard")}
        />
        <NavItem
          icon={<History size={22} />}
          label="HISTORY"
          isActive={currentView === "history"}
          onClick={() => onViewChange("history")}
        />
        <NavItem
          icon={<PlusCircle size={22} />}
          label="NEW"
          isActive={currentView === "new"}
          onClick={() => onViewChange("new")}
        />
        <NavItem
          icon={<User size={22} />}
          label="PROFILE"
          isActive={currentView === "profile"}
          onClick={() => onViewChange("profile")}
        />
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all outline-none ${
        isActive ? "relative" : "opacity-30 grayscale"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-x-[-12px] inset-y-[-8px] bg-bg rounded-lg -z-10 border border-border"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className={`transition-colors ${isActive ? "text-accent" : "text-text-muted"}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <span
        className={`text-[9px] font-bold tracking-widest ${
          isActive ? "text-accent" : "text-text-muted"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function SidebarItem({ icon, label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${
        isActive ? "bg-accent text-white shadow-lg" : "text-text-muted hover:bg-bg"
      }`}
    >
      <div className={`${isActive ? "text-white" : "text-accent"}`}>
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );
}
