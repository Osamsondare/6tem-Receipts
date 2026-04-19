import { Plus, Settings, Coffee, Receipt, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useCurrency } from "../contexts/CurrencyContext";
import { Receipt as ReceiptType } from "../types";

const currencies: ("USD" | "EUR" | "GBP" | "JPY" | "NGN")[] = ["USD", "EUR", "GBP", "JPY", "NGN"];

export default function Dashboard({ 
  receiptCount, 
  receipts, 
  onCreateClick, 
  onReceiptClick,
  onViewAll
}: { 
  receiptCount: number, 
  receipts: ReceiptType[], 
  onCreateClick: () => void, 
  onReceiptClick: (r: ReceiptType) => void,
  onViewAll: () => void
}) {
  const { currency, setCurrency, formatPrice } = useCurrency();

  // Dynamic Weekly Logic
  const daysMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const chartDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Start on Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekReceipts = receipts.filter(r => {
    const [d, m, y] = r.date.split("/").map(Number);
    const rDate = new Date(y, m - 1, d);
    return rDate >= startOfWeek;
  });

  const weeklyTotals = thisWeekReceipts.reduce((acc: Record<string, number>, r) => {
    const [d, m, y] = r.date.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = daysMap[date.getDay()];
    acc[dayName] = (acc[dayName] || 0) + r.total;
    return acc;
  }, {});

  const maxDaily = Math.max(...Object.values(weeklyTotals), 0) || 1;
  const thisWeekTotal = thisWeekReceipts.reduce((acc, r) => acc + r.total, 0);

  const weeklyData = chartDays.map(day => {
    const value = weeklyTotals[day] || 0;
    const height = (value / maxDaily) * 100; // Percentage height
    return {
      day,
      value,
      height: Math.max(height, 5), // Min 5% height
      isPeak: value === maxDaily && value > 0,
      isStale: value === 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Global Overview Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-primary rounded-xl p-8 text-bg dark:text-bg shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-accent uppercase">Global Overview</p>
            <h2 className="text-4xl font-extrabold leading-none tracking-tighter text-bg dark:text-bg">
              {receiptCount} {receiptCount === 1 ? 'Receipt' : 'Receipts'} <br /> Created
            </h2>
          </div>
          <button 
            onClick={onCreateClick}
            className="bg-accent text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} strokeWidth={3} />
            Create New Receipt
          </button>
        </div>
      </motion.div>

      {/* Currency Preference */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Currency Preference</h3>
          <Settings size={14} className="text-text-muted" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {currencies.map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`py-2 rounded font-bold text-xs transition-all ${
                curr === currency
                  ? "bg-accent text-white shadow-md shadow-blue-100"
                  : "bg-bg text-text-muted hover:bg-border border border-border"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Volume */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Weekly Volume</h3>
            <p className="text-xs font-bold text-success flex items-center gap-1">
              <TrendingUp size={12} />
              +12.0% <span className="text-text-muted font-medium ml-1">vs last month</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(thisWeekTotal)}</p>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">This Week</p>
          </div>
        </div>

        {/* Custom Bar Chart */}
        <div className="flex items-end justify-between h-32 px-1 gap-1.5">
          {weeklyData.map((data) => (
            <div key={data.day} className="flex-1 flex flex-col items-center gap-2.5">
              <div className="flex flex-col items-center w-full relative group">
                {data.isPeak && (
                  <div className="absolute -top-7 bg-primary text-white px-2 py-0.5 rounded text-[9px] font-bold z-10 flex items-center">
                    Peak
                  </div>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${data.height}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`w-full max-w-[40px] rounded transition-all ${
                    data.isPeak 
                      ? "bg-accent" 
                      : data.isStale 
                        ? "bg-text-muted/20" 
                         : "bg-bg border border-border"
                  }`}
                />
              </div>
              <span className="text-[10px] font-bold text-text-muted">{data.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Recent Activity</h3>
          <button 
            onClick={onViewAll}
            className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wide"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {receipts.length > 0 ? (
            receipts.slice(0, 5).map((receipt) => (
              <ActivityItem
                key={receipt.id}
                icon={<Receipt size={20} className="text-accent" />}
                iconBg="bg-blue-50 border border-blue-100"
                title={receipt.customerName}
                subtitle={`${receipt.date} • #${receipt.number}`}
                amount={`${receipt.currencySymbol}${receipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                onClick={() => onReceiptClick(receipt)}
              />
            ))
          ) : (
            <div className="bg-bg p-8 rounded-xl border border-dashed border-border text-center">
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconBg, title, subtitle, amount, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3.5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 ${iconBg} dark:bg-slate-800/50 rounded-lg flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-text-main text-sm truncate">{title}</h4>
          <p className="text-[10px] text-text-muted font-bold tracking-tight uppercase">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-bold text-primary text-sm tabular-nums">{amount}</p>
        <ChevronRight size={14} className="text-border group-hover:text-accent transition-colors" />
      </div>
    </div>
  );
}
