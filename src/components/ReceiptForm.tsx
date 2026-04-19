import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, ReceiptText, Sparkles, Download, Share2, User, Mail, MapPin, CheckCircle2, StickyNote, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCurrency } from "../contexts/CurrencyContext";
import { useBusiness } from "../contexts/BusinessContext";
import { Receipt, ReceiptItem } from "../types";
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from "jspdf";

interface ReceiptFormProps {
  onGenerate: (data: Omit<Receipt, 'number' | 'id'>) => Promise<void>;
  receiptNumber: number;
}

export default function ReceiptForm({ onGenerate, receiptNumber }: ReceiptFormProps) {
  const { formatPrice, currency, currencySymbol } = useCurrency();
  const { businessInfo } = useBusiness();
  
  const [issuerName, setIssuerName] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_issuer_name") || businessInfo.name;
  });
  const [issuerEmail, setIssuerEmail] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_issuer_email") || businessInfo.email;
  });
  const [issuerPhone, setIssuerPhone] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_issuer_phone") || businessInfo.phone || "";
  });
  const [issuerAddress, setIssuerAddress] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_issuer_address") || businessInfo.address || "";
  });

  // Initialize state from local storage if a draft exists
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_name") || "";
  });
  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_email") || "";
  });
  const [customerAddress, setCustomerAddress] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_address") || "";
  });
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem("6tem_receipt_draft_notes") || "";
  });
  const [items, setItems] = useState<ReceiptItem[]>(() => {
    const saved = localStorage.getItem("6tem_receipt_draft_items");
    return saved ? JSON.parse(saved) : [{ id: "1", name: "", description: "", quantity: 1, price: 0 }];
  });
  const [taxRate, setTaxRate] = useState(() => {
    const saved = localStorage.getItem("6tem_receipt_draft_tax");
    return saved !== null ? parseFloat(saved) : 7.5;
  });
  const [discountValue, setDiscountValue] = useState(() => {
    const saved = localStorage.getItem("6tem_receipt_draft_discount_val");
    return saved !== null ? parseFloat(saved) : 0;
  });
  const [discountType, setDiscountType] = useState<"percent" | "amount">(() => {
    return (localStorage.getItem("6tem_receipt_draft_discount_type") as "percent" | "amount") || "percent";
  });
  
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'png' | 'pdf' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Auto-save effect
  useEffect(() => {
    localStorage.setItem("6tem_receipt_draft_issuer_name", issuerName);
    localStorage.setItem("6tem_receipt_draft_issuer_email", issuerEmail);
    localStorage.setItem("6tem_receipt_draft_issuer_phone", issuerPhone);
    localStorage.setItem("6tem_receipt_draft_issuer_address", issuerAddress);
    localStorage.setItem("6tem_receipt_draft_name", customerName);
    localStorage.setItem("6tem_receipt_draft_email", customerEmail);
    localStorage.setItem("6tem_receipt_draft_address", customerAddress);
    localStorage.setItem("6tem_receipt_draft_notes", notes);
    localStorage.setItem("6tem_receipt_draft_items", JSON.stringify(items));
    localStorage.setItem("6tem_receipt_draft_tax", taxRate.toString());
    localStorage.setItem("6tem_receipt_draft_discount_val", discountValue.toString());
    localStorage.setItem("6tem_receipt_draft_discount_type", discountType);
  }, [customerName, customerEmail, customerAddress, notes, items, taxRate, discountValue, discountType]);
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return acc + (qty * price);
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === "percent") {
      return (subtotal * (Number(discountValue) || 0)) / 100;
    }
    return Number(discountValue) || 0;
  }, [subtotal, discountValue, discountType]);

  const taxableAmount = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const taxAmount = useMemo(() => (taxableAmount * (Number(taxRate) || 0)) / 100, [taxableAmount, taxRate]);
  const totalAmount = useMemo(() => taxableAmount + taxAmount, [taxableAmount, taxAmount]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: "", description: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    setExportType('png');
    try {
      const dataUrl = await toPng(receiptRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, 
        backgroundColor: '#ffffff'
      });
      download(dataUrl, `receipt-${receiptNumber}.png`);
    } catch (err) {
      console.error('oops, something went wrong!', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    setExportType('pdf');
    try {
      const dataUrl = await toPng(receiptRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, 
        backgroundColor: '#ffffff'
      });
      
      // Calculate dynamic PDF dimensions to fit all content
      const pdfWidth = 210; // Standard A4 width in mm
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      const pdfHeight = (img.height * pdfWidth) / img.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${receiptNumber}.pdf`);
    } catch (err) {
      console.error('oops, something went wrong!', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `receipt-${receiptNumber}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt #${receiptNumber}`,
          text: `Invoice from ${businessInfo.name}`,
        });
      } else {
        // High-fidelity fallback: Copy image to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          alert("Receipt image copied to clipboard! You can now paste it directly into a chat or email.");
        } catch (copyErr) {
          // Final fallback: Text details
          const shareText = `Receipt #${receiptNumber} from ${businessInfo.name}\nTotal: ${formatPrice(totalAmount)}\nDate: ${new Date().toLocaleDateString()}`;
          await navigator.clipboard.writeText(shareText);
          alert("Receipt summary copied to clipboard!");
        }
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert("Sharing failed. Please use the Download option.");
    }
  };

  const handleFinalize = async () => {
    if (subtotal === 0 || !customerName) return;
    
    setIsFinalizing(true);
    try {
      await onGenerate({
        date: new Date().toLocaleDateString('en-GB'),
        businessName: issuerName,
        businessEmail: issuerEmail,
        businessPhone: issuerPhone,
        businessAddress: issuerAddress,
        businessLogo: businessInfo.logo,
        customerName,
        customerEmail,
        customerAddress,
        notes,
        items: items.filter(i => i.name),
        subtotal,
        discountValue: Number(discountValue) || 0,
        discountType,
        taxRate: Number(taxRate) || 0,
        total: totalAmount,
        currency: currency,
        currencySymbol: currencySymbol
      });

      // Clear draft on successful finalize
      localStorage.removeItem("6tem_receipt_draft_issuer_name");
      localStorage.removeItem("6tem_receipt_draft_issuer_email");
      localStorage.removeItem("6tem_receipt_draft_issuer_phone");
      localStorage.removeItem("6tem_receipt_draft_issuer_address");
      localStorage.removeItem("6tem_receipt_draft_name");
      localStorage.removeItem("6tem_receipt_draft_email");
      localStorage.removeItem("6tem_receipt_draft_address");
      localStorage.removeItem("6tem_receipt_draft_notes");
      localStorage.removeItem("6tem_receipt_draft_items");
      localStorage.removeItem("6tem_receipt_draft_tax");
      localStorage.removeItem("6tem_receipt_draft_discount_val");
      localStorage.removeItem("6tem_receipt_draft_discount_type");
    } catch (err) {
      console.error("Finalization failed", err);
      alert("Failed to save receipt. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const resetForm = () => {
    setShowResetConfirm(false);
    setIssuerName(businessInfo.name);
    setIssuerEmail(businessInfo.email);
    setIssuerPhone(businessInfo.phone || "");
    setIssuerAddress(businessInfo.address || "");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerAddress("");
    setNotes("");
    setItems([{ id: "1", name: "", description: "", quantity: 1, price: 0 }]);
    setTaxRate(7.5);
    setDiscountValue(0);
    setDiscountType("percent");
    
    localStorage.removeItem("6tem_receipt_draft_issuer_name");
    localStorage.removeItem("6tem_receipt_draft_issuer_email");
    localStorage.removeItem("6tem_receipt_draft_issuer_phone");
    localStorage.removeItem("6tem_receipt_draft_issuer_address");
    localStorage.removeItem("6tem_receipt_draft_name");
    localStorage.removeItem("6tem_receipt_draft_email");
    localStorage.removeItem("6tem_receipt_draft_address");
    localStorage.removeItem("6tem_receipt_draft_notes");
    localStorage.removeItem("6tem_receipt_draft_items");
    localStorage.removeItem("6tem_receipt_draft_tax");
    localStorage.removeItem("6tem_receipt_draft_discount_val");
    localStorage.removeItem("6tem_receipt_draft_discount_type");
  };

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border p-8 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-primary tracking-tight uppercase">Clear This Draft?</h3>
                <p className="text-sm text-text-muted font-medium leading-relaxed">
                  You are about to permanently delete all data in this draft. This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="w-full py-4 bg-error text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:scale-[0.98] shadow-lg shadow-red-900/20"
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-bg text-primary border border-border rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-border transition-all active:scale-[0.98]"
                >
                  No, Keep Working
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tighter text-primary">Generate Receipt</h2>
          <div className="flex items-center gap-3">
            <p className="text-text-muted font-medium text-sm">Professional invoicing for your business.</p>
            {(customerName || customerEmail || customerAddress || (items.length > 1 || items[0].name || items[0].price > 0)) && (
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="text-[10px] font-bold text-error uppercase tracking-widest hover:underline px-2 py-1 rounded hover:bg-error/5 transition-colors"
              >
                Reset Form
              </button>
            )}
          </div>
        </div>
        <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
          <ReceiptText className="text-accent" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Column */}
        <div className="space-y-8">
          {/* Business Info (Issuer) */}
          <section className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ReceiptText size={16} className="text-accent" />
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Business Details (Issuer)</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Business Name</label>
                <input 
                  type="text" 
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  placeholder="Your Business Name"
                  className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Business Email</label>
                  <input 
                    type="email" 
                    value={issuerEmail}
                    onChange={(e) => setIssuerEmail(e.target.value)}
                    placeholder="billing@yourbiz.com"
                    className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Business Phone</label>
                  <input 
                    type="tel" 
                    value={issuerPhone}
                    onChange={(e) => setIssuerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Business Address</label>
                <textarea 
                  value={issuerAddress}
                  onChange={(e) => setIssuerAddress(e.target.value)}
                  placeholder="Business Street Address"
                  rows={2}
                  className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* Customer Info */}
          <section className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User size={16} className="text-accent" />
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Customer Information</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Customer Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Customer Email</label>
                <input 
                  type="email" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Customer Address</label>
                <textarea 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Street address, City"
                  rows={2}
                  className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Line Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Line Items</h3>
               <button 
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-accent text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  <Plus size={12} /> Add Item
               </button>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-start gap-3">
                       <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Item Title</label>
                          <input 
                            type="text" 
                            placeholder="Product or service name"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="w-full bg-bg border border-border px-4 py-2.5 rounded-lg text-sm text-text-main focus:border-accent outline-none font-medium transition-all"
                          />
                       </div>
                       <button 
                          onClick={() => removeItem(item.id)}
                          className="mt-7 p-2.5 text-text-muted hover:text-error hover:bg-error/5 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                       </button>
                    </div>

                    <div className="space-y-1.5 px-1">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Optional Description</label>
                      <textarea 
                        placeholder="Additional details about this product or service..."
                        value={item.description || ""}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-bg border border-border px-4 py-2.5 rounded-lg text-sm text-text-main focus:border-accent outline-none font-medium transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Quantity</label>
                        <input 
                          type="number" 
                          min="0"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-bg border border-border px-4 py-2.5 rounded-lg text-sm text-text-main focus:border-accent outline-none font-medium transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Unit Price</label>
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={item.price || ""}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-bg border border-border px-4 py-2.5 rounded-lg text-sm text-text-main focus:border-accent outline-none font-medium transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center px-1 pt-1">
                       <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Line Total</span>
                       <span className="text-xs font-black text-primary">
                         {formatPrice((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                       </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Notes for Customer */}
          <section className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <StickyNote size={16} className="text-accent" />
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Notes to Customer</h3>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Message</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Thank you for your business! Please pay within 15 days."
                rows={3}
                className="w-full bg-bg border border-border px-4 py-3 rounded-lg text-sm font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-mono"
              />
            </div>
          </section>

          {/* Action Footer */}
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Discount</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        min="0"
                        value={discountValue || ""}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-bg border border-border px-4 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-accent transition-all pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">
                        {discountType === "percent" ? "%" : currencySymbol}
                      </span>
                    </div>
                    <select 
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")}
                      className="bg-bg border border-border px-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest outline-none focus:border-accent"
                    >
                      <option value="percent">%</option>
                      <option value="amount">{currencySymbol}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Tax Rate (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-bg border border-border px-4 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-accent transition-all pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">%</span>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border/50">
                <div className="space-y-0.5">
                   <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Discount Amount</p>
                   <p className="text-sm font-black text-error">-{formatPrice(discountAmount)}</p>
                </div>
                <div className="space-y-0.5">
                   <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Tax Amount</p>
                   <p className="text-sm font-black text-primary">{formatPrice(taxAmount)}</p>
                </div>
             </div>
          </div>

            <div className="bg-primary rounded-xl p-6 text-bg dark:text-bg shadow-xl shadow-slate-200 dark:shadow-none">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-bg/10 dark:border-bg/10">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Grand Total</span>
                <span className="text-3xl font-black tracking-tighter text-accent">{formatPrice(totalAmount)}</span>
              </div>
              <button 
                onClick={handleFinalize}
                disabled={subtotal === 0 || !customerName || isFinalizing}
                className="w-full py-4 bg-accent hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
              >
                {isFinalizing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isFinalizing ? "Saving to Cloud..." : "Finalize & Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div className="flex items-center justify-between px-1">
             <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Standard Receipt Preview</h4>
             <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="p-2 text-text-muted hover:text-accent rounded-lg border border-border bg-card transition-all shadow-sm"
                  title="Share Receipt"
                >
                  <Share2 size={14} />
                </button>
                <button 
                  onClick={handleDownloadPNG}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-2 text-accent bg-card border border-accent/20 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-sm disabled:opacity-50"
                  title="Download PNG"
                >
                  <Download size={12} />
                  {isExporting && exportType === 'png' ? '...' : 'PNG'}
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-2 text-white bg-accent border border-accent/20 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                  title="Download PDF"
                >
                  <FileText size={12} />
                  {isExporting && exportType === 'pdf' ? '...' : 'PDF'}
                </button>
             </div>
          </div>

          <div 
            ref={receiptRef}
            className="bg-white rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col min-h-[700px] w-full max-w-[500px] mx-auto origin-top"
          >
            {/* Header / Business Info */}
            <div className="p-10 border-b-[8px] border-primary bg-slate-50 relative">
               <div className="flex justify-between items-start gap-6">
                  <div className="space-y-4 flex-1">
                     {businessInfo.logo ? (
                        <img src={businessInfo.logo} alt="Logo" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                     ) : (
                        <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-white">
                           <ReceiptText size={32} />
                        </div>
                     )}
                     <div className="space-y-1">
                        <h1 className="text-2xl font-black text-primary tracking-tighter leading-none">{issuerName}</h1>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 pt-1">
                          <Mail size={10} className="text-accent" /> {issuerEmail}
                        </p>
                        {issuerPhone && (
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 pt-0.5">
                             <span className="text-[10px] text-accent">✆</span> {issuerPhone}
                          </p>
                        )}
                     </div>
                  </div>
                  <div className="text-right space-y-3">
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">Official Receipt</p>
                        <p className="text-xl font-black text-primary tracking-tighter">#INV-{receiptNumber.toString().padStart(5, '0')}</p>
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Date</p>
                        <p className="text-xs font-bold text-primary">{new Date().toLocaleDateString('en-GB')}</p>
                     </div>
                  </div>
               </div>

               {/* Business Contact Footer */}
               <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border/50 pt-6">
                  {issuerAddress && (
                    <div className="flex gap-2 bg-white/50 p-2 rounded border border-border/10">
                       <MapPin size={12} className="text-accent shrink-0 mt-0.5" />
                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight whitespace-pre-line leading-relaxed">
                          {issuerAddress}
                       </p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-tight">
                        <Mail size={10} className="text-accent" />
                        {issuerEmail}
                     </div>
                     {issuerPhone && (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-tight">
                           <div className="w-[10px] flex justify-center">
                              <span className="text-[10px] text-accent">✆</span>
                           </div>
                           {issuerPhone}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Bill To */}
            <div className="px-10 py-8 bg-white border-b border-border">
               <div className="space-y-2">
                  <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Bill To:</p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-black text-primary tracking-tight">{customerName || "Customer Name"}</p>
                    <p className="text-[10px] font-bold text-text-muted flex items-center gap-1.5 opacity-80">
                      <Mail size={10} className="text-accent" />
                      {customerEmail || "customer@example.com"}
                    </p>
                    {customerAddress && (
                      <div className="flex gap-1.5 pt-1">
                        <MapPin size={10} className="text-accent shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-text-muted leading-relaxed uppercase">
                          {customerAddress}
                        </p>
                      </div>
                    )}
                    {!customerAddress && (
                      <p className="text-[10px] font-bold text-text-muted/30 italic uppercase tracking-tighter pt-1">No Address Provided</p>
                    )}
                  </div>
               </div>
            </div>

            {/* Content Table */}
            <div className="px-10 py-8 flex-1">
               <table className="w-full">
                  <thead className="border-b-2 border-primary/10">
                    <tr>
                      <th className="py-4 text-left text-[9px] font-black text-primary uppercase tracking-widest">Description</th>
                      <th className="py-4 text-center text-[9px] font-black text-primary uppercase tracking-widest">Qty</th>
                      <th className="py-4 text-right text-[9px] font-black text-primary uppercase tracking-widest">Price</th>
                      <th className="py-4 text-right text-[9px] font-black text-primary uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.filter(i => i.name).map((item) => (
                      <tr key={item.id}>
                        <td className="py-5">
                          <p className="text-xs font-bold text-primary tracking-tight">{item.name}</p>
                          {item.description && (
                            <p className="text-[9px] font-medium text-text-muted mt-1 leading-relaxed italic">{item.description}</p>
                          )}
                        </td>
                        <td className="py-5 text-center text-xs font-bold text-text-muted">{Number(item.quantity) || 0}</td>
                        <td className="py-5 text-right text-xs font-bold text-text-muted">{formatPrice(Number(item.price) || 0)}</td>
                        <td className="py-5 text-right text-sm font-black text-primary tracking-tighter">{formatPrice((Number(item.quantity) || 0) * (Number(item.price) || 0))}</td>
                      </tr>
                    ))}
                    {items.filter(i => i.name).length === 0 && (
                       <tr>
                         <td colSpan={4} className="py-12 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-30">
                            Awaiting line items...
                         </td>
                       </tr>
                    )}
                  </tbody>
               </table>
            </div>

            {/* Customer Notes in Preview */}
            {notes && (
              <div className="px-10 py-6 border-t border-border/50 bg-slate-50/30">
                <p className="text-[8px] font-black text-accent uppercase tracking-[0.2em] mb-2">Notes:</p>
                <p className="text-[10px] font-bold text-text-muted leading-relaxed whitespace-pre-line italic">
                  "{notes}"
                </p>
              </div>
            )}

            {/* Calculations Footer */}
            <div className="p-10 bg-slate-50 flex justify-between items-end">
               <div className="bg-white p-2 rounded-lg border border-border">
                  <QRCodeSVG 
                    value={`Receipt: #INV-${receiptNumber.toString().padStart(5, '0')}\nTotal: ${formatPrice(totalAmount)}\nIssuer: ${businessInfo.name}\nDate: ${new Date().toLocaleDateString('en-GB')}`}
                    size={64}
                    level="M"
                    includeMargin={false}
                  />
                  <p className="text-[6px] font-bold text-text-muted mt-1 text-center uppercase tracking-tighter">Scan to Verify</p>
               </div>
               <div className="w-48 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                     <span>Subtotal</span>
                     <span className="text-primary">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-error uppercase tracking-widest">
                       <span>Discount {discountType === "percent" ? `(${discountValue}%)` : ""}</span>
                       <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                     <span>Tax ({taxRate}%)</span>
                     <span className="text-primary">{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="pt-3 border-t-2 border-primary flex justify-between items-center">
                     <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Grand Total</span>
                     <span className="text-xl font-black text-accent tracking-tighter">{formatPrice(totalAmount)}</span>
                  </div>
               </div>
            </div>

            {/* Footnote */}
            <div className="px-10 py-6 border-t border-dashed border-border flex justify-between items-center">
               <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">Issued via 6tem Receipts</p>
               <p className="text-[10px] font-black text-primary uppercase">Thank You!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
