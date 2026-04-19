import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { auth, db, handleFirestoreError } from "../lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { BusinessInfo } from "../types";

interface BusinessContextType {
  businessInfo: BusinessInfo;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => Promise<void>;
  resetBusinessData: () => Promise<void>;
}

const defaultInfo: BusinessInfo = {
  name: "6tem Invoice",
  email: "billing@6tem.com",
  phone: "+234 000 000 000",
  address: "123 Business Way, Lagos, Nigeria",
  logo: null,
  receiptCount: 0,
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    const saved = localStorage.getItem("6tem_business_info");
    return saved ? JSON.parse(saved) : defaultInfo;
  });

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        // Sync with Firestore
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as BusinessInfo;
            setBusinessInfo(data);
            localStorage.setItem("6tem_business_info", JSON.stringify(data));
          } else {
            // Document doesn't exist, create it once with current or default info
            // Use user's login email if the current business email is just the placeholder
            const initialEmail = (businessInfo.email === "billing@6tem.com" || !businessInfo.email) 
              ? (user.email || businessInfo.email) 
              : businessInfo.email;
              
            setDoc(userDocRef, {
              ...businessInfo,
              email: initialEmail,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true }).catch(err => handleFirestoreError(err, 'create', `users/${user.uid}`));
          }
        }, err => {
          // If we're unsubscribing or logging out, ignore permission errors
          if (auth.currentUser) {
            handleFirestoreError(err, 'get', `users/${user.uid}`);
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const updateBusinessInfo = useCallback(async (info: Partial<BusinessInfo>) => {
    const next = { ...businessInfo, ...info };
    setBusinessInfo(next);
    localStorage.setItem("6tem_business_info", JSON.stringify(next));

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        await setDoc(userDocRef, {
          ...next,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, 'update', `users/${user.uid}`);
        throw err;
      }
    }
  }, [businessInfo]);

  const resetBusinessData = useCallback(async () => {
    setBusinessInfo(defaultInfo);
    localStorage.setItem("6tem_business_info", JSON.stringify(defaultInfo));

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        await setDoc(userDocRef, {
          ...defaultInfo,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, 'update', `users/${user.uid}`);
        throw err;
      }
    }
  }, []);

  const value = useMemo(() => ({ 
    businessInfo, 
    updateBusinessInfo,
    resetBusinessData
  }), [businessInfo, updateBusinessInfo, resetBusinessData]);

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
