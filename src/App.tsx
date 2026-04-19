/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Splash from "./components/Splash";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import BusinessProfile from "./components/BusinessProfile";
import ReceiptForm from "./components/ReceiptForm";
import ReceiptViewer from "./components/ReceiptViewer";
import Policy from "./components/Policy";
import About from "./components/About";
import Terms from "./components/Terms";
import { AnimatePresence, motion } from "motion/react";
import { History, PlusCircle, ArrowDownWideNarrow, Receipt as ReceiptIcon, ChevronRight } from "lucide-react";
import { useReceipts } from "./contexts/ReceiptsContext";
import { auth, testConnection } from "./lib/firebase";
import { Receipt } from "./types";

type View = "splash" | "auth" | "dashboard" | "profile" | "history" | "new" | "policy" | "about" | "terms";
type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export default function App() {
  const [view, setView] = useState<View>("splash");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const { receiptCount, receipts, addReceipt, clearAllData } = useReceipts();

  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    testConnection();
    const timer = setTimeout(() => setSplashDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!splashDone) return;
      if (user) {
        setView(current => (current === "splash" || current === "auth") ? "dashboard" : current);
      } else {
        setView(current => (current === "policy" || current === "terms" || current === "about") ? current : "auth");
      }
    });
    return () => unsubscribe();
  }, [splashDone]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setView("auth");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const renderView = () => {
    switch (view) {
      case "splash":
        return <Splash />;
      case "auth":
        return <Auth onLogin={() => setView("dashboard")} onViewChange={setView} />;
      case "dashboard":
        return (
          <Dashboard 
            receiptCount={receiptCount} 
            receipts={receipts}
            onCreateClick={() => setView("new")} 
            onReceiptClick={setSelectedReceipt}
            onViewAll={() => setView("history")}
          />
        );
      case "profile":
        return <BusinessProfile />;
      case "history":
        const sortedReceipts = [...receipts].sort((a, b) => {
          if (sortBy === "date-desc" || sortBy === "date-asc") {
            // Parse DD/MM/YYYY
            const [da, ma, ya] = a.date.split("/").map(Number);
            const [db, mb, yb] = b.date.split("/").map(Number);
            const dateA = new Date(ya, ma - 1, da).getTime();
            const dateB = new Date(yb, mb - 1, db).getTime();
            return sortBy === "date-desc" ? dateB - dateA : dateA - dateB;
          }
          if (sortBy === "amount-desc" || sortBy === "amount-asc") {
            return sortBy === "amount-desc" ? b.total - a.total : a.total - b.total;
          }
          return 0;
        });

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold tracking-tighter text-primary">History</h2>
              <div className="flex items-center gap-4">
                {receipts.length > 0 && (
                  <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm">
                    <ArrowDownWideNarrow size={14} className="text-accent" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-transparent text-[10px] font-bold text-primary uppercase tracking-widest outline-none border-none cursor-pointer"
                    >
                      <option className="bg-card" value="date-desc">Newest First</option>
                      <option className="bg-card" value="date-asc">Oldest First</option>
                      <option className="bg-card" value="amount-desc">Highest Amount</option>
                      <option className="bg-card" value="amount-asc">Lowest Amount</option>
                    </select>
                  </div>
                )}
                <button 
                  onClick={clearAllData}
                  className="text-[10px] font-bold text-error uppercase tracking-widest hover:underline"
                >
                  Clear All App Data
                </button>
              </div>
            </div>
            
            {receipts.length === 0 ? (
              <div className="bg-card p-12 rounded-xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 bg-bg rounded-lg flex items-center justify-center mx-auto text-text-muted">
                  <History size={32} />
                </div>
                <p className="font-bold text-text-main">No past receipts yet</p>
                <button 
                  onClick={() => setView("new")}
                  className="text-accent font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Create your first one
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReceipts.map((receipt) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={receipt.id} 
                    onClick={() => setSelectedReceipt(receipt)}
                    className="bg-card p-4 rounded-xl border border-border flex justify-between items-center shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-bg rounded-lg flex items-center justify-center text-accent">
                        <ReceiptIcon size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-primary tracking-tight">{receipt.id}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{receipt.customerName} • {receipt.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                         <p className="font-black text-accent">{receipt.currencySymbol}{receipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <ChevronRight size={14} className="text-border group-hover:text-accent transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      case "new":
        return (
          <ReceiptForm 
            receiptNumber={receiptCount}
            onGenerate={async (data) => {
              await addReceipt(data);
              setView("history");
            }}
          />
        );
      case "policy":
        return <Policy />;
      case "terms":
        return <Terms />;
      case "about":
        return <About />;
      default:
        return (
          <Dashboard 
            receiptCount={receiptCount} 
            receipts={receipts}
            onCreateClick={() => setView("new")} 
            onReceiptClick={setSelectedReceipt}
            onViewAll={() => setView("history")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {view === "splash" || view === "auth" || view === "policy" || view === "terms" || view === "about" ? (
            <div className="relative">
              {(view === "policy" || view === "terms" || view === "about") && (
                <button 
                  onClick={() => setView(auth.currentUser ? "dashboard" : "auth")}
                  className="fixed top-6 left-6 z-[60] bg-card p-3 rounded-xl border border-border shadow-lg text-primary hover:text-accent transition-colors"
                >
                  <ArrowDownWideNarrow className="rotate-90" size={20} />
                </button>
              )}
              {renderView()}
            </div>
          ) : (
            <Layout currentView={view} onViewChange={setView} onLogout={handleLogout}>
              {renderView()}
              <AnimatePresence>
                {selectedReceipt && (
                  <ReceiptViewer 
                    receipt={selectedReceipt} 
                    onClose={() => setSelectedReceipt(null)} 
                  />
                )}
              </AnimatePresence>
            </Layout>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
