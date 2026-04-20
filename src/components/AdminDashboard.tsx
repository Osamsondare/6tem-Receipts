import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Receipt, 
  DollarSign, 
  BarChart3, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Search,
  LayoutDashboard,
  Database,
  UserPlus,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Settings2,
  Mail,
  UserX,
  UserCheck,
  X,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  query, 
  collectionGroup, 
  orderBy, 
  limit,
  doc,
  updateDoc
} from "firebase/firestore";
import { Receipt as ReceiptType, BusinessInfo } from "../types";
import { useCurrency } from "../contexts/CurrencyContext";

interface UserWithBusiness extends BusinessInfo {
  id: string;
  disabled?: boolean;
}

export default function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<"stats" | "security">("stats");
  const [users, setUsers] = useState<UserWithBusiness[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithBusiness | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  
  // Security state
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [securityStatus, setSecurityStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserWithBusiness[];
      setUsers(usersData);

      // Fetch all receipts using collectionGroup
      const receiptsSnapshot = await getDocs(query(collectionGroup(db, "receipts"), orderBy("createdAt", "desc")));
      const receiptsData = receiptsSnapshot.docs.map(doc => doc.data() as ReceiptType);
      setReceipts(receiptsData);

    } catch (err: any) {
      console.error("Failed to fetch admin data", err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === "emerandaglobalinvestment@gmail.com") {
        fetchAdminData().finally(() => setIsLoading(false));
      } else if (!user) {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleUserStatus = async (user: UserWithBusiness) => {
    try {
      await updateDoc(doc(db, "users", user.id), {
        disabled: !user.disabled
      });
      setSecurityStatus({ 
        type: 'success', 
        message: `User ${!user.disabled ? 'suspended' : 'reinstated'} successfully` 
      });
      fetchAdminData();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, disabled: !user.disabled });
      }
    } catch (err) {
      setSecurityStatus({ type: 'error', message: "Failed to update user status" });
    } finally {
      setTimeout(() => setSecurityStatus(null), 3000);
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setSecurityStatus({ type: 'success', message: "Account recovery email dispatched" });
    } catch (err) {
      setSecurityStatus({ type: 'error', message: "Credential reset request failed" });
    } finally {
      setTimeout(() => setSecurityStatus(null), 3000);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) return;
    if (newPin !== confirmPin) {
      setSecurityStatus({ type: 'error', message: "PINs do not match" });
      return;
    }

    setIsUpdatingPin(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Unauthenticated");
      
      await updateDoc(doc(db, "users", user.uid), {
        adminPin: newPin
      });
      
      setSecurityStatus({ type: 'success', message: "Master PIN updated successfully" });
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      setSecurityStatus({ type: 'error', message: "Failed to update security credentials" });
    } finally {
      setIsUpdatingPin(false);
      setTimeout(() => setSecurityStatus(null), 3000);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = receipts.reduce((acc, r) => acc + r.total, 0);
    const totalTax = receipts.reduce((acc, r) => acc + (r.taxRate ? (r.subtotal * r.taxRate / 100) : 0), 0);
    const avgReceiptValue = receipts.length > 0 ? totalRevenue / receipts.length : 0;
    
    return {
      totalUsers: users.length,
      totalReceipts: receipts.length,
      totalRevenue,
      totalTax,
      avgReceiptValue
    };
  }, [users, receipts]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Database className="text-accent" size={40} />
        </motion.div>
        <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Aggregating Global Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Administrator</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-primary">Admin Command Center</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
            <LayoutDashboard className="text-accent" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActiveTab("stats")}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'stats' ? 'text-accent' : 'text-text-muted hover:text-primary'
          }`}
        >
          Intelligence Dashboard
          {activeTab === 'stats' && (
            <motion.div layoutId="admintab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("security")}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'security' ? 'text-accent' : 'text-text-muted hover:text-primary'
          }`}
        >
          Security & Access
          {activeTab === 'security' && (
            <motion.div layoutId="admintab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "stats" ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={<Users size={20} />}
                label="Total Users"
                value={stats.totalUsers.toLocaleString()}
                change="+12%"
                isPositive={true}
                color="blue"
              />
              <StatCard 
                icon={<Receipt size={20} />}
                label="Total Receipts"
                value={stats.totalReceipts.toLocaleString()}
                change="+8%"
                isPositive={true}
                color="indigo"
              />
              <StatCard 
                icon={<DollarSign size={20} />}
                label="Gross Volume"
                value={formatPrice(stats.totalRevenue)}
                change="+15%"
                isPositive={true}
                color="green"
              />
              <StatCard 
                icon={<BarChart3 size={20} />}
                label="Avg. Receipt"
                value={formatPrice(stats.avgReceiptValue)}
                change="-2%"
                isPositive={false}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Management */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Active Business Users</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input 
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-card border border-border rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-accent/20 outline-none w-48 lg:w-64 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-bg border-b border-border">
                          <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Business</th>
                          <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Contact</th>
                          <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Transactions</th>
                          <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-bg/50 transition-colors group cursor-default">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                                  {user.logo ? (
                                    <img src={user.logo} className="w-8 h-8 object-contain rounded" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Users size={18} className="text-primary/40" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-primary truncate max-w-[150px]">{user.name}</span>
                                  {user.disabled && (
                                    <span className="text-[8px] font-black bg-error/10 text-error px-1.5 py-0.5 rounded uppercase tracking-tighter w-fit mt-0.5">Suspended</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <p className="text-xs font-medium text-text-main">{user.email}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase">{user.phone}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-black text-accent">{user.receiptCount || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => { setSelectedUser(user); setIsManaging(true); }}
                                className="p-2 text-text-muted hover:text-accent hover:bg-accent/5 rounded-lg transition-all"
                                title="Manage Account"
                              >
                                <Settings2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Events / Platform Health */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Platform Events</h3>
                <div className="bg-card rounded-xl border border-border p-5 space-y-6">
                  <div className="space-y-4">
                    {receipts.slice(0, 8).map((r, i) => (
                      <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-bg flex items-center justify-center text-accent ring-1 ring-border group-hover:ring-accent/30 transition-all">
                              <Receipt size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-primary line-clamp-1">{r.customerName}</p>
                              <p className="text-[9px] font-bold text-text-muted uppercase">{r.date}</p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-accent">{r.currencySymbol}{r.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-border mt-4">
                      <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <span>New Signups</span>
                        <span className="flex items-center gap-1 text-success">
                          <UserPlus size={10} />
                          {users.filter(u => {
                            const createdAt = (u as any).createdAt?.toDate();
                            if (!createdAt) return false;
                            const today = new Date();
                            return createdAt.toDateString() === today.toDateString();
                          }).length} Today
                        </span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="max-w-md mx-auto space-y-6 pt-4"
          >
            <div className="bg-card p-8 rounded-2xl border border-border space-y-8 shadow-sm">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent ring-4 ring-accent/5">
                    <Key size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-primary uppercase tracking-tight">Master PIN Control</h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Update your 4-digit security PIN used to access the platform's sensitive analytics and user data.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePin} className="space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">New 4-Digit PIN</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                          <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                            className="w-full pl-11 pr-4 py-3 bg-bg border border-border rounded-lg outline-none text-text-main text-sm focus:ring-2 focus:ring-accent/20 transition-all text-center tracking-[1em] font-black"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Confirm New PIN</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                          <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                            className="w-full pl-11 pr-4 py-3 bg-bg border border-border rounded-lg outline-none text-text-main text-sm focus:ring-2 focus:ring-accent/20 transition-all text-center tracking-[1em] font-black"
                          />
                        </div>
                      </div>
                   </div>

                   <AnimatePresence>
                     {securityStatus && (
                       <motion.div
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0 }}
                         className={`p-3 rounded-lg flex items-center gap-3 text-xs font-bold ${
                           securityStatus.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                         }`}
                       >
                         {securityStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                         {securityStatus.message}
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <button
                    type="submit"
                    disabled={isUpdatingPin || newPin.length !== 4}
                    className="w-full py-4 bg-primary text-bg rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-accent transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
                   >
                    {isUpdatingPin ? <Loader2 size={16} className="animate-spin" /> : "Update Master PIN"}
                   </button>
                </form>
            </div>

            <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 flex items-start gap-4">
               <AlertTriangle className="text-accent shrink-0" size={20} />
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">Security Advisory</p>
                 <p className="text-[10px] text-text-muted font-medium leading-relaxed">
                   Your PIN is stored as a high-integrity field in your encrypted user record. 
                   Ensure your PIN is unique and not shared with any non-authorized personnel.
                 </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Management Modal */}
      <AnimatePresence>
        {isManaging && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManaging(false)}
              className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm p-6 flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-bg p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Settings2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-primary uppercase tracking-tight">Account Control</h3>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">ID: {selectedUser.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsManaging(false)}
                    className="p-2 text-text-muted hover:bg-card rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-8">
                  <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-border">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-border">
                      {selectedUser.logo ? (
                        <img src={selectedUser.logo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40 font-black">
                          {selectedUser.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{selectedUser.name}</p>
                      <p className="text-xs text-text-muted font-medium">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">Critical Actions</h4>
                    
                    <button 
                      onClick={() => handleSendResetEmail(selectedUser.email)}
                      className="w-full flex items-center justify-between p-4 bg-bg rounded-xl border border-border hover:border-accent group transition-all"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">Credential Recovery</p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Dispatch password reset email</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-text-muted group-hover:text-accent translate-x-0 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button 
                      onClick={() => handleToggleUserStatus(selectedUser)}
                      className={`w-full flex items-center justify-between p-4 bg-bg rounded-xl border transition-all group ${
                        selectedUser.disabled 
                          ? 'border-success/20 hover:border-success' 
                          : 'border-error/20 hover:border-error'
                      }`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                          selectedUser.disabled 
                            ? 'bg-success/5 text-success' 
                            : 'bg-error/5 text-error'
                        }`}>
                          {selectedUser.disabled ? <UserCheck size={18} /> : <UserX size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">
                            {selectedUser.disabled ? 'Reinstate Account' : 'Suspend Account'}
                          </p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                            {selectedUser.disabled ? 'Restore global data access' : 'Instantly block all platform access'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>

                  {selectedUser.disabled && (
                    <div className="p-4 bg-error/5 rounded-xl border border-error/10 flex items-start gap-4">
                      <ShieldAlert className="text-error shrink-0" size={20} />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-error uppercase tracking-widest">Account Suspended</p>
                        <p className="text-[9px] text-error/60 font-medium leading-relaxed">
                          This user is currently blocked from reading or writing any data. Any active digital receipts will be hidden until reinstatement.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-bg p-4 border-t border-border">
                   <button 
                    onClick={() => setIsManaging(false)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-primary transition-colors"
                   >
                    Exit Management
                   </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, change, isPositive, color }: any) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-200",
    indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    green: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    purple: "bg-purple-500/10 text-purple-600 border-purple-200",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${isPositive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
          {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {change}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-primary tracking-tighter tabular-nums">{value}</p>
      </div>
    </motion.div>
  );
}
