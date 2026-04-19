import { useState, useEffect } from "react";

import { Receipt, BusinessInfo } from "../types";

export function useReceiptLocalStorage() {
  const [receiptCount, setReceiptCount] = useState<number>(() => {
    const saved = localStorage.getItem("6tem_receipt_count");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem("6tem_receipts_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("6tem_receipt_count", receiptCount.toString());
  }, [receiptCount]);

  useEffect(() => {
    localStorage.setItem("6tem_receipts_history", JSON.stringify(receipts));
  }, [receipts]);

  const addReceipt = (receipt: Omit<Receipt, 'number' | 'id'>) => {
    const newCount = receiptCount;
    const newReceipt: Receipt = {
      ...receipt,
      number: newCount,
      id: `INV-${newCount.toString().padStart(5, '0')}`,
    };
    
    setReceipts(prev => [newReceipt, ...prev]);
    setReceiptCount(prev => prev + 1);
  };

  const clearAllData = () => {
    setReceiptCount(0);
    setReceipts([]);
    localStorage.removeItem("6tem_receipt_count");
    localStorage.removeItem("6tem_receipts_history");
    localStorage.removeItem("6tem_currency_pref");
    localStorage.removeItem("6tem_business_info");
    // We might want to force a reload or update contexts
    window.location.reload(); 
  };

  return { receiptCount, receipts, addReceipt, clearAllData };
}
