import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { auth, db, handleFirestoreError } from "../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  writeBatch,
  setDoc,
  getDocs
} from "firebase/firestore";
import { Receipt } from "../types";
import { useBusiness } from "./BusinessContext";
import ConfirmationModal from '../components/ConfirmationModal';

interface ReceiptsContextType {
  receipts: Receipt[];
  receiptCount: number;
  addReceipt: (receipt: Omit<Receipt, 'number' | 'id'>) => Promise<void>;
  clearAllData: () => void; // Changed to sync call that opens modal
  isSyncing: boolean;
}

const ReceiptsContext = createContext<ReceiptsContextType | undefined>(undefined);

export function ReceiptsProvider({ children }: { children: React.ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const { businessInfo, resetBusinessData } = useBusiness();

  useEffect(() => {
    let unsubscribeReceipts: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      console.log("ReceiptsContext: Auth state changed", user?.uid);
      setIsSyncing(true);
      if (unsubscribeReceipts) {
        unsubscribeReceipts();
        unsubscribeReceipts = null;
      }

      if (user) {
        const receiptsRef = collection(db, "users", user.uid, "receipts");
        const q = query(receiptsRef, orderBy("createdAt", "desc"));
        
        unsubscribeReceipts = onSnapshot(q, (snap) => {
          const fetchedReceipts = snap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Receipt[];
          setReceipts(fetchedReceipts);
          setIsSyncing(false);
        }, err => {
          if (auth.currentUser) {
            handleFirestoreError(err, 'list', `users/${user.uid}/receipts`);
          }
          setIsSyncing(false);
        });
      } else {
        // Local fallback
        const saved = localStorage.getItem("6tem_receipts_history");
        setReceipts(saved ? JSON.parse(saved) : []);
        setIsSyncing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeReceipts) unsubscribeReceipts();
    };
  }, []);

  const addReceipt = useCallback(async (receipt: Omit<Receipt, 'number' | 'id'>) => {
    const user = auth.currentUser;
    if (user) {
      const batch = writeBatch(db);
      const userDocRef = doc(db, "users", user.uid);
      
      const currentCount = businessInfo.receiptCount || 0;
      const receiptId = `INV-${currentCount.toString().padStart(5, '0')}`;
      const receiptDocRef = doc(db, "users", user.uid, "receipts", receiptId);

      batch.set(receiptDocRef, {
        ...receipt,
        number: currentCount,
        id: receiptId,
        createdAt: serverTimestamp()
      });
      
      batch.set(userDocRef, {
        receiptCount: currentCount + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, 'write', `users/${user.uid}/receipts`);
      }
    } else {
      const newCount = receipts.length;
      const receiptId = `INV-${newCount.toString().padStart(5, '0')}`;
      const newReceipt: Receipt = {
        ...receipt,
        number: newCount,
        id: receiptId,
      };
      
      const updatedReceipts = [newReceipt, ...receipts];
      setReceipts(updatedReceipts);
      localStorage.setItem("6tem_receipts_history", JSON.stringify(updatedReceipts));
    }
  }, [businessInfo.receiptCount, receipts]);

  const handleClearConfirm = async () => {
    console.log("ReceiptsContext: Starting clearAllData process");
    try {
      // 1. Clear local state immediately
      setReceipts([]);
      localStorage.removeItem("6tem_receipts_history");
      console.log("ReceiptsContext: Local storage and state cleared");

      // 2. Reset Business Info
      console.log("ReceiptsContext: Requesting business data reset...");
      await resetBusinessData();
      console.log("ReceiptsContext: Business data reset complete");

      const user = auth.currentUser;
      if (user) {
        console.log("ReceiptsContext: Deleting from Firestore for user", user.uid);
        // 3. Delete all receipts from Firestore
        const receiptsRef = collection(db, "users", user.uid, "receipts");
        const snap = await getDocs(receiptsRef);
        
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => {
            console.log("ReceiptsContext: Marking for deletion", d.id);
            batch.delete(d.ref);
          });
          await batch.commit();
          console.log("ReceiptsContext: Firestore deletion batch committed successfully");
        } else {
          console.log("ReceiptsContext: No documents found in Firestore to delete");
        }
      }
      
      alert("All application data has been successfully cleared.");
    } catch (err) {
      console.error("Critical error during data clear:", err);
      alert("An error occurred while clearing data. Please check your connection.");
    } finally {
      setIsClearModalOpen(false);
    }
  };

  const clearAllData = useCallback(() => {
    console.log("ReceiptsContext: clearAllData triggered - opening modal");
    setIsClearModalOpen(true);
  }, []);

  const value = useMemo(() => ({
    receipts,
    receiptCount: businessInfo.receiptCount,
    addReceipt,
    clearAllData,
    isSyncing
  }), [receipts, businessInfo.receiptCount, addReceipt, clearAllData, isSyncing]);

  return (
    <ReceiptsContext.Provider value={value}>
      {children}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearConfirm}
        title="Destroy All App Data?"
        message="This will permanently delete every receipt, reset your company profile, and wipe your dashboard averages. This action is final and cannot be undone."
        confirmText="Yes, Wipe Everything"
        requireText="CONFIRM"
        variant="danger"
      />
    </ReceiptsContext.Provider>
  );
}

export function useReceipts() {
  const context = useContext(ReceiptsContext);
  if (context === undefined) {
    throw new Error("useReceipts must be used within a ReceiptsProvider");
  }
  return context;
}
