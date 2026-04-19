import { useRef, useState } from "react";
import { X, Download, Share2, Mail, MapPin, ReceiptText, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt } from "../types";
import { useCurrency } from "../contexts/CurrencyContext";
import { useBusiness } from "../contexts/BusinessContext";
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { jsPDF } from "jspdf";

interface ReceiptViewerProps {
  receipt: Receipt;
  onClose: () => void;
}

export default function ReceiptViewer({ receipt, onClose }: ReceiptViewerProps) {
  const { formatPrice } = useCurrency();
  const { businessInfo } = useBusiness();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'png' | 'pdf' | null>(null);

  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    setExportType('png');
    try {
      const dataUrl = await toPng(receiptRef.current, { 
        quality: 1.0, 
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      download(dataUrl, `Receipt-${receipt.id}.png`);
    } catch (err) {
      console.error('Error downloading:', err);
      alert("Failed to download PNG. High resolution export might be blocked by browser settings.");
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
        quality: 1.0, 
        pixelRatio: 3, // Higher resolution for professional PDF
        backgroundColor: '#ffffff',
        cacheBust: true
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
      pdf.save(`Receipt-${receipt.id}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Receipt-${receipt.id}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `Receipt #${receipt.number}`,
          text: `Invoice from ${receipt.businessName}`
        });
      } else {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          alert("Receipt image copied to clipboard!");
        } catch (copyErr) {
          await navigator.clipboard.writeText(`Receipt #${receipt.number} from ${receipt.businessName}\nTotal: ${receipt.currencySymbol}${receipt.total.toLocaleString()}\nDate: ${receipt.date}`);
          alert("Receipt summary copied to clipboard!");
        }
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert("Sharing failed. Please use download instead.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-primary/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-bg w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border"
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-bg rounded-lg text-text-muted transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-black text-primary tracking-tight">Receipt #{receipt.number}</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-text-main bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-bg transition-all"
            >
              <Share2 size={16} /> Share
            </button>
            <button 
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-card text-accent border border-accent/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
              {isExporting && exportType === 'png' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting && exportType === 'png' ? 'Saving...' : 'PNG'}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
            >
              {isExporting && exportType === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {isExporting && exportType === 'pdf' ? 'Saving...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-bg flex justify-center items-start">
           <div 
             ref={receiptRef}
             className="bg-white w-full max-w-[500px] shadow-xl border border-border flex flex-col min-h-[700px] mx-auto origin-top"
           >
              {/* Header / Business Info */}
              <div className="p-10 border-b-[8px] border-primary bg-slate-50 relative">
                 <div className="flex justify-between items-start gap-6">
                    <div className="space-y-4 flex-1">
                       {receipt.businessLogo ? (
                          <img src={receipt.businessLogo} alt="Logo" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                       ) : businessInfo.logo ? (
                          <img src={businessInfo.logo} alt="Logo" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                       ) : (
                          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-white">
                             <ReceiptText size={32} />
                          </div>
                       )}
                       <div className="space-y-1">
                          <h1 className="text-2xl font-black text-primary tracking-tighter leading-none">{receipt.businessName}</h1>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 pt-1">
                            <Mail size={10} className="text-accent" /> {receipt.businessEmail}
                          </p>
                          {receipt.businessPhone && (
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 pt-0.5">
                               <span className="text-[10px] text-accent">✆</span> {receipt.businessPhone}
                            </p>
                          )}
                       </div>
                    </div>
                    <div className="text-right space-y-3">
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">Official Receipt</p>
                          <p className="text-xl font-black text-primary tracking-tighter">#INV-{receipt.number.toString().padStart(5, '0')}</p>
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Date</p>
                          <p className="text-xs font-bold text-primary">{receipt.date}</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border/50 pt-6">
                    {receipt.businessAddress && (
                      <div className="flex gap-2 bg-white/50 p-2 rounded border border-border/10">
                         <MapPin size={12} className="text-accent shrink-0 mt-0.5" />
                         <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight whitespace-pre-line leading-relaxed">
                            {receipt.businessAddress}
                         </p>
                      </div>
                    )}
                    <div className="space-y-1.5">
                       <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-tight">
                          <Mail size={10} className="text-accent" />
                          {receipt.businessEmail}
                       </div>
                       {receipt.businessPhone && (
                          <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-tight">
                             <div className="w-[10px] flex justify-center">
                                <span className="text-[10px] text-accent">✆</span>
                             </div>
                             {receipt.businessPhone}
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
                      <p className="text-sm font-black text-primary tracking-tight">{receipt.customerName}</p>
                      <p className="text-[10px] font-bold text-text-muted flex items-center gap-1.5 opacity-80">
                        <Mail size={10} className="text-accent" />
                        {receipt.customerEmail || "No Email Provided"}
                      </p>
                      {receipt.customerAddress && (
                        <div className="flex gap-1.5 pt-1">
                          <MapPin size={10} className="text-accent shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-text-muted leading-relaxed uppercase">
                            {receipt.customerAddress}
                          </p>
                        </div>
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
                      {receipt.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-5">
                            <p className="text-xs font-bold text-primary tracking-tight">{item.name}</p>
                            {item.description && (
                              <p className="text-[9px] font-medium text-text-muted mt-1 leading-relaxed italic">{item.description}</p>
                            )}
                          </td>
                          <td className="py-5 text-center text-xs font-bold text-text-muted">{item.quantity}</td>
                          <td className="py-5 text-right text-xs font-bold text-text-muted">{receipt.currencySymbol}{item.price.toLocaleString()}</td>
                          <td className="py-5 text-right text-sm font-black text-primary tracking-tighter">{receipt.currencySymbol}{(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>

              {/* Totals Section */}
              <div className="px-10 py-8 bg-slate-50 border-t-4 border-primary">
                 <div className="flex justify-end">
                    <div className="w-full max-w-[200px] space-y-3">
                       <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span className="text-primary">{receipt.currencySymbol}{receipt.subtotal.toLocaleString()}</span>
                       </div>
                       
                       {receipt.discountValue && receipt.discountValue > 0 && (
                         <div className="flex justify-between items-center text-[10px] font-bold text-error uppercase tracking-widest">
                            <span>Discount</span>
                            <span>-{receipt.discountType === 'percent' ? `${receipt.discountValue}%` : `${receipt.currencySymbol}${receipt.discountValue}`}</span>
                         </div>
                       )}

                       {receipt.taxRate && receipt.taxRate > 0 && (
                         <div className="flex justify-between items-center text-[10px] font-bold text-primary uppercase tracking-widest">
                            <span>Tax ({receipt.taxRate}%)</span>
                            <span>+{receipt.currencySymbol}{(receipt.subtotal * (receipt.taxRate / 100)).toLocaleString()}</span>
                       </div>
                       )}

                       <div className="pt-3 border-t border-border flex justify-between items-center">
                          <span className="text-xs font-black text-primary uppercase tracking-widest">Total</span>
                          <span className="text-xl font-black text-primary tracking-tighter">{receipt.currencySymbol}{receipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer Notes */}
              <div className="px-10 py-8 text-center space-y-4 border-t border-border bg-white">
                 {receipt.notes && (
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Notes</p>
                      <p className="text-[10px] font-medium text-primary italic leading-relaxed">
                         "{receipt.notes}"
                      </p>
                   </div>
                 )}
                 <div className="pt-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Thank You</p>
                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-50">Authorized 6tem Receipt</p>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
